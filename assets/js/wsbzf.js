/* ==========================================================================
   保障性住房综合管理系统 · 页面交互脚本 (wsbzf.js)
   命名空间 BZ；依赖 app.js 的 PMS（toast/drawer/confirm）。用于政务端 shell 内
   的保障房各页面（房态选择、轮候操作、摇号台预览等）。摇号现场大屏的动效引擎
   自带在 wsbzf-16-run.html 内，保持全屏页自包含。
   ========================================================================== */
(function () {
  var BZ = {};

  BZ.toast = function (msg, type) {
    if (window.PMS && PMS.toast) PMS.toast(msg, type || 'success');
  };

  BZ.param = function (name) {
    var m = new RegExp('[?&]' + name + '=([^&]+)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  };

  /* 通用「按钮已响应」占位提示，避免死按钮 */
  BZ.act = function (msg, type) { BZ.toast(msg || '操作已提交', type); };

  /* 打开某从属详情页（在 shell iframe 内跳转，携带当前查询串保持身份） */
  BZ.open = function (page) {
    var q = location.search || '';
    location.href = page + q;
  };

  /* 房态栅格：点选房间，弹出简要信息 */
  function bindFangtai() {
    document.querySelectorAll('.bz-fangtai .bz-cell').forEach(function (c) {
      c.addEventListener('click', function () {
        var no = c.getAttribute('data-no') || c.querySelector('.no') && c.querySelector('.no').textContent || '';
        var st = c.classList.contains('free') ? '可配租/配售' :
                 c.classList.contains('lock') ? '已冻结（摇号锁定）' :
                 c.classList.contains('fix') ? '维修中' : '已入住';
        BZ.toast('房号 ' + no + ' · ' + st, c.classList.contains('free') ? 'success' : 'info');
      });
    });
  }

  /* 轮候队列：资格复核 / 递补占位动作 */
  function bindQueue() {
    document.querySelectorAll('[data-bz-act]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        BZ.act(b.getAttribute('data-bz-act'), b.getAttribute('data-bz-type') || 'success');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindFangtai();
    bindQueue();
  });

  window.BZ = BZ;
})();
