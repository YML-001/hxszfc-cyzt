/* ==========================================================================
   统一应用服务平台（wssvc）页面公共脚本
   在 app.js 之后引入。做三件事，不改动 app.js 的任何行为：

   一、路径深度校正。app.js 的菜单 href 按「一级子目录页面」书写，本平台页面在
       modules/wssvc/<服务>/ 下深两级，独立打开（非外壳 iframe）时脚本注入的顶栏
       与侧栏链接要多补一层 ../。与 wsjcfx.js 同一套做法，只是深度不同。
   二、SVG 图表。本平台图多且形态集中在折线、柱、环、热力四类，各页自己写 SVG 会
       让同一种图在不同页长得不一样，统一收在这里按数据画。
   三、页面内演示交互：开关、标签多选、参数组切换、调试台发起调用。
   ========================================================================== */
(function () {
  'use strict';

  var END = (window.APP_CONFIG && window.APP_CONFIG.end) || 'government';

  /* ---------------------------------------------------------------- 路径校正 */
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

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.body.classList.contains('embedded')) {
      fixDepth('.app-sidebar');
      fixDepth('.app-topbar');
    }
    document.querySelectorAll('[data-chart]').forEach(draw);
  });

  /* ---------------------------------------------------------------- SVG 图表 */
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) { if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]); }
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function svgBox(host, w, h) {
    var s = el('svg', { viewBox: '0 0 ' + w + ' ' + h, preserveAspectRatio: 'xMidYMid meet', height: h });
    host.innerHTML = '';
    host.appendChild(s);
    return s;
  }

  function niceMax(v) {
    if (v <= 0) return 10;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / p * 2) / 2 * p;
  }

  function fmt(v) {
    if (v >= 10000) return (v / 10000).toFixed(v >= 100000 ? 0 : 1) + '万';
    return String(v);
  }

  /* 双轴折线：柱为调用量、线为成功率。data = {x:[], bar:[], line:[]} */
  function drawDual(host, d) {
    var W = 900, H = 260, L = 52, R = 46, T = 18, B = 30;
    var s = svgBox(host, W, H);
    var iw = W - L - R, ih = H - T - B;
    var max = niceMax(Math.max.apply(null, d.bar));
    var lo = Math.min.apply(null, d.line), hi = Math.max.apply(null, d.line);
    lo = Math.floor((lo - 0.3) * 10) / 10; hi = Math.ceil((hi + 0.2) * 10) / 10;
    var g = el('g', { class: 'grid' });
    for (var i = 0; i <= 4; i++) {
      var y = T + ih * i / 4;
      g.appendChild(el('line', { x1: L, y1: y, x2: L + iw, y2: y }));
      s.appendChild(el('text', { class: 'axis y', x: L - 8, y: y + 4 }, fmt(Math.round(max * (4 - i) / 4))));
      s.appendChild(el('text', { class: 'axis', x: L + iw + 8, y: y + 4 },
        (lo + (hi - lo) * (4 - i) / 4).toFixed(1) + '%'));
    }
    s.insertBefore(g, s.firstChild);
    var bw = iw / d.bar.length * 0.56;
    d.bar.forEach(function (v, k) {
      var cx = L + iw * (k + 0.5) / d.bar.length;
      var bh = ih * v / max;
      s.appendChild(el('rect', { class: 'bar', x: cx - bw / 2, y: T + ih - bh, width: bw, height: bh, rx: 2 }));
    });
    var pts = d.line.map(function (v, k) {
      return [L + iw * (k + 0.5) / d.line.length, T + ih - ih * (v - lo) / (hi - lo)];
    });
    s.appendChild(el('path', { class: 'line', d: 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L') }));
    pts.forEach(function (p, k) {
      if (d.line.length > 14 && k % 3 !== 0) return;
      s.appendChild(el('circle', { class: 'dot', cx: p[0], cy: p[1], r: 3 }));
    });
    d.x.forEach(function (t, k) {
      if (d.x.length > 14 && k % Math.ceil(d.x.length / 10) !== 0) return;
      s.appendChild(el('text', { class: 'axis x', x: L + iw * (k + 0.5) / d.x.length, y: H - 10 }, t));
    });
  }

  /* 分组柱：data = {x:[], series:[{name,color,v:[]}]} */
  function drawGroup(host, d) {
    var W = 900, H = 250, L = 48, R = 14, T = 18, B = 30;
    var s = svgBox(host, W, H);
    var iw = W - L - R, ih = H - T - B;
    var all = [];
    d.series.forEach(function (se) { all = all.concat(se.v); });
    var max = niceMax(Math.max.apply(null, all));
    var g = el('g', { class: 'grid' });
    for (var i = 0; i <= 4; i++) {
      var y = T + ih * i / 4;
      g.appendChild(el('line', { x1: L, y1: y, x2: L + iw, y2: y }));
      s.appendChild(el('text', { class: 'axis y', x: L - 8, y: y + 4 }, fmt(Math.round(max * (4 - i) / 4))));
    }
    s.insertBefore(g, s.firstChild);
    var gw = iw / d.x.length, bw = gw * 0.72 / d.series.length;
    d.x.forEach(function (t, k) {
      var x0 = L + gw * k + gw * 0.14;
      d.series.forEach(function (se, j) {
        var bh = ih * se.v[k] / max;
        s.appendChild(el('rect', {
          x: x0 + bw * j, y: T + ih - bh, width: bw - 2, height: bh, rx: 2, fill: se.color
        }));
      });
      s.appendChild(el('text', { class: 'axis x', x: L + gw * (k + 0.5), y: H - 10 }, t));
    });
  }

  /* 横向条形对比，带目标线。data = {items:[{n,v,warn}], max, ref, unit} */
  function drawHBar(host, d) {
    var rows = d.items.length;
    var W = 620, RH = 30, T = 14, B = 24, L = 132, R = 52;
    var H = T + B + RH * rows;
    var s = svgBox(host, W, H);
    var iw = W - L - R;
    var max = d.max || niceMax(Math.max.apply(null, d.items.map(function (i) { return i.v; })));
    d.items.forEach(function (it, k) {
      var y = T + RH * k;
      s.appendChild(el('text', { class: 'axis y', x: L - 10, y: y + 17 }, it.n));
      s.appendChild(el('rect', { x: L, y: y + 7, width: iw, height: 14, rx: 3, fill: 'var(--bg-soft)' }));
      s.appendChild(el('rect', {
        x: L, y: y + 7, width: Math.max(2, iw * it.v / max), height: 14, rx: 3,
        fill: it.warn ? 'var(--lv-orange)' : 'var(--primary)'
      }));
      s.appendChild(el('text', {
        class: 'axis', x: L + iw + 8, y: y + 18, fill: it.warn ? 'var(--lv-orange)' : 'var(--text-1)'
      }, it.v + (d.unit || '')));
    });
    if (d.ref) {
      var rx = L + iw * d.ref / max;
      s.appendChild(el('line', { class: 'ref', x1: rx, y1: T, x2: rx, y2: T + RH * rows }));
      s.appendChild(el('text', { class: 'ref-t', x: rx + 4, y: H - 10 }, '目标 ' + d.ref + (d.unit || '')));
    }
  }

  /* 环形占比。data = {items:[{n,v,color}]} */
  function drawDonut(host, d) {
    var W = 360, H = 200, cx = 100, cy = 100, r = 68, rr = 42;
    var s = svgBox(host, W, H);
    var total = d.items.reduce(function (a, b) { return a + b.v; }, 0) || 1;
    var a0 = -Math.PI / 2;
    d.items.forEach(function (it) {
      var a1 = a0 + Math.PI * 2 * it.v / total;
      var big = (a1 - a0) > Math.PI ? 1 : 0;
      var p = ['M', cx + r * Math.cos(a0), cy + r * Math.sin(a0),
        'A', r, r, 0, big, 1, cx + r * Math.cos(a1), cy + r * Math.sin(a1),
        'L', cx + rr * Math.cos(a1), cy + rr * Math.sin(a1),
        'A', rr, rr, 0, big, 0, cx + rr * Math.cos(a0), cy + rr * Math.sin(a0), 'Z'].join(' ');
      var path = el('path', { d: p, fill: it.color });
      var t = el('title', {}, it.n + ' ' + (it.v / total * 100).toFixed(1) + '%');
      path.appendChild(t);
      s.appendChild(path);
      a0 = a1;
    });
    s.appendChild(el('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', fill: 'var(--text-3)', 'font-size': 12 }, d.label || '合计'));
    s.appendChild(el('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', fill: 'var(--text-1)', 'font-size': 18, 'font-weight': 700 }, d.total || fmt(total)));
    d.items.forEach(function (it, k) {
      var y = 30 + k * 22;
      s.appendChild(el('rect', { x: 196, y: y - 9, width: 10, height: 10, rx: 2, fill: it.color }));
      s.appendChild(el('text', { x: 212, y: y, fill: 'var(--text-2)', 'font-size': 12 }, it.n));
      s.appendChild(el('text', { x: W - 6, y: y, fill: 'var(--text-3)', 'font-size': 11.5, 'text-anchor': 'end' },
        (it.v / total * 100).toFixed(1) + '%'));
    });
  }

  /* 面积折线，单序列。data = {x:[], v:[], unit} */
  function drawArea(host, d) {
    var W = 900, H = 220, L = 52, R = 14, T = 16, B = 28;
    var s = svgBox(host, W, H);
    var iw = W - L - R, ih = H - T - B;
    var max = niceMax(Math.max.apply(null, d.v));
    var g = el('g', { class: 'grid' });
    for (var i = 0; i <= 4; i++) {
      var y = T + ih * i / 4;
      g.appendChild(el('line', { x1: L, y1: y, x2: L + iw, y2: y }));
      s.appendChild(el('text', { class: 'axis y', x: L - 8, y: y + 4 }, fmt(Math.round(max * (4 - i) / 4))));
    }
    s.insertBefore(g, s.firstChild);
    var pts = d.v.map(function (v, k) {
      return [L + iw * k / (d.v.length - 1), T + ih - ih * v / max];
    });
    var line = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L');
    s.appendChild(el('path', { d: line + 'L' + (L + iw) + ',' + (T + ih) + 'L' + L + ',' + (T + ih) + 'Z', fill: 'var(--primary-light)' }));
    s.appendChild(el('path', { class: 'line', d: line }));
    d.x.forEach(function (t, k) {
      if (d.x.length > 12 && k % Math.ceil(d.x.length / 8) !== 0) return;
      s.appendChild(el('text', { class: 'axis x', x: L + iw * k / (d.x.length - 1), y: H - 9 }, t));
    });
  }

  /* 堆叠横条：一行看完各段占比。data = {items:[{n,v,color}], total} */
  function drawStack(host, d) {
    var W = 900, H = 64, L = 0, T = 10, BH = 26;
    var s = svgBox(host, W, H);
    var total = d.total || d.items.reduce(function (a, b) { return a + b.v; }, 0) || 1;
    var x = L;
    d.items.forEach(function (it) {
      var w = (W - L) * it.v / total;
      s.appendChild(el('rect', { x: x, y: T, width: Math.max(1, w - 1), height: BH, rx: 2, fill: it.color }));
      if (w > 52) {
        s.appendChild(el('text', {
          x: x + w / 2, y: T + 18, 'text-anchor': 'middle', fill: '#fff', 'font-size': 12, 'font-weight': 600
        }, (it.v / total * 100).toFixed(0) + '%'));
      }
      s.appendChild(el('text', { x: x, y: H - 8, fill: 'var(--text-3)', 'font-size': 11.5 }, it.n));
      x += w;
    });
  }

  var CHARTS = { dual: drawDual, group: drawGroup, hbar: drawHBar, donut: drawDonut, area: drawArea, stack: drawStack };

  function draw(host) {
    var kind = host.getAttribute('data-chart');
    var fn = CHARTS[kind];
    if (!fn) return;
    var raw = host.getAttribute('data-series');
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    fn(host, data);
  }

  /* ---------------------------------------------------------------- 页内交互 */
  var SVC = {
    chart: function (host, kind, data) { CHARTS[kind] && CHARTS[kind](host, data); },

    /* 假开关：切 on 类并回调 */
    toggle: function (el2, msg) {
      el2.classList.toggle('on');
      if (msg) PMS.toast(msg + '：' + (el2.classList.contains('on') ? '已开启' : '已关闭'));
    },

    /* 标签多选 */
    chip: function (el2) { el2.classList.toggle('on'); },

    /* 同组单选：卡片、胶囊、接口树共用 */
    pick: function (el2, sel, cb) {
      var box = el2.parentElement;
      if (!box) return;
      box.querySelectorAll(sel).forEach(function (n) { n.classList.remove('on'); });
      el2.classList.add('on');
      if (typeof cb === 'function') cb(el2);
    },

    /* 参数组导航：切左侧高亮并滚到对应分组 */
    param: function (el2, id) {
      SVC.pick(el2, 'a');
      var sec = document.getElementById(id);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    /* 调试台：选接口后回填请求样例 */
    api: function (el2, name, path, body) {
      var box = el2.closest('.svc-api-tree');
      if (box) { box.querySelectorAll('.at-i').forEach(function (n) { n.classList.remove('on'); }); }
      el2.classList.add('on');
      var t = document.getElementById('dbgName'); if (t) t.textContent = name;
      var p = document.getElementById('dbgPath'); if (p) p.textContent = path;
      var b = document.getElementById('dbgBody'); if (b) b.value = body || b.value;
      var o = document.getElementById('dbgOut'); if (o) o.classList.add('hidden');
    },

    /* 调试台：发起调用。原型阶段直接展示预置响应 */
    send: function (ms) {
      var o = document.getElementById('dbgOut');
      PMS.toast('请求已发出，等待三方响应…');
      setTimeout(function () {
        if (o) o.classList.remove('hidden');
        PMS.toast('调用成功，耗时 ' + (ms || 286) + ' ms', 'success');
      }, 420);
    },

    /* 通用「尚未接入真实服务」提示，避免出现无反馈按钮 */
    todo: function (what) { PMS.toast(what); },

    /* 异步导出 */
    exportAsync: function (name) {
      PMS.toast('已提交导出任务：' + name + '，完成后在顶栏消息区提醒', 'success');
    }
  };

  window.SVC = SVC;
})();
