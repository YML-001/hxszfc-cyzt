/* ==========================================================================
   统一工作门户 · 闭环引擎 (flow.js)
   职责：把 66 个功能点做成真实可点击、状态可跨页联动的闭环。
         app.js 负责布局与交互外壳（Toast / 确认框 / 抽屉 / 字典 / 分页），
         本文件负责状态迁移、业务规则校验、统计口径与跨页流转。
   依赖：app.js → flow-data.js → flow.js（顺序不可颠倒）
   口径：办件状态机对齐全局 ZD5；任务状态机对齐第 01 章 1.10.3；
         取数规则对齐 1.1.2 节；时限与中止不计时对齐 1.1.5 节；
         一件事主子件对齐 1.1.3 节；更正撤销另立新件对齐 1.1.4 节。
   ========================================================================== */
(function () {
  'use strict';

  var D = window.FLOW_DATA;
  var DAY = D.DAY, HOUR = D.HOUR;
  var db = null;
  var subs = [];

  /* ==========================================================================
     一、基础工具
     ========================================================================== */
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function fmtTime(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return fmtDate(ts) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  /* 时长人性化，如 3天4.5小时 */
  function fmtSpan(ms) {
    if (ms == null) return '—';
    var abs = Math.abs(ms);
    var d = Math.floor(abs / DAY);
    var h = Math.round((abs % DAY) / HOUR * 10) / 10;
    return (d ? d + '天' : '') + h + '小时';
  }
  function money(n) {
    if (n == null || n === '') return '—';
    var p = String(Math.round(Number(n) * 100) / 100).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return p.join('.');
  }
  function param(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }
  function dict(name, code) {
    var list = (window.APP_CONFIG && window.APP_CONFIG.dict[name]) || [];
    for (var i = 0; i < list.length; i++) if (list[i][0] === String(code)) return list[i][1];
    return code == null || code === '' ? '—' : String(code);
  }
  function nid(prefix) { db._seq = (db._seq || 0) + 1; return prefix + pad(db._seq); }
  function toast(msg, type) { if (window.PMS) PMS.toast(msg, type); }
  function role() { return param('role') || 'biz'; }

  /* ==========================================================================
     二、状态仓读写
     ========================================================================== */
  function load() { db = D.load(); return db; }
  function commit() { D.persist(db); emit(); }
  function get(coll) { return db[coll] || []; }
  function byId(coll, id) {
    var a = get(coll);
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function where(coll, fn) { return get(coll).filter(fn); }

  /* ==========================================================================
     三、状态机
     办件（全局 ZD5）：0 待受理 1 办理中 2 已办结 3 已撤件 4 已退件 5 待补正 6 中止 7 作废
     任务（1.10.3）：0 待签收 1 待办理 2 办理中 3 已办结 4 已转办 5 已作废 6 已退回
     ========================================================================== */
  var CASE_FLOW = {
    '0': ['1', '3', '4'],
    '1': ['2', '4', '5', '6'],
    '2': [],
    '3': [],
    '4': [],
    '5': ['1', '4'],
    '6': ['1', '7'],
    '7': []
  };
  var TASK_FLOW = {
    '0': ['1', '4', '5'],
    '1': ['2', '3', '4', '6'],
    '2': ['3', '4', '6'],
    '3': [],
    '4': [],
    '5': [],
    '6': ['1']
  };

  function canCase(from, to) { return (CASE_FLOW[String(from)] || []).indexOf(String(to)) >= 0; }
  function canTask(from, to) { return (TASK_FLOW[String(from)] || []).indexOf(String(to)) >= 0; }

  /* 受控迁移：非法跃迁直接拦截并报错，保证演示符合业务逻辑 */
  function moveCase(c, to, note) {
    if (!c) return false;
    if (String(c.blzt) === String(to)) return true;
    if (!canCase(c.blzt, to)) {
      toast('办件当前为「' + dict('blzt', c.blzt) + '」，不能直接变更为「' + dict('blzt', to) + '」', 'error');
      return false;
    }
    c.blzt = String(to);
    if (note) log(c, note.czlx, note.jd, note.yj, note.czr);
    return true;
  }
  function moveTask(t, to) {
    if (!t) return false;
    if (String(t.rwzt) === String(to)) return true;
    if (!canTask(t.rwzt, to)) {
      toast('任务当前为「' + dict('rwzt', t.rwzt) + '」，不能变更为「' + dict('rwzt', to) + '」', 'error');
      return false;
    }
    t.rwzt = String(to);
    return true;
  }

  /* 办理日志 + 任务流水 */
  function log(c, czlx, jd, yj, czr) {
    db.caseLogs.push({
      id: nid('L'), bjzj: c.id, czlx: String(czlx), jd: jd || c.jd,
      czr: czr || db.me.name, czsj: Date.now(), yj: yj || ''
    });
  }
  function tlog(t, czlx, yj) {
    db.taskLogs.push({
      id: nid('TL'), bjzj: t.bjzj, sjbh: t.sjbh, sxmc: t.sxmc, czlx: String(czlx),
      czr: db.me.id, czrmc: db.me.name, czsj: Date.now(), jd: t.jd, yj: yj || ''
    });
  }
  function notify(xxlx, title, content, href) {
    db.msgs.unshift({
      id: nid('XX'), xxlx: String(xxlx), title: title, content: content,
      href: href || 'news.html', read: 0, createdAt: Date.now()
    });
  }

  /* ==========================================================================
     四、时限与预警（1.1.5 节）
     已用时长扣除中止时长；四色预警按剩余占比划分
     ========================================================================== */
  function used(c) {
    if (!c || !c.slsj) return 0;
    var end = c.bjsj || Date.now();
    return Math.max(0, end - c.slsj - (c.ztsc || 0));
  }
  /* 返回 {ms 剩余毫秒, level 四色, text 文案, over 是否超期} */
  function remain(c) {
    if (!c || !c.cnwcsj) return { ms: null, level: 'blue', text: '—', over: false };
    if (c.blzt === '2') return { ms: 0, level: 'blue', text: '已办结', over: false };
    if (c.blzt === '6') return { ms: null, level: 'yellow', text: '中止不计时', over: false };
    var ms = c.cnwcsj - Date.now();
    var total = c.cnwcsj - (c.slsj || c.sjsj) || DAY;
    var ratio = ms / total;
    var level = ms < 0 ? 'red' : (ratio <= 0.2 ? 'orange' : (ratio <= 0.5 ? 'yellow' : 'blue'));
    return {
      ms: ms, level: level, over: ms < 0,
      text: ms < 0 ? ('超期 ' + fmtSpan(ms)) : ('剩 ' + fmtSpan(ms))
    };
  }
  function levelText(level) {
    return { blue: '正常', yellow: '提示', orange: '预警', red: '严重' }[level] || '正常';
  }
  /* 任务的时限沿用其办件 */
  function taskRemain(t) { return remain(caseOf(t)); }
  function caseOf(t) { return t ? byId('cases', t.bjzj) : null; }

  /* ==========================================================================
     五、取数视图（1.1.2 节）
     ========================================================================== */
  function myTasks() {
    return where('tasks', function (t) {
      return t.blryzj === db.me.id && (t.rwzt === '0' || t.rwzt === '1' || t.rwzt === '2') && !t.sfsc;
    }).sort(function (a, b) {
      if (b.jjcd !== a.jjcd) return Number(b.jjcd) - Number(a.jjcd);
      return (a.cnwcsj || 0) - (b.cnwcsj || 0);
    });
  }
  /* 待领办：按角色查，未指定办理人 */
  function poolTasks() {
    return where('tasks', function (t) { return t.rwzt === '0' && !t.blryzj && !t.sfsc; });
  }
  /* 已办：由任务流水反查（czlx=2 办结） */
  function myDone() {
    return where('taskLogs', function (l) { return l.czr === db.me.id && l.czlx === '2'; })
      .sort(function (a, b) { return b.czsj - a.czsj; });
  }
  function myCases() {
    return where('cases', function (c) { return c.jbr === db.me.id; });
  }

  /* ==========================================================================
     六、统计
     ========================================================================== */
  function monthStart() {
    var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }
  function dayStart() {
    var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
  var STATS = {
    myTodo: function () { return myTasks().length; },
    pool: function () { return poolTasks().length; },
    unread: function () { return where('msgs', function (m) { return !m.read; }).length; },
    myDoing: function () { return where('cases', function (c) { return c.jbr === db.me.id && c.blzt === '1'; }).length; },
    myDone: function () { return myDone().length; },
    monthDone: function () {
      return where('cases', function (c) { return c.blzt === '2' && c.bjsj >= monthStart(); }).length;
    },
    todayIntake: function () {
      return where('cases', function (c) { return c.sjsj >= dayStart(); }).length;
    },
    monthIntake: function () {
      return where('cases', function (c) { return c.sjsj >= monthStart(); }).length;
    },
    /* 临期 + 超期（全量在办件，用于台账与效能监督） */
    warnCount: function () {
      return where('cases', function (c) {
        if (c.blzt !== '1' && c.blzt !== '5') return false;
        var r = remain(c);
        return r.level === 'orange' || r.level === 'red';
      }).length;
    },
    /* 临期 + 超期（仅本人经办，用于工作台与个人看板） */
    myWarn: function () {
      return where('cases', function (c) {
        if (c.jbr !== db.me.id) return false;
        if (c.blzt !== '1' && c.blzt !== '5') return false;
        var r = remain(c);
        return r.level === 'orange' || r.level === 'red';
      }).length;
    },
    myOverdue: function () {
      return where('cases', function (c) {
        return c.jbr === db.me.id && (c.blzt === '1' || c.blzt === '5') && remain(c).over;
      }).length;
    },
    myReject: function () {
      return where('cases', function (c) { return c.jbr === db.me.id && c.blzt === '4'; }).length;
    },
    myMonthDone: function () {
      return where('cases', function (c) {
        return c.jbr === db.me.id && c.blzt === '2' && c.bjsj >= monthStart();
      }).length;
    },
    /* 本人按时办结率 */
    myOnTimeRate: function () {
      var done = where('cases', function (c) { return c.jbr === db.me.id && c.blzt === '2'; });
      if (!done.length) return '—';
      var ok = done.filter(function (c) { return c.bjsj <= c.cnwcsj; }).length;
      return (Math.round(ok / done.length * 1000) / 10) + '%';
    },
    myAvgSpan: function () {
      var done = where('cases', function (c) { return c.jbr === db.me.id && c.blzt === '2'; });
      if (!done.length) return '—';
      var sum = 0;
      done.forEach(function (c) { sum += used(c); });
      return fmtSpan(sum / done.length);
    },
    overdue: function () {
      return where('cases', function (c) {
        return (c.blzt === '1' || c.blzt === '5') && remain(c).over;
      }).length;
    },
    rejected: function () { return where('cases', function (c) { return c.blzt === '4'; }).length; },
    correcting: function () { return where('corrections', function (x) { return x.zt === '1'; }).length; },
    corrOverdue: function () {
      return where('corrections', function (x) { return x.zt === '1' && x.deadline < Date.now(); }).length;
    },
    badReview: function () { return where('reviews', function (r) { return r.pjdj >= '4'; }).length; },
    badPending: function () { return where('reviews', function (r) { return r.pjdj >= '4' && r.hsZt === '0'; }).length; },
    /* 按时办结率 */
    onTimeRate: function () {
      var done = where('cases', function (c) { return c.blzt === '2'; });
      if (!done.length) return '—';
      var ok = done.filter(function (c) { return c.bjsj <= c.cnwcsj; }).length;
      return (Math.round(ok / done.length * 1000) / 10) + '%';
    },
    /* 退件率 */
    rejectRate: function () {
      var all = get('cases').length;
      if (!all) return '—';
      return (Math.round(STATS.rejected() / all * 1000) / 10) + '%';
    },
    satisfyRate: function () {
      var rs = get('reviews');
      if (!rs.length) return '—';
      var good = rs.filter(function (r) { return r.pjdj <= '3'; }).length;
      return (Math.round(good / rs.length * 1000) / 10) + '%';
    },
    avgSpan: function () {
      var done = where('cases', function (c) { return c.blzt === '2'; });
      if (!done.length) return '—';
      var sum = 0;
      done.forEach(function (c) { sum += used(c); });
      return fmtSpan(sum / done.length);
    },
    apptTotal: function () { return get('appts').length; },
    arriveRate: function () {
      var a = get('appts');
      if (!a.length) return '—';
      var n = a.filter(function (x) { return x.yyzt === '1' || x.yyzt === '2'; }).length;
      return (Math.round(n / a.length * 1000) / 10) + '%';
    },
    noShowRate: function () {
      var a = get('appts');
      if (!a.length) return '—';
      var n = a.filter(function (x) { return x.yyzt === '4'; }).length;
      return (Math.round(n / a.length * 1000) / 10) + '%';
    },
    waiting: function () { return where('queue', function (q) { return q.pdzt === '0'; }).length; }
  };
  function stat(name) {
    return STATS[name] ? STATS[name]() : '—';
  }

  /* ==========================================================================
     七、订阅与跨页
     ========================================================================== */
  function on(fn) { if (typeof fn === 'function') { subs.push(fn); fn(); } }
  function emit() {
    subs.forEach(function (fn) { try { fn(); } catch (e) {} });
    chrome();
    /* 外壳在父窗口时同步顶栏红点 */
    try { if (window.parent && window.parent !== window && window.parent.FLOW) window.parent.FLOW.chrome(); } catch (e) {}
  }
  /* 顶栏消息红点：由未读消息数驱动 */
  function chrome() {
    var dot = document.querySelector('.app-topbar .topbar-icon .dot');
    if (!dot) return;
    var n = stat('unread');
    dot.textContent = n;
    dot.style.display = n ? '' : 'none';
  }
  function goto(page, params) {
    var q = ['role=' + role()];
    if (params) Object.keys(params).forEach(function (k) {
      if (params[k] != null && params[k] !== '') q.push(k + '=' + encodeURIComponent(params[k]));
    });
    location.href = page + '?' + q.join('&');
  }
  function reset() {
    db = D.reset();
    emit();
  }

  /* ==========================================================================
     八、渲染 helper
     app.js 的 enhanceTables 会克隆种子行伪造 500~20000 条总量，会覆盖状态驱动
     的真实数据，所以由状态驱动的表格一律在 HTML 上标 data-static，
     行与分页交由下面的 FLOW.table 按真实数据渲染。
     ========================================================================== */
  var ZT_COLOR = { '0': 'blue', '1': 'orange', '2': 'green', '3': 'gray', '4': 'red', '5': 'orange', '6': 'gray', '7': 'gray' };
  var RWZT_COLOR = { '0': 'cyan', '1': 'orange', '2': 'blue', '3': 'green', '4': 'gray', '5': 'gray', '6': 'red' };
  var JJCD = { '0': ['gray', '普通'], '1': ['orange', '加急'], '2': ['red', '特急'] };

  function badge(text, color) { return '<span class="badge ' + (color || 'blue') + '">' + esc(text) + '</span>'; }
  function ztBadge(blzt) { return badge(dict('blzt', blzt), ZT_COLOR[String(blzt)] || 'gray'); }
  function rwztBadge(rwzt) { return badge(dict('rwzt', rwzt), RWZT_COLOR[String(rwzt)] || 'gray'); }
  function jjBadge(jjcd) {
    var m = JJCD[String(jjcd)] || JJCD['0'];
    return badge(m[1], m[0]);
  }
  /* 四色预警指示 */
  function lv(level, text) {
    return '<span class="lv ' + level + '">' + esc(text == null ? levelText(level) : text) + '</span>';
  }
  function remainCell(c) {
    var r = remain(c);
    if (r.ms == null) return '<span class="text-3">' + r.text + '</span>';
    return lv(r.level, r.text);
  }
  function nodeTag(post) { return '<span class="node-tag"><i class="fa-solid fa-user-shield"></i>' + esc(post) + '</span>'; }
  function emptyRow(cols, text, icon) {
    return '<tr class="is-empty"><td colspan="' + cols + '">' +
      '<div class="empty"><i class="fa-regular ' + (icon || 'fa-folder-open') + '"></i>' +
      '<div>' + esc(text || '暂无数据') + '</div></div></td></tr>';
  }

  /*
    FLOW.table({
      id:       表格元素 id
      rows:     function() 返回数据数组
      cells:    function(row, index) 返回 <td> 片段数组
      attrs:    function(row) 返回 <tr> 上的附加属性（可选）
      pageSize: 每页条数，默认 10
      empty:    空态文案
    })
    表格需在 HTML 中写好 thead 与空 tbody，并在 <table> 上标 data-static。
  */
  var tableCfgs = {};
  function table(cfg) {
    tableCfgs[cfg.id] = cfg;
    paint(cfg.id);
  }
  function paint(id) {
    var cfg = tableCfgs[id];
    if (!cfg) return;
    var el = document.getElementById(id);
    if (!el) return;
    var tbody = el.querySelector('tbody');
    if (!tbody) return;
    var cols = el.querySelectorAll('thead th').length || 1;
    var data = cfg.rows() || [];
    var size = el._size || cfg.pageSize || 10;
    var page = el._page || 1;
    var pages = Math.max(1, Math.ceil(data.length / size));
    if (page > pages) page = pages;
    el._page = page; el._size = size;

    if (!data.length) {
      tbody.innerHTML = emptyRow(cols, cfg.empty, cfg.icon);
    } else {
      var from = (page - 1) * size;
      var slice = data.slice(from, from + size);
      tbody.innerHTML = slice.map(function (row, i) {
        var seq = from + i + 1;
        var attrs = cfg.attrs ? (cfg.attrs(row) || '') : '';
        return '<tr' + attrs + '><td class="idx-col">' + pad(seq) + '</td>' +
          cfg.cells(row, from + i).join('') + '</tr>';
      }).join('');
    }
    /* 真实总量的分页条（不是 app.js 的模拟总量） */
    if (window.PMS && PMS.renderPager) {
      PMS.renderPager(el, {
        pageNum: page, pageSize: size, total: data.length,
        onChange: function (s) { el._page = s.pageNum; el._size = s.pageSize; paint(id); }
      });
    }
    if (cfg.after) cfg.after();
  }
  function repaintAll() { Object.keys(tableCfgs).forEach(paint); }

  /* 勾选：读取表格内选中行的 value */
  function checked(scopeId) {
    var scope = document.getElementById(scopeId) || document;
    return Array.prototype.map.call(
      scope.querySelectorAll('input[type=checkbox][data-pick]:checked'),
      function (x) { return x.getAttribute('data-pick'); }
    );
  }
  /* 全选框 */
  function pickAll(box, scopeId) {
    var scope = document.getElementById(scopeId) || document;
    scope.querySelectorAll('input[type=checkbox][data-pick]').forEach(function (x) { x.checked = box.checked; });
  }

  /* 纯 CSS 柱状图 */
  function barChart(items) {
    var max = 1;
    items.forEach(function (it) { if (it.v > max) max = it.v; });
    return '<div class="bar-chart">' + items.map(function (it) {
      return '<div class="bar-col"><span class="bar-val">' + it.v + '</span>' +
        '<div class="bar" style="height:' + Math.max(4, Math.round(it.v / max * 100)) + '%"></div>' +
        '<span class="bar-label">' + esc(it.l) + '</span></div>';
    }).join('') + '</div>';
  }
  /* 四色环形图 + 图例 */
  function donut(parts, centerV, centerL) {
    var total = 0;
    parts.forEach(function (p) { total += p.v; });
    if (!total) total = 1;
    var acc = 0, seg = [];
    parts.forEach(function (p) {
      var from = acc / total * 100;
      acc += p.v;
      seg.push('var(--lv-' + p.c + ') ' + from.toFixed(2) + '% ' + (acc / total * 100).toFixed(2) + '%');
    });
    return '<div class="flex items-center gap-16">' +
      '<div class="donut" style="background:conic-gradient(' + seg.join(',') + ')">' +
        '<div class="donut-hole"><div class="fw-700" style="font-size:22px">' + centerV + '</div>' +
        '<div class="text-3 text-sm">' + esc(centerL) + '</div></div></div>' +
      '<div class="legend" style="flex:1">' + parts.map(function (p) {
        return '<div class="lg-item"><span class="lg-color" style="background:var(--lv-' + p.c + ')"></span> ' +
          esc(p.l) + ' <b style="margin-left:auto">' + p.v + '</b></div>';
      }).join('') + '</div></div>';
  }

  window.FLOW = {
    /* 数据 */
    load: load, db: function () { return db; }, commit: commit, get: get, byId: byId, where: where,
    nid: nid, reset: reset,
    get me() { return db.me; },
    /* 格式化与字典 */
    esc: esc, dict: dict, param: param, role: role,
    fmt: { date: fmtDate, time: fmtTime, span: fmtSpan, money: money, pad: pad },
    /* 规则 */
    canCase: canCase, canTask: canTask, moveCase: moveCase, moveTask: moveTask,
    log: log, tlog: tlog, notify: notify,
    used: used, remain: remain, taskRemain: taskRemain, caseOf: caseOf, levelText: levelText,
    /* 视图与统计 */
    myTasks: myTasks, poolTasks: poolTasks, myDone: myDone, myCases: myCases, stat: stat,
    /* 渲染 */
    badge: badge, ztBadge: ztBadge, rwztBadge: rwztBadge, jjBadge: jjBadge, lv: lv,
    remainCell: remainCell, nodeTag: nodeTag, table: table, paint: paint, repaintAll: repaintAll,
    checked: checked, pickAll: pickAll, barChart: barChart, donut: donut, emptyRow: emptyRow,
    /* 订阅与导航 */
    on: on, emit: emit, chrome: chrome, goto: goto, toast: toast
  };

  /* ==========================================================================
     九、66 个功能点闭环动作
     命名与《方案》第五章的功能点编号一一对应，注释中标注编号。
     每个动作统一完成：规则校验 → 状态迁移 → 写流水 → 发消息 → 落盘重绘 → Toast
     ========================================================================== */
  var act = {};

  /* ---------------- 我的工作台 wsbiz-01（功能点 1~4） ---------------- */
  /* 1 常用功能入口 */
  act.saveQuick = function (keys) {
    db.prefs.quick = keys;
    commit();
    toast('常用入口已保存', 'success');
  };
  /* 2 材料在线预览：标记已阅 */
  act.markPreviewed = function (mid) {
    var m = byId('materials', mid);
    if (!m) return;
    m.previewed = 1;
    commit();
    toast('已标记「' + m.clmc + '」阅毕', 'success');
  };
  /* 3 工作台布局设置 */
  act.saveLayout = function (cards) {
    db.prefs.cards = cards;
    commit();
    toast('工作台布局已保存', 'success');
  };
  /* 4 快捷检索定位：按办件号 / 合同号 / 房号 / 申请人真实匹配 */
  act.quickSearch = function (kw) {
    kw = (kw || '').trim();
    if (!kw) { toast('请输入办件编号、合同号、房屋编码或申请人', 'error'); return null; }
    var hit = null;
    get('cases').some(function (c) {
      if (c.sjbh.indexOf(kw) >= 0 || c.htbh.indexOf(kw) >= 0 ||
          c.fwbm.indexOf(kw) >= 0 || c.sqr.indexOf(kw) >= 0 || c.fw.indexOf(kw) >= 0) {
        hit = c; return true;
      }
      return false;
    });
    if (!hit) { toast('未检索到匹配的办件', 'error'); return null; }
    goto('case-detail.html', { id: hit.id });
    return hit;
  };

  /* ---------------- 待我审批 wsbiz-02（功能点 5~7） ---------------- */
  /* 7 签收领办：签收时间是时限计算起点（1.1.5） */
  act.signTask = function (tid, silent) {
    var t = byId('tasks', tid);
    if (!t) return false;
    if (t.rwzt !== '0') { if (!silent) toast('该任务已签收，无需重复签收', 'error'); return false; }
    if (!moveTask(t, '1')) return false;
    t.blryzj = db.me.id; t.blrmc = db.me.name; t.qssj = Date.now();
    var c = caseOf(t);
    if (c) {
      /* 待受理件签收后进入办理中，并以签收时间为时限起点重算承诺完成时间 */
      if (c.blzt === '0') {
        moveCase(c, '1', { czlx: '2', jd: t.jd, yj: '任务签收领办，进入办理环节。' });
        c.slsj = Date.now();
        var it = itemOf(c);
        c.cnwcsj = c.slsj + Math.round((it ? it.cnsx : 3) * 1.4) * DAY;
      }
      c.jbr = db.me.id; c.jbrmc = db.me.name;
    }
    tlog(t, '1', '签收领办');
    if (!silent) { commit(); toast('已签收，时限自签收时间起算', 'success'); }
    return true;
  };
  act.signBatch = function (ids) {
    if (!ids || !ids.length) { toast('请先勾选待签收的任务', 'error'); return; }
    var n = 0;
    ids.forEach(function (id) { if (act.signTask(id, true)) n++; });
    commit();
    toast(n ? ('已批量签收 ' + n + ' 件' + (n < ids.length ? '，' + (ids.length - n) + ' 件状态不允许' : '')) : '所选任务均已签收', n ? 'success' : 'error');
  };
  /* 7 批量转派 */
  act.transferTask = function (tid, userId, reason) {
    var t = byId('tasks', tid), u = userById(userId);
    if (!t || !u) { toast('请选择接收人', 'error'); return false; }
    if (t.rwzt === '3') { toast('已办结任务不能转派', 'error'); return false; }
    tlog(t, '3', '转派给 ' + u.name + (reason ? '：' + reason : ''));
    t.blryzj = u.id; t.blrmc = u.name; t.rwzt = '1'; t.qssj = Date.now();
    var c = caseOf(t);
    if (c) { c.jbr = u.id; c.jbrmc = u.name; log(c, '3', t.jd, '任务转派给 ' + u.name + (reason ? '：' + reason : ''), db.me.name); }
    notify('0', '待办提醒', '韦晓明 转派 1 件「' + t.sxmc + '」给您', 'my-approval.html');
    commit();
    toast('已转派给 ' + u.name + '，该任务已从我的待办移除', 'success');
    return true;
  };
  act.transferBatch = function (ids, userId) {
    if (!ids || !ids.length) { toast('请先勾选要转派的任务', 'error'); return; }
    var u = userById(userId);
    if (!u) { toast('请选择接收人', 'error'); return; }
    var n = 0;
    ids.forEach(function (id) {
      var t = byId('tasks', id);
      if (!t || t.rwzt === '3') return;
      tlog(t, '3', '批量转派给 ' + u.name);
      t.blryzj = u.id; t.blrmc = u.name; t.rwzt = '1'; t.qssj = Date.now();
      var c = caseOf(t);
      if (c) { c.jbr = u.id; c.jbrmc = u.name; }
      n++;
    });
    if (n) notify('0', '待办提醒', '韦晓明 批量转派 ' + n + ' 件任务给您', 'my-approval.html');
    commit();
    toast(n ? ('已批量转派 ' + n + ' 件给 ' + u.name) : '所选任务不可转派', n ? 'success' : 'error');
  };

  /* 审批通过：一件事子件受主件约束（1.1.3） */
  act.approve = function (tid, opinion) {
    var t = byId('tasks', tid);
    if (!t) return false;
    var c = caseOf(t);
    if (!c) return false;
    if (t.rwzt === '0') { toast('请先签收该任务再办理', 'error'); return false; }
    if (c.gllx === '2' && c.glbjzj) {
      var main = byId('cases', c.glbjzj);
      if (main && main.blzt !== '2') {
        toast('本件为一件事子件，主件「' + main.sjbh + '」未办结前不能单独办结', 'error');
        return false;
      }
    }
    if (!moveCase(c, '2', { czlx: '5', jd: t.jd, yj: opinion || '审核通过，予以备案。' })) return false;
    c.bjsj = Date.now(); c.jd = '出件登簿';
    db.docs.push({
      id: nid('D'), bjzj: c.id, sjbh: c.sjbh, cjlx: '0', cjmc: '备案证明',
      czr: db.me.name, czsj: Date.now(), printed: 0
    });
    act.archive(c.id, true);
    moveTask(t, '3');
    tlog(t, '2', opinion || '审核通过');
    db.reviews.push({
      id: nid('PJ'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc, sqr: c.sqr,
      pjdj: '', way: '待评价', content: '', jbr: db.me.id, jbrmc: db.me.name,
      wid: 'W01', wname: '1 号窗口', said: c.said, czsj: null, hsZt: '-'
    });
    notify('6', '评价提醒', '办件 ' + c.sjbh + ' 已办结，等待申请人评价', 'service-review.html');
    commit();
    toast('已办结并出具备案证明，材料同步归档', 'success');
    return true;
  };
  /* 退回补正：办件转 5 待补正 */
  act.reject = function (tid, reason) {
    var t = byId('tasks', tid);
    if (!t) return false;
    var c = caseOf(t);
    if (!c) return false;
    if (!reason) { toast('请填写退回补正原因', 'error'); return false; }
    if (!moveCase(c, '5', { czlx: '3', jd: t.jd, yj: '退回补正：' + reason })) return false;
    c.bzcs = (c.bzcs || 0) + 1;
    t.rwlx = '1';
    tlog(t, '4', '退回补正：' + reason);
    /* 未发过一次性告知的，同步生成补正任务（30） */
    if (!c.corrNotified) act.issueCorrection(c.id, [reason], 10, true);
    commit();
    toast('已退回补正，办件转为待补正', 'success');
    return true;
  };
  /* 回退到上一环节 */
  act.sendBack = function (tid, reason) {
    var t = byId('tasks', tid);
    if (!t) return false;
    if (!reason) { toast('请填写回退理由', 'error'); return false; }
    var c = caseOf(t);
    var idx = D.NODES.indexOf(t.jd);
    var prev = D.NODES[Math.max(0, idx - 1)];
    tlog(t, '5', '回退至「' + prev + '」：' + reason);
    t.jd = prev; t.rwzt = '1';
    if (c) { c.jd = prev; log(c, '7', prev, '回退至上一环节：' + reason, db.me.name); }
    commit();
    toast('已回退至「' + prev + '」', 'success');
    return true;
  };
  /* 中止 / 恢复：中止期间不计入时限（1.1.5） */
  act.suspend = function (cid, reason) {
    var c = byId('cases', cid);
    if (!c) return false;
    if (!reason) { toast('请填写中止事由', 'error'); return false; }
    if (!moveCase(c, '6', { czlx: '6', jd: c.jd, yj: '中止办理：' + reason })) return false;
    c.ztStart = Date.now();
    commit();
    toast('已中止办理，中止期间不计入办理时限', 'success');
    return true;
  };
  act.resume = function (cid) {
    var c = byId('cases', cid);
    if (!c) return false;
    if (!moveCase(c, '1', { czlx: '6', jd: c.jd, yj: '中止事由消除，恢复办理。' })) return false;
    if (c.ztStart) {
      var span = Date.now() - c.ztStart;
      c.ztsc = (c.ztsc || 0) + span;
      c.cnwcsj += span;      /* 顺延承诺完成时间 */
      c.ztStart = null;
    }
    commit();
    toast('已恢复办理，承诺时限相应顺延', 'success');
    return true;
  };

  function userById(id) {
    var us = get('users');
    for (var i = 0; i < us.length; i++) if (us[i].id === id) return us[i];
    return null;
  }
  function itemOf(c) {
    var its = get('items');
    for (var i = 0; i < its.length; i++) if (its[i].sxdm === c.sxdm) return its[i];
    return null;
  }
  act._userById = userById;
  act._itemOf = itemOf;

  /* ---------------- 待办中心 wsbiz-03（功能点 8~11） ---------------- */
  /* 9 任务池抢单领办 */
  act.claim = function (tid) {
    var t = byId('tasks', tid);
    if (!t) return false;
    if (t.blryzj) { toast('该任务已被 ' + t.blrmc + ' 领办', 'error'); return false; }
    return act.signTask(tid);
  };
  /* 9 指定分派 */
  act.assign = function (tid, userId) {
    var t = byId('tasks', tid), u = userById(userId);
    if (!t || !u) { toast('请选择承办人', 'error'); return false; }
    if (t.rwzt === '3') { toast('已办结任务不能分派', 'error'); return false; }
    t.blryzj = u.id; t.blrmc = u.name; t.rwzt = '1'; t.qssj = Date.now();
    var c = caseOf(t);
    if (c) {
      c.jbr = u.id; c.jbrmc = u.name;
      if (c.blzt === '0') { moveCase(c, '1', { czlx: '2', jd: t.jd, yj: '指定分派给 ' + u.name }); c.slsj = Date.now(); }
    }
    tlog(t, '1', '指定分派给 ' + u.name);
    notify('0', '待办提醒', '您被指派 1 件「' + t.sxmc + '」', 'my-approval.html');
    commit();
    toast('已分派给 ' + u.name, 'success');
    return true;
  };
  /* 10 批量办理：批量通过 / 批量退回 / 批量出件 */
  act.batchHandle = function (ids, mode, text) {
    if (!ids || !ids.length) { toast('请先勾选要办理的任务', 'error'); return; }
    var ok = 0, fail = 0;
    ids.forEach(function (id) {
      var t = byId('tasks', id);
      if (!t) { fail++; return; }
      if (t.rwzt === '0') { if (!act.signTask(id, true)) { fail++; return; } }
      var c = caseOf(t);
      if (mode === 'pass') {
        if (c && c.gllx === '2' && c.glbjzj) {
          var main = byId('cases', c.glbjzj);
          if (main && main.blzt !== '2') { fail++; return; }
        }
        if (!c || !canCase(c.blzt, '2')) { fail++; return; }
        c.blzt = '2'; c.bjsj = Date.now(); c.jd = '出件登簿';
        log(c, '5', '出件登簿', text || '批量审核通过', db.me.name);
        db.docs.push({ id: nid('D'), bjzj: c.id, sjbh: c.sjbh, cjlx: '0', cjmc: '备案证明', czr: db.me.name, czsj: Date.now(), printed: 0 });
        act.archive(c.id, true);
        t.rwzt = '3'; tlog(t, '2', text || '批量审核通过');
        ok++;
      } else if (mode === 'reject') {
        if (!c || !canCase(c.blzt, '5')) { fail++; return; }
        c.blzt = '5'; c.bzcs = (c.bzcs || 0) + 1;
        log(c, '3', t.jd, '批量退回补正：' + (text || '材料不齐'), db.me.name);
        t.rwlx = '1'; tlog(t, '4', '批量退回补正');
        ok++;
      } else if (mode === 'issue') {
        if (!c || c.blzt !== '2') { fail++; return; }
        db.docs.push({ id: nid('D'), bjzj: c.id, sjbh: c.sjbh, cjlx: '0', cjmc: '备案证明', czr: db.me.name, czsj: Date.now(), printed: 1 });
        ok++;
      }
    });
    commit();
    var label = { pass: '批量通过', reject: '批量退回', issue: '批量出件' }[mode] || '批量办理';
    toast(label + ' 成功 ' + ok + ' 件' + (fail ? '，' + fail + ' 件因状态或主子件约束被拦截' : ''), ok ? 'success' : 'error');
  };
  /* 11 催办；超期自动升级为督办 */
  act.urge = function (tid) {
    var t = byId('tasks', tid);
    if (!t) return false;
    var c = caseOf(t);
    var over = c ? remain(c).over : false;
    t.urged = (t.urged || 0) + 1;
    db.tasks.push({
      id: nid('T'), bjzj: t.bjzj, sjbh: t.sjbh, sxmc: t.sxmc, ywdlm: t.ywdlm,
      rwlx: over ? '4' : '3', rwzt: '1', blryzj: t.blryzj, blrmc: t.blrmc,
      jsdm: t.jsdm, jjcd: over ? '2' : '1', jd: t.jd, said: t.said, sjly: t.sjly,
      cnwcsj: Date.now() + DAY, qssj: null, createdAt: Date.now(), sfsc: 0, urged: 0
    });
    notify(over ? '2' : '1', over ? '督办通知' : '催办通知',
      (over ? '已超期升级督办：' : '催办：') + t.sxmc + '（' + t.sjbh + '）', 'task-center.html');
    commit();
    toast(over ? '该件已超期，已自动升级为督办并通知科室负责人' : '已发送催办提醒', 'success');
    return true;
  };

  /* ---------------- 事项目录 wsbiz-05（功能点 15~17） ---------------- */
  act.saveItem = function (data) {
    if (!data.sxmc || !data.sxdm) { toast('事项代码与事项名称为必填', 'error'); return false; }
    if (Number(data.cnsx) > Number(data.fdsx)) { toast('承诺时限不得大于法定时限', 'error'); return false; }
    var it = null;
    get('items').some(function (x) { if (x.sxdm === data.sxdm) { it = x; return true; } return false; });
    if (it) {
      ['sxmc', 'ywdlm', 'bllj', 'dept', 'sflx'].forEach(function (k) { if (data[k] != null) it[k] = data[k]; });
      it.fdsx = Number(data.fdsx); it.cnsx = Number(data.cnsx);
      commit(); toast('事项「' + it.sxmc + '」已更新，统一收件的事项下拉同步生效', 'success');
    } else {
      db.items.push({
        id: nid('I'), sxdm: data.sxdm, sxmc: data.sxmc, ywdlm: data.ywdlm || '99',
        bllj: data.bllj || '3', dept: data.dept || '综合受理科',
        fdsx: Number(data.fdsx) || 10, cnsx: Number(data.cnsx) || 5, sflx: data.sflx || '4',
        hot: 0, enabled: 1, cond: data.cond || '按事项办事指南执行。', sample: '示范样表.pdf',
        flow: D.NODES.slice(0, 4), clist: [], localDiff: [], points: [], rejects: []
      });
      commit(); toast('事项已新增，可在统一收件中选择', 'success');
    }
    return true;
  };
  act.saveGuide = function (sxdm, guide) {
    var it = null;
    get('items').some(function (x) { if (x.sxdm === sxdm) { it = x; return true; } return false; });
    if (!it) return false;
    if (guide.cond != null) it.cond = guide.cond;
    if (guide.clist) it.clist = guide.clist;
    commit();
    toast('办事指南已保存，材料核验清单同步更新', 'success');
    return true;
  };
  act.saveLocalDiff = function (sxdm, said, data) {
    var it = null;
    get('items').some(function (x) { if (x.sxdm === sxdm) { it = x; return true; } return false; });
    if (!it) return false;
    if (!said) { toast('请选择县区', 'error'); return false; }
    var d = null;
    it.localDiff.some(function (x) { if (x.said === said) { d = x; return true; } return false; });
    if (Number(data.cnsx) > it.fdsx) { toast('属地承诺时限不得大于市级法定时限', 'error'); return false; }
    if (d) { d.dept = data.dept; d.cnsx = Number(data.cnsx); d.note = data.note; }
    else it.localDiff.push({ said: said, dept: data.dept, cnsx: Number(data.cnsx), note: data.note });
    commit();
    toast(dict('said', said) + ' 属地差异已生效，未配置的县区继续继承市级口径', 'success');
    return true;
  };

  /* ---------------- 身份核验 wsbiz-06（功能点 18~20） ---------------- */
  /* 18 自然人实名核验：姓名与身份证号一致性校验 */
  act.verifyPerson = function (data) {
    if (!data.xm || !data.zjh) { toast('姓名与证件号为必填', 'error'); return false; }
    /* 演示规则：证件号需 18 位（含脱敏 *），且与库内申请人姓名匹配才算通过 */
    var known = null;
    get('cases').some(function (c) { if (c.sqr === data.xm && c.sqrlx === '1') { known = c; return true; } return false; });
    var ok = String(data.zjh).length >= 18 && !!known;
    db.verifies.push({
      id: nid('HY'), bjzj: known ? known.id : null, sjbh: known ? known.sjbh : '—',
      ztlx: '1', xm: data.xm, zjh: data.zjh, hyfs: data.hyfs || '2',
      result: ok ? 1 : 0,
      note: ok ? '姓名与身份证号一致，核验通过' : '姓名与身份证号不一致或证件号位数不足，已拦截',
      czr: db.me.name, czsj: Date.now(), proxy: null
    });
    commit();
    toast(ok ? '实名核验通过，结果已留痕' : '核验不通过：姓名与身份证号不一致，已拦截并留痕', ok ? 'success' : 'error');
    return ok;
  };
  /* 19 法人身份核验 */
  act.verifyLegal = function (data) {
    if (!data.xm || !data.zjh) { toast('单位名称与统一社会信用代码为必填', 'error'); return false; }
    var ok = String(data.zjh).length >= 18;
    var known = null;
    get('cases').some(function (c) { if (c.sqr === data.xm && c.sqrlx === '2') { known = c; return true; } return false; });
    db.verifies.push({
      id: nid('HY'), bjzj: known ? known.id : null, sjbh: known ? known.sjbh : '—',
      ztlx: '2', xm: data.xm, zjh: data.zjh, hyfs: data.hyfs || '3',
      result: ok ? 1 : 0,
      note: ok ? ('统一社会信用代码校验通过' + (known ? '，已关联主体备案信息' : '')) : '统一社会信用代码位数不足 18 位',
      czr: db.me.name, czsj: Date.now(), proxy: null
    });
    commit();
    toast(ok ? '法人核验通过' + (known ? '，已自动带出主体备案信息' : '') : '核验不通过：统一社会信用代码格式有误', ok ? 'success' : 'error');
    return ok;
  };
  /* 20 委托代理核验：记录事项范围与有效期，超范围代办拦截 */
  act.verifyProxy = function (data) {
    if (!data.name || !data.scope) { toast('代理人与委托事项范围为必填', 'error'); return false; }
    db.verifies.push({
      id: nid('HY'), bjzj: null, sjbh: '—', ztlx: '1',
      xm: data.principal || '—', zjh: data.pzjh || '—', hyfs: '4', result: 1,
      note: '委托书核验通过，事项范围「' + data.scope + '」，有效期至 ' + fmtDate(data.expire),
      czr: db.me.name, czsj: Date.now(),
      proxy: { name: data.name, zjh: data.zjh || '—', scope: data.scope, expire: data.expire }
    });
    commit();
    toast('委托代理核验通过，超出「' + data.scope + '」范围的代办将被拦截', 'success');
    return true;
  };
  /* 20 超范围校验：收件时调用 */
  act.checkProxyScope = function (proxyName, sxmc) {
    var hit = null;
    get('verifies').some(function (v) {
      if (v.proxy && v.proxy.name === proxyName) { hit = v; return true; }
      return false;
    });
    if (!hit) return true;
    if (hit.proxy.expire < Date.now()) { toast('代理人 ' + proxyName + ' 的委托书已过期，不能代办', 'error'); return false; }
    if (hit.proxy.scope.indexOf(sxmc) < 0 && hit.proxy.scope !== '全部业务') {
      toast('超出委托范围：' + proxyName + ' 仅被授权办理「' + hit.proxy.scope + '」', 'error');
      return false;
    }
    return true;
  };

  /* ---------------- 统一收件 wsbiz-07（功能点 21~24） ---------------- */
  /* 22 分类受理归口：按事项 + 层级 + 属地算出承办科室 */
  act.route = function (sxdm, said) {
    var it = null;
    get('items').some(function (x) { if (x.sxdm === sxdm) { it = x; return true; } return false; });
    if (!it) return null;
    var dept = it.dept, cnsx = it.cnsx, note = '继承市级口径';
    it.localDiff.forEach(function (d) {
      if (d.said === said) { dept = d.dept; cnsx = d.cnsx; note = d.note; }
    });
    var users = get('users').filter(function (u) {
      return u.roles.indexOf('sh') >= 0 && (u.said === said || u.said === '100100');
    });
    return { dept: dept, cnsx: cnsx, note: note, bllj: it.bllj, handlers: users };
  };
  /* 23 县区属地受理范围控制 */
  act.checkTerritory = function (windowSaid, houseSaid) {
    if (windowSaid === '100100') return { ok: true };
    if (windowSaid === houseSaid) return { ok: true };
    return { ok: false, to: houseSaid, msg: '本窗口属 ' + dict('said', windowSaid) + '，该房屋位于 ' + dict('said', houseSaid) + '，请转办至对应县区' };
  };
  /* 21 + 24 统一收件：一次申请可生成 1 主件 + N 子件 */
  act.intake = function (data) {
    if (!data.sxdm) { toast('请选择办理事项', 'error'); return null; }
    if (!data.sqr) { toast('请填写申请人', 'error'); return null; }
    if (!data.verified) { toast('请先完成申请人身份核验', 'error'); return null; }
    var extras = data.extras || [];
    var codes = [data.sxdm].concat(extras);
    var created = [], mainId = null;
    codes.forEach(function (code, k) {
      var it = null;
      get('items').some(function (x) { if (x.sxdm === code) { it = x; return true; } return false; });
      if (!it) return;
      var rt = act.route(code, data.said) || { dept: it.dept, cnsx: it.cnsx };
      var now = Date.now();
      var c = {
        id: nid('C'),
        sjbh: 'HX' + (data.said || '100100') + fmtDate(now).replace(/-/g, '').slice(0, 6) + pad(90 + get('cases').length % 9 + k),
        sxdm: it.sxdm, sxmc: it.sxmc, ywdlm: it.ywdlm, dept: rt.dept,
        blzt: '1', said: data.said || '100100', sjfs: data.sjfs || '0', sjly: data.sjly || '01',
        sqr: data.sqr, sqrlx: data.sqrlx || '1', sqrzjh: data.sqrzjh || '—', sqrdh: data.sqrdh || '—',
        fw: data.fw || '—', fwbm: data.fwbm || '—', xmmc: data.xmmc || '—', zl: data.zl || '—',
        htbh: data.htbh || ('HXSWB2026-' + pad(200 + get('cases').length) + '66'),
        gllx: codes.length > 1 ? (k === 0 ? '1' : '2') : '0',
        glbjzj: codes.length > 1 && k > 0 ? mainId : null,
        gzbs: '0', ygzsjbh: null,
        sjsj: now, slsj: now, cnwcsj: now + Math.round(rt.cnsx * 1.4) * DAY, bjsj: null,
        jbr: db.me.id, jbrmc: db.me.name, jd: '材料初审',
        ztsc: 0, bzcs: 0, thcs: 0, gdbs: 0,
        sfje: it.sflx === '4' ? 0 : (it.sflx === '3' ? 10 : 660),
        sfzt: it.sflx === '4' ? '免收' : '待缴',
        cxm: 'CX' + pad(200 + get('cases').length) + k + '7',
        aiChecked: 0, precheck: null, receiptAt: null, smsAt: null, corrNotified: 0
      };
      if (k === 0) mainId = c.id;
      db.cases.push(c);
      created.push(c);
      log(c, '1', '一窗受理', '一窗统一收件，归口 ' + rt.dept + '。' + (codes.length > 1 ? '关联业务合并收件。' : ''), db.me.name);
      /* 材料按事项清单落库 */
      it.clist.forEach(function (m) {
        db.materials.push({
          id: nid('MT'), bjzj: c.id, cldm: m.cldm, clmc: m.clmc, must: m.must,
          tjfs: m.exempt ? '2' : '0', got: 1, ok: 1, bad: '', previewed: 0, pages: 3
        });
      });
      /* 生成审批任务 */
      db.tasks.push({
        id: nid('T'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc, ywdlm: c.ywdlm,
        rwlx: '0', rwzt: '1', blryzj: db.me.id, blrmc: db.me.name,
        jsdm: rt.dept, jjcd: '0', jd: '材料初审', said: c.said, sjly: c.sjly,
        cnwcsj: c.cnwcsj, qssj: now, createdAt: now, sfsc: 0, urged: 0
      });
      /* 32 收件材料自动归档触发 */
      act.archive(c.id, true);
    });
    if (!created.length) { toast('收件失败：未匹配到有效事项', 'error'); return null; }
    notify('0', '待办提醒', '新收件 ' + created[0].sjbh + '「' + created[0].sxmc + '」已进入待办', 'my-approval.html');
    commit();
    toast(created.length > 1
      ? ('合并收件成功：1 个主件 + ' + (created.length - 1) + ' 个子件，收件编号 ' + created[0].sjbh)
      : ('收件成功，收件编号 ' + created[0].sjbh), 'success');
    return created;
  };
  /* 23 跨属地转办 */
  act.transferTerritory = function (said, data) {
    db.caseLogs.push({
      id: nid('L'), bjzj: null, czlx: '3', jd: '一窗受理', czr: db.me.name,
      czsj: Date.now(), yj: '跨属地申请，已转办至 ' + dict('said', said) + '：' + (data && data.sqr ? data.sqr : '')
    });
    notify('0', '待办提醒', '收到 ' + dict('said', '100100') + ' 转办的属地申请，请及时受理', 'task-center.html');
    commit();
    toast('已转办至 ' + dict('said', said) + '，并通知属地窗口', 'success');
    return true;
  };

  /* ---------------- 材料核验 wsbiz-08（功能点 25~27） ---------------- */
  /* 25 材料清单核对 */
  act.toggleMaterial = function (mid, got) {
    var m = byId('materials', mid);
    if (!m) return;
    m.got = got ? 1 : 0;
    commit();
  };
  /* 25 缺件校验 */
  act.missing = function (cid) {
    return where('materials', function (m) { return m.bjzj === cid && m.must && !m.got && m.tjfs === '0'; });
  };
  /* 26 材料形式要件核验 */
  act.formCheck = function (mid, ok, reason) {
    var m = byId('materials', mid);
    if (!m) return false;
    if (!ok && !reason) { toast('不合格必须填写原因', 'error'); return false; }
    m.ok = ok ? 1 : 0;
    m.bad = ok ? '' : reason;
    commit();
    toast(ok ? '「' + m.clmc + '」形式要件合格' : '「' + m.clmc + '」已标记不合格：' + reason, ok ? 'success' : 'error');
    return true;
  };
  /* 27 材料智能预检 */
  act.aiPrecheck = function (cid) {
    var c = byId('cases', cid);
    if (!c) return null;
    var ms = where('materials', function (m) { return m.bjzj === cid; });
    var miss = ms.filter(function (m) { return m.must && !m.got; }).map(function (m) { return m.clmc; });
    var diff = [];
    if (c.sfje > 600) diff.push('合同金额 ' + money(c.sfje * 1000) + ' 元与契税完税凭证金额存在差异');
    if (c.fw.indexOf('栋') >= 0) diff.push('测绘报告建筑面积与合同约定面积相差 0.3 ㎡，需确认');
    c.aiChecked = 1;
    c.precheck = { miss: miss, diff: diff, at: Date.now() };
    commit();
    toast('AI 预检完成：疑似缺项 ' + miss.length + ' 项，信息不一致 ' + diff.length + ' 处',
      (miss.length || diff.length) ? 'error' : 'success');
    return c.precheck;
  };
  /* 27 一键采纳预检结果 → 生成补正项 */
  act.adoptPrecheck = function (cid) {
    var c = byId('cases', cid);
    if (!c || !c.precheck) { toast('请先执行 AI 预检', 'error'); return false; }
    var items = c.precheck.miss.concat(c.precheck.diff);
    if (!items.length) { toast('预检未发现问题，无需补正', 'error'); return false; }
    return act.issueCorrection(cid, items, 10);
  };

  /* ---------------- 收件登记 wsbiz-09（功能点 28~32） ---------------- */
  /* 28 收件回执出具 */
  act.issueReceipt = function (cid) {
    var c = byId('cases', cid);
    if (!c) return false;
    c.receiptAt = Date.now();
    db.docs.push({
      id: nid('D'), bjzj: c.id, sjbh: c.sjbh, cjlx: '1', cjmc: '收件回执',
      czr: db.me.name, czsj: Date.now(), printed: 0
    });
    commit();
    toast('已生成收件回执，查询码 ' + c.cxm, 'success');
    return true;
  };
  act.pushSms = function (cid) {
    var c = byId('cases', cid);
    if (!c) return false;
    if (!c.receiptAt) { toast('请先出具收件回执', 'error'); return false; }
    c.smsAt = Date.now();
    notify('0', '待办提醒', '收件回执已短信推送至 ' + c.sqrdh + '（查询码 ' + c.cxm + '）', 'intake-register.html');
    commit();
    toast('已推送至申请人手机 ' + c.sqrdh, 'success');
    return true;
  };
  act.printDoc = function (did) {
    var d = byId('docs', did);
    if (!d) return false;
    d.printed = 1;
    commit();
    toast('已发送到打印机：' + d.cjmc, 'success');
    return true;
  };
  /* 29 受理结果告知：受理通知书 / 不予受理通知书 */
  act.issueNotice = function (cid, cjlx, reason) {
    var c = byId('cases', cid);
    if (!c) return false;
    if (cjlx === '2' && !reason) { toast('不予受理必须注明依据与救济途径', 'error'); return false; }
    db.docs.push({
      id: nid('D'), bjzj: c.id, sjbh: c.sjbh, cjlx: cjlx, cjmc: dict('cjlx', cjlx),
      czr: db.me.name, czsj: Date.now(), printed: 0, reason: reason || ''
    });
    if (cjlx === '2') {
      moveCase(c, '4', { czlx: '4', jd: '一窗受理', yj: '不予受理：' + reason });
      c.thcs = (c.thcs || 0) + 1;
    } else {
      log(c, '1', '一窗受理', '出具受理通知书', db.me.name);
    }
    commit();
    toast('已出具' + dict('cjlx', cjlx), 'success');
    return true;
  };
  /* 30 一次性补正通知：同一办件只允许告知一次 */
  act.issueCorrection = function (cid, items, days, silent) {
    var c = byId('cases', cid);
    if (!c) return false;
    if (c.corrNotified) {
      if (!silent) toast('该办件已发出一次性补正告知，不得重复告知（一次性告知制）', 'error');
      return false;
    }
    if (!items || !items.length) { if (!silent) toast('请选择需要补正的内容', 'error'); return false; }
    if (c.blzt !== '5' && !moveCase(c, '5', { czlx: '3', jd: c.jd, yj: '出具一次性补正通知书' })) return false;
    var deadline = Date.now() + (days || 10) * DAY;
    db.corrections.push({
      id: nid('BZ'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc, sqr: c.sqr, sqrdh: c.sqrdh,
      items: items, reason: items.join('；'), deadline: deadline,
      createdAt: Date.now(), createdBy: db.me.name, zt: '1',
      submitAt: null, reviewAt: null, reviewBy: null, way: '一次性告知'
    });
    db.docs.push({
      id: nid('D'), bjzj: c.id, sjbh: c.sjbh, cjlx: '3', cjmc: '一次性补正通知书',
      czr: db.me.name, czsj: Date.now(), printed: 0
    });
    c.corrNotified = 1;
    c.bzcs = (c.bzcs || 0) + 1;
    notify('0', '待办提醒', '办件 ' + c.sjbh + ' 已发出一次性补正通知，补正期限至 ' + fmtDate(deadline), 'material-correct.html');
    if (!silent) { commit(); toast('已出具一次性补正通知书，共 ' + items.length + ' 项，期限至 ' + fmtDate(deadline), 'success'); }
    return true;
  };
  /* 32 收件材料自动归档触发（随办随归） */
  act.archive = function (cid, silent) {
    var c = byId('cases', cid);
    if (!c) return false;
    var exist = where('archives', function (a) { return a.bjzj === cid; });
    if (exist.length) { if (!silent) toast('该办件材料已归档', 'error'); return false; }
    var n = where('materials', function (m) { return m.bjzj === cid && m.got; }).length;
    db.archives.push({
      id: nid('A'), bjzj: c.id, sjbh: c.sjbh,
      dabh: 'DA' + fmtDate(Date.now()).replace(/-/g, '') + pad(get('archives').length + 1),
      count: n, czsj: Date.now(), way: '随办随归'
    });
    c.gdbs = 1;
    if (!silent) { commit(); toast('已推送房产档案，共 ' + n + ' 份材料影像', 'success'); }
    return true;
  };
  /* 31 办结件更正与撤销受理：本身也是一次办件（1.1.4） */
  act.submitCorrectionCase = function (data) {
    var orig = byId('cases', data.origId);
    if (!orig) { toast('请先选择原办结件', 'error'); return null; }
    if (orig.blzt !== '2') { toast('只有已办结的办件才能申请更正或撤销', 'error'); return null; }
    if (!data.gzlx) { toast('请选择更正类型', 'error'); return null; }
    if (!data.reason) { toast('请填写更正或撤销事由', 'error'); return null; }
    var isRevoke = data.gzlx === '4';
    var now = Date.now();
    var c = {
      id: nid('C'),
      sjbh: 'HX' + orig.said + fmtDate(now).replace(/-/g, '').slice(0, 6) + pad(70 + get('cases').length % 20),
      sxdm: 'SX1401', sxmc: isRevoke ? '办结件整件撤销' : '办结件信息更正',
      ywdlm: '14', dept: '综合受理科', blzt: '1', said: orig.said,
      sjfs: '0', sjly: '01',
      sqr: orig.sqr, sqrlx: orig.sqrlx, sqrzjh: orig.sqrzjh, sqrdh: orig.sqrdh,
      fw: orig.fw, fwbm: orig.fwbm, xmmc: orig.xmmc, zl: orig.zl, htbh: orig.htbh,
      gllx: isRevoke ? '6' : '5', glbjzj: orig.id,
      gzbs: isRevoke ? '2' : '1', ygzsjbh: orig.sjbh,
      sjsj: now, slsj: now, cnwcsj: now + 7 * DAY, bjsj: null,
      jbr: db.me.id, jbrmc: db.me.name, jd: '材料初审',
      ztsc: 0, bzcs: 0, thcs: 0, gdbs: 0, sfje: 0, sfzt: '免收',
      cxm: 'CX' + pad(300 + get('cases').length) + '9',
      aiChecked: 0, precheck: null, receiptAt: null, smsAt: null, corrNotified: 0,
      gz: {
        gzlx: data.gzlx, reason: data.reason, before: data.before || '', after: data.after || '',
        sync: { biz: 0, archive: 0, report: 0 }
      }
    };
    db.cases.push(c);
    log(c, '1', '一窗受理', '受理' + (isRevoke ? '撤销' : '更正') + '申请，原办件 ' + orig.sjbh + '，事由：' + data.reason, db.me.name);
    db.tasks.push({
      id: nid('T'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc, ywdlm: '14',
      rwlx: '0', rwzt: '1', blryzj: db.me.id, blrmc: db.me.name,
      jsdm: '综合受理科', jjcd: '1', jd: '材料初审', said: c.said, sjly: '01',
      cnwcsj: c.cnwcsj, qssj: now, createdAt: now, sfsc: 0, urged: 0
    });
    notify('0', '待办提醒', (isRevoke ? '撤销' : '更正') + '件 ' + c.sjbh + ' 已受理，按原业务审批链复核', 'my-approval.html');
    commit();
    toast('已生成' + (isRevoke ? '撤销' : '更正') + '件 ' + c.sjbh + '，按原审批链复核', 'success');
    return c;
  };
  /* 31 三处同步：业务库 / 档案 / 上级报送 */
  act.syncCorrection = function (cid, target) {
    var c = byId('cases', cid);
    if (!c || !c.gz) { toast('该办件不是更正或撤销件', 'error'); return false; }
    if (c.blzt !== '2') { toast('更正件需先复核办结才能同步', 'error'); return false; }
    var names = { biz: '业务库', archive: '房产档案', report: '上级报送库' };
    if (c.gz.sync[target]) { toast(names[target] + ' 已同步', 'error'); return false; }
    c.gz.sync[target] = Date.now();
    log(c, '8', '出件登簿', '更正结果已同步至' + names[target], db.me.name);
    commit();
    var all = c.gz.sync.biz && c.gz.sync.archive && c.gz.sync.report;
    toast(all ? '三处同步全部完成，更正闭环' : (names[target] + ' 同步完成'), 'success');
    return true;
  };

  /* ---------------- 预约取号 wsbiz-10（功能点 33~36） ---------------- */
  /* 35 号源余量：某窗口某时段已约数 */
  act.slotUsed = function (wid, slot, dayTs) {
    var d0 = new Date(dayTs || Date.now()); d0.setHours(0, 0, 0, 0);
    var d1 = d0.getTime() + DAY;
    return where('appts', function (a) {
      return a.wid === wid && a.slot === slot && a.date >= d0.getTime() && a.date < d1 &&
        (a.yyzt === '0' || a.yyzt === '1' || a.yyzt === '2');
    }).length;
  };
  act.slotLeft = function (wid, slot, dayTs) {
    var w = byId('windows', wid);
    var cap = w ? w.cap : 12;
    return Math.max(0, cap - act.slotUsed(wid, slot, dayTs));
  };
  /* 33 网上预约：号源上限硬约束 */
  act.book = function (data) {
    if (!data.sqr || !data.sxdm || !data.wid || !data.slot) { toast('申请人、事项、窗口、时段均为必填', 'error'); return null; }
    if (act.slotLeft(data.wid, data.slot, data.date) <= 0) {
      toast('该窗口该时段号源已满，请改选其他时段', 'error');
      return null;
    }
    var w = byId('windows', data.wid);
    var it = null;
    get('items').some(function (x) { if (x.sxdm === data.sxdm) { it = x; return true; } return false; });
    var a = {
      id: nid('YY'), yyh: 'YY' + fmtDate(Date.now()).replace(/-/g, '') + pad(get('appts').length + 1),
      sqr: data.sqr, sqrdh: data.sqrdh || '—', sxdm: data.sxdm, sxmc: it ? it.sxmc : '—',
      wid: w.id, wname: w.name, said: w.said,
      date: data.date || Date.now(), slot: data.slot, yyzt: '0',
      createdAt: Date.now(), way: data.way || '统一服务门户'
    };
    db.appts.push(a);
    notify('0', '待办提醒', a.sqr + ' 预约 ' + a.slot + ' 到 ' + a.wname + ' 办理「' + a.sxmc + '」', 'appointment.html');
    commit();
    toast('预约成功，预约号 ' + a.yyh + '，剩余号源 ' + act.slotLeft(w.id, data.slot, a.date), 'success');
    return a;
  };
  /* 33 取消改约：释放号源 */
  act.cancelBook = function (id) {
    var a = byId('appts', id);
    if (!a) return false;
    if (a.yyzt !== '0') { toast('仅「已预约」状态可取消', 'error'); return false; }
    a.yyzt = '3';
    commit();
    toast('已取消预约，号源已释放', 'success');
    return true;
  };
  act.rebook = function (id, slot) {
    var a = byId('appts', id);
    if (!a) return false;
    if (a.yyzt !== '0') { toast('仅「已预约」状态可改约', 'error'); return false; }
    if (act.slotLeft(a.wid, slot, a.date) <= 0) { toast('目标时段号源已满', 'error'); return false; }
    a.slot = slot;
    commit();
    toast('已改约至 ' + slot, 'success');
    return true;
  };
  /* 34 取号进队：预约号优先 */
  act.takeNumber = function (id) {
    var a = byId('appts', id);
    if (!a) return false;
    if (a.yyzt !== '0') { toast('该预约当前为「' + dict('yyzt', a.yyzt) + '」，不能取号', 'error'); return false; }
    a.yyzt = '1';
    db.queue.push({
      id: nid('PD'), pdh: 'A' + pad(where('queue', function (q) { return q.isAppt; }).length + 1),
      yyid: a.id, sqr: a.sqr, wid: a.wid, wname: a.wname, sxmc: a.sxmc,
      pdzt: '0', isAppt: 1, createdAt: Date.now()
    });
    commit();
    toast('已取号，预约号优先排队', 'success');
    return true;
  };
  act.walkIn = function (name, wid) {
    var w = byId('windows', wid) || get('windows')[0];
    db.queue.push({
      id: nid('PD'), pdh: 'B' + pad(where('queue', function (q) { return !q.isAppt; }).length + 1),
      yyid: null, sqr: name || '现场群众', wid: w.id, wname: w.name,
      sxmc: '现场取号', pdzt: '0', isAppt: 0, createdAt: Date.now()
    });
    commit();
    toast('现场取号成功，排在预约号之后', 'success');
    return true;
  };
  /* 34 叫号推进：预约号优先于现场号 */
  act.callNext = function (wid) {
    /* 先结束当前正在办理的 */
    where('queue', function (q) { return q.pdzt === '2' && (!wid || q.wid === wid); })
      .forEach(function (q) { q.pdzt = '3'; });
    var pool = where('queue', function (q) { return q.pdzt === '0' && (!wid || q.wid === wid); });
    if (!pool.length) { commit(); toast('当前无等待中的号', 'error'); return null; }
    pool.sort(function (a, b) {
      if (a.isAppt !== b.isAppt) return b.isAppt - a.isAppt;   /* 预约号优先 */
      return a.createdAt - b.createdAt;
    });
    var next = pool[0];
    next.pdzt = '2';
    if (next.yyid) {
      var a = byId('appts', next.yyid);
      if (a) a.yyzt = '2';
    }
    commit();
    toast('请 ' + next.pdh + ' 号 ' + next.sqr + ' 到 ' + next.wname + ' 办理', 'success');
    return next;
  };
  /* 35 号源资源配置 */
  act.saveQuota = function (wid, cap) {
    var w = byId('windows', wid);
    if (!w) return false;
    cap = Number(cap);
    if (!cap || cap < 1) { toast('号源上限须为正整数', 'error'); return false; }
    w.cap = cap;
    commit();
    toast(w.name + ' 号源上限已设为 ' + cap + '，预约页可选余量同步变化', 'success');
    return true;
  };
  /* 36 标记爽约 */
  act.markNoShow = function (id) {
    var a = byId('appts', id);
    if (!a) return false;
    if (a.yyzt !== '0' && a.yyzt !== '1') { toast('仅已预约或已取号可标记爽约', 'error'); return false; }
    a.yyzt = '4';
    commit();
    toast('已标记爽约，失约率更新为 ' + stat('noShowRate'), 'success');
    return true;
  };

  /* ---------------- 窗口排班 wsbiz-11（功能点 37~38） ---------------- */
  act.saveWindow = function (data) {
    if (!data.name) { toast('窗口名称为必填', 'error'); return false; }
    var w = data.id ? byId('windows', data.id) : null;
    if (w) {
      w.name = data.name; w.type = data.type; w.scope = data.scope;
      w.said = data.said; w.cap = Number(data.cap) || w.cap;
      commit(); toast('窗口已更新，预约页窗口下拉同步', 'success');
    } else {
      db.windows.push({
        id: 'W' + pad(get('windows').length + 1), name: data.name,
        type: data.type || '综合窗口', scope: data.scope || '全部业务',
        said: data.said || '100100', enabled: 1, cap: Number(data.cap) || 12
      });
      D.WEEK.forEach(function (day) {
        db.shifts.push({
          id: nid('S'), wid: 'W' + pad(get('windows').length), wname: data.name,
          day: day, userId: 'U004', userName: '莫振华'
        });
      });
      commit(); toast('窗口已新增并生成默认班表', 'success');
    }
    return true;
  };
  act.saveShift = function (sid, userId) {
    var s = byId('shifts', sid), u = userById(userId);
    if (!s || !u) { toast('请选择值班人员', 'error'); return false; }
    s.userId = u.id; s.userName = u.name;
    db.shiftPublished = 0;
    commit();
    toast(s.wname + ' ' + s.day + ' 值班人已调整为 ' + u.name + '，待发布', 'success');
    return true;
  };
  /* 38 两人换班 */
  act.swapShift = function (aid, bid) {
    var a = byId('shifts', aid), b = byId('shifts', bid);
    if (!a || !b) { toast('请选择两个班次', 'error'); return false; }
    if (a.id === b.id) { toast('请选择不同的两个班次', 'error'); return false; }
    var t = { id: a.userId, name: a.userName };
    a.userId = b.userId; a.userName = b.userName;
    b.userId = t.id; b.userName = t.name;
    db.shiftPublished = 0;
    commit();
    toast('已换班：' + a.userName + ' ⇄ ' + b.userName + '，待发布', 'success');
    return true;
  };
  act.publishShift = function () {
    db.shiftPublished = 1;
    notify('4', '系统公告', '下周窗口值班表已发布，叫号分流按新班表执行', 'window-schedule.html');
    commit();
    toast('值班表已发布，叫号分流按新班表执行', 'success');
    return true;
  };

  /* ---------------- 帮办代办 wsbiz-12（功能点 39~40） ---------------- */
  act.assistIntake = function (data) {
    if (!data.sqr || !data.helper || !data.group) { toast('申请人、帮办人、特殊群体类型为必填', 'error'); return null; }
    var created = act.intake({
      sxdm: data.sxdm, sqr: data.sqr, sqrdh: data.sqrdh, said: data.said,
      fw: data.fw, sjfs: '7', sjly: '01', verified: true
    });
    if (!created) return null;
    var c = created[0];
    c.assist = { helper: data.helper, group: data.group, auth: data.auth || '现场口头授权并录音留痕' };
    log(c, '1', '一窗受理', '帮办代办受理：' + data.group + '，帮办人 ' + data.helper, db.me.name);
    commit();
    toast('帮办代办受理完成，收件方式已标记为帮办代办', 'success');
    return c;
  };
  /* 40 材料网上预审 */
  act.preAudit = function (cid, pass, opinion) {
    var c = byId('cases', cid);
    if (!c) return false;
    if (!pass && !opinion) { toast('预审不通过必须填写意见', 'error'); return false; }
    c.preAudit = { pass: pass ? 1 : 0, opinion: opinion || '材料齐全，可到窗口一次办结', at: Date.now(), by: db.me.name };
    log(c, '2', '材料初审', (pass ? '网上预审通过：' : '网上预审不通过：') + (opinion || '材料齐全'), db.me.name);
    if (!pass) {
      act.issueCorrection(cid, [opinion], 10, true);
    }
    commit();
    toast(pass ? '预审通过，申请人可到窗口一次办结或直接网上办结' : '预审不通过，已生成补正任务', pass ? 'success' : 'error');
    return true;
  };

  /* ---------------- 材料库 wsbiz-13（功能点 41~42） ---------------- */
  act.saveMaterialDef = function (data) {
    if (!data.clmc) { toast('材料名称为必填', 'error'); return false; }
    var m = data.id ? byId('materialDefs', data.id) : null;
    if (m) {
      m.clmc = data.clmc; m.cllx = data.cllx; m.gs = data.gs;
      m.yxq = Number(data.yxq) || 0; m.reuse = data.reuse ? 1 : 0;
      commit(); toast('材料项已更新，事项材料清单可选项同步', 'success');
    } else {
      db.materialDefs.push({
        id: nid('M'), cldm: 'CL' + pad(get('materialDefs').length + 1), clmc: data.clmc,
        cllx: data.cllx || '其他', gs: data.gs || 'PDF', yxq: Number(data.yxq) || 0,
        reuse: data.reuse ? 1 : 0, useCount: 0, bzCount: 0
      });
      commit(); toast('材料项已新增', 'success');
    }
    return true;
  };
  /* 42 申请人材料库：按申请人归集历史材料 */
  act.applicantMaterials = function (sqr) {
    var ids = where('cases', function (c) { return c.sqr === sqr; }).map(function (c) { return c.id; });
    return where('materials', function (m) { return ids.indexOf(m.bjzj) >= 0; });
  };

  /* ---------------- 材料免提交 wsbiz-14（功能点 43~46） ---------------- */
  function setExempt(mid, tjfs, label) {
    var m = byId('materials', mid);
    if (!m) return false;
    if (m.tjfs === tjfs) { toast('该材料已是「' + dict('tjfs', tjfs) + '」', 'error'); return false; }
    m.tjfs = tjfs; m.got = 1; m.ok = 1; m.bad = '';
    commit();
    toast(label + '：「' + m.clmc + '」已免提交', 'success');
    return true;
  }
  /* 43 电子证照调用 */
  act.callLicense = function (mid) { return setExempt(mid, '2', '电子证照调用成功'); };
  /* 44 历史材料复用 */
  act.reuseHistory = function (mid) { return setExempt(mid, '3', '历史材料复用成功'); };
  /* 45 数据共享代替材料 */
  act.fetchShared = function (mid, src) {
    var ok = setExempt(mid, '4', (src || '共享接口') + ' 数据获取成功');
    return ok;
  };
  /* 46 免提交清单管理 */
  act.publishExempt = function (sxdm, codes) {
    var it = null;
    get('items').some(function (x) { if (x.sxdm === sxdm) { it = x; return true; } return false; });
    if (!it) return false;
    it.clist.forEach(function (m) { m.exempt = codes.indexOf(m.cldm) >= 0 ? 1 : 0; });
    commit();
    toast('免提交清单已发布，收件时将一次性告知申请人', 'success');
    return true;
  };

  /* ---------------- 材料补正 wsbiz-15（功能点 47~49） ---------------- */
  /* 47 逾期处置：终止办理 或 退件 */
  act.correctOverdue = function (bid, mode) {
    var bz = byId('corrections', bid);
    if (!bz) return false;
    if (bz.deadline >= Date.now()) { toast('该补正任务尚未逾期，不能按逾期处置', 'error'); return false; }
    if (bz.zt !== '1') { toast('该补正任务已' + (bz.zt === '2' ? '提交' : '办结'), 'error'); return false; }
    var c = byId('cases', bz.bjzj);
    if (!c) return false;
    if (mode === 'stop') {
      if (!moveCase(c, '4', { czlx: '4', jd: c.jd, yj: '补正期限届满仍未补正，依规退件。' })) return false;
      c.thcs = (c.thcs || 0) + 1;
      bz.zt = '4';
      db.docs.push({ id: nid('D'), bjzj: c.id, sjbh: c.sjbh, cjlx: '4', cjmc: '退件通知书', czr: db.me.name, czsj: Date.now(), printed: 0 });
      commit();
      toast('已按逾期未补正退件，并出具退件通知书', 'success');
    } else {
      if (!moveCase(c, '1', { czlx: '6', jd: c.jd, yj: '补正逾期，转中止办理等待申请人补充。' })) return false;
      moveCase(c, '6', { czlx: '6', jd: c.jd, yj: '中止办理，等待补正材料。' });
      c.ztStart = Date.now();
      bz.zt = '3';
      commit();
      toast('已中止办理，中止期间不计入时限', 'success');
    }
    return true;
  };
  /* 48 线上补正提交（模拟申请人在线补交） */
  act.submitOnlineCorrect = function (bid) {
    var bz = byId('corrections', bid);
    if (!bz) return false;
    if (bz.zt !== '1') { toast('该补正任务当前不可提交', 'error'); return false; }
    bz.zt = '2'; bz.submitAt = Date.now(); bz.way = '线上补正';
    /* 被标记不合格的材料重新置为待复核 */
    where('materials', function (m) { return m.bjzj === bz.bjzj && !m.ok; })
      .forEach(function (m) { m.got = 1; m.tjfs = '1'; });
    notify('0', '待办提醒', bz.sqr + ' 已在线补交材料，办件 ' + bz.sjbh + ' 待复核', 'material-correct.html');
    commit();
    toast('申请人已线上补交，等待经办人复核', 'success');
    return true;
  };
  /* 48 补正复核：通过则办件回到办理中 */
  act.reviewCorrection = function (bid, pass, opinion) {
    var bz = byId('corrections', bid);
    if (!bz) return false;
    if (bz.zt !== '2') { toast('请等待申请人提交补正材料后再复核', 'error'); return false; }
    var c = byId('cases', bz.bjzj);
    if (!c) return false;
    bz.reviewAt = Date.now(); bz.reviewBy = db.me.name;
    if (pass) {
      if (!moveCase(c, '1', { czlx: '2', jd: c.jd, yj: '补正材料复核通过，恢复办理。' })) return false;
      bz.zt = '3';
      where('materials', function (m) { return m.bjzj === c.id; }).forEach(function (m) { m.ok = 1; m.bad = ''; });
      /* 任务回到待办 */
      var t = null;
      get('tasks').some(function (x) { if (x.bjzj === c.id) { t = x; return true; } return false; });
      if (t) { t.rwlx = '0'; t.rwzt = '1'; }
      else {
        db.tasks.push({
          id: nid('T'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc, ywdlm: c.ywdlm,
          rwlx: '0', rwzt: '1', blryzj: db.me.id, blrmc: db.me.name, jsdm: c.dept,
          jjcd: '1', jd: c.jd, said: c.said, sjly: c.sjly, cnwcsj: c.cnwcsj,
          qssj: Date.now(), createdAt: Date.now(), sfsc: 0, urged: 0
        });
      }
      commit();
      toast('复核通过，办件恢复为办理中，任务已回到待办', 'success');
    } else {
      if (!opinion) { toast('复核不通过必须填写意见', 'error'); return false; }
      bz.zt = '1'; bz.submitAt = null;
      log(c, '3', c.jd, '补正材料复核不通过：' + opinion, db.me.name);
      commit();
      toast('复核不通过，补正任务继续跟踪', 'error');
    }
    return true;
  };
  /* 49 高频补正材料 TOP10 */
  act.topCorrectItems = function () {
    var count = {};
    get('corrections').forEach(function (bz) {
      (bz.items || []).forEach(function (n) { count[n] = (count[n] || 0) + 1; });
    });
    get('materialDefs').forEach(function (m) {
      if (m.bzCount) count[m.clmc] = (count[m.clmc] || 0) + m.bzCount;
    });
    return Object.keys(count).map(function (k) { return { l: k, v: count[k] }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 10);
  };
  act.optimizeChecklist = function (name) {
    notify('5', '业务动态', '「' + name + '」补正频次偏高，建议纳入免提交或数据共享范围', 'material-library.html');
    commit();
    toast('已生成优化建议并推送材料库管理员', 'success');
    return true;
  };

  /* ---------------- 跨业务查询 wsbiz-16（功能点 50~53） ---------------- */
  var DIM_LABEL = { fw: '房屋', ds: '当事人', xm: '项目', bj: '办件' };
  act.query = function (dim, kw) {
    kw = (kw || '').trim();
    if (!kw) { toast('请输入' + (DIM_LABEL[dim] || '') + '查询条件', 'error'); return []; }
    var hits = where('cases', function (c) {
      if (dim === 'fw') return c.fw.indexOf(kw) >= 0 || c.fwbm.indexOf(kw) >= 0;
      if (dim === 'ds') return c.sqr.indexOf(kw) >= 0 || c.sqrzjh.indexOf(kw) >= 0;
      if (dim === 'xm') return c.xmmc.indexOf(kw) >= 0 || c.zl.indexOf(kw) >= 0;
      return c.sjbh.indexOf(kw) >= 0 || c.htbh.indexOf(kw) >= 0 ||
        (c.jbrmc || '').indexOf(kw) >= 0 || c.sxmc.indexOf(kw) >= 0;
    });
    /* 查询行为留痕（MS_ZHCXJLXX） */
    db.queries.unshift({
      id: nid('CX'), dim: dim, kw: kw, czr: db.me.name, czsj: Date.now(), hit: hits.length
    });
    commit();
    toast('按' + (DIM_LABEL[dim] || '') + '维度命中 ' + hits.length + ' 条记录，查询已留痕',
      hits.length ? 'success' : 'error');
    return hits;
  };

  /* ---------------- 办件台账 wsbiz-17（功能点 54~57） ---------------- */
  act.exportLedger = function (said) {
    var n = where('cases', function (c) { return !said || c.said === said; }).length;
    toast('已导出 ' + (said ? dict('said', said) : '全市') + ' 办件台账，共 ' + n + ' 条', 'success');
    return true;
  };
  /* 55 超期预警分类 */
  act.overdueGroups = function () {
    var doing = where('cases', function (c) { return c.blzt === '1' || c.blzt === '5'; });
    return {
      near: doing.filter(function (c) { return remain(c).level === 'orange'; }),
      over: doing.filter(function (c) { return remain(c).over; }),
      multiReject: where('cases', function (c) { return (c.thcs || 0) >= 2; }),
      hang: where('cases', function (c) { return c.blzt === '6'; })
    };
  };
  act.pushOverdue = function (cid) {
    var c = byId('cases', cid);
    if (!c) return false;
    notify('3', '预警通知', '超期件 ' + c.sjbh + '「' + c.sxmc + '」已推送 ' + c.dept + ' 负责人', 'case-ledger.html');
    commit();
    toast('已推送至 ' + c.dept + ' 负责人', 'success');
    return true;
  };
  /* 56 效能监督：按维度聚合 */
  act.efficiency = function (by) {
    var groups = {};
    get('cases').forEach(function (c) {
      var key = by === 'said' ? dict('said', c.said) : (by === 'dept' ? c.dept : (c.jbrmc || '未分配'));
      if (!groups[key]) groups[key] = { key: key, intake: 0, done: 0, over: 0, reject: 0, span: 0 };
      var g = groups[key];
      g.intake++;
      if (c.blzt === '2') { g.done++; g.span += used(c); }
      if ((c.blzt === '1' || c.blzt === '5') && remain(c).over) g.over++;
      if (c.blzt === '4') g.reject++;
    });
    return Object.keys(groups).map(function (k) {
      var g = groups[k];
      g.avg = g.done ? fmtSpan(g.span / g.done) : '—';
      g.overRate = g.intake ? (Math.round(g.over / g.intake * 1000) / 10) + '%' : '0%';
      g.rejectRate = g.intake ? (Math.round(g.reject / g.intake * 1000) / 10) + '%' : '0%';
      return g;
    }).sort(function (a, b) { return b.done - a.done; });
  };
  /* 57 全过程追溯 */
  act.trace = function (cid) {
    return where('caseLogs', function (l) { return l.bjzj === cid; })
      .sort(function (a, b) { return a.czsj - b.czsj; });
  };

  /* ---------------- 服务评价 wsbiz-18（功能点 58~60） ---------------- */
  /* 58 好差评采集：差评自动生成核实任务 */
  act.submitReview = function (data) {
    if (!data.bjzj) { toast('请选择被评价的办件', 'error'); return false; }
    if (!data.pjdj) { toast('请选择评价等级', 'error'); return false; }
    var c = byId('cases', data.bjzj);
    if (!c) return false;
    if (c.blzt !== '2') { toast('仅已办结的办件可以评价', 'error'); return false; }
    var r = null;
    get('reviews').some(function (x) {
      if (x.bjzj === data.bjzj && !x.pjdj) { r = x; return true; }
      return false;
    });
    var bad = data.pjdj >= '4';
    if (r) {
      r.pjdj = data.pjdj; r.way = data.way || '窗口评价器';
      r.content = data.content || ''; r.czsj = Date.now();
      r.hsZt = bad ? '0' : '-';
    } else {
      r = {
        id: nid('PJ'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc, sqr: c.sqr,
        pjdj: data.pjdj, way: data.way || '窗口评价器', content: data.content || '',
        jbr: c.jbr, jbrmc: c.jbrmc, wid: 'W01', wname: '1 号窗口',
        said: c.said, czsj: Date.now(), hsZt: bad ? '0' : '-'
      };
      db.reviews.push(r);
    }
    if (bad) {
      /* 差评必定生成核实任务进待办中心 */
      db.tasks.push({
        id: nid('T'), bjzj: c.id, sjbh: c.sjbh, sxmc: '差评核实整改', ywdlm: c.ywdlm,
        rwlx: '6', rwzt: '1', blryzj: db.me.id, blrmc: db.me.name,
        jsdm: '综合受理科', jjcd: '1', jd: '差评核实', said: c.said, sjly: '01',
        cnwcsj: Date.now() + 3 * DAY, qssj: Date.now(), createdAt: Date.now(), sfsc: 0, urged: 0,
        reviewId: r.id
      });
      notify('6', '评价提醒', '新增 1 条差评（' + dict('pjdj', data.pjdj) + '），已生成核实任务', 'service-review.html');
    }
    commit();
    toast(bad ? '差评已记录，并自动生成核实整改任务' : '评价已提交，满意度更新为 ' + stat('satisfyRate'),
      bad ? 'error' : 'success');
    return true;
  };
  /* 59 差评核实整改闭环 */
  act.verifyReview = function (rid, data) {
    var r = byId('reviews', rid);
    if (!r) return false;
    if (r.pjdj < '4') { toast('仅差评需要核实整改', 'error'); return false; }
    if (r.hsZt === '1') { toast('该差评已完成核实整改', 'error'); return false; }
    if (!data.result || !data.measure) { toast('核实结果与整改措施均为必填', 'error'); return false; }
    db.rectifies.push({
      id: nid('ZG'), pjid: r.id, bjzj: r.bjzj, sjbh: r.sjbh,
      result: data.result, measure: data.measure, reason: data.reason || '',
      czr: db.me.name, czsj: Date.now()
    });
    r.hsZt = '1';
    /* 关闭对应核实任务 */
    where('tasks', function (t) { return t.reviewId === r.id; }).forEach(function (t) {
      t.rwzt = '3';
      tlog(t, '2', '差评核实整改完成');
    });
    commit();
    toast('差评核实整改已闭环，核实任务同步办结', 'success');
    return true;
  };
  /* 60 满意度统计 */
  act.satisfaction = function (by) {
    var groups = {};
    get('reviews').filter(function (r) { return r.pjdj; }).forEach(function (r) {
      var key = by === 'said' ? dict('said', r.said) : (by === 'window' ? r.wname : (by === 'person' ? r.jbrmc : r.sxmc));
      if (!groups[key]) groups[key] = { key: key, total: 0, good: 0, bad: 0 };
      groups[key].total++;
      if (r.pjdj <= '3') groups[key].good++; else groups[key].bad++;
    });
    return Object.keys(groups).map(function (k) {
      var g = groups[k];
      g.rate = (Math.round(g.good / g.total * 1000) / 10) + '%';
      return g;
    }).sort(function (a, b) { return b.total - a.total; });
  };

  /* ---------------- 业务指引 wsbiz-19（功能点 61~63） ---------------- */
  act.favPolicy = function (pid) {
    var p = byId('policies', pid);
    if (!p) return false;
    if (p.status === '已废止') { toast('已废止的政策不能收藏', 'error'); return false; }
    p.fav = p.fav ? 0 : 1;
    commit();
    toast(p.fav ? '已收藏，可在工作台快捷区查看' : '已取消收藏', 'success');
    return true;
  };
  act.submitHardCase = function (data) {
    if (!data.title || !data.body) { toast('案例标题与处理要点为必填', 'error'); return false; }
    db.hardCases.push({
      id: nid('AL'), title: data.title, cat: data.cat || '综合', status: '待审核',
      author: db.me.name, createdAt: Date.now(), body: data.body, views: 0
    });
    notify('0', '待办提醒', '新增 1 条疑难案例待业务科室审核发布', 'guide.html');
    commit();
    toast('案例已提交，待业务科室审核发布后可被检索', 'success');
    return true;
  };
  act.auditHardCase = function (id, pass, reason) {
    var a = byId('hardCases', id);
    if (!a) return false;
    if (a.status !== '待审核') { toast('该案例已' + a.status, 'error'); return false; }
    if (!pass && !reason) { toast('不通过必须填写理由', 'error'); return false; }
    a.status = pass ? '已发布' : '已退回';
    a.auditBy = db.me.name; a.auditAt = Date.now(); a.auditNote = reason || '';
    commit();
    toast(pass ? '案例已发布，可被检索到' : '案例已退回作者修改', pass ? 'success' : 'error');
    return true;
  };

  /* ---------------- 业务动态 wsbiz-20（功能点 64~66） ---------------- */
  act.readMsg = function (id) {
    var m = byId('msgs', id);
    if (!m) return false;
    m.read = 1;
    commit();
    return true;
  };
  act.readAll = function () {
    var n = 0;
    get('msgs').forEach(function (m) { if (!m.read) { m.read = 1; n++; } });
    commit();
    toast(n ? ('已将 ' + n + ' 条消息标记为已读') : '没有未读消息', n ? 'success' : 'error');
    return true;
  };
  act.publishNews = function (data) {
    if (!data.title || !data.content) { toast('标题与正文为必填', 'error'); return false; }
    db.news.unshift({
      id: nid('DT'), title: data.title, content: data.content,
      scope: data.scope ? dict('said', data.scope) : '全市',
      author: db.me.name, createdAt: Date.now()
    });
    notify('5', '业务动态', data.title, 'news.html');
    commit();
    toast('业务动态已发布', 'success');
    return true;
  };
  act.publishNotice = function (data) {
    if (!data.title || !data.content) { toast('标题与正文为必填', 'error'); return false; }
    db.notices.unshift({
      id: nid('TZ'), title: data.title, content: data.content, must: data.must ? 1 : 0,
      author: db.me.dept, createdAt: Date.now(), confirmed: 0, confirmAt: null
    });
    notify('4', '系统公告', data.title, 'news.html');
    commit();
    toast(data.must ? '通知已发布，需全员阅读确认' : '通知已发布', 'success');
    return true;
  };
  /* 66 重要通知强制阅读确认并留痕 */
  act.confirmNotice = function (id) {
    var n = byId('notices', id);
    if (!n) return false;
    if (!n.must) { toast('该通知无需阅读确认', 'error'); return false; }
    if (n.confirmed) { toast('您已确认阅读该通知', 'error'); return false; }
    n.confirmed = 1; n.confirmAt = Date.now(); n.confirmBy = db.me.name;
    commit();
    toast('已确认阅读，阅读人与时间已留痕', 'success');
    return true;
  };

  window.FLOW.act = act;
  window.FLOW.userById = userById;
  window.FLOW.itemOf = itemOf;

  /* ==========================================================================
     十、引导
     app.js 在 DOMContentLoaded 里注入布局与增强表格；本文件的监听在其之后注册，
     因此这里能拿到已注入的顶栏，并在其之后渲染状态驱动的内容。
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    load();
    chrome();
    /* 跨页定位：?focus=xxx 时高亮并滚动到目标行 */
    var focus = param('focus');
    if (focus) {
      setTimeout(function () {
        var el = document.querySelector('[data-focus="' + focus + '"]');
        if (el) {
          el.scrollIntoView({ block: 'center' });
          el.style.transition = 'background .4s';
          el.style.background = 'var(--primary-light)';
          setTimeout(function () { el.style.background = ''; }, 2400);
        }
      }, 200);
    }
  });
})();
