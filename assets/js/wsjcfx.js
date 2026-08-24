/* ==========================================================================
   房地产市场监管监测系统（wsjcfx）页面公共脚本
   在 app.js 之后引入，只做两件事，不改动 app.js 的任何行为：

   一、路径深度校正。app.js 的菜单 href 按「一级子目录页面」（如 government/shell.html、
       modules/_pending.html）书写，本子系统页面在 modules/wsjcfx/ 下深一级，独立打开
       （非外壳 iframe）时脚本注入的顶栏与侧栏链接需要多一层 ../。外壳模式下侧栏由
       shell.html 渲染，不走这里。

   二、页面内演示交互的公共封装：单选卡片、下钻提示、指标穿透、导出异步提示。
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
      // 端级首页：dashboard.html?role=xxx
      if (/^dashboard\.html/.test(h)) a.setAttribute('href', '../../' + END + '/' + h);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('embedded')) return;
    fixDepth('.app-sidebar');
    fixDepth('.app-topbar');
  });

  var JC = {
    /* 同组卡片 / 侧栏条目单选：给容器内的 sel 元素切换 on 类 */
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
    }
  };
  window.JC = JC;
})();
