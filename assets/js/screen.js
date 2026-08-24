/* ==========================================================================
   监测大屏公共脚本（wsjcfx-screen-*.html）· ECharts 版
   职责：等比缩放、时钟、主题轮播、演示/降级、氛围粒子，
   以及 ECharts 装配（同步注册真实柳州地图 + 统一深色主题令牌）。
   业务图表在各主题页内联脚本里用 SC.ready(cb) 构建。

   地图取数：优先用 assets/geo/liuzhou-geo.js 提供的全局变量（同步、file:// 可用），
   仅当该变量缺失时才回退 fetch(assets/geo/liuzhou.json)。
   故障隔离：每张图各自 try/catch，单图失败不影响同页其余图表（RL6 / BS9）。
   ========================================================================== */
(function (w, d) {
  'use strict';

  /* 七个主题的轮播顺序（BS8） */
  var THEMES = [
    { k: 'zh', f: 'wsjcfx-screen-zh.html', n: '综合监测大屏' },
    { k: 'spf', f: 'wsjcfx-screen-spf.html', n: '商品房专题' },
    { k: 'esf', f: 'wsjcfx-screen-esf.html', n: '存量房专题' },
    { k: 'zj', f: 'wsjcfx-screen-zj.html', n: '资金监管专题' },
    { k: 'sc', f: 'wsjcfx-screen-sc.html', n: '市场运行专题' },
    { k: 'bjl', f: 'wsjcfx-screen-bjl.html', n: '保交楼专题' },
    { k: 'hfz', f: 'wsjcfx-screen-hfz.html', n: '好房子专题' }
  ];
  var DWELL = 45;

  var SC = w.SC = {};
  SC.themes = THEMES;
  SC.mapName = 'liuzhou';
  SC.mapReady = false;
  SC.charts = [];

  /* ---------- 主题令牌：从 CSS 变量读取强调色，供 ECharts option 使用 ---------- */
  function cssVar(name, fb) {
    var v = getComputedStyle(d.body).getPropertyValue(name);
    return (v && v.trim()) || fb;
  }
  function buildTokens() {
    SC.C = {
      accent: cssVar('--sc-accent', '#00d4ff'),
      accent2: cssVar('--sc-accent-2', '#3d7eff'),
      primary: cssVar('--sc-primary', '#3d7eff'),
      cyan: cssVar('--sc-cyan', '#00d4ff'),
      green: cssVar('--sc-green', '#00ff9d'),
      red: cssVar('--sc-red', '#f56c6c'),
      orange: cssVar('--sc-orange', '#f59e0b'),
      yellow: cssVar('--sc-yellow', '#fbbf24'),
      blue: cssVar('--sc-blue', '#4a7ce0'),
      t1: cssVar('--sc-t1', '#e6f1ff'),
      t2: cssVar('--sc-t2', '#a0b8d8'),
      t3: cssVar('--sc-t3', '#6b8299'),
      line: 'rgba(0,180,255,.14)',
      axis: '#5a7391',
      font: '"Microsoft YaHei","PingFang SC",Arial,sans-serif'
    };
  }

  /* 通用 tooltip 样式 */
  SC.tt = function (extra) {
    var base = {
      backgroundColor: 'rgba(4,16,40,.94)',
      borderColor: 'rgba(0,212,255,.4)',
      borderWidth: 1,
      textStyle: { color: '#e6f1ff', fontSize: 13 },
      extraCssText: 'backdrop-filter:blur(6px);box-shadow:0 4px 24px rgba(0,0,0,.5);'
    };
    if (extra) for (var k in extra) if (extra.hasOwnProperty(k)) base[k] = extra[k];
    return base;
  };

  /* 常用紧凑 grid（提升信息密度，减少留白） */
  SC.grid = function (o) {
    var g = { left: 46, right: 18, top: 26, bottom: 24, containLabel: false };
    if (o) for (var k in o) if (o.hasOwnProperty(k)) g[k] = o[k];
    return g;
  };

  /* ---------- ECharts 初始化封装：单图故障隔离 ---------- */
  SC.echart = function (elId, option, onclick) {
    var el = typeof elId === 'string' ? d.getElementById(elId) : elId;
    if (!el) { console.warn('[大屏] 容器不存在：' + elId); return null; }
    if (!w.echarts) { degradePanel(el, '图表组件未加载'); return null; }
    try {
      var ch = w.echarts.init(el, null, { renderer: 'canvas' });
      ch.setOption(option);
      if (onclick) ch.on('click', onclick);
      SC.charts.push(ch);
      return ch;
    } catch (e) {
      console.error('[大屏] 图表渲染失败：' + elId, e);
      degradePanel(el, '该图表数据暂不可用');
      return null;
    }
  };

  /* 单个面板降级：优先显示同面板内的清单兜底，否则显示占位文案。绝不黑屏、绝不报错（BS9） */
  function degradePanel(el, msg) {
    var body = el.closest ? el.closest('.sp-b') : null;
    var list = body ? body.querySelector('.sc-maplist') : null;
    el.style.display = 'none';
    if (list) { list.classList.add('show'); return; }
    if (body && !body.querySelector('.sc-fallback')) {
      var p = d.createElement('div');
      p.className = 'sc-fallback';
      p.innerHTML = '<i class="fa-solid fa-circle-info"></i> ' + (msg || '数据暂不可用');
      body.appendChild(p);
    }
  }

  /* 地图专用：地图未注册时只降级本面板，不抛错、不影响同页其它图表 */
  SC.mapChart = function (elId, opt) {
    var el = typeof elId === 'string' ? d.getElementById(elId) : elId;
    if (!el) return null;
    if (!SC.mapReady) { degradePanel(el, '地图数据暂不可用，已切换为区县清单'); return null; }
    return SC.echart(el, SC.liuzhouMap(opt));
  };

  /* ---------- 真实柳州地图 option 工厂 ---------- */
  /* areaData: [{name:'柳南区', value: 数值}]，points: [{name, value:[lng,lat,size], lv}] */
  SC.liuzhouMap = function (opt) {
    opt = opt || {};
    var C = SC.C;
    var series = [{
      type: 'map', map: 'liuzhou', roam: false, zoom: opt.zoom || 1.18, aspectScale: 0.9,
      data: opt.areaData || [],
      label: { show: opt.label !== false, color: C.t2, fontSize: opt.labelSize || 11, formatter: opt.labelFmt },
      itemStyle: { areaColor: 'rgba(12,30,68,.6)', borderColor: 'rgba(0,180,255,.35)', borderWidth: 1 },
      emphasis: { label: { color: '#fff', fontWeight: 700 }, itemStyle: { areaColor: 'rgba(0,150,220,.5)' } },
      select: { disabled: true }
    }];
    if (opt.points && opt.points.length) {
      var normal = opt.points.filter(function (p) { return p.lv !== 'red'; });
      var reds = opt.points.filter(function (p) { return p.lv === 'red'; });
      if (normal.length) series.push({
        type: 'scatter', coordinateSystem: 'geo', data: normal, zlevel: 2,
        symbolSize: function (v) { return Math.max(7, Math.sqrt(v[2] || 40) * (opt.sizeK || 1.4)); },
        itemStyle: {
          color: function (p) { return SC.lvColor(p.data && p.data.lv); },
          shadowBlur: 8, shadowColor: 'rgba(0,212,255,.5)'
        }
      });
      if (reds.length) series.push({
        type: 'effectScatter', coordinateSystem: 'geo', data: reds, zlevel: 3,
        symbolSize: function (v) { return Math.max(10, Math.sqrt(v[2] || 60) * (opt.sizeK || 1.4)); },
        rippleEffect: { brushType: 'stroke', scale: 4, period: 3 },
        itemStyle: { color: C.red, shadowBlur: 12, shadowColor: 'rgba(245,108,108,.7)' },
        label: { show: !!opt.labelRed, formatter: '{b}', position: 'right', color: C.red, fontSize: 11 }
      });
    }
    var o = {
      tooltip: SC.tt({
        trigger: 'item',
        formatter: opt.tooltip || function (p) {
          if (p.seriesType === 'map') return p.name + (p.value != null && !isNaN(p.value) ? ' · ' + p.value : '');
          return p.name;
        }
      }),
      geo: {
        map: 'liuzhou', roam: false, zoom: opt.zoom || 1.18, aspectScale: 0.9,
        itemStyle: { areaColor: 'transparent', borderColor: 'transparent' }
      },
      series: series
    };
    if (!opt.noVisual) {
      o.visualMap = {
        min: opt.min || 0, max: opt.max || 100, left: 10, bottom: 12,
        text: [opt.maxTxt || '高', opt.minTxt || '低'], textStyle: { color: C.t3, fontSize: 11 },
        inRange: { color: opt.colors || ['rgba(0,40,80,.55)', 'rgba(0,120,200,.7)', C.accent] },
        calculable: true, itemWidth: 10, itemHeight: opt.vmH || 86, seriesIndex: 0
      };
    }
    if (opt.pieces) {
      o.visualMap = {
        type: 'piecewise', pieces: opt.pieces, left: 10, bottom: 12, seriesIndex: 0,
        textStyle: { color: C.t3, fontSize: 11 }, itemWidth: 12, itemHeight: 10, itemGap: 4
      };
    }
    return o;
  };
  SC.lvColor = function (lv) {
    var C = SC.C;
    return lv === 'red' ? C.red : lv === 'orange' ? C.orange : lv === 'yellow' ? C.yellow
      : lv === 'blue' ? C.blue : lv === 'green' ? C.green : C.accent;
  };

  /* 滚动表格：重复一份数据实现无缝滚动 */
  SC.roll = function (id, arr, fn) {
    var el = d.getElementById(id); if (!el) return;
    try { el.innerHTML = arr.concat(arr).map(fn).join(''); }
    catch (e) { console.error('[大屏] 列表渲染失败：' + id, e); }
  };

  /* ---------- SC.ready：ECharts + 地图就绪后回调 ---------- */
  var readyQ = [], isReady = false;
  SC.ready = function (cb) { if (isReady) safeRun(cb); else readyQ.push(cb); };
  function safeRun(cb) { try { cb(); } catch (e) { console.error('[大屏] 建图脚本异常', e); } }
  function flushReady() { isReady = true; readyQ.forEach(safeRun); readyQ = []; }

  /* 地图注册：同步优先（file:// 可用），fetch 仅作兜底 */
  function initMap() {
    if (!w.echarts) { console.warn('[大屏] ECharts 未加载'); flushReady(); return; }
    if (w.SC_GEO_LIUZHOU) {
      try {
        w.echarts.registerMap('liuzhou', w.SC_GEO_LIUZHOU);
        SC.mapReady = true;
      } catch (e) { console.error('[大屏] 地图注册失败', e); }
      flushReady();
      return;
    }
    /* 兜底：本地 JSON（仅 http(s) 下可用） */
    if (!w.fetch) { flushReady(); return; }
    fetch('../assets/geo/liuzhou.json')
      .then(function (r) { if (!r.ok) throw new Error('geo ' + r.status); return r.json(); })
      .then(function (geo) { w.echarts.registerMap('liuzhou', geo); SC.mapReady = true; flushReady(); })
      .catch(function (e) {
        console.warn('[大屏] 地图数据加载失败，地图面板降级为区县清单', e);
        flushReady();
      });
  }

  /* ---------- 氛围层（网格 + 扫描 + 粒子） ---------- */
  var fxRAF = null;
  function initFx() {
    if (d.querySelector('.sc-fx')) return;
    var fx = d.createElement('div');
    fx.className = 'sc-fx';
    fx.innerHTML = '<div class="sc-grid"></div><div class="sc-scan"></div><canvas id="scParticles"></canvas>';
    d.body.insertBefore(fx, d.body.firstChild);
    var cvs = d.getElementById('scParticles');
    if (!cvs || !cvs.getContext) return;
    var ctx = cvs.getContext('2d'), W = 0, H = 0, pts = [], dpr = w.devicePixelRatio || 1;
    function accent() { return cssVar('--sc-accent-rgb', '0, 212, 255'); }
    function resize() {
      W = w.innerWidth; H = w.innerHeight;
      cvs.width = W * dpr; cvs.height = H * dpr; cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); pts = [];
      var n = Math.round(Math.min(88, Math.max(46, W / 24)));
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .4, dx: (Math.random() - .5) * .3, dy: (Math.random() - .5) * .22, a: Math.random() * .5 + .2, red: Math.random() > .92 });
    }
    function draw() {
      var ac = accent(); ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) { var p = pts[i]; p.x += p.dx; p.y += p.dy; if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(' + (p.red ? '245,108,108' : ac) + ',' + p.a + ')'; ctx.fill(); }
      for (var a = 0; a < pts.length; a++) for (var b = a + 1; b < pts.length; b++) { var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y, dist = Math.sqrt(dx * dx + dy * dy); if (dist < 150) { ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.strokeStyle = 'rgba(' + ac + ',' + (0.08 * (1 - dist / 150)) + ')'; ctx.lineWidth = 0.5; ctx.stroke(); } }
      fxRAF = requestAnimationFrame(draw);
    }
    resize(); w.addEventListener('resize', resize); if (fxRAF) cancelAnimationFrame(fxRAF); draw();
  }
  SC.initFx = initFx;

  function decoratePanels() {
    d.querySelectorAll('.sc-panel').forEach(function (p) {
      if (p.querySelector('.sp-c1')) return;
      var c1 = d.createElement('span'); c1.className = 'sp-c1';
      var c2 = d.createElement('span'); c2.className = 'sp-c2';
      p.appendChild(c1); p.appendChild(c2);
    });
  }

  /* ---------- 等比缩放（BS12） ---------- */
  function fit() {
    var st = d.querySelector('.sc-stage'); if (!st) return;
    var s = Math.min(w.innerWidth / 1920, w.innerHeight / 1080);
    st.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  SC.fit = fit;

  /* ---------- 时钟 ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var el = d.getElementById('scClock'); if (!el) return;
    var t = new Date(); var wk = ['日', '一', '二', '三', '四', '五', '六'][t.getDay()];
    el.textContent = pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds());
    var dt = d.getElementById('scDate'); if (dt) dt.textContent = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + ' 星期' + wk;
  }

  /* ---------- 数字滚动（data-count） ---------- */
  function countUp() {
    d.querySelectorAll('[data-count]').forEach(function (el) {
      var raw = el.getAttribute('data-count'); var to = parseFloat(raw.replace(/,/g, '')); if (isNaN(to)) return;
      var dec = (raw.split('.')[1] || '').length; var t0 = null, dur = 1100;
      (function step(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1); var v = to * (1 - Math.pow(1 - p, 3)); el.textContent = fmt(v.toFixed(dec)); if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to.toFixed(dec)); })(performance.now());
    });
  }
  function fmt(n) { var p = String(n).split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.'); }
  SC.fmt = fmt;

  /* ---------- 轮播 ---------- */
  var timer = null, left = DWELL;
  function curIndex() { var f = location.pathname.split('/').pop(); var i = THEMES.findIndex(function (t) { return t.f === f; }); return i < 0 ? 0 : i; }
  function paint() { var bar = d.querySelector('.sc-carousel > i'); if (bar) bar.style.width = ((DWELL - left) / DWELL * 100) + '%'; var lb = d.getElementById('scNext'); if (lb) lb.textContent = left + ' 秒后切换至「' + THEMES[(curIndex() + 1) % THEMES.length].n + '」'; }
  function startCarousel() { stopCarousel(); left = DWELL; paint(); timer = setInterval(function () { left--; paint(); if (left <= 0) location.href = THEMES[(curIndex() + 1) % THEMES.length].f; }, 1000); d.body.classList.add('rolling'); }
  function stopCarousel() { if (timer) { clearInterval(timer); timer = null; } var bar = d.querySelector('.sc-carousel > i'); if (bar) bar.style.width = '0'; var lb = d.getElementById('scNext'); if (lb) lb.textContent = '轮播已暂停'; d.body.classList.remove('rolling'); }
  SC.toggleCarousel = function (btn) { var on = btn.classList.toggle('on'); if (on) { startCarousel(); btn.innerHTML = '<i class="fa-solid fa-pause"></i> 暂停轮播'; } else { stopCarousel(); btn.innerHTML = '<i class="fa-solid fa-play"></i> 开始轮播'; } };
  SC.go = function (k) { var t = THEMES.find(function (x) { return x.k === k; }); if (t) location.href = t.f; };
  SC.next = function () { location.href = THEMES[(curIndex() + 1) % THEMES.length].f; };
  SC.prev = function () { location.href = THEMES[(curIndex() + THEMES.length - 1) % THEMES.length].f; };

  /* ---------- 演示模式（BS10） ---------- */
  SC.toggleDemo = function (btn) { var on = d.body.classList.toggle('demo'); btn.classList.toggle('on', on); var f = d.getElementById('scDemoFlag'); if (f) f.style.display = on ? '' : 'none'; console.log('[大屏演示模式] ' + (on ? '开启' : '关闭') + ' @ ' + new Date().toISOString()); };

  /* ---------- 三级降级（BS9） ---------- */
  SC.degrade = function (level) {
    var f = d.getElementById('scDegradeFlag'); var cover = d.querySelector('.sc-cover');
    if (level === 0) { if (f) f.style.display = 'none'; if (cover) cover.classList.remove('show'); }
    else if (level === 1) { if (f) { f.style.display = ''; f.querySelector('span').textContent = '实时数据不可用，当前展示今日固化结果（02:00）'; } if (cover) cover.classList.remove('show'); }
    else if (level === 2) { if (f) { f.style.display = ''; f.querySelector('span').textContent = '固化结果不可用，当前展示 2026-07-30 最近快照'; } if (cover) cover.classList.remove('show'); }
    else { if (cover) cover.classList.add('show'); }
  };

  /* ---------- 键盘 ---------- */
  d.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') SC.next();
    else if (e.key === 'ArrowLeft') SC.prev();
    else if (e.key === 'f' || e.key === 'F') { if (d.fullscreenElement) d.exitFullscreen(); else d.documentElement.requestFullscreen(); }
  });

  w.addEventListener('resize', function () { fit(); SC.charts.forEach(function (c) { try { c.resize(); } catch (e) {} }); });
  d.addEventListener('DOMContentLoaded', function () {
    buildTokens();
    initFx();
    decoratePanels();
    fit();
    tick(); setInterval(tick, 1000);
    countUp();
    initMap();
  });
})(window, document);
