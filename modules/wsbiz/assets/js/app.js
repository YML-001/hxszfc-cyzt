/* ==========================================================================
   政务蓝基线 · 布局与组件引擎 (app.js)
   职责：注入顶栏/侧边栏布局、菜单高亮与搜索、首页渲染、列表增强与分页、
         抽屉/弹窗/确认框/Toast、字典下拉、文件上传等交互组件。
   用法：外壳页 <body data-shell data-role="xxx">
         业务页 <body data-role="xxx" data-active="菜单key"> + <main class="app-main">
   ========================================================================== */
(function () {
  'use strict';

  /* ==========================================================================
     一、配置区 —— 新项目只需要改这一段
     ========================================================================== */
  var APP_CONFIG = {
    sysName: '华信数智房产交易一体化平台 · 统一工作门户',
    portalHref: '../../index.html',
    defaultRole: 'biz',

    /* 角色元信息：本原型把窗口受理、业务审核、科室负责人、事项管理四类岗位
       的功能集中在同一套页面内演示，页面上用 .node-tag 标注职责归属 */
    roles: {
      biz: { tag: '业务办理端', user: '韦晓明', role: '华信房产交易中心 · 综合受理科' }
    },

    /* 菜单树：7 个一级节点、19 个二级项，key 与页面 body[data-active] 一一对应。
       5 个共享页（办件详情、审批办理、回执文书、更正撤销、差评核实）不进菜单，
       遵循规范 4.4 菜单收敛原则，由列表页与抽屉链入 */
    menu: [
      { key: 'portal-home', label: '一网通办门户', icon: 'fa-globe', href: 'portal-home.html' },
      { key: 'workbench', label: '我的工作台', icon: 'fa-house', href: 'workbench.html' },
      { label: '待办任务', icon: 'fa-clipboard-check', children: [
        { key: 'my-approval', label: '待我审批', href: 'my-approval.html' },
        { key: 'task-center', label: '待办中心', href: 'task-center.html' },
        { key: 'my-board', label: '办件看板', href: 'my-board.html' }
      ]},
      { label: '收件受理', icon: 'fa-inbox', children: [
        { key: 'item-catalog', label: '事项目录', href: 'item-catalog.html' },
        { key: 'identity-verify', label: '身份核验', href: 'identity-verify.html' },
        { key: 'intake', label: '统一收件', href: 'intake.html' },
        { key: 'material-check', label: '材料核验', href: 'material-check.html' },
        { key: 'intake-register', label: '收件登记', href: 'intake-register.html' }
      ]},
      { label: '预约窗口', icon: 'fa-calendar-check', children: [
        { key: 'appointment', label: '预约取号', href: 'appointment.html' },
        { key: 'window-schedule', label: '窗口排班', href: 'window-schedule.html' },
        { key: 'assist-service', label: '帮办代办', href: 'assist-service.html' }
      ]},
      { label: '材料证照', icon: 'fa-folder-open', children: [
        { key: 'material-library', label: '材料库管理', href: 'material-library.html' },
        { key: 'material-exempt', label: '材料免提交', href: 'material-exempt.html' },
        { key: 'material-correct', label: '材料补正', href: 'material-correct.html' }
      ]},
      { label: '综合查询', icon: 'fa-magnifying-glass', children: [
        { key: 'cross-query', label: '跨业务查询', href: 'cross-query.html' },
        { key: 'case-ledger', label: '办件台账', href: 'case-ledger.html' },
        { key: 'service-review', label: '服务评价', href: 'service-review.html' }
      ]},
      { label: '指引动态', icon: 'fa-book', children: [
        { key: 'guide', label: '业务指引', href: 'guide.html' },
        { key: 'news', label: '业务动态', href: 'news.html' }
      ]}
    ],

    /* 角色菜单白名单：null = 全部可见（所有岗位功能集中演示） */
    roleMenu: { biz: null },

    /* 数据字典：全局字典见第 20 章 0.13 节，章内字典见第 01 章 1.10 节 */
    dict: {
      /* ---- 全局字典 ---- */
      /* 行政区划为演示用中性名称与虚构编码，不指向任何真实地市 */
      said: [['100100', '华信市本级'], ['100102', '东城区'], ['100103', '西城区'], ['100104', '南城区'],
             ['100105', '北城区'], ['100106', '新城区'], ['100122', '平安县'], ['100123', '长丰县'],
             ['100124', '清河县'], ['100125', '明山县'], ['100126', '安宁县']],
      sjly: [['01', '窗口办理'], ['02', '统一服务门户'], ['03', '微信小程序'], ['04', '自助终端'],
             ['05', '中介机构端'], ['06', '企业工作台'], ['07', '银行端'], ['08', '接口导入'],
             ['09', '历史数据迁移'], ['10', '批量导入'], ['99', '其他']],
      ywdlm: [['01', '商品房交易'], ['02', '存量房交易'], ['03', '房屋租赁'], ['04', '抵押与交易限制'],
              ['05', '政策性住房与安置房'], ['06', '测绘成果与面积'], ['07', '房产档案'], ['08', '预售资金监管'],
              ['09', '存量房资金监管'], ['10', '维修资金监管'], ['11', '从业主体与信用'], ['12', '项目监管与好房子'],
              ['13', '查询与出证'], ['14', '更正与撤销'], ['99', '其他']],
      zjlx: [['01', '居民身份证'], ['02', '户口簿'], ['03', '护照'], ['04', '军官证'], ['05', '士兵证'],
             ['06', '港澳居民来往内地通行证'], ['07', '台湾居民来往大陆通行证'], ['08', '外国人永久居留身份证'],
             ['09', '港澳台居民居住证'], ['10', '出生医学证明'], ['21', '统一社会信用代码证'], ['22', '营业执照'],
             ['23', '组织机构代码证'], ['24', '事业单位法人证书'], ['99', '其他']],
      blzt: [['0', '待受理'], ['1', '办理中'], ['2', '已办结'], ['3', '已撤件'],
             ['4', '已退件'], ['5', '待补正'], ['6', '中止办理'], ['7', '已作废']],
      shzt: [['0', '待审核'], ['1', '审核中'], ['2', '审核通过'], ['3', '审核不通过'], ['4', '退回补正']],
      ztlx: [['1', '自然人'], ['2', '法人'], ['3', '非法人组织'], ['4', '境外自然人'], ['5', '境外法人']],
      bllj: [['1', '市级'], ['2', '县区级'], ['3', '市县两级']],

      /* ---- 第 01 章章内字典 ---- */
      gllx: [['0', '独立件'], ['1', '一件事主件'], ['2', '一件事子件'], ['3', '并件'],
             ['4', '跨部门联办件'], ['5', '更正件'], ['6', '撤销件'], ['7', '补办件']],
      rwlx: [['0', '审批任务'], ['1', '补正任务'], ['2', '签收任务'], ['3', '催办任务'],
             ['4', '督办任务'], ['5', '抄送任务'], ['6', '核验任务'], ['7', '出件任务']],
      rwzt: [['0', '待签收'], ['1', '待办理'], ['2', '办理中'], ['3', '已办结'],
             ['4', '已转办'], ['5', '已作废'], ['6', '已退回']],
      sjfs: [['0', '一窗统一收件'], ['1', '分类受理归口'], ['2', '网上申报'], ['3', '移动端申报'],
             ['4', '自助终端'], ['5', '中介代办'], ['6', '银行代收'], ['7', '帮办代办'], ['8', '邮寄申请']],
      tjfs: [['0', '现场提交'], ['1', '网上上传'], ['2', '免提交-电子证照调用'], ['3', '免提交-历史材料复用'],
             ['4', '免提交-数据共享代替'], ['5', '免提交-告知承诺'], ['6', '高拍仪采集']],
      hyfs: [['0', '人脸识别'], ['1', '三要素认证'], ['2', '身份证读卡'], ['3', '电子证照核验'],
             ['4', '人工核验'], ['5', 'UKey认证'], ['6', '短信验证码'], ['7', '省级统一身份认证']],
      sflx: [['0', '行政事业性收费'], ['1', '经营服务性收费'], ['2', '代征税费'], ['3', '工本费'], ['4', '免收']],
      cjlx: [['0', '备案证明'], ['1', '受理通知书'], ['2', '不予受理通知书'], ['3', '补正通知书'],
             ['4', '退件通知书'], ['5', '预售许可证'], ['6', '现售备案证明'], ['7', '抵押备案证明'],
             ['8', '租赁备案证明'], ['9', '查档结果证明'], ['10', '缴存证明'], ['99', '其他文书']],
      yyzt: [['0', '已预约'], ['1', '已取号'], ['2', '已办理'], ['3', '已取消'], ['4', '已爽约'], ['5', '已过期']],
      pdzt: [['0', '等待中'], ['1', '已叫号'], ['2', '办理中'], ['3', '已完成'], ['4', '已过号']],
      pjdj: [['1', '非常满意'], ['2', '满意'], ['3', '基本满意'], ['4', '不满意'], ['5', '非常不满意']],
      gzlx: [['1', '当事人信息更正'], ['2', '房屋信息更正'], ['3', '合同金额更正'], ['4', '整件撤销']],
      xxlx: [['0', '待办提醒'], ['1', '催办通知'], ['2', '督办通知'], ['3', '预警通知'],
             ['4', '系统公告'], ['5', '业务动态'], ['6', '评价提醒']],
      yesNo: [['1', '是'], ['0', '否']]
    },

    /* 工作台首页内容：数字与待办由 flow.js 在渲染后回填为真实统计 */
    home: {
      biz: {
        welcome: '统一工作门户 · 全平台办件唯一入口',
        heroStats: [{ v: '—', l: '待我审批' }, { v: '—', l: '我的在办' }, { v: '—', l: '临期超期' }],
        kpis: [
          { c: 'blue', i: 'fa-folder-open', l: '我的在办', v: '—' },
          { c: 'green', i: 'fa-circle-check', l: '本月办结', v: '—' },
          { c: 'orange', i: 'fa-clock', l: '临期 / 超期', v: '—', t: '需优先处理', td: 'text-danger' },
          { c: 'cyan', i: 'fa-percent', l: '按时办结率', v: '—' }
        ],
        todos: [],
        shortcuts: [],
        /* 自定义首页主体：两个面板的内容由 flow.js 按真实状态填充，
           这里只给出骨架与正确的跳转地址，避免默认模板产生死链 */
        body: function (q) {
          return '<div class="grid-2">' +
            '<div class="card home-panel"><div class="card-head"><h3>待我审批</h3>' +
              '<a class="home-more" href="my-approval.html' + q + '">查看全部 <i class="fa-solid fa-angle-right"></i></a>' +
            '</div><div class="card-body"><div class="home-todo" id="wbTodo"></div></div></div>' +
            '<div class="card home-panel"><div class="card-head"><h3>常用功能入口</h3>' +
              '<span class="link" onclick="openQuickEdit()">编辑常用 <i class="fa-solid fa-pen-to-square"></i></span>' +
            '</div><div class="card-body"><div class="quick-grid" id="wbQuick"></div></div></div>' +
          '</div>';
        }
      }
    }
  };
  window.APP_CONFIG = APP_CONFIG;

  /* ==========================================================================
     二、运行时 —— 以下无需修改
     ========================================================================== */
  var DICT = APP_CONFIG.dict || {};
  var ROLE_META = APP_CONFIG.roles || {};
  var MENU = APP_CONFIG.menu || [];
  var ROLE_MENU = APP_CONFIG.roleMenu || {};
  var HOME = APP_CONFIG.home || {};
  var SYS_NAME = APP_CONFIG.sysName || '';
  /* 顶栏品牌与子系统胶囊：平台名取「·」前段，子系统名取后段，与其他子系统顶栏一致 */
  var SYS_PARTS = SYS_NAME.split('·');
  var PLATFORM_NAME = (SYS_PARTS[0] || SYS_NAME).trim();
  var SYS_CUR_NAME = (SYS_PARTS.slice(1).join('·') || '').trim();

  /* ------- 角色解析：URL ?role= 优先，其次会话记忆，最后页面声明 ------- */
  function resolveRole(declaredRole) {
    var param = null;
    try { param = new URLSearchParams(location.search).get('role'); } catch (e) {}
    var role = param || sessionStorage.getItem('app-role') || declaredRole || APP_CONFIG.defaultRole;
    if (!ROLE_META[role]) role = APP_CONFIG.defaultRole;
    try { sessionStorage.setItem('app-role', role); } catch (e) {}
    return role;
  }

  /* ------- 侧边栏菜单 HTML（按角色过滤、按当前页高亮、链接带 role） ------- */
  function buildMenu(active, file, role) {
    var q = role ? ('?role=' + role) : '';
    var allow = ROLE_MENU[role];
    var ok = function (key) { return !allow || !key || allow.indexOf(key) >= 0; };
    var isOn = function (it) { return (it.key && it.key === active) || it.href === file; };
    var html = '';
    MENU.forEach(function (it) {
      if (it.children) {
        var kids = it.children.filter(function (c) { return ok(c.key); });
        if (!kids.length) return;
        var isOpen = kids.some(isOn);
        html += '<div class="menu-item' + (isOpen ? ' open' : '') + '">';
        html += '  <div class="menu-link"><i class="m-icon fa-solid ' + it.icon + '"></i><span>' + it.label + '</span><i class="m-arrow fa-solid fa-chevron-right"></i></div>';
        html += '  <div class="menu-sub">';
        kids.forEach(function (c) {
          html += '<a href="' + c.href + q + '" class="' + (isOn(c) ? 'active' : '') + '">' + c.label + '</a>';
        });
        html += '  </div></div>';
      } else {
        if (!ok(it.key)) return;
        html += '<a href="' + it.href + q + '" class="menu-single' + (isOn(it) ? ' active' : '') + '"><i class="m-icon fa-solid ' + it.icon + '"></i><span>' + it.label + '</span></a>';
      }
    });
    return html;
  }

  function topbarHTML(meta) {
    return '<div class="brand">' +
        '<i class="sidebar-toggle fa-solid fa-bars"></i>' +
        '<div class="logo"><img src="../assets/img/logo.png" alt="XXXX市住房和城乡建设局"></div>' +
        '<div class="name">' + PLATFORM_NAME + '</div>' +
      '</div>' +
      '<div class="sys-capsule">' +
        '<div class="sys-cur" title="当前业务子系统"><span>' + (SYS_CUR_NAME || meta && meta.tag || '') + '</span></div>' +
        '<button type="button" class="sys-switch-btn" aria-label="切换系统" title="切换系统"></button>' +
      '</div>' +
      '<div class="topbar-right">' +
        '<div class="topbar-icon" title="消息"><i class="fa-solid fa-bell"></i><span class="dot">5</span></div>' +
        '<div class="topbar-icon" title="帮助"><i class="fa-solid fa-circle-question"></i></div>' +
        '<div class="user"><div class="avatar">' + meta.user.charAt(0) + '</div>' +
          '<div class="u-meta"><div class="u-name">' + meta.user + '</div><div class="u-role">' + meta.role + '</div></div>' +
          '<i class="fa-solid fa-angle-down" style="font-size:12px;opacity:.8"></i></div>' +
        '<a href="' + (APP_CONFIG.portalHref || '../../index.html') + '" class="topbar-icon" title="返回门户/退出"><i class="fa-solid fa-right-from-bracket"></i></a>' +
      '</div>';
  }

  /* 顶栏「切换系统」：本端为独立外壳，跳转到统一业务办理端外壳使用共用的系统切换面板 */
  function initSysSwitch(topbar) {
    var btn = topbar.querySelector('.sys-switch-btn');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      (window.top || window).location.href = '../../../government/shell.html';
    });
  }

  function sidebarHTML(active, file, role) {
    return '<div class="menu-search">' +
        '<input type="text" class="menu-search-input" placeholder="菜单搜索" autocomplete="off">' +
        '<i class="fa-solid fa-magnifying-glass s-ico"></i>' +
        '<i class="fa-solid fa-xmark s-clear" title="清空"></i>' +
      '</div>' +
      '<div class="menu-list">' + buildMenu(active, file, role) + '</div>';
  }

  /* ------- 首页渲染（由 APP_CONFIG.home 驱动） ------- */
  function greet() { var h = new Date().getHours(); return h < 12 ? '上午好' : h < 18 ? '下午好' : '晚上好'; }
  function todayStr() {
    var d = new Date(), wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 星期' + wk;
  }
  function statCards(list) {
    return '<div class="stat-grid">' + (list || []).map(function (k) {
      return '<div class="stat-card"><div class="s-icon ' + k.c + '"><i class="fa-solid ' + k.i + '"></i></div><div>' +
        '<div class="s-label">' + k.l + '</div><div class="s-value">' + k.v + '</div>' +
        (k.t ? '<div class="s-trend ' + (k.td || 'text-success') + '">' + k.t + '</div>' : '') + '</div></div>';
    }).join('') + '</div>';
  }
  function quickGrid(items, q) {
    return '<div class="quick-grid">' + (items || []).map(function (it) {
      return '<a class="quick-item" href="' + it.h + q + '"><span class="q-ico ' + it.c + '"><i class="fa-solid ' + it.i + '"></i></span><span class="q-label">' + it.l + '</span></a>';
    }).join('') + '</div>';
  }
  function todoRows(items, q) {
    return '<div class="home-todo">' + (items || []).map(function (t) {
      return '<a class="todo-row" href="my-todo.html' + q + '"><span class="badge ' + t.c + '">' + t.tag + '</span>' +
        '<span class="todo-text">' + t.txt + '</span><span class="todo-time ' + (t.warn ? 'is-warn' : '') + '">' + t.time + '</span></a>';
    }).join('') + '</div>';
  }
  function panel(title, moreHref, inner) {
    return '<div class="card home-panel"><div class="card-head"><h3>' + title + '</h3>' +
      (moreHref ? '<a class="home-more" href="' + moreHref + '">查看全部 <i class="fa-solid fa-angle-right"></i></a>' : '') +
      '</div><div class="card-body">' + inner + '</div></div>';
  }
  function renderHome(role, meta) {
    var root = document.getElementById('home-root');
    if (!root) return;
    var q = '?role=' + role;
    var cfg = HOME[role] || HOME[APP_CONFIG.defaultRole];
    if (!cfg) return;
    var html = '<div class="home-hero">' +
      '<div class="hero-l">' +
        '<div class="hero-greet">' + greet() + '，' + meta.user + '</div>' +
        '<div class="hero-sub">' + meta.tag + ' · ' + meta.role + '　|　' + (cfg.welcome || '') + '</div>' +
        '<div class="hero-date"><i class="fa-regular fa-calendar"></i> ' + todayStr() + '</div>' +
      '</div>' +
      '<div class="hero-r">' + (cfg.heroStats || []).map(function (s) {
        return '<div class="hs"><div class="hs-v">' + s.v + '</div><div class="hs-l">' + s.l + '</div></div>';
      }).join('<div class="hs-div"></div>') + '</div>' +
    '</div>';
    html += statCards(cfg.kpis);
    if (cfg.body) {
      html += cfg.body(q);
    } else {
      html += '<div class="grid-2">' +
        panel('我的待办', 'my-todo.html' + q, todoRows(cfg.todos, q)) +
        panel('快捷入口', '', quickGrid(cfg.shortcuts, q)) +
      '</div>';
    }
    root.innerHTML = html;
  }

  /* ------- 详情分组增强：.section-title + .desc-list → .grp-card ------- */
  function enhanceDetailGroups() {
    Array.prototype.forEach.call(document.querySelectorAll('.section-title'), function (title) {
      if (title.classList.contains('grp-head')) return;
      if (title.closest('.grp-card, .card')) return;
      var next = title.nextElementSibling;
      if (!next || !next.classList.contains('desc-list')) return;
      var bodyEls = [], n = next;
      while (n && n.classList.contains('desc-list')) { var cur = n; n = n.nextElementSibling; bodyEls.push(cur); }
      var icon = title.getAttribute('data-icon') || 'fa-layer-group';
      var card = document.createElement('div');
      card.className = 'grp-card';
      var head = document.createElement('div');
      head.className = 'grp-head';
      head.innerHTML = '<span class="gi"><i class="fa-solid ' + icon + '"></i></span>' + title.innerHTML;
      title.parentNode.insertBefore(card, title);
      card.appendChild(head);
      bodyEls.forEach(function (el) { el.classList.remove('mb-16', 'mt-16', 'mt-8'); card.appendChild(el); });
      title.parentNode.removeChild(title);
    });
  }

  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  /* ------- 布局注入：嵌入外壳时只初始化内容，独立打开则补齐顶栏与侧栏 ------- */
  function injectLayout() {
    var body = document.body;
    var declaredRole = body.getAttribute('data-role');
    if (!declaredRole) return;
    var role = resolveRole(declaredRole);
    var active = body.getAttribute('data-active') || '';
    var file = ((location.pathname.split('/').pop() || '').split('?')[0]) || '';
    var meta = ROLE_META[role];

    if (isEmbedded()) {
      body.classList.add('embedded');
    } else {
      var topbar = document.createElement('header');
      topbar.className = 'app-topbar';
      topbar.innerHTML = topbarHTML(meta);
      var sidebar = document.createElement('aside');
      sidebar.className = 'app-sidebar';
      sidebar.innerHTML = sidebarHTML(active, file, role);
      body.insertBefore(sidebar, body.firstChild);
      body.insertBefore(topbar, body.firstChild);
      sidebar.addEventListener('click', function (e) {
        var link = e.target.closest('.menu-link');
        if (link) { link.parentElement.classList.toggle('open'); }
      });
      topbar.querySelector('.sidebar-toggle').addEventListener('click', function () {
        sidebar.classList.toggle('open');
      });
      initSysSwitch(topbar);
      initMenuSearch(sidebar);
      ensureSingleActive(sidebar, file);
    }
    renderHome(role, meta);
    applyRolePerms(role);
    mergeActionsIntoFilter();
    enhanceDetailGroups();
  }

  /* ------- 外壳：常驻顶栏 + 侧栏，右侧 iframe 承载内容 ------- */
  function initShell() {
    var body = document.body;
    var role = resolveRole(body.getAttribute('data-role'));
    body.setAttribute('data-role', role);
    var meta = ROLE_META[role];

    var topbar = document.createElement('header');
    topbar.className = 'app-topbar';
    topbar.innerHTML = topbarHTML(meta);
    var sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML = sidebarHTML('', '', role);
    body.insertBefore(sidebar, body.firstChild);
    body.insertBefore(topbar, body.firstChild);

    var frame = document.getElementById('content-frame');
    function loadPage(href) {
      if (!href) return;
      frame.setAttribute('src', href);
      if (window.innerWidth <= 1100) sidebar.classList.remove('open');
    }

    sidebar.addEventListener('click', function (e) {
      var groupHead = e.target.closest('.menu-link');
      if (groupHead) { groupHead.parentElement.classList.toggle('open'); return; }
      var a = e.target.closest('a.menu-single, .menu-sub a');
      if (a) {
        e.preventDefault();
        setActiveAnchor(sidebar, a);
        loadPage(a.getAttribute('href'));
      }
    });
    topbar.querySelector('.sidebar-toggle').addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
    initSysSwitch(topbar);
    initMenuSearch(sidebar);

    frame.addEventListener('load', function () {
      var file = '';
      try { file = (frame.contentWindow.location.pathname.split('/').pop() || '').split('?')[0]; } catch (e) {}
      if (file) {
        highlightMenu(sidebar, file);
        try { history.replaceState(null, '', 'shell.html?role=' + role + '&page=' + file); } catch (e) {}
      }
    });

    var page = null;
    try { page = new URLSearchParams(location.search).get('page'); } catch (e) {}
    page = page || 'dashboard.html';
    loadPage(page + (page.indexOf('?') >= 0 ? '&' : '?') + 'role=' + role);
  }

  function setActiveAnchor(sidebar, a) {
    sidebar.querySelectorAll('.menu-single.active, .menu-sub a.active').forEach(function (x) { x.classList.remove('active'); });
    a.classList.add('active');
    var g = a.closest('.menu-item');
    if (g) {
      sidebar.querySelectorAll('.menu-item.open').forEach(function (x) { if (x !== g) x.classList.remove('open'); });
      g.classList.add('open');
    } else {
      sidebar.querySelectorAll('.menu-item.open').forEach(function (x) { x.classList.remove('open'); });
    }
  }

  function highlightMenu(sidebar, file) {
    sidebar.querySelectorAll('.menu-single.active, .menu-sub a.active').forEach(function (a) { a.classList.remove('active'); });
    sidebar.querySelectorAll('.menu-item.open').forEach(function (g) { g.classList.remove('open'); });
    sidebar.querySelectorAll('.menu-single').forEach(function (a) {
      if ((a.getAttribute('href') || '').split('?')[0] === file) a.classList.add('active');
    });
    sidebar.querySelectorAll('.menu-sub a').forEach(function (a) {
      if ((a.getAttribute('href') || '').split('?')[0] === file) {
        a.classList.add('active');
        var g = a.closest('.menu-item'); if (g) g.classList.add('open');
      }
    });
  }

  function ensureSingleActive(sidebar, file) {
    sidebar.querySelectorAll('.menu-single').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('?')[0];
      if (href !== file) a.classList.remove('active');
    });
  }

  /* ------- 页头操作按钮并入查询工具条（整体右对齐） ------- */
  function mergeActionsIntoFilter() {
    var main = document.querySelector('main.app-main');
    if (!main) return;
    var actions = main.querySelector('.page-head .page-actions');
    var fb = main.querySelector('.filter-bar');
    if (!fb) return;
    var group = fb.querySelector('.filter-actions');
    if (!group) { group = document.createElement('div'); group.className = 'filter-actions'; }
    [].slice.call(fb.children).forEach(function (ch) {
      if (ch === group) return;
      if (ch.classList && (ch.classList.contains('btn') || ch.tagName === 'BUTTON')) group.appendChild(ch);
    });
    if (actions) {
      while (actions.firstChild) { group.appendChild(actions.firstChild); }
      if (actions.parentNode) actions.parentNode.removeChild(actions);
    }
    var sp = fb.querySelector('.spacer');
    if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
    if (group.childNodes.length) fb.appendChild(group);
  }

  /* ------- 按角色显隐：data-roles / data-roles-not ------- */
  function applyRolePerms(role) {
    document.querySelectorAll('[data-roles]').forEach(function (el) {
      var roles = (el.getAttribute('data-roles') || '').split(/[,\s]+/).filter(Boolean);
      if (roles.length && roles.indexOf(role) < 0) el.style.display = 'none';
    });
    document.querySelectorAll('[data-roles-not]').forEach(function (el) {
      var roles = (el.getAttribute('data-roles-not') || '').split(/[,\s]+/).filter(Boolean);
      if (roles.indexOf(role) >= 0) el.style.display = 'none';
    });
    if (window.PMS) window.PMS.role = role;
    document.body.setAttribute('data-current-role', role);
  }

  /* ------- 菜单搜索：实时过滤并展开命中分组 ------- */
  function initMenuSearch(sidebar) {
    var box = sidebar.querySelector('.menu-search');
    if (!box) return;
    var input = box.querySelector('.menu-search-input');
    var clear = box.querySelector('.s-clear');
    var list = sidebar.querySelector('.menu-list');
    function textOf(el) { return (el.textContent || '').toLowerCase(); }
    function restore() {
      list.querySelectorAll('.menu-single, .menu-item, .menu-sub a').forEach(function (el) { el.style.display = ''; });
      list.querySelectorAll('.menu-item').forEach(function (g) {
        if (g.querySelector('.menu-sub a.active')) g.classList.add('open'); else g.classList.remove('open');
      });
    }
    function filter(q) {
      q = q.trim().toLowerCase();
      box.classList.toggle('has-value', q.length > 0);
      if (!q) { restore(); return; }
      list.querySelectorAll('.menu-single').forEach(function (el) {
        el.style.display = textOf(el).indexOf(q) >= 0 ? '' : 'none';
      });
      list.querySelectorAll('.menu-item').forEach(function (g) {
        var head = g.querySelector('.menu-link');
        var groupHit = head && textOf(head).indexOf(q) >= 0;
        var subHit = false;
        g.querySelectorAll('.menu-sub a').forEach(function (sub) {
          var hit = groupHit || textOf(sub).indexOf(q) >= 0;
          sub.style.display = hit ? '' : 'none';
          if (hit) subHit = true;
        });
        if (groupHit || subHit) { g.style.display = ''; g.classList.add('open'); }
        else { g.style.display = 'none'; }
      });
    }
    input.addEventListener('input', function () { filter(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; filter(''); input.blur(); } });
    clear.addEventListener('click', function () { input.value = ''; filter(''); input.focus(); });
  }

  /* ==========================================================================
     文件上传：表单中的 URL / 附件字段自动升级为方形宫格上传组件
     ========================================================================== */
  function fileNameFromUrl(url) {
    if (!url || url === '—' || url === '-') return '';
    try {
      var path = String(url).split('?')[0];
      var name = path.substring(path.lastIndexOf('/') + 1);
      return decodeURIComponent(name || path);
    } catch (e) { return String(url); }
  }
  function parseFileList(val) {
    if (val == null) return [];
    var s = String(val).trim();
    if (!s || s === '—' || s === '-') return [];
    if (s.charAt(0) === '[') {
      try {
        var arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map(function (x) { return String(x || '').trim(); }).filter(Boolean);
      } catch (e) {}
    }
    return s.split(/[,;\n]+/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function joinFileList(list) { return (list || []).filter(Boolean).join(','); }
  function isImageName(name) { return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || ''); }
  function fileExt(name) { var m = String(name || '').match(/\.([a-z0-9]+)$/i); return m ? m[1] : 'file'; }
  function isUrlFillName(name) {
    var n = (name || '').toLowerCase();
    return /url$/.test(n) || n.indexOf('url') >= 0 || /file$/.test(n);
  }
  function isUrlField(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    if (el.type === 'hidden' && el.closest('.file-up')) return false;
    if (el.getAttribute('data-upload') === '1') return true;
    var fill = (el.getAttribute('data-fill') || '').toLowerCase();
    if (fill.indexOf('url') >= 0) return true;
    var item = el.closest('.form-item');
    var lab = item ? (item.querySelector('label') || {}) : {};
    var lt = (lab.textContent || '').replace(/\s+/g, '');
    return /URL|链接|附件|材料|凭证/.test(lt) && !/网址入口|接口/.test(lt);
  }
  function acceptForLabel(labelText, fill) {
    var t = (labelText || '') + ' ' + (fill || '');
    if (/照片|图片|平面图|image|photo|plan/i.test(t)) return 'image/*,.jpg,.jpeg,.png,.gif,.webp';
    if (/pdf|文件|合同|备案|材料|凭证/i.test(t)) return '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
    return '*/*';
  }
  function fileViewHtml(value) {
    var list = parseFileList(value);
    if (!list.length) return '<span class="text-3">—</span>';
    return '<span class="file-view">' + list.map(function (v) {
      var nm = fileNameFromUrl(v) || v;
      var icon = isImageName(nm) ? 'fa-regular fa-image' : 'fa-regular fa-file-lines';
      return /^https?:\/\//i.test(v)
        ? ('<a class="file-chip" href="' + v + '" target="_blank" onclick="event.stopPropagation()"><i class="' + icon + '"></i><span class="fv-name">' + nm + '</span></a>')
        : ('<span class="file-chip"><i class="' + icon + '"></i><span class="fv-name">' + nm + '</span></span>');
    }).join('') + '</span>';
  }
  function getFileUpList(wrap) {
    var hid = wrap.querySelector('input[type="hidden"][data-fill], input[type="hidden"].file-up-val');
    return parseFileList(hid ? hid.value : '');
  }
  function setFileUpList(wrap, list) {
    var hid = wrap.querySelector('input[type="hidden"][data-fill], input[type="hidden"].file-up-val');
    if (hid) hid.value = joinFileList(list);
    syncFileUpUI(wrap);
  }
  function tileHtml(v, i, previews) {
    var nm = fileNameFromUrl(v) || v;
    var isImg = isImageName(nm) || /^data:image|^blob:/i.test(v);
    var thumb = (previews && previews[nm]) || (isImg && /^(https?:|data:|blob:)/i.test(v) ? v : '');
    var view = /^https?:\/\//i.test(v) ? ('<a class="view" href="' + v + '" target="_blank" onclick="event.stopPropagation()"></a>') : '';
    if (thumb) {
      return '<div class="file-up-tile thumb" title="' + nm + '"><img src="' + thumb + '" alt="' + nm + '">' + view +
        '<span class="rm" data-file-rm="' + i + '"><i class="fa-solid fa-xmark"></i></span></div>';
    }
    if (isImg) {
      return '<div class="file-up-tile doc" title="' + nm + '"><i class="fa-regular fa-image"></i>' + view +
        '<span class="fname">' + nm + '</span><span class="rm" data-file-rm="' + i + '"><i class="fa-solid fa-xmark"></i></span></div>';
    }
    return '<div class="file-up-tile doc" title="' + nm + '"><i class="fa-regular fa-file-lines"></i><span class="ext">' + fileExt(nm) + '</span>' + view +
      '<span class="fname">' + nm + '</span><span class="rm" data-file-rm="' + i + '"><i class="fa-solid fa-xmark"></i></span></div>';
  }
  function syncFileUpUI(wrap) {
    if (!wrap) return;
    var list = getFileUpList(wrap);
    var grid = wrap.querySelector('.file-up-grid');
    var addTile = wrap.querySelector('.file-up-add');
    var previews = wrap._previews || {};
    wrap.classList.toggle('has-file', list.length > 0);
    if (!grid) return;
    Array.prototype.slice.call(grid.querySelectorAll('.file-up-tile:not(.file-up-add)')).forEach(function (t) { t.remove(); });
    var frag = '';
    list.forEach(function (v, i) { frag += tileHtml(v, i, previews); });
    if (addTile) addTile.insertAdjacentHTML('beforebegin', frag);
    else grid.innerHTML = frag;
  }
  function addFilesToUp(wrap, fileList) {
    if (!fileList || !fileList.length) return;
    var cur = getFileUpList(wrap);
    var names = {};
    cur.forEach(function (x) { names[fileNameFromUrl(x) || x] = 1; });
    wrap._previews = wrap._previews || {};
    var added = 0;
    Array.prototype.forEach.call(fileList, function (f) {
      if (!f || !f.name || names[f.name]) return;
      if (isImageName(f.name)) {
        try { wrap._previews[f.name] = URL.createObjectURL(f); } catch (e) {}
      }
      cur.push(f.name);
      names[f.name] = 1;
      added++;
    });
    setFileUpList(wrap, cur);
    if (added) PMS.toast('已添加 ' + added + ' 个文件', 'success');
  }
  function bindFileUp(wrap) {
    if (!wrap || wrap.getAttribute('data-bound') === '1') { if (wrap) syncFileUpUI(wrap); return; }
    wrap.setAttribute('data-bound', '1');
    var file = wrap.querySelector('input[type="file"]');
    var grid = wrap.querySelector('.file-up-grid');
    if (file) {
      if (!file.hasAttribute('multiple')) file.setAttribute('multiple', 'multiple');
      file.addEventListener('change', function () { addFilesToUp(wrap, file.files); file.value = ''; });
    }
    wrap.addEventListener('dragover', function (e) { e.preventDefault(); wrap.classList.add('is-drag'); });
    wrap.addEventListener('dragleave', function () { wrap.classList.remove('is-drag'); });
    wrap.addEventListener('drop', function (e) {
      e.preventDefault(); wrap.classList.remove('is-drag');
      if (e.dataTransfer && e.dataTransfer.files) addFilesToUp(wrap, e.dataTransfer.files);
    });
    if (grid) {
      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-file-rm]');
        if (!btn) return;
        e.preventDefault(); e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-file-rm'), 10);
        var cur = getFileUpList(wrap);
        if (!isNaN(idx) && idx >= 0 && idx < cur.length) { cur.splice(idx, 1); setFileUpList(wrap, cur); }
      });
    }
    syncFileUpUI(wrap);
  }
  function buildFileUpHtml(opts) {
    opts = opts || {};
    var fill = opts.fill || '';
    var val = opts.value == null ? '' : String(opts.value);
    if (val === '—') val = '';
    var accept = opts.accept || '*/*';
    var fillAttr = fill ? (' data-fill="' + fill + '"') : '';
    var list = parseFileList(val);
    return '<div class="file-up' + (list.length ? ' has-file' : '') + '">' +
      '<input type="hidden" class="file-up-val"' + fillAttr + ' value="' + val.replace(/"/g, '&quot;') + '">' +
      '<div class="file-up-grid">' +
        '<div class="file-up-tile file-up-add" title="添加文件（可多选）">' +
          '<input type="file" multiple accept="' + accept + '">' +
          '<i class="fa-solid fa-plus"></i><span>上传</span>' +
        '</div>' +
      '</div></div>';
  }
  function enhanceUrlUploads(root) {
    var scope = root || document;
    scope.querySelectorAll('.file-up').forEach(function (wrap) {
      var file = wrap.querySelector('input[type="file"]');
      if (file && !file.hasAttribute('multiple')) file.setAttribute('multiple', 'multiple');
      bindFileUp(wrap);
    });
    scope.querySelectorAll('.drawer .form-item input[type="text"], .modal .form-item input[type="text"], form .form-item input[type="text"]').forEach(function (inp) {
      if (!isUrlField(inp) || inp.closest('.file-up')) return;
      var item = inp.closest('.form-item');
      if (!item) return;
      var lab = item.querySelector('label');
      var labelText = lab ? lab.textContent : '';
      if (lab) {
        lab.innerHTML = lab.innerHTML.replace(/\s*URL\s*/gi, '').replace(/文件链接|链接/g, '').replace(/\s+$/, '');
        if (!(lab.textContent || '').trim()) lab.textContent = '附件';
      }
      var fill = inp.getAttribute('data-fill') || '';
      inp.insertAdjacentHTML('beforebegin', buildFileUpHtml({ fill: fill, value: inp.value, accept: acceptForLabel(labelText, fill) }));
      inp.remove();
      bindFileUp(item.querySelector('.file-up'));
    });
  }

  /* ==========================================================================
     交互组件 PMS
     ========================================================================== */
  function formatMonth(v) {
    if (v == null || v === '' || v === '—') return '';
    var s = String(v).trim();
    if (/^\d{4}-\d{2}$/.test(s)) return s;
    if (/^\d{6}$/.test(s)) return s.slice(0, 4) + '-' + s.slice(4, 6);
    return s;
  }

  var PMS = {
    fileUpHtml: buildFileUpHtml,
    fileViewHtml: fileViewHtml,
    enhanceUrlUploads: enhanceUrlUploads,
    formatMonth: formatMonth,
    statMonth: function () {
      var d = new Date(), m = d.getMonth() + 1;
      return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m;
    },
    openDrawer: function (id) {
      var d = document.getElementById(id); if (!d) return;
      var mask = d.previousElementSibling && d.previousElementSibling.classList.contains('drawer-mask') ? d.previousElementSibling : null;
      d.classList.add('open'); if (mask) mask.classList.add('open');
      enhanceUrlUploads(d);
      d.querySelectorAll('.file-up').forEach(syncFileUpUI);
    },
    closeDrawer: function (id) {
      var d = id ? document.getElementById(id) : document.querySelector('.drawer.open');
      if (!d) return;
      d.classList.remove('open');
      var mask = d.previousElementSibling && d.previousElementSibling.classList.contains('drawer-mask') ? d.previousElementSibling : null;
      if (mask) mask.classList.remove('open');
    },
    openModal: function (id) {
      var m = document.getElementById(id); if (!m) return;
      m.classList.add('open');
      enhanceUrlUploads(m);
      m.querySelectorAll('.file-up').forEach(syncFileUpUI);
    },
    closeModal: function (id) {
      var m = id ? document.getElementById(id) : document.querySelector('.modal-mask.open');
      if (m) m.classList.remove('open');
    },
    toast: function (msg, type) {
      var wrap = document.querySelector('.toast-wrap');
      if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
      var t = document.createElement('div');
      t.className = 'toast' + (type ? ' ' + type : '');
      var icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';
      t.innerHTML = '<i class="fa-solid ' + icon + '"></i>' + msg;
      wrap.appendChild(t);
      setTimeout(function () {
        t.style.opacity = '0'; t.style.transition = '.3s';
        setTimeout(function () { t.remove(); }, 300);
      }, 2200);
    },
    /* PMS.confirm({ title, message, detail, type, okText, cancelText, onOk, onCancel })
       type: danger | warning | info | success */
    confirm: function (opts) {
      opts = opts || {};
      var type = opts.type || 'danger';
      var icons = { danger: 'fa-trash-can', warning: 'fa-triangle-exclamation', info: 'fa-circle-question', success: 'fa-circle-check' };
      var okCls = type === 'danger' ? 'btn-danger-solid' : 'btn-primary';
      var mask = document.getElementById('appConfirmMask');
      if (!mask) {
        mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'appConfirmMask';
        mask.innerHTML =
          '<div class="modal modal-sm">' +
            '<div class="modal-head" style="display:flex;align-items:center;justify-content:space-between">' +
              '<span data-confirm-title>确认</span>' +
              '<span class="close" data-confirm-cancel style="cursor:pointer;color:var(--text-3);width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px"><i class="fa-solid fa-xmark"></i></span>' +
            '</div>' +
            '<div class="modal-body"><div class="confirm-box">' +
              '<div class="confirm-ico" data-confirm-ico><i class="fa-solid fa-trash-can"></i></div>' +
              '<div><div class="confirm-msg" data-confirm-msg></div><div class="confirm-detail" data-confirm-detail></div></div>' +
            '</div></div>' +
            '<div class="modal-foot">' +
              '<button type="button" class="btn" data-confirm-cancel>取消</button>' +
              '<button type="button" class="btn" data-confirm-ok>确定</button>' +
            '</div>' +
          '</div>';
        document.body.appendChild(mask);
        mask.addEventListener('click', function (e) {
          if (e.target === mask) PMS._confirmCancel();
          if (e.target.closest('[data-confirm-cancel]')) PMS._confirmCancel();
          if (e.target.closest('[data-confirm-ok]')) PMS._confirmOk();
        });
      }
      PMS._confirmCb = { onOk: opts.onOk || null, onCancel: opts.onCancel || null };
      mask.querySelector('[data-confirm-title]').textContent = opts.title || '确认';
      mask.querySelector('[data-confirm-msg]').textContent = opts.message || '确定执行该操作吗？';
      var detailEl = mask.querySelector('[data-confirm-detail]');
      detailEl.textContent = opts.detail || '';
      detailEl.style.display = opts.detail ? '' : 'none';
      var ico = mask.querySelector('[data-confirm-ico]');
      ico.className = 'confirm-ico ' + type;
      ico.innerHTML = '<i class="fa-solid ' + (icons[type] || icons.danger) + '"></i>';
      var okBtn = mask.querySelector('[data-confirm-ok]');
      okBtn.className = 'btn ' + okCls;
      okBtn.textContent = opts.okText || '确定';
      var cancelBtn = mask.querySelector('.modal-foot [data-confirm-cancel]');
      if (cancelBtn) cancelBtn.textContent = opts.cancelText || '取消';
      mask.classList.add('open');
    },
    _confirmOk: function () {
      var cb = PMS._confirmCb || {};
      PMS._confirmCb = null;
      PMS.closeModal('appConfirmMask');
      if (cb.onOk) cb.onOk();
    },
    _confirmCancel: function () {
      var cb = PMS._confirmCb || {};
      PMS._confirmCb = null;
      PMS.closeModal('appConfirmMask');
      if (cb.onCancel) cb.onCancel();
    },
    /* 生成字典下拉选项：value=编号，text=名称 */
    opts: function (name, selected, placeholder) {
      var list = DICT[name] || [];
      var ph = placeholder == null ? '请选择' : placeholder;
      var html = ph === false ? '' : '<option value="">' + ph + '</option>';
      var sel = selected == null ? '' : String(selected).trim();
      list.forEach(function (it) {
        var on = (sel !== '' && (sel === it[0] || sel === it[1])) ? ' selected' : '';
        html += '<option value="' + it[0] + '"' + on + '>' + it[1] + '</option>';
      });
      return html;
    },
    /* 按 data-fill 键名批量填充抽屉 / 详情字段 */
    fill: function (scopeId, data) {
      var scope = document.getElementById(scopeId) || document;
      Object.keys(data).forEach(function (k) {
        scope.querySelectorAll('[data-fill="' + k + '"]').forEach(function (el) {
          var v = data[k];
          if (el.tagName === 'SELECT') {
            var s = v == null ? '' : String(v).trim();
            el.value = s;
            if (el.value !== s) {
              Array.prototype.forEach.call(el.options, function (o) {
                if (o.textContent.trim() === s) el.value = o.value;
              });
            }
          } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = (el.type === 'month') ? formatMonth(v) : (v == null ? '' : v);
          } else if (isUrlFillName(k) || el.getAttribute('data-file-view') === '1') {
            el.innerHTML = fileViewHtml(v);
          } else {
            el.textContent = v == null ? '' : v;
          }
        });
      });
      enhanceUrlUploads(scope);
      scope.querySelectorAll('.file-up').forEach(syncFileUpUI);
    },
    /* 列表行删除：确认 → 移除该行 → 提示 */
    delRow: function (tr, name) {
      if (!tr) return;
      var label = name || '该记录';
      PMS.confirm({
        title: '删除确认',
        message: '确定删除「' + label + '」吗？',
        detail: '此操作不可撤销。',
        type: 'danger',
        okText: '删除',
        onOk: function () {
          if (tr.parentNode) tr.parentNode.removeChild(tr);
          PMS.toast('已删除', 'success');
        }
      });
    }
  };
  window.PMS = PMS;

  /* ------- 全局事件委托 ------- */
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open-drawer]');
    if (o) PMS.openDrawer(o.getAttribute('data-open-drawer'));
    var m = e.target.closest('[data-open-modal]');
    if (m) PMS.openModal(m.getAttribute('data-open-modal'));
    if (e.target.closest('[data-close-drawer]') || e.target.classList.contains('drawer-mask')) PMS.closeDrawer();
    if (e.target.closest('[data-close-modal]')) PMS.closeModal();
    else if (e.target.classList.contains('modal-mask')) {
      if (e.target.id === 'appConfirmMask') PMS._confirmCancel();
      else PMS.closeModal();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var cm = document.getElementById('appConfirmMask');
      if (cm && cm.classList.contains('open')) { PMS._confirmCancel(); e.preventDefault(); }
    }
  });

  /* ------- 标签页 ------- */
  function initTabs() {
    document.querySelectorAll('.tabs').forEach(function (tabs) {
      tabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.tab'); if (!tab) return;
        var name = tab.getAttribute('data-tab');
        var scope = tabs.closest('[data-tabs-scope]') || document;
        tabs.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        scope.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === name);
        });
        scope.querySelectorAll('.tab-panel.active .table-wrap > table.data-table').forEach(function (t) {
          if (t.getAttribute('data-fill') === '1') { applyListLayout(t); fillRows(t); }
        });
      });
    });
  }

  /* ==========================================================================
     列表增强：定高布局 + 序号列 + 右侧固定操作列 + 综合分页
     ========================================================================== */
  var PAGE_SIZES = [10, 20, 50, 100];
  var DEFAULT_PAGE_SIZE = 20;

  function listTables() {
    var out = [];
    document.querySelectorAll('main.app-main .table-wrap > table.data-table').forEach(function (t) {
      if (!t.closest('.drawer')) out.push(t);
    });
    return out;
  }
  function addIndexColumn(table) {
    var headRow = table.querySelector('thead tr');
    if (headRow && !headRow.querySelector('th.idx-col')) {
      var th = document.createElement('th');
      th.className = 'idx-col'; th.textContent = '序号';
      headRow.insertBefore(th, headRow.firstChild);
    }
  }
  function markOpsColumn(table) {
    if (!table) return;
    var headRow = table.querySelector('thead tr');
    if (!headRow) return;
    var ths = headRow.children, idx = -1, i;
    for (i = 0; i < ths.length; i++) {
      if ((ths[i].textContent || '').replace(/\s+/g, '') === '操作') { idx = i; break; }
    }
    if (idx < 0) return;
    for (i = 0; i < ths.length; i++) ths[i].classList.toggle('col-ops', i === idx);
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      var cells = tr.children;
      for (var j = 0; j < cells.length; j++) {
        if (cells[j].tagName === 'TD') cells[j].classList.toggle('col-ops', j === idx);
      }
    });
  }
  function watchOpsColumn(table) {
    if (!table || table._opsWatch || typeof MutationObserver === 'undefined') return;
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    table._opsWatch = new MutationObserver(function () { markOpsColumn(table); });
    table._opsWatch.observe(tbody, { childList: true });
  }
  function renumber(table, start) {
    var n = start || 1;
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      var cell = tr.querySelector('td.idx-col');
      if (!cell) { cell = document.createElement('td'); cell.className = 'idx-col'; tr.insertBefore(cell, tr.firstChild); }
      cell.textContent = n < 10 ? '0' + n : String(n);
      n++;
    });
  }
  function applyListLayout(table) {
    var main = table.closest('main.app-main');
    if (main) {
      main.classList.add('list-layout');
      document.documentElement.classList.add('list-page');
      document.body.classList.add('list-page');
    }
    var card = table.closest('.card'); if (card) card.classList.add('list-card');
    var body = table.closest('.card-body'); if (body) body.classList.add('list-body');
    var panelEl = table.closest('.tab-panel'); if (panelEl) panelEl.classList.add('list-panel');
  }
  function ensureFoot(table) {
    var wrap = table.parentElement;
    var next = wrap.nextElementSibling;
    if (next && next.classList.contains('table-foot')) return next;
    var foot = document.createElement('div');
    foot.className = 'table-foot';
    wrap.parentNode.insertBefore(foot, wrap.nextSibling);
    return foot;
  }
  function buildPageNums(cur, total) {
    var pages = [], i;
    if (total <= 7) { for (i = 1; i <= total; i++) pages.push(i); return pages; }
    pages.push(1);
    var start = Math.max(2, cur - 1), end = Math.min(total - 1, cur + 1);
    if (cur <= 3) { start = 2; end = 4; }
    if (cur >= total - 2) { start = total - 3; end = total - 1; }
    if (start > 2) pages.push('…');
    for (i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push('…');
    pages.push(total);
    return pages;
  }
  function renderPager(foot, state) {
    var pageNum = Math.max(1, state.pageNum || 1);
    var pageSize = state.pageSize || DEFAULT_PAGE_SIZE;
    var total = Math.max(0, state.total || 0);
    var pages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (pageNum > pages) pageNum = pages;

    var sizeOpts = PAGE_SIZES.map(function (n) {
      return '<option value="' + n + '"' + (n === pageSize ? ' selected' : '') + '>' + n + '</option>';
    }).join('');

    var btns = '';
    btns += '<button type="button" data-pg="first" title="首页"' + (pageNum <= 1 ? ' disabled' : '') + '><i class="fa-solid fa-angles-left"></i></button>';
    btns += '<button type="button" data-pg="prev" title="上一页"' + (pageNum <= 1 ? ' disabled' : '') + '><i class="fa-solid fa-angle-left"></i></button>';
    buildPageNums(pageNum, pages).forEach(function (p) {
      if (p === '…') btns += '<span class="pager-ellipsis">…</span>';
      else btns += '<button type="button" class="' + (p === pageNum ? 'active' : '') + '" data-pg="' + p + '">' + p + '</button>';
    });
    btns += '<button type="button" data-pg="next" title="下一页"' + (pageNum >= pages ? ' disabled' : '') + '><i class="fa-solid fa-angle-right"></i></button>';
    btns += '<button type="button" data-pg="last" title="末页"' + (pageNum >= pages ? ' disabled' : '') + '><i class="fa-solid fa-angles-right"></i></button>';

    var from = total === 0 ? 0 : (pageNum - 1) * pageSize + 1;
    var to = Math.min(total, pageNum * pageSize);

    foot.innerHTML =
      '<div class="pager-info">共 <b>' + total + '</b> 条，显示 <b>' + from + '</b>–<b>' + to + '</b> 条</div>' +
      '<div class="pager-controls">' +
        '<label class="pager-size">每页 <select data-page-size>' + sizeOpts + '</select> 条</label>' +
        '<div class="pager">' + btns + '</div>' +
        '<label class="pager-jump">前往 <input type="number" min="1" max="' + pages + '" value="' + pageNum + '" data-page-jump> 页</label>' +
        '<span class="pager-pages">共 ' + pages + ' 页</span>' +
      '</div>';

    foot._pagerState = { pageNum: pageNum, pageSize: pageSize, total: total, pages: pages, onChange: state.onChange };

    function go(nextNum, nextSize) {
      var st = foot._pagerState;
      var size = nextSize != null ? nextSize : st.pageSize;
      var max = Math.max(1, Math.ceil(st.total / size) || 1);
      var num = Math.min(Math.max(1, nextNum), max);
      if (typeof st.onChange === 'function') { st.onChange({ pageNum: num, pageSize: size }); return; }
      var table = foot._table;
      if (!table && foot.previousElementSibling) table = foot.previousElementSibling.querySelector('table.data-table');
      if (table && table.getAttribute('data-fill') === '1') {
        table._pageNum = num; table._pageSize = size; fillRows(table);
      } else {
        renderPager(foot, { pageNum: num, pageSize: size, total: st.total, onChange: st.onChange });
      }
    }

    foot.querySelectorAll('.pager button[data-pg]').forEach(function (b) {
      b.addEventListener('click', function () {
        var st = foot._pagerState, pg = b.getAttribute('data-pg'), target = st.pageNum;
        if (pg === 'first') target = 1;
        else if (pg === 'prev') target = st.pageNum - 1;
        else if (pg === 'next') target = st.pageNum + 1;
        else if (pg === 'last') target = st.pages;
        else target = parseInt(pg, 10);
        go(target);
      });
    });
    var sizeSel = foot.querySelector('[data-page-size]');
    if (sizeSel) sizeSel.addEventListener('change', function () { go(1, parseInt(sizeSel.value, 10) || DEFAULT_PAGE_SIZE); });
    var jumpInput = foot.querySelector('[data-page-jump]');
    if (jumpInput) {
      var doJump = function () { var v = parseInt(jumpInput.value, 10); if (!isNaN(v)) go(v); };
      jumpInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doJump(); } });
      jumpInput.addEventListener('blur', doJump);
    }
  }
  PMS.renderPager = function (footOrTable, opts) {
    var foot = footOrTable;
    if (footOrTable && footOrTable.tagName === 'TABLE') {
      foot = ensureFoot(footOrTable);
      applyListLayout(footOrTable);
    }
    if (!foot) return;
    renderPager(foot, opts || {});
  };

  /* 列表模拟总量：每张表固定随机 500～20000，刷新页面前保持不变 */
  function mockTotalFor(table) {
    if (table._total != null) return table._total;
    var key = 'app.mockTotal:' + (location.pathname || '') + '#' + (table.id || '');
    var head = table.querySelector('thead');
    if (head) key += ':' + (head.textContent || '').replace(/\s+/g, '').slice(0, 40);
    try {
      var cached = sessionStorage.getItem(key);
      if (cached) {
        var n = parseInt(cached, 10);
        if (n >= 500 && n <= 20000) { table._total = n; return n; }
      }
    } catch (e) {}
    var total = 500 + Math.floor(Math.random() * 19501);
    table._total = total;
    try { sessionStorage.setItem(key, String(total)); } catch (e2) {}
    return total;
  }
  function fillRows(table) {
    var tbody = table.querySelector('tbody'); if (!tbody) return;
    if (!table._origRows) {
      table._origRows = Array.prototype.map.call(tbody.querySelectorAll('tr'), function (tr) { return tr.cloneNode(true); });
    }
    var orig = table._origRows;
    if (!orig.length) return;

    var pageSize = table._pageSize || DEFAULT_PAGE_SIZE;
    var pageNum = table._pageNum || 1;
    var total = mockTotalFor(table);
    table._pageSize = pageSize;

    var pages = Math.max(1, Math.ceil(total / pageSize));
    if (pageNum > pages) pageNum = pages;
    if (pageNum < 1) pageNum = 1;
    table._pageNum = pageNum;

    var showCount = Math.min(pageSize, total - (pageNum - 1) * pageSize);
    if (showCount < 0) showCount = 0;

    tbody.innerHTML = '';
    for (var i = 0; i < showCount; i++) {
      var seq = (pageNum - 1) * pageSize + i;
      var row = orig[seq % orig.length].cloneNode(true);
      row.classList.add('is-clone');
      tbody.appendChild(row);
    }
    renumber(table, (pageNum - 1) * pageSize + 1);
    markOpsColumn(table);
    var foot = ensureFoot(table);
    foot._table = table;
    renderPager(foot, { pageNum: pageNum, pageSize: pageSize, total: total });
  }
  function enhanceTables() {
    var all = listTables();
    all.forEach(addIndexColumn);
    all.forEach(markOpsColumn);
    all.forEach(watchOpsColumn);
    var layoutOnly = all.filter(function (t) { return t.hasAttribute('data-static') || t.getAttribute('data-fill') === '0'; });
    var fillable = all.filter(function (t) {
      return !t.closest('.grid-2, .grid-3') && !t.hasAttribute('data-static') && t.getAttribute('data-fill') !== '0';
    });
    layoutOnly.forEach(function (t) { t.setAttribute('data-fill', '0'); applyListLayout(t); });
    fillable.forEach(function (t) {
      t.setAttribute('data-fill', '1');
      t._pageSize = DEFAULT_PAGE_SIZE;
      t._pageNum = 1;
      applyListLayout(t);
    });
    all.forEach(function (t) { if (t.getAttribute('data-fill') !== '1') renumber(t); });
    fillable.forEach(fillRows);
    all.forEach(markOpsColumn);
  }

  /* ------- 字典下拉自动填充：<select data-dict="xxx"> ------- */
  function populateDicts(root) {
    (root || document).querySelectorAll('select[data-dict]').forEach(function (sel) {
      if (sel.getAttribute('data-dict-done') === '1') return;
      var name = sel.getAttribute('data-dict');
      if (!DICT[name]) return;
      var ph = '请选择';
      if (sel.hasAttribute('data-ph')) { ph = sel.getAttribute('data-ph'); if (ph === '') ph = false; }
      sel.innerHTML = PMS.opts(name, sel.getAttribute('data-selected'), ph);
      sel.setAttribute('data-dict-done', '1');
    });
  }
  PMS.populateDicts = populateDicts;

  /* ------- 引导 ------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.hasAttribute('data-shell')) { initShell(); return; }
    injectLayout();
    initTabs();
    enhanceTables();
    populateDicts();
    enhanceUrlUploads(document);
    document.querySelectorAll('.filter-item input[type="month"]').forEach(function (el) {
      if (!el.value) el.value = PMS.statMonth();
    });
  });
})();
