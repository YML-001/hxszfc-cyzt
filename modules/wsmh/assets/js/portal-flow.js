/* ==========================================================================
   统一服务门户 · 状态引擎 (portal-flow.js)
   职责：状态机、业务规则、184 个功能点的闭环动作、跨页联动。
   对外：PORTAL.act(动作, 参数) 统一分发；PORTAL.on(fn) 订阅重绘；PORTAL.reset()。
   引入顺序：portal-data.js → portal-flow.js → portal.js
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PDATA;
  var db = D.load();
  var subs = [];

  function commit() { D.persist(db); subs.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  function nid(p) { db._seq = (db._seq || 1000) + 1; return p + db._seq; }
  function now() { return D.ymdhm(Date.now()); }
  function today() { return D.ymd(Date.now()); }
  function toast(m, t) { if (window.UI) UI.toast(m, t); }

  /* ======================= 一、六个状态机 ======================= */

  /* 1. 房源状态：0待核验 1已核验 2已预约 3已成交 4已下架 5核验过期 */
  var HOUSE_ST = {
    '0': { n: '待核验', c: 'orange', pub: 0 }, '1': { n: '已核验', c: 'green', pub: 1 },
    '2': { n: '已预约', c: 'blue', pub: 1 }, '3': { n: '已成交', c: 'gray', pub: 0 },
    '4': { n: '已下架', c: 'gray', pub: 0 }, '5': { n: '核验过期', c: 'red', pub: 0 }
  };
  var HOUSE_FLOW = { '0': ['1', '4'], '1': ['2', '3', '4', '5'], '2': ['1', '3', '4'], '3': [], '4': ['0'], '5': ['1', '4'] };

  /* 2. 办件状态：1已提交 2已受理 3待补正 4已办结 5已退件 */
  var CASE_ST = {
    '1': { n: '已提交', c: 'blue' }, '2': { n: '已受理', c: 'cyan' }, '3': { n: '待补正', c: 'orange' },
    '4': { n: '已办结', c: 'green' }, '5': { n: '已退件', c: 'red' }
  };
  var CASE_FLOW = { '1': ['2', '5'], '2': ['3', '4', '5'], '3': ['2', '5'], '4': [], '5': [] };

  /* 3. 出证状态：1有效 2已过期 */
  /* 4. 授权状态：0待授权 1已授权 2已拒绝 3已撤回 4已过期 */
  var AUTH_ST = {
    '0': { n: '待授权', c: 'orange' }, '1': { n: '已授权', c: 'green' },
    '2': { n: '已拒绝', c: 'gray' }, '3': { n: '已撤回', c: 'red' }, '4': { n: '已过期', c: 'gray' }
  };
  /* 5. 投诉状态：1已提交 2处置中 3已反馈 4已超期 */
  var CP_ST = { '1': { n: '已受理', c: 'blue' }, '2': { n: '处置中', c: 'orange' }, '3': { n: '已反馈', c: 'green' }, '4': { n: '已超期', c: 'red' } };
  /* 6. 企业状态：0待审核 1已入网 2异常 3已注销 */
  var AG_ST = { '0': { n: '待审核', c: 'orange' }, '1': { n: '已入网', c: 'green' }, '2': { n: '异常', c: 'red' }, '3': { n: '已注销', c: 'gray' } };

  function can(flow, from, to) { return (flow[String(from)] || []).indexOf(String(to)) >= 0; }

  /* ======================= 二、数据读取 ======================= */
  var P = {};
  window.PORTAL = P;

  P.db = function () { return db; };
  P.site = function () { return db.site; };
  P.on = function (fn) { if (typeof fn === 'function') { subs.push(fn); } };
  P.reset = function () { db = D.reset(); };
  P.ready = function () { };

  P.HOUSE_ST = HOUSE_ST; P.CASE_ST = CASE_ST; P.AUTH_ST = AUTH_ST; P.CP_ST = CP_ST; P.AG_ST = AG_ST;

  /* 房源查询：只返回可对外展示的（wsmh-08-02 / 18.1.2 硬规则） */
  P.houses = function (f) {
    f = f || {};
    return db.houses.filter(function (h) {
      if (f.all !== 1 && !HOUSE_ST[h.fyzt].pub) return false;
      if (f.lx && h.lx !== f.lx) return false;
      if (f.qx && h.qx !== f.qx) return false;
      if (f.xq && h.xqmc !== f.xq) return false;
      if (f.owner && h.owner !== 1) return false;
      if (f.bzx && h.bzx !== 1) return false;
      if (f.kw) {
        var s = (h.bt + h.xqmc + h.qx + h.sq + h.dz + (h.wtjg || '')).toLowerCase();
        if (s.indexOf(String(f.kw).toLowerCase()) < 0) return false;
      }
      if (f.mjMin && h.mj < f.mjMin) return false;
      if (f.mjMax && h.mj > f.mjMax) return false;
      if (f.zjMin && (h.lx === '3' ? h.zj : h.zj) < f.zjMin) return false;
      if (f.zjMax && (h.lx === '3' ? h.zj : h.zj) > f.zjMax) return false;
      if (f.hx && h.hx.indexOf(f.hx) < 0) return false;
      if (f.cx && h.cx !== f.cx) return false;
      if (f.zx && h.zx !== f.zx) return false;
      if (f.ly && h.ly !== f.ly) return false;
      if (f.zjlx && h.zjlx !== f.zjlx) return false;
      return true;
    });
  };
  P.house = function (id) { return db.houses.filter(function (h) { return h.id === id; })[0]; };
  P.project = function (id) { return db.projects.filter(function (p) { return p.id === id; })[0]; };
  P.projects = function (f) {
    f = f || {};
    return db.projects.filter(function (p) {
      if (f.good && !p.good) return false;
      if (f.qx && p.qx !== f.qx) return false;
      if (f.risk && !p.risk) return false;
      if (f.kw && (p.xmmc + p.kfqy + p.qx).indexOf(f.kw) < 0) return false;
      return true;
    });
  };
  P.item = function (code) { return db.items.filter(function (i) { return i.code === code; })[0]; };
  P.items = function (f) {
    f = f || {};
    return db.items.filter(function (i) {
      if (f.theme && i.theme !== f.theme) return false;
      if (f.scene && i.scene !== f.scene) return false;
      if (f.hot && !i.hot) return false;
      if (f.kw && i.name.indexOf(f.kw) < 0) return false;
      return true;
    });
  };
  P.cases = function (f) {
    f = f || {};
    return db.cases.filter(function (c) {
      if (f.zt && c.zt !== f.zt) return false;
      if (f.sxdm && c.sxdm !== f.sxdm) return false;
      if (f.pkg && c.pkg !== f.pkg) return false;
      if (f.kw && (c.bh + c.sxmc + c.fw).indexOf(f.kw) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.sqrq < b.sqrq ? 1 : -1; });
  };
  P.caseOf = function (idOrBh) {
    return db.cases.filter(function (c) { return c.id === idOrBh || c.bh === idOrBh; })[0];
  };
  P.agencies = function (f) {
    f = f || {};
    return db.agencies.filter(function (a) {
      if (f.pub && a.rwzt === '0') return false;            /* 未审核不公示 wsmh-25-01 */
      if (f.lx && a.lx !== f.lx) return false;
      if (f.zt && a.rwzt !== f.zt) return false;
      if (f.hb && !a.hb) return false;
      if (f.heb && !a.heb) return false;
      if (f.kw && (a.mc + a.lx + a.qx).indexOf(f.kw) < 0) return false;
      return true;
    });
  };
  P.agency = function (id) { return db.agencies.filter(function (a) { return a.id === id; })[0]; };
  P.staffs = function (f) {
    f = f || {};
    return db.staffs.filter(function (s) {
      if (f.jg && s.jg !== f.jg) return false;
      if (f.zt && s.zt !== f.zt) return false;
      if (f.kw && (s.xm + s.jg + s.gw).indexOf(f.kw) < 0) return false;
      return true;
    });
  };
  P.articles = function (f) {
    f = f || {};
    var arr = db.articles.filter(function (a) {
      if (a.zt !== '1') return false;
      if (f.lm && a.lm !== f.lm) return false;
      if (f.expired !== 1 && a.yxq && a.yxq < today()) return false;   /* wsmh-05-13 到期归档 */
      if (f.expired === 1 && !(a.yxq && a.yxq < today())) return false;
      if (f.kw && (a.bt + a.zy + a.ly).indexOf(f.kw) < 0) return false;
      return true;
    });
    return arr.sort(function (a, b) { return a.fbsj < b.fbsj ? 1 : -1; });
  };
  P.article = function (id) { return db.articles.filter(function (a) { return a.id === id; })[0]; };

  /* 五类待办提醒（wsmh-02-06） */
  P.todoCounts = function () {
    var c = { todo: 0, pay: 0, fix: 0, sign: 0, rate: 0 };
    db.cases.forEach(function (x) {
      if (x.zt === '1' || x.zt === '2') c.todo++;
      if (x.zt === '3') c.fix++;
      if (x.zt === '4' && x.pj === 0) c.rate++;
    });
    db.payments.forEach(function (p) { if (p.zt === '待缴存') c.pay++; });
    db.contracts.forEach(function (h) { h.nodes.forEach(function (n) { if (n.s === 2 && n.n.indexOf('网签') >= 0) c.sign++; }); });
    db.drafts.forEach(function (d) { if (d.step >= 2) c.sign++; });
    return c;
  };

  /* 徽章 */
  P.badge = function (text, color) { return '<span class="badge ' + (color || 'blue') + '">' + text + '</span>'; };
  P.houseBadge = function (h) { var s = HOUSE_ST[h.fyzt]; return P.badge(s.n, s.c); };
  P.caseBadge = function (c) { var s = CASE_ST[c.zt]; return P.badge(s.n, s.c); };
  P.agBadge = function (a) { var s = AG_ST[a.rwzt]; return P.badge(s.n, s.c); };

  /* 脱敏（wsmh-35-06） */
  P.mask = function (kind, val) {
    var m = db.site.mask;
    if (kind === 'name' && m.qlrxm) return String(val).charAt(0) + '*' + (String(val).length > 2 ? String(val).slice(-1) : '');
    if (kind === 'id' && m.zjhm) return String(val).slice(0, 10) + '****';
    if (kind === 'tel' && m.lxfs) return String(val).slice(0, 3) + '****' + String(val).slice(-4);
    if (kind === 'fh' && m.fh) return String(val).replace(/\d{3,}/, function (s) { return '**' + s.slice(-2); });
    return val;
  };

  /* 未登录浏览范围（wsmh-34-06） */
  P.guestAllow = function (k) { return db.site.guestScope[k] === 1; };

  /* ======================= 三、闭环动作 ======================= */
  var A = {};

  /* ---------- 链条 1：房源全生命周期 ---------- */
  A['house.publish'] = function (o) {
    var id = nid('FY');
    var h = {
      id: id, lx: o.lx || '2', lxmc: o.lx === '3' ? '租房' : '二手房',
      bt: o.xq + ' ' + o.hx + ' ' + o.zx, xqmc: o.xq, qx: o.qx, sq: o.sq || '',
      dz: o.qx + o.xq, fh: o.fh || '—', fhMask: P.mask('fh', o.fh || '**室'),
      mj: Number(o.mj), hx: o.hx, cx: o.cx, zx: o.zx, lc: o.lc || '—', jcnd: o.jcnd || 2010,
      dj: o.lx === '3' ? 0 : Math.round(o.zj * 10000 / o.mj), zj: Number(o.zj),
      hym: '', hyyxq: '', fyzt: '0', ztmc: HOUSE_ST['0'].n,
      ly: '1', lymc: '个人自主房源', wtjg: '', wtjjr: '',
      gpsj: today(), gxsj: now(), tjjl: [], owner: 1,
      sjly: '门户个人自主挂牌', kfsAgree: o.kfsAgree,
      img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=70'
    };
    db.houses.unshift(h);
    commit();
    return h;
  };
  /* 权属核验通过 → 生成核验码 → 立即对外可见 */
  A['house.verify'] = function (o) {
    var h = P.house(o.id); if (!h) return null;
    if (!can(HOUSE_FLOW, h.fyzt, '1')) { toast('当前房源状态不允许核验', 'warning'); return null; }
    h.fyzt = '1'; h.ztmc = HOUSE_ST['1'].n;
    h.hym = 'LZ' + (h.lx === '3' ? '3' : '2') + 'H' + (2026000000 + Number(String(h.id).replace(/\D/g, '')) * 7);
    h.hyyxq = D.ymd(D.shift(90)); h.gxsj = now();
    commit(); return h;
  };
  A['house.renew'] = function (o) {
    var h = P.house(o.id); if (!h) return null;
    h.hyyxq = D.ymd(D.shift(90));
    if (h.fyzt === '5') { h.fyzt = '1'; h.ztmc = HOUSE_ST['1'].n; }
    h.gxsj = now(); commit(); return h;
  };
  A['house.offline'] = function (o) {
    var h = P.house(o.id); if (!h) return null;
    h.fyzt = '4'; h.ztmc = HOUSE_ST['4'].n; h.gxsj = now();
    commit(); return h;
  };
  A['house.deal'] = function (o) {
    var h = P.house(o.id); if (!h) return null;
    h.fyzt = '3'; h.ztmc = HOUSE_ST['3'].n; h.gxsj = now();
    db.market.month.cj++; db.market.today.cj++;
    commit(); return h;
  };
  /* 举报核实 → 房源下架 + 记入机构信用（wsmh-14-05） */
  A['house.report'] = function (o) {
    var h = P.house(o.hid);
    var r = {
      id: nid('JB'), hid: o.hid, hname: h ? h.bt : '', lx: o.lx, desc: o.desc,
      tel: o.tel || '', d: now(), zt: '1', ztmc: '已受理', jg: h ? h.wtjg : ''
    };
    db.reports.unshift(r); commit(); return r;
  };
  A['house.reportVerify'] = function (o) {
    var r = db.reports.filter(function (x) { return x.id === o.id; })[0]; if (!r) return null;
    r.zt = '2'; r.ztmc = '核实成立'; r.hsd = now();
    var h = P.house(r.hid);
    if (h) { h.fyzt = '4'; h.ztmc = HOUSE_ST['4'].n; h.gxsj = now(); }
    if (r.jg) {
      var ag = db.agencies.filter(function (a) { return a.mc === r.jg; })[0];
      if (ag) {
        ag.score = Math.max(40, ag.score - 6);
        ag.dj = ag.score >= 90 ? 'A' : ag.score >= 80 ? 'B' : ag.score >= 70 ? 'C' : 'D';
        ag.hb = ag.score >= 90 ? 1 : 0; ag.heb = ag.score < 66 ? 1 : 0;
        ag.lyqk = '存在虚假房源违规记录（' + today() + '）';
        if (ag.score < 60) { ag.rwzt = '2'; ag.rwztmc = AG_ST['2'].n; }
      }
    }
    commit(); return r;
  };
  A['house.entrust'] = function (o) {
    var h = P.house(o.id); if (!h) return null;
    h.ly = '2'; h.lymc = '居间代理房源'; h.wtjg = o.jg; h.wtjjr = o.jjr || '韦*明';
    h.jjrzsh = '桂经纪证第' + (450200000 + 37) + '号'; h.yjbl = o.yj; h.wtsj = today(); h.gxsj = now();
    commit(); return h;
  };
  A['house.unentrust'] = function (o) {
    var h = P.house(o.id); if (!h) return null;
    h.ly = '1'; h.lymc = '个人自主房源'; h.wtjgOld = h.wtjg; h.wtjg = ''; h.wtjjr = '';
    h.jcsj = today(); h.gxsj = now(); commit(); return h;
  };
  A['house.fav'] = function (o) {
    if (db.favs.filter(function (f) { return f.hid === o.hid; }).length) return 'exist';
    db.favs.unshift({ hid: o.hid, t: now() }); commit(); return 'ok';
  };
  A['house.unfav'] = function (o) {
    db.favs = db.favs.filter(function (f) { return f.hid !== o.hid; }); commit(); return 'ok';
  };
  A['house.appt'] = function (o) {
    var h = P.house(o.hid);
    var a = {
      id: nid('YY'), hid: o.hid, hname: h ? h.bt : '', jg: h ? (h.wtjg || '房源所属机构') : '',
      d: o.d, sd: o.sd, zt: '待确认', tel: o.tel, note: o.note || ''
    };
    db.appts.unshift(a);
    if (h && h.fyzt === '1') { h.fyzt = '2'; h.ztmc = HOUSE_ST['2'].n; }
    commit(); return a;
  };
  A['appt.confirm'] = function (o) {
    var a = db.appts.filter(function (x) { return x.id === o.id; })[0]; if (!a) return null;
    a.zt = '已确认'; a.qrsj = now(); commit(); return a;
  };
  A['appt.cancel'] = function (o) {
    var a = db.appts.filter(function (x) { return x.id === o.id; })[0]; if (!a) return null;
    a.zt = '已取消';
    var h = P.house(a.hid); if (h && h.fyzt === '2') { h.fyzt = '1'; h.ztmc = HOUSE_ST['1'].n; }
    commit(); return a;
  };
  A['appt.change'] = function (o) {
    var a = db.appts.filter(function (x) { return x.id === o.id; })[0]; if (!a) return null;
    a.d = o.d; a.sd = o.sd; a.zt = '待确认'; commit(); return a;
  };
  A['demand.add'] = function (o) {
    var d = {
      id: nid('QG'), lx: o.lx, qx: o.qx, mj: o.mj, ys: o.ys, hx: o.hx,
      lxr: o.lxr, tel: o.tel, d: today(), zt: '展示中', note: o.note || ''
    };
    db.demands.unshift(d); commit(); return d;
  };

  /* ---------- 链条 2：申报办件 ---------- */
  A['case.submit'] = function (o) {
    var it = P.item(o.sxdm);
    db._seq++;
    var c = {
      id: 'BJ' + db._seq, bh: 'BJ2026' + D.pad(db._seq - 1000 + 1900),
      sxdm: o.sxdm, sxmc: o.sxmc || (it ? it.name : ''), fw: o.fw || '', dept: it ? it.dept : '综合受理科',
      zt: '1', ztmc: CASE_ST['1'].n, sqrq: now(), bjrq: '', xqts: 0, bzyq: '', tjly: '',
      steps: [
        { n: '在线提交', s: 1, d: now() }, { n: '收件受理', s: 0, d: '' },
        { n: '业务审核', s: 0, d: '' }, { n: '办结出件', s: 0, d: '' }
      ],
      files: o.files || [], pj: -1, source: o.source || '门户网站', pkg: o.pkg || '', data: o.data || {}
    };
    db.cases.unshift(c);
    db.msgs.unshift({
      id: nid('XX'), lx: '办件通知', bt: '您的「' + c.sxmc + '」已提交成功',
      c: '办件编号 ' + c.bh + '，承办科室' + c.dept + '，承诺办结时限 ' + (it ? it.nsrq : 3) + ' 个工作日。',
      d: now(), r: 0
    });
    if (o.draftId) db.drafts = db.drafts.filter(function (d) { return d.id !== o.draftId; });
    /* 一网通办推送（wsmh-36-03） */
    db.onenet.pushLogs.unshift({ bh: c.bh, jd: '受理', d: now(), zt: '成功', hz: 'ACK-' + Date.now().toString().slice(-8) });
    commit(); return c;
  };
  /* 状态推进（演示用：模拟政府侧办理） */
  A['case.next'] = function (o) {
    var c = P.caseOf(o.id); if (!c) return null;
    var to = o.to;
    if (!can(CASE_FLOW, c.zt, to)) { toast('办件当前为「' + c.ztmc + '」，不允许流转到「' + (CASE_ST[to] || {}).n + '」', 'warning'); return null; }
    c.zt = to; c.ztmc = CASE_ST[to].n;
    if (to === '2') { c.steps[1].s = 1; c.steps[1].d = now(); c.steps[2].s = 2; c.xqts = 0; c.bzyq = ''; }
    if (to === '3') { c.steps[2].s = 3; c.xqts = 5; c.bzyq = o.bzyq || '材料不齐全，缺少契税完税凭证，请补充上传后重新提交。'; }
    if (to === '4') {
      c.steps[2].s = 1; c.steps[2].d = now(); c.steps[3].s = 1; c.steps[3].d = now();
      c.bjrq = now(); c.pj = 0;
      A['cert.issue']({ lx: c.sxmc.replace('网签备案', '备案证明').replace(/申请|登记|缴存/, '证明'), fw: c.fw, yt: '办理后续手续', silent: 1 });
      db.onenet.pushLogs.unshift({ bh: c.bh, jd: '办结', d: now(), zt: '成功', hz: 'ACK-' + Date.now().toString().slice(-8) });
      if (c.sxdm === 'SX0105') {
        db.articles.unshift({
          id: nid('WZ'), lm: 'refund', bt: '关于' + (c.fw || '商品房') + '申请退房与备案注销情况的公示',
          ly: 'XXXX市房产交易管理中心', pic: 0, fbsj: today(), llcs: 0, zt: '1', yxq: D.ymd(D.shift(30)),
          zy: '经审核，' + c.fw + '退房与合同作废（备案撤销）申请已办结，现予公示。房号已按规定脱敏。',
          zw: '<p>经审核，' + c.fw + '的退房与合同作废（备案撤销）申请已于 ' + today() + ' 办结，现将有关情况予以公示，公示期 30 日。</p>'
        });
      }
      if (c.sxdm === 'SX0601') {
        db.articles.unshift({
          id: nid('WZ'), lm: 'survey', bt: '关于' + (c.fw || '项目') + '房产测绘成果备案情况的公示',
          ly: 'XXXX市房产交易管理中心', pic: 0, fbsj: today(), llcs: 0, zt: '1', yxq: D.ymd(D.shift(30)),
          zy: '测绘成果已完成备案，现予公示。', zw: '<p>测绘成果已完成备案，现予公示，公示期 30 日。</p>'
        });
      }
    }
    if (to === '5') { c.steps[2].s = 4; c.tjly = o.tjly || '房屋存在限制交易情形，不符合备案条件。'; }
    db.msgs.unshift({
      id: nid('XX'),
      lx: to === '3' ? '补正提醒' : (to === '4' ? '办结通知' : to === '5' ? '退件通知' : '办件通知'),
      bt: '「' + c.sxmc + '」' + c.ztmc,
      c: to === '3' ? c.bzyq : (to === '4' ? '办件已办结，备案证明可在「我的证照与票据」下载。' : to === '5' ? c.tjly : '办件已受理，进入业务审核环节。'),
      d: now(), r: 0
    });
    commit(); return c;
  };
  /* 在线补交材料 → 回到已受理（wsmh-30-01） */
  A['case.supplement'] = function (o) {
    var c = P.caseOf(o.id); if (!c) return null;
    if (c.zt !== '3') { toast('该办件当前不需要补正', 'warning'); return null; }
    (o.files || []).forEach(function (f) { c.files.push(f); });
    return A['case.next']({ id: o.id, to: '2' });
  };
  A['case.rate'] = function (o) {
    var c = P.caseOf(o.id); if (!c) return null;
    c.pj = 1;
    db.ratings.unshift({ id: nid('PJ'), dx: c.sxmc, lx: '事项', star: Number(o.star), c: o.text || '', d: today(), bh: c.bh, hc: 0 });
    commit(); return c;
  };

  /* ---------- 链条 3：草稿跨端续办 ---------- */
  A['draft.save'] = function (o) {
    var ex = db.drafts.filter(function (d) { return d.sxdm === o.sxdm && d.id === o.id; })[0];
    if (ex) { ex.step = o.step; ex.data = o.data; ex.files = o.files || ex.files; ex.cjsj = now(); }
    else {
      db.drafts.unshift({
        id: nid('CG'), sxdm: o.sxdm, sxmc: o.sxmc, step: o.step || 1,
        data: o.data || {}, files: o.files || [], cjsj: now(), yxq: D.ymd(D.shift(30)), from: 'PC 端门户'
      });
    }
    commit(); return db.drafts[0];
  };
  A['draft.del'] = function (o) {
    db.drafts = db.drafts.filter(function (d) { return d.id !== o.id; }); commit(); return 'ok';
  };
  P.draft = function (id) { return db.drafts.filter(function (d) { return d.id === id; })[0]; };

  /* ---------- 链条 4 / 5：查询、出证、授权 ---------- */
  A['query.log'] = function (o) {
    db.qlogs.unshift({
      id: nid('CX'), cxr: o.cxr || (window.UI ? UI.user().name : '韦志强'), dx: o.dx,
      lx: o.lx, yt: o.yt || '自用', d: now(), way: o.way || '门户网站'
    });
    commit(); return db.qlogs[0];
  };
  /* 查他人必须有已授权记录（18.1.3 硬规则） */
  A['query.checkAuth'] = function (o) {
    var hit = db.auths.filter(function (a) {
      return a.zt === '1' && a.qlr === o.qlr && a.qx >= today();
    })[0];
    return hit || null;
  };
  A['auth.request'] = function (o) {
    var a = {
      id: nid('SQ'), sqr: o.sqr, qlr: o.qlr, fw: o.fw, yt: o.yt,
      qx: o.qx || D.ymd(D.shift(30)), zt: '0', ztmc: AUTH_ST['0'].n, d: today(), pl: o.pl || 0
    };
    db.auths.unshift(a);
    db.msgs.unshift({
      id: nid('XX'), lx: '授权申请', bt: o.sqr + ' 申请查询您的房产信息',
      c: '查询范围：' + o.fw + '，用途：' + o.yt + '。请在个人中心「查询授权」中处理。', d: now(), r: 0
    });
    commit(); return a;
  };
  A['auth.set'] = function (o) {
    var a = db.auths.filter(function (x) { return x.id === o.id; })[0]; if (!a) return null;
    a.zt = o.zt; a.ztmc = AUTH_ST[o.zt].n; a.czsj = now();
    commit(); return a;
  };
  A['cert.issue'] = function (o) {
    var yzm = '';
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (var i = 0; i < 6; i++) yzm += chars.charAt(Math.floor(Math.random() * chars.length));
    db._seq++;
    var c = {
      id: 'ZM' + db._seq, bh: 'LZZM2026' + D.pad(db._seq - 1000 + 3200),
      lx: o.lx, fw: o.fw, yzm: yzm, d: now(), yxq: D.ymd(D.shift(90)),
      yt: o.yt || '自用', zt: '1', ztmc: '有效',
      nr: o.nr || ('兹证明' + (o.fw || '') + '相关业务已按规定办理完毕，本证明由XXXX市房产交易管理中心出具，可扫码或凭验真码核验真伪。')
    };
    db.certs.unshift(c);
    if (!o.silent) {
      db.msgs.unshift({ id: nid('XX'), lx: '出证通知', bt: '您的「' + o.lx + '」已出具', c: '证明编号 ' + c.bh + '，验真码 ' + yzm + '，有效期至 ' + c.yxq + '。', d: now(), r: 0 });
    }
    commit(); return c;
  };
  A['cert.verify'] = function (o) {
    var code = String(o.code || '').toUpperCase().trim();
    var hit = db.certs.filter(function (c) { return c.yzm === code || c.bh === code; })[0];
    if (!hit) return { ok: 0, msg: '未查询到该证明，请核对验真码或二维码是否正确。若确认无误，该证明可能为伪造件，请向 0772-2822168 举报。' };
    if (hit.yxq < today()) return { ok: 0, cert: hit, msg: '该证明已于 ' + hit.yxq + ' 过期，如需使用请重新出证。' };
    return { ok: 1, cert: hit };
  };
  P.certs = function () { return db.certs; };
  P.auths = function (f) {
    f = f || {};
    return db.auths.filter(function (a) {
      if (f.zt && a.zt !== f.zt) return false;
      if (f.pl !== undefined && (a.pl ? 1 : 0) !== f.pl) return false;
      return true;
    });
  };
  P.qlogs = function () { return db.qlogs; };

  /* ---------- 链条 6：咨询投诉与智能客服 ---------- */
  var KB_RULES = [
    { k: ['核验码', '验真', '真假'], a: '房源核验码是平台对房源权属与挂牌资格核验通过后生成的唯一编码。您可以在房源详情页看到核验码与有效期，也可以在「查询中心 → 扫码验真」输入核验码核验真伪。', go: ['web/query-verify.html', '去验真'] },
    { k: ['二手房', '存量房', '买卖'], a: '二手房交易可以全程网办：买卖双方在「业务办理 → 二手房自助办理」自助填报、在线签约、签订资金监管协议后提交，承诺 2 个工作日内办结备案。', go: ['web/second-hand-apply.html', '去申报'] },
    { k: ['租房', '租赁', '备案证明'], a: '住房租赁合同可在线签约并申请备案，办结后可获取租赁备案证明电子件，用于落户、入学、公积金提取等场景。', go: ['web/rent-sign.html', '去办理'] },
    { k: ['一房一价', '价格', '房价'], a: '新建商品房的一房一价在「房源超市 → 新房专区 → 楼盘详情 → 一房一价」按楼栋-单元-层-房号可视化展示，标注为备案（拟售）价格，实际成交以合同为准。本期不发布房价指数。', go: ['web/new-house.html', '去查看'] },
    { k: ['监管账户', '缴款', '交钱', '账号'], a: '购房款必须缴入项目的预售资金监管账户，账户信息在楼盘详情「购房关键信息公示」与「信息公示 → 监管账户公示」都可核对。请勿将购房款转入任何个人账户。', go: ['web/public-fund.html', '查监管账户'] },
    { k: ['进度', '办到哪', '查办件'], a: '可在「查询中心 → 网签备案进度查询」凭办件编号或身份信息查询，登录后在「个人中心 → 我的办件」可看到完整进度时间轴与补正要求。', go: ['web/query-center.html', '查进度'] },
    { k: ['好房子', '品质'], a: '好房子专区展示已认定项目的绿建星级、装配率、适老化等品质标签，并公示层高、得房率、公摊、隔声、节能等品质指标与五方责任主体。', go: ['web/good-house.html', '去看好房子'] },
    { k: ['房票'], a: '房票适用房源在「房源超市 → 房票房源专区」公示，同页可查询房票额度与核销情况，并查看使用规则、有效期与抵扣结算流程。', go: ['web/voucher-house.html', '去查看'] },
    { k: ['一件事', '联办'], a: '「高效办成一件事」把多个事项集成为一次申报，一次告知、一表申请、一套材料。目前上线新房购置、二手房交易、房屋租赁、带押过户四个主题。', go: ['web/one-thing.html', '去办理'] },
    { k: ['税', '契税', '试算'], a: '可使用「便民工具 → 交易税费试算」按房屋性质、面积、套次试算契税、增值税、个税等税费明细。试算结果仅供参考，实际以税务机关核定为准。', go: ['web/tool-tax.html', '去试算'] },
    { k: ['贷款', '月供', '公积金'], a: '「便民工具」提供房贷计算器与公积金可贷额度测算。抵押备案办理可在「业务办理 → 网上办事大厅」搜索"房屋抵押合同备案"。', go: ['web/tool-loan.html', '去计算'] },
    { k: ['网点', '窗口', '排队', '取号'], a: '「网点导航与排队」展示各交易网点、自助终端与资金监管合作银行的地址、电话、办理时间，并可查看当前叫号进度与在线取号。', go: ['web/outlets.html', '看网点'] },
    { k: ['投诉', '举报', '维权'], a: '可在「咨询投诉」提交投诉建议，系统按类别自动分派到责任科室或县区，处置进度与结果在线反馈，超期未办会自动提醒。', go: ['web/complaint.html', '去投诉'] }
  ];
  A['chat.ask'] = function (o) {
    var q = String(o.q || '');
    var hit = null;
    for (var i = 0; i < KB_RULES.length; i++) {
      for (var j = 0; j < KB_RULES[i].k.length; j++) {
        if (q.indexOf(KB_RULES[i].k[j]) >= 0) { hit = KB_RULES[i]; break; }
      }
      if (hit) break;
    }
    db.kb.total++;
    if (hit) db.kb.hit++;
    var rec = { q: q, a: hit ? hit.a : '', go: hit ? hit.go : null, d: now(), ok: hit ? 1 : 0 };
    db.chats.unshift(rec);
    if (!hit) {
      db.kb.gaps.unshift({ id: nid('ZS'), q: q, d: now(), zt: '待补充', cs: 1 });
    }
    commit();
    return rec;
  };
  A['chat.unsolved'] = function (o) {
    db.kb.gaps.unshift({ id: nid('ZS'), q: o.q, d: now(), zt: '待补充', cs: 1, from: '用户标记未解决' });
    commit(); return 'ok';
  };
  A['chat.gapFix'] = function (o) {
    var g = db.kb.gaps.filter(function (x) { return x.id === o.id; })[0]; if (!g) return null;
    g.zt = '已补充'; g.fixd = now(); commit(); return g;
  };
  A['chat.rate'] = function (o) {
    db.ratings.unshift({ id: nid('PJ'), dx: '智能客服会话', lx: '客服', star: Number(o.star), c: o.text || '', d: today(), bh: '' });
    if (Number(o.star) <= 2 && o.q) db.kb.gaps.unshift({ id: nid('ZS'), q: o.q, d: now(), zt: '待补充', cs: 1, from: '低满意度回流' });
    commit(); return 'ok';
  };
  A['complaint.add'] = function (o) {
    var DEPT = {
      '中介服务': '市场监管科', '房源信息': '市场监管科', '交易备案': '综合受理科',
      '资金监管': '资金监管科', '住房租赁': '租赁管理科', '维修资金': '维修资金科',
      '窗口服务': '综合受理科', '项目质量': '市场监管科', '其他': '综合受理科'
    };
    var dept = DEPT[o.lb] || '综合受理科';
    var qxDept = o.qx && o.qx !== '柳州市本级' ? o.qx + '住建部门' : dept;
    db._seq++;
    var c = {
      id: 'TS' + db._seq, bh: 'TS2026' + D.pad(db._seq - 1000 + 220),
      lb: o.lb, bt: o.bt, dx: o.dx || '', qx: o.qx || '柳州市本级', desc: o.desc,
      lxr: o.lxr || '', tel: o.tel || '', d: today(), zt: '1', ztmc: CP_ST['1'].n,
      dept: qxDept, xqts: 10,
      xz: [
        { n: '提交投诉', d: now(), r: '投诉人' },
        { n: '自动分派', d: now(), r: '系统', c: '按投诉类别「' + o.lb + '」分派至' + qxDept }
      ]
    };
    db.complaints.unshift(c);
    db.msgs.unshift({ id: nid('XX'), lx: '投诉受理', bt: '您的投诉已受理', c: '投诉编号 ' + c.bh + '，承办单位' + qxDept + '，承诺 10 个工作日内反馈。', d: now(), r: 0 });
    commit(); return c;
  };
  A['complaint.handle'] = function (o) {
    var c = db.complaints.filter(function (x) { return x.id === o.id || x.bh === o.id; })[0]; if (!c) return null;
    c.zt = o.zt; c.ztmc = CP_ST[o.zt].n;
    c.xz.push({ n: o.zt === '2' ? '受理登记' : '处置反馈', d: now(), r: c.dept, c: o.note || '' });
    if (o.zt === '3') {
      c.hf = o.note; c.hfd = now();
      db.msgs.unshift({ id: nid('XX'), lx: '投诉反馈', bt: '投诉 ' + c.bh + ' 已反馈处置结果', c: o.note || '已完成处置', d: now(), r: 0 });
    }
    commit(); return c;
  };
  A['complaint.urge'] = function (o) {
    var c = db.complaints.filter(function (x) { return x.id === o.id || x.bh === o.id; })[0]; if (!c) return null;
    c.cb = (c.cb || 0) + 1;
    c.xz.push({ n: '投诉人催办', d: now(), r: '投诉人', c: '第 ' + c.cb + ' 次催办，已推送承办单位' });
    commit(); return c;
  };
  P.complaints = function (f) {
    f = f || {};
    return db.complaints.filter(function (c) {
      if (f.bh && c.bh !== f.bh) return false;
      if (f.lb && c.lb !== f.lb) return false;
      if (f.zt && c.zt !== f.zt) return false;
      return true;
    });
  };
  A['feedback.add'] = function (o) {
    db._seq++;
    var f = { id: 'FK' + db._seq, bh: 'FK2026' + D.pad(db._seq - 1000), type: o.type, page: o.page, desc: o.desc, tel: o.tel || '', d: now(), zt: '待处理' };
    db.feedbacks.unshift(f);
    db.msgs.unshift({ id: nid('XX'), lx: '反馈受理', bt: '您的意见反馈已受理', c: '受理编号 ' + f.bh + '，我们将在 5 个工作日内处理。', d: now(), r: 0 });
    commit(); return f.bh;
  };

  /* ---------- 链条 7：入网与信用 ---------- */
  A['agency.apply'] = function (o) {
    db._seq++;
    var a = {
      id: 'QY' + db._seq, mc: o.mc, lx: o.lx, tyshxydm: o.code, fddbr: o.fr, qx: o.qx, dz: o.dz, tel: o.tel,
      zzdj: o.zz || '—', rwzt: '0', rwztmc: AG_ST['0'].n, rwrq: '', yxq: '',
      score: 80, dj: 'B', hb: 0, heb: 0, xmnum: 0, fynum: 0, pjnum: 0, pjscore: '—',
      cnsj: today(), cnlx: '诚信经营承诺书', lyqk: '新入网', mendian: [],
      sqsj: now(), shyj: []
    };
    db.agencies.unshift(a);
    commit(); return a;
  };
  A['agency.audit'] = function (o) {
    var a = P.agency(o.id); if (!a) return null;
    a.rwzt = o.pass ? '1' : '0'; a.rwztmc = AG_ST[a.rwzt].n;
    a.shyj = a.shyj || [];
    a.shyj.unshift({ d: now(), r: '市场监管科', jg: o.pass ? '通过' : '退回', yj: o.yj || (o.pass ? '材料齐全，符合入网条件' : '材料不齐全，请补充资质文件') });
    if (o.pass) { a.rwrq = today(); a.yxq = D.ymd(D.shift(730)); }
    commit(); return a;
  };
  A['agency.change'] = function (o) {
    var a = P.agency(o.id); if (!a) return null;
    a.bgjl = a.bgjl || [];
    a.bgjl.unshift({ d: now(), items: o.items, old: o.old, cur: o.cur });
    for (var k in o.cur) { a[k] = o.cur[k]; }
    commit(); return a;
  };
  A['agency.cancel'] = function (o) {
    var a = P.agency(o.id); if (!a) return null;
    var pending = db.cases.filter(function (c) { return c.zt !== '4' && c.zt !== '5'; }).length;
    if (pending > 0 && !o.force) return { blocked: 1, num: pending };
    a.rwzt = '3'; a.rwztmc = AG_ST['3'].n; a.zxsj = today();
    commit(); return a;
  };
  A['staff.register'] = function (o) {
    db._seq++;
    var s = {
      id: 'RY' + db._seq, xm: o.xm, zjhm: o.zjhm, jg: o.jg, jgzj: o.jgzj || '',
      gw: o.gw, zsbh: o.zsbh, djrq: today(), zt: '1', ztmc: '正常',
      tel: o.tel, yjnum: 0, pjscore: '—'
    };
    db.staffs.unshift(s); commit(); return s;
  };
  A['staff.change'] = function (o) {
    var s = db.staffs.filter(function (x) { return x.id === o.id; })[0]; if (!s) return null;
    for (var k in o.cur) { s[k] = o.cur[k]; }
    s.bgsj = now(); commit(); return s;
  };
  A['staff.cancel'] = function (o) {
    var s = db.staffs.filter(function (x) { return x.id === o.id; })[0]; if (!s) return null;
    s.zt = '3'; s.ztmc = '已注销'; s.zxsj = today(); commit(); return s;
  };
  A['rating.agency'] = function (o) {
    var a = P.agency(o.id) || db.agencies.filter(function (x) { return x.mc === o.mc; })[0];
    if (!a) return null;
    db.ratings.unshift({ id: nid('PJ'), dx: a.mc, lx: '机构', star: Number(o.star), c: o.text || '', d: today(), bh: o.bh || '' });
    a.pjnum++;
    var old = a.pjscore === '—' ? 4 : Number(a.pjscore);
    a.pjscore = (((old * (a.pjnum - 1)) + Number(o.star)) / a.pjnum).toFixed(1);
    a.score = Math.min(100, Math.max(40, Math.round(a.score + (Number(o.star) - 3))));
    a.dj = a.score >= 90 ? 'A' : a.score >= 80 ? 'B' : a.score >= 70 ? 'C' : 'D';
    a.hb = a.score >= 90 ? 1 : 0; a.heb = a.score < 66 ? 1 : 0;
    commit(); return a;
  };
  A['rating.appeal'] = function (o) {
    db.feedbacks.unshift({ id: nid('SS'), bh: 'SS2026' + D.pad(db._seq - 1000), type: '评价申诉', page: o.dx, desc: o.reason, d: now(), zt: '待核查' });
    commit(); return 'ok';
  };

  /* ---------- 链条 8：购房链 ---------- */
  A['room.select'] = function (o) {
    var pl = db.plates[o.xmzj]; if (!pl) return null;
    var cell = null;
    pl.units.forEach(function (u) {
      if (u.u !== Number(o.unit)) return;
      u.floors.forEach(function (f) {
        f.cells.forEach(function (c) { if (c.fh === o.fh) cell = c; });
      });
    });
    if (!cell) return null;
    if (cell.s !== 0) { toast('该房号当前为「' + ['未售', '已认购', '已签约', '限制交易', '已备案'][cell.s] + '」，不可选购', 'warning'); return null; }
    cell.s = 1;
    var p = P.project(o.xmzj);
    db.contracts.unshift({
      id: nid('HT'), bh: 'LZRG2026' + D.pad(db._seq - 1000), lx: '商品房认购书',
      xmmc: p ? p.xmmc : '', fw: pl.lc + ' ' + o.unit + '单元 ' + o.fh,
      mj: cell.mj, zj: Math.round(cell.mj * cell.dj), ba: '认购登记', bash: '', ver: 1,
      nodes: [
        { n: '认购登记', d: today(), s: 1 }, { n: '合同网签', d: '', s: 2 },
        { n: '合同备案', d: '', s: 0 }, { n: '购房款缴存', d: '', s: 0 },
        { n: '维修资金缴存', d: '', s: 0 }, { n: '产权过户', d: '', s: 0 }, { n: '房屋交付', d: '', s: 0 }
      ], vers: [{ v: 1, d: today(), note: '认购登记' }]
    });
    db.payments.unshift({
      id: nid('JK'), lx: '购房定金', xm: (p ? p.xmmc : '') + ' ' + o.fh, je: 20000,
      zt: '待缴存', yh: p ? p.jgyh : '', zh: p ? p.jgzj : '', d: '', note: '认购定金，缴入项目预售资金监管账户'
    });
    db.msgs.unshift({ id: nid('XX'), lx: '选房通知', bt: '认购登记成功', c: (p ? p.xmmc : '') + ' ' + o.fh + ' 已完成认购登记，请在 7 日内签订购房合同。', d: now(), r: 0 });
    commit(); return cell;
  };
  A['payment.pay'] = function (o) {
    var p = db.payments.filter(function (x) { return x.id === o.id; })[0]; if (!p) return null;
    p.zt = '已到账'; p.d = today(); p.pzh = 'PZ' + Date.now().toString().slice(-10);
    db.msgs.unshift({ id: nid('XX'), lx: '缴款到账', bt: p.lx + '已到账', c: '金额 ' + p.je.toLocaleString() + ' 元已缴入' + (p.yh || '监管账户') + '，凭证号 ' + p.pzh + '。', d: now(), r: 0 });
    var ct = db.contracts[0];
    if (ct) ct.nodes.forEach(function (n) { if (n.n.indexOf('缴存') >= 0 && n.s === 2) { n.s = 1; n.d = today(); } });
    commit(); return p;
  };
  A['delivery.rate'] = function (o) {
    db.ratings.unshift({ id: nid('PJ'), dx: o.xm + ' 入住满意度', lx: '项目', star: Number(o.star), c: o.text || '', d: today(), bh: '' });
    commit(); return 'ok';
  };
  P.contracts = function () { return db.contracts; };
  P.payments = function () { return db.payments; };
  P.loans = function () { return db.loans; };
  P.plate = function (id) { return db.plates[id]; };

  /* ---------- 链条 9：订阅与推送 ---------- */
  A['sub.add'] = function (o) {
    if (db.subs.filter(function (s) { return s.lm === o.lm && s.kw === (o.kw || ''); }).length) return 'exist';
    db.subs.unshift({ id: nid('DY'), lm: o.lm, lmmc: o.lmmc, kw: o.kw || '', d: today(), way: o.way || '站内消息+短信' });
    commit(); return 'ok';
  };
  A['sub.del'] = function (o) { db.subs = db.subs.filter(function (s) { return s.id !== o.id; }); commit(); return 'ok'; };
  P.subs = function () { return db.subs; };
  A['article.publish'] = function (o) {
    db._seq++;
    var a = {
      id: 'WZ' + db._seq, lm: o.lm, bt: o.bt, ly: o.ly || 'XXXX市房产交易管理中心', pic: 0,
      fbsj: today(), llcs: 0, zt: o.zt || '1', yxq: o.yxq || '',
      zy: o.zy || '', zw: o.zw || '<p>' + (o.zy || '') + '</p>', channels: o.channels || ['PC', 'H5', '小程序'],
      shzt: o.shzt || '已发布', shjl: [{ d: now(), r: '门户运营管理员', jg: '发布' }]
    };
    db.articles.unshift(a);
    /* 推送给订阅了该栏目的用户 */
    var hit = db.subs.filter(function (s) { return s.lm === o.lm; });
    if (hit.length) {
      db.msgs.unshift({
        id: nid('XX'), lx: '公示订阅', bt: '您订阅的「' + (hit[0].lmmc || o.lm) + '」有 1 条新增',
        c: o.bt, d: now(), r: 0
      });
    }
    commit(); return a;
  };
  A['article.audit'] = function (o) {
    var a = P.article(o.id); if (!a) return null;
    a.shzt = o.jg; a.shjl = a.shjl || [];
    a.shjl.unshift({ d: now(), r: '门户运营管理员', jg: o.jg, yj: o.yj || '' });
    if (o.jg === '通过' || o.jg === '发布') { a.zt = '1'; }
    if (o.jg === '下架' || o.jg === '退回') { a.zt = '0'; }
    commit(); return a;
  };
  A['msg.read'] = function (o) {
    if (o.all) db.msgs.forEach(function (m) { m.r = 1; });
    else { var m = db.msgs.filter(function (x) { return x.id === o.id; })[0]; if (m) m.r = 1; }
    commit(); return 'ok';
  };
  P.msgs = function () { return db.msgs; };
  P.unread = function () { return db.msgs.filter(function (m) { return !m.r; }).length; };

  /* ---------- 链条 10：后台配置反向生效 ---------- */
  A['site.save'] = function (o) { for (var k in o) db.site[k] = o[k]; commit(); return db.site; };
  A['site.guestScope'] = function (o) { db.site.guestScope[o.k] = o.v ? 1 : 0; commit(); return db.site.guestScope; };
  A['site.mask'] = function (o) { db.site.mask[o.k] = o.v ? 1 : 0; commit(); return db.site.mask; };
  A['site.channel'] = function (o) {
    var c = db.site.channels.filter(function (x) { return x.name === o.name; })[0];
    if (c) c.on = o.v ? 1 : 0; commit(); return db.site.channels;
  };
  A['site.subPlatform'] = function (o) {
    var s = db.site.subs.filter(function (x) { return x.n === o.n; })[0];
    if (s) s.on = o.v ? 1 : 0; commit(); return db.site.subs;
  };
  A['onenet.receive'] = function (o) {
    var p = db.onenet.pending.filter(function (x) { return x.bh === o.bh; })[0]; if (!p) return null;
    p.zt = '已接收';
    var it = db.items.filter(function (i) { return i.name === p.sx; })[0];
    var c = A['case.submit']({ sxdm: it ? it.code : 'SX0201', sxmc: p.sx, fw: '广西政务服务网转入', source: '广西政务服务网' });
    p.bjbh = c.bh;
    commit(); return c;
  };
  A['onenet.sync'] = function () {
    db.onenet.syncTime = now(); db.onenet.syncCount = db.items.length;
    db.onenet.stat.sxs = db.items.length; db.onenet.stat.sxjs = db.items.length;
    commit(); return db.onenet;
  };
  A['onenet.push'] = function (o) {
    var l = db.onenet.pushLogs.filter(function (x) { return x.bh === o.bh && x.zt === '失败'; })[0];
    if (l) { l.zt = '成功'; l.d = now(); l.hz = 'ACK-' + Date.now().toString().slice(-8); }
    commit(); return l;
  };
  A['onenet.rateBack'] = function () {
    var n = 0;
    db.ratings.forEach(function (r) { if (r.lx === '事项' && !r.hc) { r.hc = 1; r.hcd = now(); n++; } });
    commit(); return n;
  };
  P.onenet = function () { return db.onenet; };

  /* ---------- 其他 ---------- */
  A['prefs.quick'] = function (o) { db.prefs.quick = o.list; commit(); return db.prefs.quick; };
  A['prefs.recent'] = function (o) {
    db.prefs.recent = db.prefs.recent.filter(function (x) { return x.code !== o.code; });
    db.prefs.recent.unshift({ code: o.code, name: o.name, d: now() });
    db.prefs.recent = db.prefs.recent.slice(0, 8);
    commit(); return db.prefs.recent;
  };
  A['prefs.sub'] = function (o) { db.prefs.subTypes[o.k] = o.v ? 1 : 0; commit(); return db.prefs.subTypes; };
  P.prefs = function () { return db.prefs; };
  A['queue.take'] = function (o) {
    var w = db.outlets.filter(function (x) { return x.id === o.id; })[0]; if (!w) return null;
    w.dd++;
    var no = w.jh.charAt(0) + D.pad(Number(w.jh.slice(1)) + w.dd);
    db.msgs.unshift({ id: nid('XX'), lx: '取号成功', bt: '已为您取号 ' + no, c: w.n + '，当前叫号 ' + w.jh + '，前面还有 ' + w.dd + ' 人等待。', d: now(), r: 0 });
    commit(); return { no: no, wait: w.dd, w: w };
  };
  P.outlets = function (f) {
    f = f || {};
    return db.outlets.filter(function (o) { return !f.lx || o.lx === f.lx; });
  };
  P.faq = function (f) {
    f = f || {};
    return db.faq.filter(function (q) {
      if (f.lb && q.lb !== f.lb) return false;
      if (f.kw && (q.q + q.a).indexOf(f.kw) < 0) return false;
      return true;
    });
  };
  P.kb = function () { return db.kb; };
  P.market = function () { return db.market; };
  P.funds = function () { return db.funds; };
  P.packages = function () { return db.packages; };
  P.package = function (id) { return db.packages.filter(function (p) { return p.id === id; })[0]; };
  P.communities = function (f) {
    f = f || {};
    return db.communities.filter(function (c) {
      if (f.qx && c.qx !== f.qx) return false;
      if (f.kw && c.mc.indexOf(f.kw) < 0) return false;
      return true;
    });
  };
  P.favs = function () { return db.favs; };
  P.appts = function () { return db.appts; };
  P.demands = function (f) { f = f || {}; return db.demands.filter(function (d) { return !f.lx || d.lx === f.lx; }); };
  P.reports = function () { return db.reports; };
  P.ratings = function (f) {
    f = f || {};
    return db.ratings.filter(function (r) { return !f.lx || r.lx === f.lx; });
  };
  P.feedbacks = function () { return db.feedbacks; };
  P.vouchers = function () { return db.vouchers; };
  P.drafts = function () { return db.drafts; };
  P.staffAll = function () { return db.staffs; };

  /* 一件事集成申报：一次填报拆成多个子办件（wsmh-06-01） */
  A['package.apply'] = function (o) {
    var pkg = P.package(o.pkgId); if (!pkg) return null;
    var made = [];
    pkg.items.forEach(function (code, idx) {
      var it = P.item(code);
      var c = A['case.submit']({
        sxdm: code, sxmc: it ? it.name : code, fw: o.fw, pkg: pkg.id,
        files: o.files || [], source: '一件事专区'
      });
      if (pkg.mode === '串联' && idx > 0) { c.zt = '1'; c.ztmc = '待前序办结'; }
      made.push(c);
    });
    commit(); return made;
  };

  /* 全站搜索（wsmh-02-04） */
  P.search = function (kw, scope) {
    kw = String(kw || '').trim();
    var r = { project: [], community: [], item: [], article: [], notice: [], house: [] };
    if (!kw) return r;
    if (!scope || scope === 'all' || scope === 'project') r.project = P.projects({ kw: kw });
    if (!scope || scope === 'all' || scope === 'community') r.community = P.communities({ kw: kw });
    if (!scope || scope === 'all' || scope === 'item') r.item = P.items({ kw: kw });
    if (!scope || scope === 'all' || scope === 'article') r.article = P.articles({ kw: kw }).filter(function (a) { return a.lm === 'policy' || a.lm === 'open'; });
    if (!scope || scope === 'all' || scope === 'notice') r.notice = P.articles({ kw: kw }).filter(function (a) { return a.lm === 'notice' || a.lm === 'news'; });
    if (!scope || scope === 'all') r.house = P.houses({ kw: kw });
    return r;
  };
  /* 无结果时的相近事项推荐 */
  P.suggest = function (kw) {
    return db.items.filter(function (i) { return i.hot; }).slice(0, 5);
  };

  /* 分发器 */
  P.act = function (name, o) {
    if (!A[name]) { console.warn('未定义的闭环动作：' + name); return null; }
    return A[name](o || {});
  };
  P.acts = A;

  /* 到期自动处理：核验过期房源、超期投诉、过期授权（页面加载时跑一次） */
  (function autoExpire() {
    var t = today(), changed = 0;
    db.houses.forEach(function (h) {
      if (h.fyzt === '1' && h.hyyxq && h.hyyxq < t) { h.fyzt = '5'; h.ztmc = HOUSE_ST['5'].n; changed++; }
    });
    db.auths.forEach(function (a) {
      if (a.zt === '1' && a.qx < t) { a.zt = '4'; a.ztmc = AUTH_ST['4'].n; changed++; }
    });
    db.certs.forEach(function (c) {
      if (c.zt === '1' && c.yxq < t) { c.zt = '2'; c.ztmc = '已过期'; changed++; }
    });
    if (changed) D.persist(db);
  })();
})();
