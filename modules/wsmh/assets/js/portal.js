/* ==========================================================================
   统一服务门户 · UI 引擎 (portal.js)
   职责：站点骨架（政务条 / 站头 / 导航 / 页脚 / 悬浮工具）自动注入，
         以及 Tabs、筛选、抽屉、弹窗、Toast、适老化、登录拦截等通用交互。
   业务状态与闭环动作在 portal-flow.js。
   引入顺序：portal-data.js → portal-flow.js → portal.js
   ========================================================================== */
(function () {
  'use strict';

  var UI = {};
  window.UI = UI;

  /* ----------------------------- 路径与参数 ----------------------------- */
  var DIRS = ['/web/', '/person/', '/company/', '/admin/', '/kiosk/'];
  var base = '';
  (function () {
    var p = location.pathname;
    for (var i = 0; i < DIRS.length; i++) { if (p.indexOf(DIRS[i]) >= 0) { base = '../'; break; } }
  })();
  UI.base = base;
  UI.url = function (path) { return base + path; };

  UI.param = function (name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  };
  UI.go = function (path, params) {
    var u = path.indexOf('http') === 0 || path.indexOf('../') === 0 ? path : base + path;
    if (params) {
      var qs = [];
      for (var k in params) { if (params[k] !== undefined && params[k] !== '') qs.push(k + '=' + encodeURIComponent(params[k])); }
      if (qs.length) u += (u.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
    }
    location.href = u;
  };
  UI.esc = function (s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  UI.money = function (n, d) {
    var v = Number(n || 0).toFixed(d === undefined ? 2 : d);
    var a = v.split('.');
    return a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (a[1] ? '.' + a[1] : '');
  };
  UI.wan = function (n) { return UI.money(Number(n || 0) / 10000, 0); };

  /* ----------------------------- 身份与偏好 ----------------------------- */
  var SS = {
    get: function (k, d) { try { return sessionStorage.getItem(k) || d; } catch (e) { return d; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } }
  };
  var LS = {
    get: function (k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  };

  var USERS = {
    guest: { name: '未登录', role: 'guest', label: '游客', realname: 0 },
    person: { name: '韦志强', role: 'person', label: '个人用户', realname: 2, idno: '450202198703****', mobile: '137****2856' },
    company: { name: 'XXXX市龙城房地产开发有限公司', role: 'company', label: '企业用户', realname: 2, credit: '91450200MA5K****X1' },
    admin: { name: '门户运营管理员', role: 'admin', label: '门户运营', realname: 2 }
  };

  UI.user = function () {
    var q = UI.param('user');
    if (q && USERS[q]) { SS.set('wsmh.user', q); }
    var r = SS.get('wsmh.user', 'guest');
    return USERS[r] || USERS.guest;
  };
  UI.setUser = function (role) { SS.set('wsmh.user', role); };
  UI.isLogin = function () { return UI.user().role !== 'guest'; };

  /* 未登录拦截：需登录的操作统一走这里（wsmh-34-06） */
  UI.needLogin = function (actionName) {
    if (UI.isLogin()) return true;
    UI.confirm(
      '该操作需要登录',
      '门户配置的未登录浏览范围为「房源列表与详情、信息公示、办事指南」。<b>' + UI.esc(actionName || '本操作') +
      '</b>属于需登录实名的操作，请先登录。<div class="text-3 text-xs mt-8">配置项见 门户配置后台 → 门户框架配置 → 未登录浏览范围与实名门槛。</div>',
      function () { UI.go('web/login.html', { from: location.pathname.split('/').pop() }); },
      '去登录'
    );
    return false;
  };
  /* 需要实名等级 */
  UI.needRealname = function (actionName) {
    if (!UI.needLogin(actionName)) return false;
    if (UI.user().realname >= 2) return true;
    UI.toast('该操作需要完成实名认证，请先到个人中心完成实名', 'warning');
    return false;
  };

  /* ----------------------------- 站点配置 ----------------------------- */
  UI.site = function () {
    if (window.PORTAL && PORTAL.site) return PORTAL.site();
    return {
      zdmc: '房产交易管理网', fbt: '统一服务门户 · 一网通办',
      zbdw: 'XXXX市住房和城乡建设局', jsdw: 'XXXX市房产交易管理中心',
      icp: '桂ICP备11003243号', gab: '桂公网安备 45020202000188号', zwbs: '4502000047',
      tel: '0772-2822168', addr: '柳州市城中区文昌路1号房产交易大厅',
      gzsj: '周一至周五 9:00-12:00、13:00-17:00（法定节假日除外）'
    };
  };

  /* ----------------------------- 导航结构 ----------------------------- */
  var NAV = [
    { key: 'home', name: '首页', href: 'web/home.html' },
    {
      key: 'house', name: '房源超市', href: 'web/house-market.html', sub: [
        { name: '房源超市首页', href: 'web/house-market.html' },
        { name: '房源综合检索', href: 'web/house-search.html' },
        { name: '地图找房 / 小区找房', href: 'web/house-map.html' },
        { name: '新房专区', href: 'web/new-house.html' },
        { name: '二手房专区', href: 'web/second-house.html' },
        { name: '租房专区', href: 'web/rent-house.html' },
        { name: '房票房源专区', href: 'web/voucher-house.html' },
        { name: '好房子专区', href: 'web/good-house.html' },
        { name: '房源自主发布', href: 'web/listing-publish.html' },
        { name: '购房办事服务', href: 'web/buy-service.html' }
      ]
    },
    {
      key: 'service', name: '业务办理', href: 'web/service-hall.html', sub: [
        { name: '网上办事大厅', href: 'web/service-hall.html' },
        { name: '二手房自助办理', href: 'web/second-hand-apply.html' },
        { name: '二手房进度查询', href: 'web/second-hand-progress.html' },
        { name: '租房签约备案', href: 'web/rent-sign.html' },
        { name: '租房公共服务', href: 'web/rent-public.html' },
        { name: '高效办成一件事', href: 'web/one-thing.html' },
        { name: '网点导航与排队', href: 'web/outlets.html' }
      ]
    },
    {
      key: 'guide', name: '业务指南', href: 'web/guide.html', sub: [
        { name: '办事指南与流程图解', href: 'web/guide.html' },
        { name: '政策解读专栏', href: 'web/policy.html' },
        { name: '帮助中心', href: 'web/help.html' }
      ]
    },
    {
      key: 'public', name: '信息公示', href: 'web/public-index.html', sub: [
        { name: '公示中心', href: 'web/public-index.html' },
        { name: '预售楼盘公示', href: 'web/public-presale.html' },
        { name: '资金监管类公示', href: 'web/public-fund.html' },
        { name: '政务公开与通知公告', href: 'web/public-affairs.html' }
      ]
    },
    {
      key: 'agency', name: '从业主体', href: 'web/agency-public.html', sub: [
        { name: '从业主体公示总览', href: 'web/agency-public.html' },
        { name: '企业与人员名录', href: 'web/agency-list.html' },
        { name: '信用评价与红黑榜', href: 'web/credit-rank.html' }
      ]
    },
    {
      key: 'query', name: '查询中心', href: 'web/query-center.html', sub: [
        { name: '查询中心首页', href: 'web/query-center.html' },
        { name: '个人房产信息查询', href: 'web/query-house.html' },
        { name: '扫码验真与电子亮证', href: 'web/query-verify.html' },
        { name: '证明打印出证', href: 'web/cert-print.html' },
        { name: '查询授权与留痕', href: 'web/query-auth.html' }
      ]
    }
  ];
  UI.nav = NAV;

  /* ----------------------------- 骨架渲染 ----------------------------- */
  function renderChrome() {
    var body = document.body;
    var navKey = body.getAttribute('data-nav');
    if (!navKey) return;                    /* 未声明 data-nav 的页面（终端 / 导航页）不注入 */
    var s = UI.site(), u = UI.user();

    /* 政务条 */
    var senior = LS.get('wsmh.senior', '0'), contrast = LS.get('wsmh.contrast', '0');
    if (senior === '1') body.setAttribute('data-senior', '1');
    if (contrast === '1') body.setAttribute('data-contrast', '1');

    var loginHtml = u.role === 'guest'
      ? '<a href="' + base + 'web/login.html">登录</a><span class="gb-sp"></span><a href="' + base + 'web/login.html?tab=reg">注册</a>'
      : '<span class="gb-user"><i class="fa-solid fa-circle-user"></i> ' + UI.esc(u.name.length > 12 ? u.name.slice(0, 12) + '…' : u.name) + '</span>'
      + '<span class="gb-sp"></span><a href="' + base + (u.role === 'company' ? 'company/index.html' : u.role === 'admin' ? 'admin/index.html' : 'person/index.html') + '">'
      + (u.role === 'company' ? '企业工作台' : u.role === 'admin' ? '运营后台' : '个人中心') + '</a>'
      + '<span class="gb-sp"></span><a href="javascript:;" data-act="logout">退出</a>';

    var gov = '<div class="gov-bar"><div class="wrap">'
      + '<div class="gb-l"><i class="fa-solid fa-location-dot"></i> 当前站点：<a href="javascript:;" data-act="channel">柳州市本级</a>'
      + '<span class="gb-sp"></span><span>' + UI.esc(s.gzsj.split('（')[0]) + '</span></div>'
      + '<div class="gb-r">'
      + '<span class="gb-btn' + (senior === '1' ? ' on' : '') + '" data-act="senior"><i class="fa-solid fa-a"></i> 长辈版</span>'
      + '<span class="gb-btn' + (contrast === '1' ? ' on' : '') + '" data-act="contrast"><i class="fa-solid fa-circle-half-stroke"></i> 高对比</span>'
      + '<a href="' + base + 'web/accessibility.html">无障碍</a>'
      + '<span class="gb-sp"></span>'
      + '<a href="' + base + 'index.html"><i class="fa-solid fa-diagram-project"></i> 原型导航</a>'
      + '<span class="gb-sp"></span><a href="javascript:;" data-act="reset" title="恢复演示数据初始状态">重置演示数据</a>'
      + '<span class="gb-sp"></span>' + loginHtml
      + '</div></div></div>';

    /* 站头 */
    var head = '<div class="site-head"><div class="wrap">'
      + '<a class="sh-logo" href="' + base + 'web/home.html">'
      + '<span class="sh-mark"><i class="fa-solid fa-city"></i></span>'
      + '<span><span class="sh-t1"><em>房产交易</em>管理网</span><span class="sh-t2">' + UI.esc(s.fbt) + '</span></span></a>'
      + '<div class="sh-search"><div class="ss-box">'
      + '<select id="ss-scope"><option value="all">全站</option><option value="project">项目楼盘</option>'
      + '<option value="community">小区</option><option value="item">办事事项</option>'
      + '<option value="article">政策文件</option><option value="notice">公示信息</option></select>'
      + '<input id="ss-kw" placeholder="搜索楼盘、小区、办事事项、政策文件与公示信息" value="' + UI.esc(UI.param('kw')) + '">'
      + '<button data-act="search"><i class="fa-solid fa-magnifying-glass"></i> 搜索</button></div>'
      + '<div class="ss-hot"><span>热搜：</span>'
      + ['二手房网签备案', '预售资金监管账户', '租赁备案证明', '好房子认定', '房票房源'].map(function (k) {
        return '<a href="javascript:;" data-hot="' + k + '">' + k + '</a>';
      }).join('') + '</div></div>'
      + '<div class="sh-qr" data-act="qr"><div class="qr-img"><i class="fa-solid fa-qrcode"></i></div>小程序办理</div>'
      + '</div></div>';

    /* 主导航 */
    var navItems = NAV.map(function (n) {
      var drop = '';
      if (n.sub) {
        drop = '<div class="nav-drop">' + n.sub.map(function (x) {
          return '<a href="' + base + x.href + '">' + x.name + '</a>';
        }).join('') + '</div>';
      }
      return '<div class="nav-i' + (n.key === navKey ? ' on' : '') + '"><a href="' + base + n.href + '">' + n.name + '</a>' + drop + '</div>';
    }).join('');
    var nav = '<div class="site-nav"><div class="wrap">' + navItems
      + '<div class="nav-x"><a href="' + base + 'person/index.html"><i class="fa-solid fa-user"></i> 个人中心</a>'
      + '<span style="color:rgba(255,255,255,.4)">|</span>'
      + '<a href="' + base + 'company/index.html"><i class="fa-solid fa-building"></i> 企业办事</a></div>'
      + '</div></div>';

    /* 页脚 */
    var links = [
      ['广西政务服务网', 'http://zwfw.gxzf.gov.cn/'], ['XXXX市人民政府', 'http://www.liuzhou.gov.cn/'],
      ['住房公积金', '#'], ['不动产登记', '#'], ['住房保障', '#'], ['住房租赁服务平台', '#']
    ];
    var foot = '<div class="site-foot">'
      + '<div class="sf-links"><div class="wrap"><b>关联平台：</b>'
      + links.map(function (l) { return '<a href="javascript:;" data-link="' + UI.esc(l[0]) + '">' + l[0] + '</a>'; }).join('<span style="opacity:.3">·</span>')
      + '<a class="ml-auto" href="' + base + 'web/accessibility.html" style="margin-left:auto"><i class="fa-solid fa-universal-access"></i> 无障碍与适老化</a>'
      + '</div></div>'
      + '<div class="sf-main"><div class="wrap flex" style="gap:40px">'
      + '<div class="sf-info">'
      + '主办单位：' + UI.esc(s.zbdw) + '　|　技术支持：' + UI.esc(s.jsdw) + '<br>'
      + '办公地址：' + UI.esc(s.addr) + '　|　咨询电话：<b style="color:#fff">' + UI.esc(s.tel) + '</b><br>'
      + '工作时间：' + UI.esc(s.gzsj) + '<br>'
      + UI.esc(s.icp) + '　|　' + UI.esc(s.gab) + '　|　政务服务网站标识码：' + UI.esc(s.zwbs)
      + '</div>'
      + '<div class="sf-badges">'
      + '<div class="sf-bd"><i class="fa-solid fa-shield-halved"></i>政府网站<br>找错</div>'
      + '<div class="sf-bd"><i class="fa-solid fa-universal-access"></i>无障碍<br>浏览</div>'
      + '<div class="sf-bd"><i class="fa-solid fa-qrcode"></i>小程序<br>办理</div>'
      + '</div></div></div>'
      + '<div class="sf-copy">本站数据来源于华信数智房产交易一体化平台，展示信息已按规定脱敏；'
      + '价格与统计口径以正式办事指南与窗口答复为准，本站内容仅供参考，不作为交易依据。</div>'
      + '</div>';

    /* 悬浮工具（wsmh-31-06 / wsmh-33-04 / wsmh-33-05） */
    var floatTools = '<div class="float-tools" id="float-tools">'
      + '<div class="ft-i accent" data-act="chat" title="智能客服，可拖动"><i class="fa-solid fa-headset"></i>智能客服</div>'
      + '<div class="ft-i" data-act="feedback"><i class="fa-solid fa-comment-dots"></i>意见反馈</div>'
      + '<div class="ft-i" data-act="qr" data-fp="wsmh-33-04"><i class="fa-solid fa-qrcode"></i>扫码办理</div>'
      + '<div class="ft-i" data-act="top"><i class="fa-solid fa-arrow-up"></i>回顶部</div>'
      + '<div class="ft-qr" id="ft-qr">'
      + '<div class="qr-c"><div class="qr-b"><i class="fa-brands fa-weixin"></i></div>微信小程序<br>扫码掌上办</div>'
      + '<div class="qr-c"><div class="qr-b"><i class="fa-solid fa-qrcode"></i></div>微信公众号<br>订阅办件提醒</div>'
      + '</div></div>';

    /* 挂载 */
    var top = document.createElement('div');
    top.innerHTML = gov + head + nav;
    body.insertBefore(top, body.firstChild);

    var bottom = document.createElement('div');
    bottom.innerHTML = foot + floatTools
      + '<div class="mask-layer" id="mask"></div>'
      + '<div class="drawer" id="drawer"><div class="dw-head"><h3 id="dw-title">详情</h3><span class="dw-x" data-act="close-drawer"><i class="fa-solid fa-xmark"></i></span></div>'
      + '<div class="dw-body" id="dw-body"></div><div class="dw-foot" id="dw-foot"></div></div>'
      + '<div class="modal" id="modal"><div class="md-head"><h3 id="md-title">提示</h3><span class="md-x" data-act="close-modal"><i class="fa-solid fa-xmark"></i></span></div>'
      + '<div class="md-body" id="md-body"></div><div class="md-foot" id="md-foot"></div></div>'
      + '<div id="toast-box"></div>';
    body.appendChild(bottom);

    makeDraggable(document.querySelector('#float-tools .ft-i.accent'), document.getElementById('float-tools'));
  }

  /* 悬浮客服可拖动（wsmh-31-06） */
  function makeDraggable(handle, box) {
    if (!handle || !box) return;
    var sx, sy, sr, sb, moving = false;
    handle.addEventListener('mousedown', function (e) {
      moving = true; sx = e.clientX; sy = e.clientY;
      sr = parseInt(getComputedStyle(box).right); sb = parseInt(getComputedStyle(box).bottom);
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!moving) return;
      var r = Math.max(4, sr - (e.clientX - sx)), b = Math.max(4, sb - (e.clientY - sy));
      box.style.right = r + 'px'; box.style.bottom = b + 'px';
    });
    document.addEventListener('mouseup', function () { moving = false; });
  }

  /* ----------------------------- Toast / 弹窗 / 抽屉 ----------------------------- */
  UI.toast = function (msg, type) {
    var box = document.getElementById('toast-box');
    if (!box) { box = document.createElement('div'); box.id = 'toast-box'; document.body.appendChild(box); }
    var ico = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    var t = type || 'info';
    var el = document.createElement('div');
    el.className = 'toast ' + t;
    el.innerHTML = '<i class="fa-solid ' + (ico[t] || ico.info) + '"></i><span>' + msg + '</span>';
    box.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = '.3s'; setTimeout(function () { el.remove(); }, 300); }, 2600);
  };

  UI.modal = function (title, html, footHtml, wide) {
    var m = document.getElementById('modal'); if (!m) return;
    document.getElementById('md-title').innerHTML = title;
    document.getElementById('md-body').innerHTML = html;
    document.getElementById('md-foot').innerHTML = footHtml === undefined
      ? '<button class="btn" data-act="close-modal">关闭</button>' : footHtml;
    m.className = 'modal on' + (wide ? ' wide' : '');
    document.getElementById('mask').classList.add('on');
  };
  UI.closeModal = function () {
    var m = document.getElementById('modal'); if (m) m.className = 'modal';
    if (!document.querySelector('.drawer.on')) document.getElementById('mask').classList.remove('on');
  };
  UI.confirm = function (title, text, onOk, okText) {
    UI.modal('<i class="fa-solid fa-circle-question text-primary"></i> ' + title,
      '<div style="font-size:14.5px;line-height:1.9">' + text + '</div>',
      '<button class="btn" data-act="close-modal">取消</button><button class="btn btn-primary" id="md-ok">' + (okText || '确定') + '</button>');
    document.getElementById('md-ok').onclick = function () { UI.closeModal(); if (onOk) onOk(); };
  };

  UI.drawer = function (title, html, footHtml) {
    var d = document.getElementById('drawer'); if (!d) return;
    document.getElementById('dw-title').innerHTML = title;
    document.getElementById('dw-body').innerHTML = html;
    document.getElementById('dw-foot').innerHTML = footHtml === undefined
      ? '<button class="btn" data-act="close-drawer">关闭</button>' : footHtml;
    d.classList.add('on');
    document.getElementById('mask').classList.add('on');
  };
  UI.closeDrawer = function () {
    var d = document.getElementById('drawer'); if (d) d.classList.remove('on');
    if (!document.querySelector('.modal.on')) document.getElementById('mask').classList.remove('on');
  };

  /* 二次身份核验（对外查询与敏感字段查看统一走这里） */
  UI.verifyIdentity = function (purpose, onPass) {
    if (!UI.needLogin(purpose)) return;
    UI.modal('<i class="fa-solid fa-shield-halved text-primary"></i> 二次身份核验',
      '<div class="alert alert-warning" style="margin-bottom:14px"><i class="fa-solid fa-triangle-exclamation"></i>'
      + '<span>按《统一服务门户》对外查询口径，查看<b>' + UI.esc(purpose) + '</b>的敏感字段需二次身份核验，核验过程全程留痕。</span></div>'
      + '<div class="form-grid c1">'
      + '<div class="form-item"><label>证件号码后六位</label><input class="input" id="vf-id" placeholder="演示环境输入任意 6 位即可" maxlength="6"></div>'
      + '<div class="form-item"><label>手机短信验证码</label><div class="flex gap-8">'
      + '<input class="input" id="vf-code" placeholder="演示验证码 123456" maxlength="6">'
      + '<button class="btn" style="flex:none" id="vf-send">获取验证码</button></div></div></div>',
      '<button class="btn" data-act="close-modal">取消</button><button class="btn btn-primary" id="vf-ok">核验并继续</button>');
    document.getElementById('vf-send').onclick = function () { UI.toast('验证码已发送至 137****2856，演示环境固定为 123456', 'success'); };
    document.getElementById('vf-ok').onclick = function () {
      var a = document.getElementById('vf-id').value, b = document.getElementById('vf-code').value;
      if (a.length < 6 || b.length < 6) { UI.toast('请填写完整的证件号后六位与验证码', 'warning'); return; }
      UI.closeModal();
      UI.toast('身份核验通过，本次查看已记入查询留痕', 'success');
      if (onPass) onPass();
    };
  };

  /* ----------------------------- 自动增强 ----------------------------- */
  /* Tabs：<div class="tabs" data-tabs><a data-tab="p1" class="on">..</a></div> + <div class="tab-pane on" id="p1"> */
  function bindTabs() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-tab]'); if (!a) return;
      var group = a.closest('[data-tabs]') || a.parentNode;
      group.querySelectorAll('[data-tab]').forEach(function (x) { x.classList.remove('on'); });
      a.classList.add('on');
      var id = a.getAttribute('data-tab');
      var scope = group.getAttribute('data-scope');
      var panes = scope ? document.querySelectorAll('#' + scope + ' .tab-pane') : document.querySelectorAll('.tab-pane');
      panes.forEach(function (p) { if (p.id === id) p.classList.add('on'); else if (!scope || p.closest('#' + scope)) p.classList.remove('on'); });
      if (window.onTabChange) window.onTabChange(id, a);
    });
  }

  /* 筛选行：点击互斥高亮 + 汇总已选条件 */
  function bindFilter() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('.filter-row .fr-opts a'); if (!a) return;
      var row = a.closest('.filter-row');
      row.querySelectorAll('a').forEach(function (x) { x.classList.remove('on'); });
      a.classList.add('on');
      UI.syncChosen();
      if (window.onFilterChange) window.onFilterChange();
    });
    document.addEventListener('click', function (e) {
      var x = e.target.closest('.fc-tag i'); if (x) {
        var key = x.parentNode.getAttribute('data-key');
        var row = document.querySelector('.filter-row[data-key="' + key + '"]');
        if (row) { row.querySelectorAll('a').forEach(function (y) { y.classList.remove('on'); }); row.querySelector('a').classList.add('on'); }
        UI.syncChosen(); if (window.onFilterChange) window.onFilterChange();
      }
      var c = e.target.closest('.fc-clear'); if (c) {
        document.querySelectorAll('.filter-row').forEach(function (r) {
          r.querySelectorAll('a').forEach(function (y) { y.classList.remove('on'); });
          if (r.querySelector('a')) r.querySelector('a').classList.add('on');
        });
        UI.syncChosen(); if (window.onFilterChange) window.onFilterChange();
      }
    });
  }
  UI.syncChosen = function () {
    var box = document.getElementById('filter-chosen'); if (!box) return;
    var tags = [];
    document.querySelectorAll('.filter-row').forEach(function (r) {
      var on = r.querySelector('a.on');
      if (on && on.getAttribute('data-v') !== '' && on.getAttribute('data-v') !== null) {
        tags.push('<span class="fc-tag" data-key="' + r.getAttribute('data-key') + '">' + on.textContent + ' <i class="fa-solid fa-xmark"></i></span>');
      }
    });
    box.innerHTML = tags.length
      ? '<span class="text-3">已选条件：</span>' + tags.join('') + '<span class="fc-clear"><i class="fa-solid fa-trash-can"></i> 清空全部</span>'
      : '<span class="text-3"><i class="fa-solid fa-filter"></i> 暂未选择筛选条件，当前展示全部核验通过房源</span>';
  };
  UI.filterVal = function (key) {
    var r = document.querySelector('.filter-row[data-key="' + key + '"] a.on');
    return r ? (r.getAttribute('data-v') || '') : '';
  };

  /* 全局动作 */
  function bindActions() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]'); if (!el) return;
      var act = el.getAttribute('data-act');
      switch (act) {
        case 'close-modal': UI.closeModal(); break;
        case 'close-drawer': UI.closeDrawer(); break;
        case 'top': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
        case 'qr': document.getElementById('ft-qr').classList.toggle('on'); break;
        case 'chat': UI.go('web/chat.html', { from: document.title }); break;
        case 'feedback': UI.feedback(); break;
        case 'search': UI.doSearch(); break;
        case 'senior': toggleSenior(); break;
        case 'contrast': toggleContrast(); break;
        case 'logout': UI.setUser('guest'); UI.toast('已退出登录', 'success'); setTimeout(function () { location.reload(); }, 600); break;
        case 'reset':
          UI.confirm('重置演示数据', '将清空本次演示产生的挂牌、办件、查询、出证、投诉等全部状态，恢复到初始的种子数据。确定重置吗？', function () {
            if (window.PORTAL) PORTAL.reset();
            UI.toast('演示数据已重置', 'success'); setTimeout(function () { location.reload(); }, 700);
          }, '确定重置');
          break;
        case 'channel': UI.channelPicker(); break;
      }
    });
    document.addEventListener('click', function (e) {
      var h = e.target.closest('[data-hot]'); if (!h) return;
      UI.go('web/search.html', { kw: h.getAttribute('data-hot') });
    });
    document.addEventListener('click', function (e) {
      var l = e.target.closest('[data-link]'); if (!l) return;
      UI.toast('「' + l.getAttribute('data-link') + '」为关联平台，相关业务不在本平台重复建设，演示环境不做外跳', 'info');
    });
    document.addEventListener('click', function (e) {
      if (e.target.id === 'mask') { UI.closeModal(); UI.closeDrawer(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { UI.closeModal(); UI.closeDrawer(); }
      if (e.key === 'Enter' && e.target.id === 'ss-kw') UI.doSearch();
    });
  }

  UI.doSearch = function () {
    var kw = (document.getElementById('ss-kw') || {}).value || '';
    var scope = (document.getElementById('ss-scope') || {}).value || 'all';
    if (!kw.trim()) { UI.toast('请输入搜索关键词', 'warning'); return; }
    UI.go('web/search.html', { kw: kw.trim(), scope: scope });
  };

  function toggleSenior() {
    var on = document.body.getAttribute('data-senior') === '1';
    document.body.setAttribute('data-senior', on ? '0' : '1');
    LS.set('wsmh.senior', on ? '0' : '1');
    document.querySelector('[data-act="senior"]').classList.toggle('on', !on);
    UI.toast(on ? '已退出长辈版' : '已切换到长辈版，字号整体放大，设置将被记住', 'success');
  }
  function toggleContrast() {
    var on = document.body.getAttribute('data-contrast') === '1';
    document.body.setAttribute('data-contrast', on ? '0' : '1');
    LS.set('wsmh.contrast', on ? '0' : '1');
    document.querySelector('[data-act="contrast"]').classList.toggle('on', !on);
    UI.toast(on ? '已关闭高对比度' : '已开启高对比度模式', 'success');
  }

  /* 县区频道切换（wsmh-35-03） */
  UI.channelPicker = function () {
    var chs = ['柳州市本级', '城中区', '鱼峰区', '柳南区', '柳北区', '柳江区', '柳城县', '鹿寨县', '融安县', '融水苗族自治县', '三江侗族自治县'];
    var cur = LS.get('wsmh.channel', '柳州市本级');
    UI.modal('<i class="fa-solid fa-sitemap text-primary"></i> 切换市县频道',
      '<div class="alert alert-info"><i class="fa-solid fa-circle-info"></i><span>各县区频道展示属地办事指南、联系方式与公告，事项目录与房源数据全市一源。</span></div>'
      + '<div class="pill-tabs">' + chs.map(function (c) {
        return '<a class="' + (c === cur ? 'on' : '') + '" data-ch="' + c + '">' + c + '</a>';
      }).join('') + '</div>', '<button class="btn" data-act="close-modal">关闭</button>');
    document.querySelectorAll('[data-ch]').forEach(function (a) {
      a.onclick = function () {
        LS.set('wsmh.channel', a.getAttribute('data-ch'));
        UI.closeModal();
        UI.toast('已切换到「' + a.getAttribute('data-ch') + '」频道', 'success');
        setTimeout(function () { location.reload(); }, 600);
      };
    });
  };

  /* 意见反馈（wsmh-33-05） */
  UI.feedback = function () {
    UI.drawer('<i class="fa-solid fa-comment-dots text-primary"></i> 意见反馈',
      '<div class="alert alert-info"><i class="fa-solid fa-circle-info"></i><span>反馈提交后可在「个人中心 → 我的消息」查看处理情况。</span></div>'
      + '<div class="form-grid c1">'
      + '<div class="form-item"><label><span class="req">*</span>反馈类型</label>'
      + '<select class="select" id="fb-type"><option>页面问题</option><option>功能建议</option><option>信息纠错</option><option>其他</option></select></div>'
      + '<div class="form-item"><label>问题页面</label><input class="input" id="fb-page" value="' + UI.esc(document.title) + '" readonly></div>'
      + '<div class="form-item"><label><span class="req">*</span>问题描述</label>'
      + '<textarea class="textarea" id="fb-desc" placeholder="请描述您遇到的问题或建议，我们会在 5 个工作日内处理"></textarea></div>'
      + '<div class="form-item"><label>联系方式（选填）</label><input class="input" id="fb-tel" placeholder="便于回访，留空则不回访"></div>'
      + '</div>',
      '<button class="btn" data-act="close-drawer">取消</button><button class="btn btn-primary" id="fb-ok">提交反馈</button>');
    document.getElementById('fb-ok').onclick = function () {
      var d = document.getElementById('fb-desc').value.trim();
      if (!d) { UI.toast('请填写问题描述', 'warning'); return; }
      var no = window.PORTAL ? PORTAL.act('feedback.add', {
        type: document.getElementById('fb-type').value, page: document.title, desc: d,
        tel: document.getElementById('fb-tel').value
      }) : 'FK' + Date.now();
      UI.closeDrawer();
      UI.toast('反馈已提交，受理编号 ' + no + '，可在个人中心我的消息查看处理情况', 'success');
    };
  };

  /* 通用「敬请期待 / 演示说明」 */
  UI.demo = function (text) { UI.toast(text, 'info'); };

  /* 分页渲染：UI.pager(el, total, page, size, onGo) */
  UI.pager = function (el, total, page, size, onGo) {
    if (!el) return;
    var pages = Math.max(1, Math.ceil(total / size));
    var h = '<span class="tot">共 ' + total + ' 条 / ' + pages + ' 页</span>';
    h += '<a class="' + (page <= 1 ? 'dis' : '') + '" data-p="' + (page - 1) + '">上一页</a>';
    var s = Math.max(1, page - 2), e2 = Math.min(pages, s + 4); s = Math.max(1, e2 - 4);
    for (var i = s; i <= e2; i++) h += '<a class="' + (i === page ? 'on' : '') + '" data-p="' + i + '">' + i + '</a>';
    h += '<a class="' + (page >= pages ? 'dis' : '') + '" data-p="' + (page + 1) + '">下一页</a>';
    el.className = 'pager'; el.innerHTML = h;
    el.querySelectorAll('a').forEach(function (a) {
      a.onclick = function () {
        if (a.classList.contains('dis') || a.classList.contains('on')) return;
        onGo(Number(a.getAttribute('data-p')));
      };
    });
  };

  /* 空态 */
  UI.empty = function (title, desc, actionHtml) {
    return '<div class="empty"><i class="fa-regular fa-folder-open"></i><div class="em-t">' + title + '</div>'
      + (desc ? '<div class="em-d">' + desc + '</div>' : '')
      + (actionHtml ? '<div class="em-a">' + actionHtml + '</div>' : '') + '</div>';
  };

  /* 数据来源与免责声明（wsmh-15-03） */
  UI.sourceNote = function (extra) {
    return '<div class="disclaimer"><b>数据来源与口径说明：</b>'
      + '本页数据来源于华信数智房产交易一体化平台业务库，每日 06:00 同步一次，最近更新时间 ' + UI.today() + ' 06:00。'
      + '房源信息仅展示核验通过房源，权利人姓名、身份证号与联系方式一律不予展示，房号按规定截断。'
      + (extra ? extra : '')
      + '本站不设广告位与付费排序，榜单只按网签量与成交量客观呈现，本期不发布房价指数。'
      + '展示内容仅供参考，实际以正式办事指南、备案合同与窗口答复为准。</div>';
  };
  UI.today = function () {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  };

  /* ----------------------------- 启动 ----------------------------- */
  function boot() {
    renderChrome();
    bindTabs(); bindFilter(); bindActions();
    UI.syncChosen();
    if (window.PORTAL && PORTAL.ready) PORTAL.ready();
    if (window.pageInit) { try { window.pageInit(); } catch (err) { console.error('pageInit error', err); } }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
