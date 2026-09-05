/* ==========================================================================
   工作台 v2 渲染器（与 wb.css 配套）
   WB.render(config, rootId)
     · 区块式：config.blocks = [block, ...]，按顺序渲染，任意组合
     · 简写式：config.greet / todos / kpis / quick / chain / charts / donuts 仍可用（旧写法）
   区块类型（type）：
     row     { cols:[block,...], ratio:'1fr 1fr' }           一行多栏
     hero    { title, sub, bg, placeholder, chips:[], btn }  搜索英雄区
     greet   { name, org, sys, filters, report, tiles, date }
     todos   { title, tabs:[[label,count]], items:[...], mode:'list'|'cards', more, weather }
     kpis    { items:[...], cols:4|5|6 }
     quick   { title, sub, rows:[[...]], note }
     chain   { title, sub, tag, steps:[...], note }
     bar     { title, unit, data:[[label, v1, v2?]], series:[名1,名2], colors:[], note, more }
     hbar    { title, unit, data:[[label, v]], total, totalLabel, note, more }
     donut   { title, meta, center, centerLabel, parts:[[label, v, color]], note, side:'hbar 数据可选' }
     table   { title, meta, cols:[], rows:[[]], note, more }
     note    { text, warn:true }
     card    { title, meta, more, html }                      自定义内容卡
   ========================================================================== */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var fmt = function (n) { return typeof n === 'number' ? n.toLocaleString('zh-CN') : esc(n); };
  var go = function (href) { return href ? ' onclick="location.href=\'' + href + '\'"' : ''; };
  var todayStr = function () {
    var d = new Date(), wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 星期' + wk;
  };
  function head(b, extra) {
    return '<div class="wb-h"><span class="t">' + esc(b.title) + '</span>' +
      (b.sub ? '<span class="sub">' + esc(b.sub) + '</span>' : '') +
      (b.meta || b.unit ? '<span class="unit">' + esc(b.meta || b.unit) + '</span>' : '') +
      (extra || '') +
      (b.more !== false && (b.more || b.moreHref) ? '<span class="more"' + go(b.moreHref) + '>' + esc(typeof b.more === 'string' ? b.more : '更多') + ' <i class="fa-solid fa-angle-right"></i></span>' : '') +
    '</div>';
  }
  function note(text, warn) {
    if (!text) return '';
    return '<div class="wb-note' + (warn ? ' warn' : '') + '"><i class="fa-solid ' + (warn ? 'fa-lightbulb' : 'fa-circle-info') + '"></i><span>' + esc(text) + '</span></div>';
  }

  /* ---------- 英雄搜索区 ---------- */
  function hero(b) {
    return '<div class="wb-hero"' + (b.bg ? ' style="background-image:url(\'' + b.bg + '\')"' : '') + '>' +
      '<div class="h-t"><i class="fa-solid ' + (b.icon || 'fa-magnifying-glass-chart') + '"></i>' + esc(b.title) + '</div>' +
      (b.sub ? '<div class="h-s">' + esc(b.sub) + '</div>' : '') +
      '<div class="h-search"><input type="text" placeholder="' + esc(b.placeholder || '请输入关键字') + '">' +
        '<button onclick="PMS.toast(\'' + esc(b.btn || '查询') + '：原型中按关键字联动检索结果\')"><i class="fa-solid fa-magnifying-glass"></i> ' + esc(b.btn || '查询') + '</button></div>' +
      (b.chips ? '<div class="h-chips">' + b.chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' : '') +
    '</div>';
  }

  /* ---------- 问候卡 ---------- */
  function greet(g) {
    var h = new Date().getHours();
    var hello = g.hello || (h < 12 ? '上午好' : h < 18 ? '下午好' : '晚上好');
    return '<div class="wb-greet' + (g.compact ? ' compact' : '') + '">' +
      '<div class="g-top"><div class="g-avatar"></div><div>' +
        '<div class="g-hello">' + hello + '，' + esc(g.name) + '</div>' +
        '<div class="g-org">' + esc(g.org) + (g.sys ? '　|　' + esc(g.sys) : '') + '</div>' +
        (g.dateInline ? '<div class="g-date inline"><i class="fa-regular fa-calendar"></i>' + esc(g.date || todayStr()) + '</div>' : '') +
      '</div>' +
        '<div class="g-ops">' +
          (g.filters ? '<select>' + g.filters.map(function (f) { return '<option>' + esc(f) + '</option>'; }).join('') + '</select>' : '') +
          (g.report ? '<button class="btn" onclick="PMS.toast(\'已生成' + esc(g.report) + '，可在综合查询下载\',\'success\')"><i class="fa-solid fa-file-lines"></i> ' + esc(g.report) + '</button>' : '') +
        '</div></div>' +
      '<div class="g-tiles">' + (g.tiles || []).map(function (t) {
        return '<div class="g-tile"' + go(t.href) + '><i class="fa-solid ' + (t.icon || 'fa-chart-simple') + '"></i><div class="l">' + esc(t.label) + '</div><div class="v">' + fmt(t.value) + '</div></div>';
      }).join('') + '</div>' +
      (g.dateInline ? '' : '<div class="g-date"><i class="fa-regular fa-calendar"></i>' + esc(g.date || todayStr()) + '</div>') +
    '</div>';
  }

  /* ---------- 我的待办 / 待办事项 ---------- */
  function todos(b) {
    var items = b.items || [];
    var tabs = b.tabs ? '<div class="t-tabs">' + b.tabs.map(function (t, i) {
      return '<span class="' + (i === 0 ? 'on' : '') + '">' + esc(t[0]) + (t[1] != null ? ' <b>' + fmt(t[1]) + '</b>' : '') + '</span>';
    }).join('') + '</div>' : '';
    var body;
    if (b.mode === 'cards') {
      body = '<div class="t-cards">' + items.map(function (t) {
        return '<div class="t-card"' + go(t.href) + '><div class="tc-top"><span class="t-tag ' + (t.c || 'blue') + '">' + esc(t.tag) + '</span>' +
          (t.time ? '<span class="t-time' + (t.over ? ' over' : '') + '">' + esc(t.time) + '</span>' : '') + '</div>' +
          '<div class="tc-no">' + esc(t.no || '') + '</div><div class="tc-txt">' + esc(t.text) + '</div>' +
          '<div class="tc-foot"><span class="btn-mini">' + esc(t.action || '去处理') + ' <i class="fa-solid fa-angle-right"></i></span></div></div>';
      }).join('') + '</div>';
    } else {
      body = '<div class="t-list">' + items.map(function (t) {
        return '<div class="t-row"' + go(t.href) + '><span class="t-tag ' + (t.c || 'blue') + '">' + esc(t.tag) + '</span>' +
          '<span class="t-txt">' + esc(t.text) + '</span>' +
          (t.time ? '<span class="t-time' + (t.over ? ' over' : '') + '">' + esc(t.time) + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    }
    return '<div class="wb-todo"><div class="t-h"><span class="t">' + esc(b.title || '我的待办') + '</span>' +
      (b.summary ? '<span class="t-sum">' + esc(b.summary) + '</span>' : '') +
      (b.weather !== false ? '<span class="weather"><i class="fa-solid ' + (b.weatherIcon || 'fa-cloud-sun-rain') + '"></i>' + esc(b.weather || '小雨 26℃') + '</span>' : '') +
      '<span class="more"' + go(b.moreHref) + '>' + esc(b.more || '查看更多') + ' <i class="fa-solid fa-angle-right"></i></span></div>' +
      tabs + body + '</div>';
  }

  /* ---------- KPI ---------- */
  function kpis(b) {
    var list = b.items || b;
    var cols = b.cols || (list.length === 6 || list.length === 12 ? 6 : list.length === 5 || list.length === 10 ? 5 : 4);
    return '<div class="wb-kpis c' + cols + '">' + list.map(function (k) {
      return '<div class="wb-kpi"' + go(k.href) + '><i class="fa-solid ' + (k.icon || 'fa-chart-pie') + ' ' + (k.c || 'blue') + '"></i>' +
        '<div class="k-b"><div class="k-l">' + esc(k.label) + '</div><div class="k-v">' + fmt(k.value) + (k.unit ? '<small>' + esc(k.unit) + '</small>' : '') + '</div></div>' +
        (k.sub ? '<div class="k-s ' + (k.trend || '') + '">' + (k.trend === 'up' ? '<i class="fa-solid fa-arrow-up"></i> ' : k.trend === 'down' ? '<i class="fa-solid fa-arrow-down"></i> ' : '') + esc(k.sub) + '</div>' : '') +
      '</div>';
    }).join('') + '</div>';
  }

  /* ---------- 快速入口 ---------- */
  function quick(q) {
    var ci = 0;
    return '<div class="wb-quick"><div class="q-h"><span class="t">' + esc(q.title || '快速入口') + '</span>' +
      '<span class="sub">' + esc(q.sub || '按业务链路顺序排列') + '</span></div>' +
      (q.rows || []).map(function (row) {
        return '<div class="q-row">' + row.map(function (it) {
          ci = ci % 11 + 1;
          var href = it.href ? ' href="' + it.href + '"' : ' href="javascript:void(0)" onclick="PMS.toast(\'' + esc(it.label) + '：功能入口，原型中按事项清单挂接\')"';
          return '<a class="q-item"' + href + '><i class="fa-solid ' + (it.icon || 'fa-cube') + ' c' + (it.c || ci) + '"></i><span>' + esc(it.label) + '</span></a>';
        }).join('') + '</div>';
      }).join('') + note(q.note) + '</div>';
  }

  /* ---------- 全链条 ---------- */
  function chain(c) {
    return '<div class="wb-card">' + head(c, c.tag ? '<span class="unit">' + esc(c.tag) + '</span>' : '') +
      '<div class="wb-b"><div class="wb-chain">' + (c.steps || []).map(function (s, i) {
        return '<div class="c-step"' + go(s.href) + '><span class="n">' + (i + 1) + '</span><span class="l">' + esc(s.label) + '</span>' +
          '<div class="v">' + fmt(s.value) + (s.state ? '<small>/' + esc(s.state) + '</small>' : '') + '</div></div>';
      }).join('') + '</div>' + note(c.note, true) + '</div></div>';
  }

  /* ---------- 柱图（支持 1~3 个系列） ---------- */
  function bar(b) {
    var ns = (b.series && b.series.length) || 1;
    var colors = b.colors || ['linear-gradient(180deg,#5b8def,#2556ba)', 'linear-gradient(180deg,#5fd39a,#12a877)', 'linear-gradient(180deg,#ffc36b,#f59e0b)'];
    var max = 0;
    b.data.forEach(function (d) { for (var i = 1; i <= ns; i++) max = Math.max(max, d[i] || 0); });
    var step = max > 2000 ? 500 : max > 500 ? 100 : max > 100 ? 50 : max > 20 ? 10 : 5;
    var top = Math.ceil(max / step) * step || 1;
    var ticks = []; for (var i = 5; i >= 0; i--) ticks.push(Math.round(top * i / 5));
    var legend = ns > 1 ? '<div class="wb-legend">' + b.series.map(function (s, i) { return '<span><i style="background:' + colors[i] + '"></i>' + esc(s) + '</span>'; }).join('') + '</div>' : '';
    return '<div class="wb-card">' + head(b) + '<div class="wb-b">' + legend +
      '<div class="wb-bars' + (ns > 1 ? ' multi' : '') + '"><div class="axis">' + ticks.map(function (t) { return '<span>' + fmt(t) + '</span>'; }).join('') + '</div><div class="grid"></div>' +
      b.data.map(function (d) {
        var bars = '';
        for (var k = 1; k <= ns; k++) {
          var h = Math.max(2, Math.round((d[k] || 0) / top * 100));
          bars += '<div class="bar" style="height:' + h + '%;background:' + colors[k - 1] + '"><span class="val">' + fmt(d[k] || 0) + '</span></div>';
        }
        return '<div class="col"><div class="bars">' + bars + '</div><span class="lab">' + esc(d[0]) + '</span></div>';
      }).join('') + '</div>' + note(b.note, true) + '</div></div>';
  }

  /* ---------- 横向条形 ---------- */
  function hbarBody(b) {
    var max = Math.max.apply(null, b.data.map(function (d) { return d[1]; })) || 1;
    var total = b.data.reduce(function (a, d) { return a + d[1]; }, 0);
    return '<div class="wb-hbars">' + b.data.map(function (d) {
      return '<div class="hb"><span class="l">' + esc(d[0]) + '</span>' + (d[2] ? '<span class="tag">' + esc(d[2]) + '</span>' : '') +
        '<div class="track"><span style="width:' + Math.round(d[1] / max * 100) + '%"></span></div><span class="v">' + fmt(d[1]) + (b.suffix || '') + '</span></div>';
    }).join('') +
    (b.total ? '<div class="hb total"><span class="l">' + esc(b.totalLabel || '合计') + '</span><div class="track"><span style="width:100%"></span></div><span class="v">' + fmt(total) + (b.suffix || '') + '</span></div>' : '') +
    '</div>';
  }
  function hbar(b) { return '<div class="wb-card">' + head(b) + '<div class="wb-b">' + (b.subTitle ? '<div class="wb-sub-t">' + esc(b.subTitle) + '</div>' : '') + hbarBody(b) + note(b.note, true) + '</div></div>'; }

  /* ---------- 环图 ---------- */
  function ringSVG(parts, size) {
    var total = parts.reduce(function (a, p) { return a + p[1]; }, 0) || 1;
    var r = 46, C = 2 * Math.PI * r, off = 0, segs = '';
    parts.forEach(function (p) {
      var len = p[1] / total * C;
      segs += '<circle r="' + r + '" cx="60" cy="60" fill="none" stroke="' + p[2] + '" stroke-width="16" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '"></circle>';
      off += len;
    });
    return '<svg viewBox="0 0 120 120"><circle r="' + r + '" cx="60" cy="60" fill="none" stroke="#eef1f6" stroke-width="16"></circle>' + segs + '</svg>';
  }
  function donutBody(d) {
    var total = d.parts.reduce(function (a, p) { return a + p[1]; }, 0) || 1;
    return '<div class="wb-donut">' +
      '<div class="legend">' + d.parts.map(function (p) {
        return '<div class="li"><span class="dot" style="background:' + p[2] + '"></span><span>' + esc(p[0]) + '：' + fmt(p[1]) + '</span><span class="pct">' + (p[1] / total * 100).toFixed(p[1] / total * 100 < 10 ? 1 : 0).replace(/\.0$/, '') + '%</span></div>';
      }).join('') + '</div>' +
      '<div class="ring">' + ringSVG(d.parts) + '<div class="c"><b>' + esc(d.center) + '</b><span>' + esc(d.centerLabel || '') + '</span></div></div></div>';
  }
  function donut(d) {
    return '<div class="wb-card">' + head(d) + '<div class="wb-b">' +
      (d.subTitle ? '<div class="wb-sub-t">' + esc(d.subTitle) + '</div>' : '') + donutBody(d) +
      (d.side ? '<div class="wb-sub-t" style="margin-top:14px">' + esc(d.side.title) + '</div>' + hbarBody(d.side) : '') +
      note(d.note, true) + '</div></div>';
  }

  /* ---------- 表格 ---------- */
  function table(b) {
    return '<div class="wb-card">' + head(b) + '<div class="wb-b pad0"><table class="wb-table"><thead><tr>' +
      b.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      b.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i === 0 ? ' class="first"' : '') + '>' + (c == null ? '' : c) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table>' + (b.note ? '<div style="padding:12px 20px 0">' + note(b.note, true) + '</div>' : '') + '</div></div>';
  }

  /* ---------- 自定义卡 ---------- */
  function card(b) { return '<div class="wb-card">' + (b.title ? head(b) : '') + '<div class="wb-b' + (b.pad0 ? ' pad0' : '') + '">' + (b.html || '') + note(b.note, true) + '</div></div>'; }

  function ai(a) {
    if (a === false) return '';
    return '<div class="wb-ai" title="智能助手" onclick="PMS.toast(\'智能助手由 AI 应用服务平台提供，原型中以占位呈现\')"><i class="fa-solid fa-robot"></i><span class="badge">问</span></div>';
  }

  var R = {
    hero: hero, greet: greet, todos: todos, kpis: kpis, quick: quick, chain: chain,
    bar: bar, hbar: hbar, donut: donut, table: table, card: card,
    note: function (b) { return note(b.text, b.warn); },
    row: function (b) {
      var n = b.cols.length;
      var style = b.ratio ? ' style="grid-template-columns:' + b.ratio + '"' : '';
      return '<div class="wb-row r' + n + '"' + style + '>' + b.cols.map(block).join('') + '</div>';
    }
  };
  function block(b) { var f = R[b.type]; return f ? f(b) : ''; }

  window.WB = {
    render: function (cfg, rootId) {
      var root = document.getElementById(rootId || 'wb-root');
      if (!root) return;
      root.className = 'wb';
      var html = '';
      if (cfg.blocks) {
        html = cfg.blocks.map(block).join('');
      } else {
        /* 旧的简写式配置 */
        if (cfg.greet || cfg.todos) html += R.row({ cols: [].concat(cfg.greet ? [{ type: 'greet' }] : [], cfg.todos ? [{ type: 'todos' }] : []).map(function (x) {
          return x.type === 'greet' ? Object.assign({ type: 'greet' }, cfg.greet) : Object.assign({ type: 'todos', items: cfg.todos }, cfg.todoOpt || {});
        }) });
        if (cfg.kpis) html += kpis({ items: cfg.kpis });
        if (cfg.quick) html += quick(cfg.quick);
        if (cfg.chain) html += chain(cfg.chain);
        if (cfg.charts) html += R.row({ cols: cfg.charts.map(function (c) { return Object.assign({ type: c.type === 'hbar' ? 'hbar' : 'bar', total: c.total !== false, totalLabel: c.totalLabel || '各县合计' }, c); }) });
        if (cfg.donuts) html += R.row({ cols: cfg.donuts.map(function (d) { return Object.assign({ type: 'donut' }, d); }) });
      }
      root.innerHTML = html + ai(cfg.ai);
    }
  };
})();
