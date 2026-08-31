/* ==========================================================================
   需求口径承载页 · 共享脚本（spec.js）
   在 app.js 之后引入，不改动 app.js 的任何行为。与 spec.css 配套使用。

   做三件事：
   一、路径深度校正。app.js 的菜单 href 按「一级子目录页面」（如 government/shell.html）
       书写，modules/<子系统>/ 下的页面深一级，独立打开时注入的顶栏与侧栏链接需多一层 ../。
       外壳模式下侧栏由 shell.html 渲染，不走这里。
   二、页面内演示交互的公共封装：单选、下钻、异步导出、无权限说明、双人授权、脱敏解除。
   三、页签与 URL 参数的互通，便于跨页链接直接落到指定页签。

   从业主体子系统的 wsztxy.js 先于本文件建成，两者能力重叠但各自独立，
   以免改动影响已交付页面；后续新增子系统一律用本文件。
   ========================================================================== */
(function () {
  'use strict';

  var END = (window.APP_CONFIG && window.APP_CONFIG.end) || 'government';

  /* app.js 注入的链接按「页面在根下一层」书写（如 government/shell.html 里的 ../modules/x）。
     本子系统页面更深，需要按实际层级补 ../：
       modules/<子系统>/x.html          根下 2 层，补 1 个
       modules/<子系统>/<端>/x.html     根下 3 层，补 2 个
     即补的个数 = modules/ 之下的目录层数。 */
  function extraUp() {
    var p = location.pathname;
    var i = p.lastIndexOf('/modules/');
    if (i < 0) return 0;
    var rest = p.slice(i + '/modules/'.length);
    return rest.split('/').length - 1;   /* 去掉文件名后剩余的目录层数 */
  }

  function fixDepth(scope) {
    var box = document.querySelector(scope);
    if (!box) return;
    /* app.js 补丁 J 已统一处理，重复补会多出 ../ */
    if (box.getAttribute('data-depth-fixed')) return;
    box.setAttribute('data-depth-fixed', '1');
    var up = new Array(extraUp() + 1).join('../');
    if (!up) return;
    box.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href') || '';
      if (/^(https?:|#|javascript:|mailto:)/.test(h)) return;
      if (h.indexOf('../') === 0) { a.setAttribute('href', up + h); return; }
      if (/^dashboard\.html/.test(h)) a.setAttribute('href', up + '../' + END + '/' + h);
    });
  }

  /* app.js 的 ensureSingleActive 按「菜单 href 文件名 == 当前文件名」判定高亮，
     modules/ 下的页面菜单 href 带目录前缀，始终对不上。这里按 body[data-active]
     与菜单 a[data-key] 重新标注，详情页（data-active 指向所属菜单）也能高亮父菜单。 */
  function markActive() {
    var key = document.body.getAttribute('data-active') || '';
    var box = document.querySelector('.app-sidebar');
    if (!key || !box) return;
    var hit = box.querySelector('a[data-key="' + key + '"]');
    if (!hit) return;
    box.querySelectorAll('a.active').forEach(function (a) { a.classList.remove('active'); });
    hit.classList.add('active');
    var group = hit.closest('.menu-item');
    if (group) group.classList.add('open');
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('embedded')) return;
    fixDepth('.app-sidebar');
    fixDepth('.app-topbar');
    markActive();
  });

  /* 各角色的演示姓名，与 app.js 的 roles 配置保持一致。
     双人授权拦截需要比对「发起人」与「当前登录人」。 */
  var USERS = {
    window: '覃永明', district: '覃永明', reviewer: '韦国强',
    manager: '李慧', city: '李慧', leader: '张伟',
    admin: '蒙丽华', ops: '陆志明', developer: '周××', bank: '莫××'
  };
  function me() {
    var r = (window.PMS && PMS.role) || document.body.getAttribute('data-current-role') || '';
    return USERS[r] || '当前登录人';
  }

  var SP = {
    me: me,

    /* 同组卡片 / 树节点单选 */
    pick: function (el, sel, cb) {
      var box = el.parentElement;
      while (box && !box.querySelector) box = box.parentElement;
      if (!box) return;
      box.querySelectorAll(sel).forEach(function (n) { n.classList.remove('on'); });
      el.classList.add('on');
      if (typeof cb === 'function') cb(el);
    },

    /* 指标下钻。给了 href 的真跳转，没给的以 Toast 说明下钻目标。
       第三个参数支持 'x.html' 与 'x.html?tab=y' 两种写法。 */
    drill: function (name, desc, href) {
      if (href) {
        PMS.toast('正在打开「' + name + '」' + (desc ? ' · ' + desc : ''));
        setTimeout(function () { location.href = href; }, 260);
        return;
      }
      PMS.toast('下钻至「' + name + '」' + (desc ? ' · ' + desc : ''));
    },

    exportAsync: function (name) {
      PMS.toast('已提交导出任务：' + name + '，完成后在顶栏消息区提醒', 'success');
    },

    /* 无权限或不可用的操作：点击后说明原因，不做隐藏 */
    denied: function (why) { PMS.toast(why, 'error'); },

    /* 通用动作反馈，避免出现无反馈按钮 */
    todo: function (what) { PMS.toast(what); },

    /* 高敏操作双人授权：发起与审批必须两人 */
    dual: function (act, who, onOk) {
      if (who && who === me()) {
        PMS.toast('「' + act + '」由您本人发起，不能由本人审批。请转交同岗其他人员或上级复核', 'error');
        return;
      }
      PMS.confirm({
        title: act + ' · 双人授权确认',
        message: '确认执行「' + act + '」？',
        detail: '本操作属高敏操作：发起人与审批人必须为不同人员，操作全程留痕（含操作人、时间、IP、前后值）。',
        type: 'warning', okText: '确认执行',
        onOk: function () {
          if (typeof onOk === 'function') onOk();
          else PMS.toast('已执行「' + act + '」并写入操作留痕', 'success');
        }
      });
    },

    /* 敏感字段脱敏解除：默认掩码，申请后临时展开并留痕 */
    mask: function (el, full, why) {
      if (!el) return;
      if (el.classList.contains('open')) {
        el.classList.remove('open');
        el.innerHTML = el.getAttribute('data-mask') || el.textContent;
        PMS.toast('已收起明文显示');
        return;
      }
      PMS.confirm({
        title: '脱敏解除申请',
        message: '确认申请查看该字段明文？',
        detail: (why || '身份证号、联系电话、银行账号等字段默认脱敏。') +
          '查看明文将记录申请人、事由、时间与被查对象，可被审计追溯。',
        type: 'warning', okText: '申请并查看',
        onOk: function () {
          if (!el.getAttribute('data-mask')) el.setAttribute('data-mask', el.innerHTML);
          el.classList.add('open');
          el.innerHTML = full + ' <span class="mk" onclick="SP.mask(this.parentElement)">收起</span>';
          PMS.toast('已临时展示明文并写入查看留痕', 'success');
        }
      });
    },

    param: function (k, def) {
      var m = new RegExp('[?&]' + k + '=([^&]*)').exec(location.search);
      return m ? decodeURIComponent(m[1]) : (def === undefined ? '' : def);
    },

    /* 按名称切换页签，供 URL 参数恢复与跨页链接使用 */
    tab: function (name, scope) {
      var box = scope ? document.querySelector(scope) : document;
      var t = box && box.querySelector('.tabs .tab[data-tab="' + name + '"]');
      if (t) t.click();
    },

    /* 千分位金额，元 → 万元保留两位 */
    wan: function (yuan) {
      return (yuan / 10000).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  };

  window.SP = SP;
})();
