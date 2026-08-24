/* ==========================================================================
   从业主体与信用监管系统（wsztxy）页面公共脚本
   在 app.js 之后引入，不改动 app.js 的任何行为，只做三件事：

   一、路径深度校正。app.js 的菜单 href 按「一级子目录页面」（如 government/shell.html、
       modules/_pending.html）书写，本子系统页面在 modules/wsztxy/ 下深一级，独立打开
       （非外壳 iframe）时脚本注入的顶栏与侧栏链接需要多一层 ../。外壳模式下侧栏由
       shell.html 渲染，不走这里。

   二、页面内演示交互的公共封装：单选卡片、下钻、指标穿透、异步导出、无权限说明。

   三、本子系统特有的两类拦截演示：P4 敏感操作的双人授权（G3）、敏感字段脱敏解除申请。
   ========================================================================== */
(function () {
  'use strict';

  var END = (window.APP_CONFIG && window.APP_CONFIG.end) || 'government';

  function fixDepth(scope) {
    var box = document.querySelector(scope);
    if (!box) return;
    box.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href') || '';
      if (/^(https?:|#|javascript:)/.test(h) || h.indexOf('../../') === 0) return;
      if (h.indexOf('../') === 0) { a.setAttribute('href', '../' + h); return; }
      if (/^dashboard\.html/.test(h)) a.setAttribute('href', '../../' + END + '/' + h);
    });
  }

  /* 本子系统的四个菜单都是一级菜单（无二级），app.js 的 ensureSingleActive 会把一级菜单里
     href 文件名与当前文件名不一致的 active 去掉；本子系统页面在 modules/wsztxy/ 下，菜单 href
     带目录前缀，因此始终对不上。这里按 body[data-active] 与菜单 a[data-key] 重新标注高亮，
     详情页（data-active 指向所属菜单）也能正确高亮父菜单。 */
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

  /* 业务办理端各角色的演示姓名，与 app.js 的 roles 配置保持一致。
     双人授权拦截需要比对「发起人」与「当前登录人」，这里只做原型演示用的映射。 */
  var USERS = {
    window: '覃永明', reviewer: '韦国强', manager: '李慧',
    leader: '张伟', admin: '蒙丽华', ops: '陆志明'
  };
  function me() {
    var r = (window.PMS && PMS.role) || document.body.getAttribute('data-current-role') || '';
    return USERS[r] || '当前登录人';
  }

  var ZT = {
    /* 当前登录人姓名（原型演示用） */
    me: me,

    /* 同组卡片 / 树节点单选：给容器内的 sel 元素切换 on 类 */
    pick: function (el, sel, cb) {
      var box = el.parentElement;
      while (box && !box.querySelector) box = box.parentElement;
      if (!box) return;
      box.querySelectorAll(sel).forEach(function (n) { n.classList.remove('on'); });
      el.classList.add('on');
      if (typeof cb === 'function') cb(el);
    },

    /* UI13 下钻：原型阶段以 Toast 说明下钻目标 */
    drill: function (name, target) {
      PMS.toast('下钻至「' + name + '」' + (target ? ' · ' + target : ''));
    },

    /* UI9 异步导出 */
    exportAsync: function (name) {
      PMS.toast('已提交导出任务：' + name + '，完成后在顶栏消息区提醒', 'success');
    },

    /* UI14 无权限按钮：置灰按钮点击后说明原因 */
    denied: function (why) {
      PMS.toast(why, 'error');
    },

    /* 通用「尚未接入真实服务」提示，避免出现无反馈按钮 */
    todo: function (what) {
      PMS.toast(what);
    },

    /* G3 双人授权：名单认定、修复、豁免、调分等 P4 操作，发起与审批必须两人
       act    操作名称
       who    发起人（默认当前登录人）
       onOk   通过双人校验后的后续动作（原型中仅演示提示） */
    dual: function (act, who, onOk) {
      if (who && who === me()) {
        PMS.toast('「' + act + '」由您本人发起，不能由本人审批。请转交同岗其他人员或上级复核（双人授权 G3）', 'error');
        return;
      }
      PMS.confirm({
        title: act + ' · 双人授权确认',
        message: '确认对本条记录执行「' + act + '」？',
        detail: '本操作属 P4 敏感操作：发起人与审批人必须为不同人员，操作全程留痕（含操作人、时间、IP、前后值），日志保留不少于 3 年。',
        type: 'warning',
        okText: '确认执行',
        onOk: function () {
          if (typeof onOk === 'function') onOk();
          else PMS.toast('已执行「' + act + '」并写入操作留痕', 'success');
        }
      });
    },

    /* 敏感字段脱敏解除：默认掩码展示，申请后按需临时展开并留痕 */
    mask: function (el, full, why) {
      if (!el) return;
      if (el.classList.contains('open')) {
        PMS.toast('已收起明文显示');
        el.classList.remove('open');
        el.innerHTML = el.getAttribute('data-mask') || el.textContent;
        return;
      }
      PMS.confirm({
        title: '脱敏解除申请',
        message: '确认申请查看该字段明文？',
        detail: (why || '身份证号、联系电话、银行账号等字段默认脱敏。') +
          '查看明文将记录申请人、事由、时间与被查主体，可被审计追溯（G3）。',
        type: 'warning',
        okText: '申请并查看',
        onOk: function () {
          if (!el.getAttribute('data-mask')) el.setAttribute('data-mask', el.innerHTML);
          el.classList.add('open');
          el.innerHTML = full + ' <span class="mk-btn" onclick="ZT.mask(this.parentElement)">收起</span>';
          PMS.toast('已临时展示明文并写入查看留痕', 'success');
        }
      });
    },

    /* 读取 URL 参数：详情页返回原页签、原筛选条件时使用 */
    param: function (k, def) {
      var m = new RegExp('[?&]' + k + '=([^&]*)').exec(location.search);
      return m ? decodeURIComponent(m[1]) : (def === undefined ? '' : def);
    },

    /* 按名称切换页签（供 URL 参数恢复、页内链接跳转使用） */
    tab: function (name, scope) {
      var box = scope ? document.querySelector(scope) : document;
      var t = box && box.querySelector('.tabs .tab[data-tab="' + name + '"]');
      if (t) t.click();
    }
  };

  window.ZT = ZT;
})();
