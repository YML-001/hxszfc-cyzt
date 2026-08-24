/* ============================================================================
   房产一张图地图组件（FR-032 底图图层 / FR-033 专题 / FR-034 检索定位）

   全系统唯一的地图实现（架构纪律 M6）：FR-069 地理热力与 FR-080 项目 GIS
   都应复用本组件，不另建地图能力。

   底图用高德栅格瓦片，坐标系 GCJ-02，与 assets/geo/liuzhou-geo.js 的行政边界
   同系，叠加不偏移。底图地址集中在 BASE 一处配置（FR-032 R1：不硬编码），
   将来换市级政务 GIS 或天地图只改这个对象。

   缩放层级驱动聚合粒度（地图找房范式）：
     z < 10   区县视图  10 个区县气泡
     z 10—12  片区视图  按片区聚合
     z ≥ 13   项目视图  单个项目点位，z ≥ 15 挂项目名标签
   ========================================================================== */
(function (w, d) {
  'use strict';

  /* -------------------- 底图配置（唯一硬编码入口） -------------------- */
  var BASE = {
    road: {
      name: '标准地图',
      tiles: [{ url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', sub: '1234' }]
    },
    img: {
      name: '影像地图',
      tiles: [
        { url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', sub: '1234' },
        { url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', sub: '1234' }
      ]
    },
    dark: {
      name: '深色地图',
      tiles: [{ url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', sub: '1234' }]
    }
  };

  var LIUZHOU = [[23.90, 108.55], [26.10, 110.15]];   /* 市域范围，复位用 */
  var Z_PQ = 10;        /* ≥ 此层级进入片区视图 */
  var Z_XM = 13;        /* ≥ 此层级散成项目点位 */
  var Z_LABEL = 15;     /* ≥ 此层级挂项目名标签 */

  var C = {
    red: '#f56c6c', orange: '#e6a23c', yellow: '#eebe77', blue: '#409eff',
    gray: '#909399', primary: '#1d4ed8', green: '#16a34a'
  };
  var LV_COLOR = { red: C.red, orange: C.orange, yellow: '#d4a017', blue: C.blue };
  var BS_COLOR = { wdg: C.gray, zj: C.primary, tg: C.red, jgws: C.orange, yjf: C.green };

  /* 库存分布按去化周期分档（与商品房专题 FR-012 R1 同档） */
  function kcColor(qh) {
    if (qh == null) return C.gray;
    if (qh > 24) return C.red;
    if (qh > 18) return C.orange;
    if (qh > 12) return '#d4a017';
    return C.green;
  }

  /* el 是 Leaflet 画布，host 是外层 .jc-map；所有状态类都挂 host，
     CSS 才能用 .jc-map.show-bjl .jm-mk 这类后代选择器命中画布里的要素 */
  var M = {
    map: null, el: null, host: null, D: null,
    base: 'road', dot: 'lv', op: 0.85,
    layer: { boundary: false, heat: false, bjl: true, hfz: false, cross: false },
    filter: { zsOnly: false, qx: '', bjlSt: '', qy: '' },
    sel: null, cb: {},
    g: {}, tileLayers: [], markers: {}, lasso: null, nearCircle: null
  };

  /* -------------------- 数据筛选与聚合 -------------------- */
  function passFilter(p) {
    var f = M.filter;
    if (f.zsOnly && p.ss !== 'zs') return false;
    if (f.qx && p.qx !== f.qx) return false;
    if (f.bjlSt && p.bjlSt !== f.bjlSt) return false;
    if (f.qy && p.qy.indexOf(f.qy) < 0 && p.n.indexOf(f.qy) < 0) return false;
    return true;
  }
  function shown() { return M.D.projects.filter(passFilter); }

  function level() {
    var z = M.map.getZoom();
    return z >= Z_XM ? 'xm' : (z >= Z_PQ ? 'pq' : 'qx');
  }
  function levelName(lv) { return lv === 'xm' ? '项目视图' : lv === 'pq' ? '片区视图' : '区县视图'; }

  /* 按 key 分组并算出锚点、项目数、最高风险等级 */
  function group(list, key, anchorOf) {
    var m = {};
    list.forEach(function (p) {
      var k = p[key];
      if (!m[k]) m[k] = { key: k, items: [], red: 0, orange: 0, top: 'blue' };
      var g = m[k];
      g.items.push(p);
      if (p.lv === 'red') g.red++;
      if (p.lv === 'orange') g.orange++;
      if (M.D.LV_RANK[p.lv] > M.D.LV_RANK[g.top]) g.top = p.lv;
    });
    return Object.keys(m).map(function (k) {
      var g = m[k];
      g.at = anchorOf(g);
      return g;
    });
  }
  function avgAnchor(g) {
    var la = 0, ln = 0;
    g.items.forEach(function (p) { la += p.lat; ln += p.lng; });
    return [la / g.items.length, ln / g.items.length];
  }

  /* 柳州五个城区挤在十几公里内，全市视野下气泡会叠成一坨。
     在屏幕坐标里做几轮互斥推挤，只挪最小距离，锚点顺序与相对方位不变。 */
  function deOverlap(gs) {
    if (gs.length < 2) return;
    var pts = gs.map(function (g) { return M.map.latLngToLayerPoint(L.latLng(g.at[0], g.at[1])); });
    var rs = gs.map(function (g) { return bubblePx(g.items.length) / 2 + 3; });
    for (var it = 0; it < 40; it++) {
      var moved = false;
      for (var i = 0; i < gs.length; i++) {
        for (var j = i + 1; j < gs.length; j++) {
          var dx = pts[j].x - pts[i].x, dy = pts[j].y - pts[i].y;
          var dist = Math.sqrt(dx * dx + dy * dy) || .01;
          var need = rs[i] + rs[j];
          if (dist >= need) continue;
          var push = (need - dist) / 2, ux = dx / dist, uy = dy / dist;
          pts[i].x -= ux * push; pts[i].y -= uy * push;
          pts[j].x += ux * push; pts[j].y += uy * push;
          moved = true;
        }
      }
      if (!moved) break;
    }
    gs.forEach(function (g, k) {
      var ll = M.map.layerPointToLatLng(pts[k]);
      g.at = [ll.lat, ll.lng];
    });
  }

  /* -------------------- 图标 -------------------- */
  function bubblePx(n) { return n > 30 ? 74 : n > 10 ? 66 : 58; }

  function bubbleIcon(g) {
    var n = g.items.length;
    var sz = n > 30 ? 'b3' : n > 10 ? 'b2' : 'b1';
    var risk = g.red || g.orange
      ? '<span class="r"><em class="red">红 ' + g.red + '</em><em class="orange">橙 ' + g.orange + '</em></span>'
      : '<span class="r ok">无红橙</span>';
    var px = bubblePx(n);
    return L.divIcon({
      className: 'jm-bubble-wrap',
      html: '<div class="jm-bubble ' + sz + ' lv-' + g.top + '" style="--c:' + LV_COLOR[g.top] + '">'
        + '<span class="t">' + g.key + '</span>'
        + '<span class="n">' + n + ' 个</span>' + risk + '</div>',
      iconSize: [px, px], iconAnchor: [px / 2, px / 2]
    });
  }

  function dotColor(p) {
    if (M.dot === 'st') return BS_COLOR[p.bs];
    if (M.dot === 'kc') return kcColor(p.qh);
    return LV_COLOR[p.lv];
  }
  function dotSize(p) { return p.ta > 1000 ? 28 : p.ta > 500 ? 22 : 17; }

  function projIcon(p) {
    var s = dotSize(p), box = s + 14;
    var cls = ['jm-mk', 'bs-' + p.bs];
    if (p.bjl) cls.push('is-bjl');
    if (p.hfz) cls.push('is-hfz');
    if (p.bjl && p.hfz) cls.push('is-cross');
    if (p.bjlSt === '严重滞后' || p.bjlSt === '停工') cls.push('is-blink');
    if (M.sel === p.n) cls.push('is-sel');
    return L.divIcon({
      className: 'jm-mk-wrap',
      html: '<div class="' + cls.join(' ') + '" style="--c:' + dotColor(p) + ';--s:' + s + 'px">'
        + '<i class="jm-sp"></i><i class="jm-ring"></i><i class="jm-star">★</i>'
        + '<b class="jm-lb">' + p.n + '</b></div>',
      iconSize: [box, box], iconAnchor: [box / 2, box / 2]
    });
  }

  /* -------------------- 渲染 -------------------- */
  function render() {
    if (!M.map) return;
    var lv = level(), list = shown();

    M.g.qx.clearLayers(); M.g.pq.clearLayers(); M.g.dot.clearLayers();
    M.markers = {};

    if (lv === 'qx' || lv === 'pq') {
      var gs = lv === 'qx'
        ? group(list, 'qx', function (g) {
          var c = M.D.qxCenter[g.key];
          return c ? [c[1], c[0]] : avgAnchor(g);
        })
        : group(list, 'pq', avgAnchor);
      gs.forEach(function (g) { g.real = g.at; });
      deOverlap(gs);
      var into = lv === 'qx' ? M.g.qx : M.g.pq;
      var next = lv === 'qx' ? Z_PQ + 1 : Z_XM + 1;
      gs.forEach(function (g) {
        L.marker(g.at, { icon: bubbleIcon(g), zIndexOffset: 200 })
          .on('click', function () { M.map.flyTo(g.real, next, { duration: .6 }); })
          .addTo(into);
      });
    } else {
      list.forEach(function (p) {
        var mk = L.marker([p.lat, p.lng], { icon: projIcon(p), title: p.n })
          .on('click', function () { select(p.n); })
          .addTo(M.g.dot);
        M.markers[p.n] = mk;
      });
    }

    M.host.classList.toggle('z-label', M.map.getZoom() >= Z_LABEL);
    applyOpacity();
    fireView(lv, list);
  }

  function fireView(lv, list) {
    if (!M.cb.onView) return;
    var b = M.map.getBounds();
    var vis = (list || shown()).filter(function (p) { return b.contains([p.lat, p.lng]); });
    M.cb.onView(vis, { level: lv || level(), levelName: levelName(lv || level()), zoom: M.map.getZoom(), total: shown().length });
  }

  /* -------------------- 行政区划边界与热力 -------------------- */
  function boundaryStyle(f) {
    var n = shown().filter(function (p) { return p.qx === f.properties.name; }).length;
    var o = n > 8 ? .26 : n > 4 ? .18 : n > 0 ? .11 : .05;
    return { color: '#1d4ed8', weight: 1.2, dashArray: '4 3', fillColor: '#1d4ed8', fillOpacity: o };
  }
  function buildBoundary() {
    var geo = w.SC_GEO_LIUZHOU;
    if (!geo) return null;
    return L.geoJSON(geo, {
      style: boundaryStyle,
      onEachFeature: function (f, ly) {
        var name = f.properties.name;
        var items = shown().filter(function (p) { return p.qx === name; });
        var red = items.filter(function (p) { return p.lv === 'red'; }).length;
        ly.bindTooltip('<b>' + name + '</b><br/>项目 ' + items.length + ' 个 · 红级 ' + red + ' 个', { sticky: true, className: 'jm-tip' });
        ly.on('mouseover', function () { ly.setStyle({ weight: 2.4, color: '#0ea5e9' }); });
        ly.on('mouseout', function () { ly.setStyle(boundaryStyle(f)); });
        ly.on('click', function () { M.map.fitBounds(ly.getBounds(), { padding: [20, 20] }); });
      }
    });
  }
  /* 透明度滑杆要真的作用到全部业务要素：点位与气泡走 CSS 变量，
     边界是 SVG path、热力是 canvas，得各自设一次 */
  function applyOpacity() {
    M.host.style.setProperty('--jm-op', M.op);
    M.g.boundary.eachLayer(function (gj) {
      if (gj.eachLayer) gj.eachLayer(function (l) { if (l._path) l._path.style.opacity = M.op; });
    });
    M.g.heat.eachLayer(function (h) { if (h._canvas) h._canvas.style.opacity = M.op; });
  }

  function buildHeat() {
    if (!L.heatLayer) return null;
    var pts = shown().map(function (p) { return [p.lat, p.lng, Math.min(1, (p.sd || 0) / 900)]; });
    return L.heatLayer(pts, { radius: 34, blur: 26, minOpacity: .32, max: 1, gradient: { .3: '#fde68a', .6: '#fb923c', 1: '#ef4444' } });
  }

  /* -------------------- 选中与定位 -------------------- */
  function byName(n) {
    return M.D.projects.filter(function (p) { return p.n === n; })[0];
  }
  function select(n, silent) {
    var prev = M.sel;
    M.sel = n;
    [prev, n].forEach(function (x) {
      var p = x && byName(x);
      if (p && M.markers[x]) M.markers[x].setIcon(projIcon(p));
    });
    if (!silent && M.cb.onSelect) M.cb.onSelect(byName(n));
  }

  /* -------------------- 圈选 / 周边 -------------------- */
  function startLasso() {
    var mp = M.map, box = M.el, start = null, rect = null;
    M.host.classList.add('lassoing');
    mp.dragging.disable(); mp.boxZoom.disable();
    function pt(e) { return mp.mouseEventToLatLng(e); }
    function down(e) {
      if (e.button !== 0) return;
      start = pt(e);
      rect = L.rectangle([start, start], { color: '#0ea5e9', weight: 1.6, dashArray: '5 3', fillOpacity: .08 }).addTo(M.g.tool);
      box.addEventListener('mousemove', move);
      d.addEventListener('mouseup', up);
    }
    function move(e) { if (rect) rect.setBounds(L.latLngBounds(start, pt(e))); }
    function up(e) {
      box.removeEventListener('mousemove', move);
      d.removeEventListener('mouseup', up);
      box.removeEventListener('mousedown', down);
      M.host.classList.remove('lassoing');
      mp.dragging.enable(); mp.boxZoom.enable();
      if (!rect) return;
      var b = rect.getBounds();
      if (M.lasso) M.g.tool.removeLayer(M.lasso);
      M.lasso = rect;
      var hit = shown().filter(function (p) { return b.contains([p.lat, p.lng]); });
      if (M.cb.onLasso) M.cb.onLasso(hit, b);
      rect = null;
    }
    box.addEventListener('mousedown', down, { once: true });
  }

  function nearby(radius) {
    var p = M.sel && byName(M.sel);
    if (!p) return null;
    var c = L.latLng(p.lat, p.lng);
    if (M.nearCircle) M.g.tool.removeLayer(M.nearCircle);
    M.nearCircle = L.circle(c, { radius: radius, color: '#0ea5e9', weight: 1.6, fillOpacity: .07 }).addTo(M.g.tool);
    M.map.fitBounds(M.nearCircle.getBounds(), { padding: [30, 30] });
    var hit = shown().filter(function (x) {
      return x.n !== p.n && c.distanceTo([x.lat, x.lng]) <= radius;
    }).map(function (x) {
      x = Object.assign({}, x);
      x._dist = Math.round(c.distanceTo([x.lat, x.lng]));
      return x;
    }).sort(function (a, b) { return a._dist - b._dist; });
    return { center: p, radius: radius, list: hit };
  }

  function clearTools() {
    M.g.tool.clearLayers();
    M.lasso = null; M.nearCircle = null;
  }

  /* -------------------- 底图 -------------------- */
  function applyBase(kind) {
    M.base = kind;
    M.tileLayers.forEach(function (t) { M.map.removeLayer(t); });
    M.tileLayers = BASE[kind].tiles.map(function (t) {
      return L.tileLayer(t.url, { subdomains: t.sub, maxZoom: 18, minZoom: 7, detectRetina: false }).addTo(M.map);
    });
    M.tileLayers.forEach(function (t) { t.bringToBack(); });
    M.host.classList.toggle('base-dark', kind === 'dark');
    M.host.classList.toggle('base-img', kind === 'img');
  }

  /* -------------------- 对外 API -------------------- */
  var API = {
    init: function (elId, cb) {
      M.D = w.JCDATA;
      M.el = typeof elId === 'string' ? d.getElementById(elId) : elId;
      M.cb = cb || {};
      if (!M.el || !w.L || !M.D) return null;
      M.host = M.el.closest('.jc-map') || M.el;

      var mp = L.map(M.el, {
        zoomControl: false, attributionControl: false,
        minZoom: 7, maxZoom: 18, zoomSnap: 1, wheelPxPerZoomLevel: 90
      });
      M.map = mp;
      mp.fitBounds(LIUZHOU);
      applyBase('road');

      M.g.boundary = L.layerGroup().addTo(mp);
      M.g.heat = L.layerGroup().addTo(mp);
      M.g.tool = L.layerGroup().addTo(mp);
      M.g.qx = L.layerGroup().addTo(mp);
      M.g.pq = L.layerGroup().addTo(mp);
      M.g.dot = L.layerGroup().addTo(mp);

      L.control.scale({ metric: true, imperial: false, position: 'bottomleft', maxWidth: 120 }).addTo(mp);

      mp.on('zoomend', render);
      mp.on('moveend', function () { fireView(); });
      M.host.classList.add('show-bjl');
      render();
      return mp;
    },

    map: function () { return M.map; },
    setBase: function (k) { applyBase(k); },

    setDotLayer: function (mode) { M.dot = mode; render(); },

    setOverlay: function (key, on) {
      M.layer[key] = on;
      if (key === 'boundary') {
        M.g.boundary.clearLayers();
        if (on) { var b = buildBoundary(); if (b) M.g.boundary.addLayer(b); }
      }
      if (key === 'heat') {
        M.g.heat.clearLayers();
        if (on) { var h = buildHeat(); if (h) M.g.heat.addLayer(h); }
      }
      applyOpacity();
    },

    setTheme: function (key, on) {
      M.layer[key] = on;
      M.host.classList.toggle('show-' + key, on);
    },

    setFilter: function (patch) {
      Object.assign(M.filter, patch || {});
      if (M.layer.boundary) API.setOverlay('boundary', true);
      if (M.layer.heat) API.setOverlay('heat', true);
      render();
    },
    filter: function () { return M.filter; },

    setOpacity: function (pct) { M.op = pct / 100; applyOpacity(); },

    locate: function (n, z) {
      var p = byName(n);
      if (!p) return;
      M.map.flyTo([p.lat, p.lng], z || 16, { duration: .8 });
      M.map.once('moveend', function () { select(n); });
    },
    select: select,
    selected: function () { return M.sel && byName(M.sel); },

    /* divIcon 的 class 挂在 .leaflet-marker-icon 上，真正要加高亮的是里面那层 .jm-mk */
    highlight: function (n, on) {
      var mk = M.markers[n];
      if (!mk) return;
      var wrap = mk.getElement && mk.getElement();
      if (!wrap) return;
      var inner = wrap.querySelector('.jm-mk') || wrap;
      inner.classList.toggle('is-hover', !!on);
      wrap.style.zIndex = on ? 1000 : '';
    },

    fitCity: function () { M.map.fitBounds(LIUZHOU); clearTools(); },
    fitQx: function (name) {
      var geo = w.SC_GEO_LIUZHOU;
      if (!geo) return;
      var f = geo.features.filter(function (x) { return x.properties.name === name; })[0];
      if (!f) return;
      M.map.fitBounds(L.geoJSON(f).getBounds(), { padding: [24, 24] });
    },
    zoom: function (delta) { M.map.setZoom(M.map.getZoom() + delta); },

    startLasso: startLasso,
    nearby: nearby,
    clearTools: clearTools,

    level: level,
    levelName: levelName,
    visible: function () {
      var b = M.map.getBounds();
      return shown().filter(function (p) { return b.contains([p.lat, p.lng]); });
    },
    all: shown
  };

  w.JCMap = API;
})(window, document);
