/* ==========================================================================
   AI 应用服务平台 · 闭环引擎 (ai-flow.js)
   职责：把 39 个功能点做成真实可点击、状态可跨页联动的闭环。
         app.js 负责布局与交互外壳（Toast / 确认框 / 抽屉 / 字典 / 分页），
         ai-data.js 负责数据形态，本文件负责状态迁移、硬约束校验与统计口径。
   依赖：app.js → ai-data.js → ai-flow.js（顺序不可颠倒）

   四条 AI 硬约束（不可绕过，逐条在下面的 guardXxx 函数中实现）：
     一 AI 输出必须可溯源：输出必带模型 + 版本 + 置信度 + 知识溯源引用
     二 AI 只出建议不产生业务效力：未人工确认不得提交业务系统
     三 预警线索不直接成案：未确认线索不得推送预警督办中心
     四 智能问数受权限与口径双约束：越权提问拦截并记日志

   六个状态机：
     AI 输出人工确认 qrzt：0 待确认 → 1 已采纳 | 2 已修正 | 3 已驳回
     模型版本 mxzt：0 草稿 → 1 部署中 → 2 灰度中 → 3 已发布 → 4 已下线
     知识库文档 zskzt：0 草稿 → 1 待审核 → 2 已生效 → 3 已废止
     智能体上架 ztzt：0 草稿 → 1 已上架 → 2 已共享（→ 3 已停用）
     预警线索 xszt：0 待确认 → 1 已确认 | 2 已排除
     报告 bgzt：0 生成中 → 1 待人工 → 2 已定稿
   ========================================================================== */
(function () {
  'use strict';

  var D = window.AI_DATA;
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
  function fmtAgo(ts) {
    if (!ts) return '—';
    var s = Date.now() - ts;
    if (s < 0) return fmtTime(ts);
    if (s < HOUR) return Math.max(1, Math.round(s / 60000)) + ' 分钟前';
    if (s < DAY) return Math.round(s / HOUR) + ' 小时前';
    if (s < 30 * DAY) return Math.round(s / DAY) + ' 天前';
    return fmtDate(ts);
  }
  function num(n) {
    if (n == null || n === '') return '—';
    var p = String(n).split('.');
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
  function nid(prefix) { return D.nid(db, prefix); }
  function toast(msg, type) { if (window.PMS) PMS.toast(msg, type); }
  function role() { return param('role') || (window.PMS && PMS.role) || 'pt'; }
  function confirmBox(opts) { if (window.PMS) PMS.confirm(opts); else if (opts.onOk) opts.onOk(); }

  /* ==========================================================================
     二、状态仓读写
     ========================================================================== */
  function load() {
    db = D.load();
    /* 当前登录人跟随 ?role= 切换，保证「谁确认的」留痕正确 */
    var want = D.ROLE_USER[role()];
    if (want && db.me.id !== want) {
      var u = userById(want);
      if (u) { db.me = JSON.parse(JSON.stringify(u)); D.persist(db); }
    }
    return db;
  }
  function commit() { D.persist(db); emit(); }
  function get(coll) { return db[coll] || []; }
  function byId(coll, id) {
    var a = get(coll);
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function where(coll, fn) { return get(coll).filter(fn); }
  function userById(id) {
    for (var i = 0; i < D.USERS.length; i++) if (D.USERS[i].id === id) return D.USERS[i];
    return null;
  }
  function me() { return db.me; }

  /* ==========================================================================
     三、六个状态机：受控迁移，非法跃迁一律拦截并报错
     ========================================================================== */
  var FLOWS = {
    /* AI 输出人工确认 */
    qrzt: { '0': ['1', '2', '3'], '1': [], '2': [], '3': [] },
    /* 模型版本 */
    mxzt: { '0': ['1'], '1': ['2', '3'], '2': ['3', '4'], '3': ['2', '4'], '4': ['1'] },
    /* 知识库文档 */
    zskzt: { '0': ['1'], '1': ['0', '2'], '2': ['1', '3'], '3': [] },
    /* 智能体上架 */
    ztzt: { '0': ['1'], '1': ['2', '3'], '2': ['1', '3'], '3': ['1'] },
    /* 预警线索 */
    xszt: { '0': ['1', '2'], '1': [], '2': [] },
    /* 报告定稿 */
    bgzt: { '0': ['1'], '1': ['2'], '2': [] }
  };
  var FLOW_NAME = {
    qrzt: 'AI 输出', mxzt: '模型', zskzt: '知识库文档',
    ztzt: '智能体', xszt: '预警线索', bgzt: '报告'
  };

  function can(kind, from, to) {
    return ((FLOWS[kind] || {})[String(from)] || []).indexOf(String(to)) >= 0;
  }
  /* 受控迁移：obj[field] 从当前值迁到 to，非法则 Toast 拦截并返回 false */
  function move(kind, obj, field, to) {
    if (!obj) return false;
    var from = String(obj[field]);
    if (from === String(to)) return true;
    if (!can(kind, from, to)) {
      toast(FLOW_NAME[kind] + '当前为「' + dict(kind, from) + '」，不能变更为「' + dict(kind, to) + '」', 'error');
      return false;
    }
    obj[field] = String(to);
    return true;
  }

  /* ==========================================================================
     四、四条 AI 硬约束
     ========================================================================== */

  /* 约束一：AI 输出必须可溯源。写入留痕时强制带模型、版本、置信度；
     需要知识支撑的场景（问答/导办/报告/问数）还必须有有效引用。 */
  var NEED_CITE_SCENES = ['01', '02', '13', '14'];
  function guardTraceable(o) {
    if (!o.modelId || !o.ver || o.conf == null) {
      toast('AI 输出缺少模型、版本或置信度，按输出治理要求不予落库', 'error');
      return false;
    }
    return true;
  }

  /* 约束一配套：幻觉防控。置信度低于阈值、或该场景要求溯源却无有效引用，
     输出被拦截并替换为转人工，同时累计拦截次数。 */
  function guardHallucination(o) {
    var g = db.guard;
    var validCites = (o.cites || []).filter(function (id) {
      var doc = byId('kbDocs', id);
      return doc && doc.zskzt === '2';   /* 只有已生效文档算有效引用 */
    });
    o.cites = validCites;
    var needCite = g.needCite && NEED_CITE_SCENES.indexOf(o.scene) >= 0;
    if (o.conf < g.confMin) {
      o.blocked = 1;
      o.text = '模型置信度 ' + o.conf + '% 低于阈值 ' + g.confMin + '%，已拦截并转人工处理。';
      g.blocked++;
      return false;
    }
    if (needCite && g.blockNoCite && !validCites.length) {
      o.blocked = 1;
      o.text = '未检索到已生效的知识库依据，按幻觉防控要求拦截并转人工，不予作答。';
      g.blocked++;
      return false;
    }
    return true;
  }

  /* 约束二：AI 只出建议不产生业务效力。任何「提交业务系统」前必须先过这里。 */
  function guardConfirmed(items, label) {
    var pending = (items || []).filter(function (x) { return String(x.qrzt) === '0'; });
    if (pending.length) {
      toast('还有 ' + pending.length + ' 项' + (label || 'AI 结论') + '未人工确认，AI 建议须人工确认后才产生业务效力', 'error');
      return false;
    }
    return true;
  }

  /* 约束三：预警线索不直接成案。推送督办前必须已确认。 */
  function guardClueConfirmed(c) {
    if (!c) return false;
    if (String(c.xszt) !== '1') {
      toast('线索「' + c.subject + '」尚未人工确认，未确认线索不得推送预警督办中心', 'error');
      return false;
    }
    return true;
  }

  /* 约束四：智能问数受权限与口径双约束。
     县区账号只能看本级；问题里出现越权范围直接拦截并记日志。 */
  function guardAskScope(q) {
    var u = me();
    var cityWide = /全市|各县区|全区|所有县区|市域/.test(q);
    if (cityWide && u.said !== '100100') {
      return { ok: false, reason: '当前账号数据权限为「' + dict('said', u.said) + '」，无权查询全市范围数据' };
    }
    return { ok: true, scope: u.said === '100100' ? '全市（含 6 城区 5 县）' : dict('said', u.said) };
  }

  /* 合规过滤：输入输出过敏感规则，命中即写日志。返回处置后的文本或 null（拦截） */
  function guardCompliance(text, scene) {
    var hit = null;
    var out = String(text == null ? '' : text);
    get('rules').forEach(function (r) {
      if (!r.enabled || hit) return;
      var re;
      try { re = new RegExp(r.pattern, 'g'); } catch (e) { return; }
      if (!re.test(out)) return;
      r.hits++;
      db.ruleHits.push({
        id: nid('MZ'), scene: scene || '01', text: out.slice(0, 60),
        ruleName: r.mc, gzdz: r.gzdz, czr: me().name, at: Date.now()
      });
      if (r.gzdz === '1') { hit = r; return; }                     /* 拦截 */
      if (r.gzdz === '2') { out = out.replace(new RegExp(r.pattern, 'g'), '****'); }  /* 脱敏 */
      /* gzdz === '3' 仅告警，不改写文本 */
    });
    if (hit) {
      toast('内容命中合规规则「' + hit.mc + '」，已按「' + dict('gzdz', hit.gzdz) + '」处置', 'error');
      return null;
    }
    return out;
  }

  /* ==========================================================================
     五、AI 输出留痕：所有智能场景的统一落库出口
     任何 AI 结论都必须经由这里写入，才能保证约束一与约束二成立。
     ========================================================================== */
  function writeOutput(o) {
    var m = byId('models', o.modelId);
    var rec = {
      id: nid('LZ'), scene: o.scene, bizId: o.bizId || '—',
      modelId: o.modelId, mxmc: m ? m.mc : '—', ver: m ? m.ver : '—',
      promptId: o.promptId || null, conf: o.conf, text: o.text,
      qrzt: '0', cites: o.cites || [], blocked: 0, fixText: null,
      hrBy: null, hrAt: null, czr: me().name, at: Date.now(), said: me().said
    };
    if (!guardTraceable(rec)) return null;
    var pass = guardHallucination(rec);
    db.outputs.unshift(rec);
    if (m) m.calls++;
    /* 被拦截的输出直接落为已驳回，不进待确认队列 */
    if (!pass) { rec.qrzt = '3'; rec.hrBy = '系统（幻觉防控）'; rec.hrAt = Date.now(); }
    return rec;
  }

  /* 人工确认：约束二的唯一入口，同时驱动模型指标与样本回流 */
  function confirmOutput(id, action, correction, silent) {
    var o = byId('outputs', id);
    if (!o) return false;
    if (!move('qrzt', o, 'qrzt', action)) return false;
    o.hrBy = me().name;
    o.hrAt = Date.now();
    if (action === '2') o.fixText = correction || null;

    var m = byId('models', o.modelId);
    if (m) {
      /* 采纳抬准确率、修正记调优样本、驳回抬误报率，幅度控制在合理区间 */
      if (action === '1') m.acc = Math.min(99.5, Math.round((m.acc + 0.1) * 10) / 10);
      if (action === '2') { m.samples++; m.acc = Math.max(50, Math.round((m.acc - 0.1) * 10) / 10); }
      if (action === '3') { m.fpr = Math.round((m.fpr + 0.2) * 10) / 10; m.samples++; }
    }
    /* 智能体采纳率与修正率 */
    var ag = get('agents').filter(function (a) { return a.scene === o.scene; })[0];
    if (ag && ag.calls) {
      if (action === '1') ag.adopt = Math.min(99.9, Math.round((ag.adopt + 0.2) * 10) / 10);
      if (action === '2') ag.correct = Math.round((ag.correct + 0.3) * 10) / 10;
      if (action === '3') ag.adopt = Math.max(0, Math.round((ag.adopt - 0.3) * 10) / 10);
    }
    db.feedbacks.push({
      id: nid('HL'), outputId: o.id, scene: o.scene, modelId: o.modelId,
      action: action, correction: correction || null, pushed: 0,
      czr: me().name, at: Date.now()
    });
    if (!silent) {
      commit();
      toast('已' + dict('qrzt', action) + '，该结论已产生业务效力并回流为训练样本', 'success');
    }
    return true;
  }

  /* ==========================================================================
     六、统计口径
     ========================================================================== */
  function stat(key) {
    switch (key) {
      case 'pendingOutputs':  return where('outputs', function (o) { return o.qrzt === '0'; }).length;
      case 'outputs':         return get('outputs').length;
      case 'unread':          return where('msgs', function (m) { return !m.read; }).length;
      case 'models':          return where('models', function (m) { return m.mxzt === '3' || m.mxzt === '2'; }).length;
      case 'modelsAll':       return get('models').length;
      case 'kbDocs':          return where('kbDocs', function (d) { return d.zskzt === '2'; }).length;
      case 'kbPending':       return where('kbAudits', function (a) { return a.zt === '1'; }).length;
      case 'agents':          return where('agents', function (a) { return a.ztzt === '1' || a.ztzt === '2'; }).length;
      case 'calls':           return get('models').reduce(function (s, m) { return s + m.calls; }, 0);
      case 'cluePending':     return where('clues', function (c) { return c.xszt === '0'; }).length;
      case 'cluePushed':      return where('clues', function (c) { return c.xszt === '1'; }).length;
      case 'samples':         return get('models').reduce(function (s, m) { return s + m.samples; }, 0);
      case 'blocked':         return db.guard.blocked;
      case 'ruleHits':        return get('ruleHits').length;
      case 'issuesPending':   return get('reviewTasks').reduce(function (s, t) {
                                return s + t.issues.filter(function (i) { return i.qrzt === '0'; }).length;
                              }, 0);
      case 'adoptRate': {
        var done = where('outputs', function (o) { return o.qrzt !== '0'; });
        if (!done.length) return 0;
        var ad = done.filter(function (o) { return o.qrzt === '1'; }).length;
        return Math.round(ad / done.length * 1000) / 10;
      }
      case 'correctRate': {
        var d2 = where('outputs', function (o) { return o.qrzt !== '0'; });
        if (!d2.length) return 0;
        var fx = d2.filter(function (o) { return o.qrzt === '2'; }).length;
        return Math.round(fx / d2.length * 1000) / 10;
      }
      case 'quotaUsed': {
        var t = get('computes').reduce(function (s, c) { return s + c.quota; }, 0);
        var u = get('computes').reduce(function (s, c) { return s + c.used; }, 0);
        return t ? Math.round(u / t * 1000) / 10 : 0;
      }
      default: return 0;
    }
  }

  /* 场景 → 页面地址：留痕台账下钻用 */
  var SCENE_PAGE = {
    '01': '../public/chat.html', '02': '../public/guide-bot.html',
    '03': '../handler/assist-fill.html', '04': '../handler/fill-validate.html',
    '05': '../public/voice-fill.html', '06': '../public/kiosk-avatar.html',
    '07': '../handler/contract-review.html', '08': '../handler/license-ocr.html',
    '09': '../handler/cross-check.html', '10': '../handler/listing-verify.html',
    '11': '../handler/quality-verify.html', '12': '../handler/archive-catalog.html',
    '13': '../analyst/ask-data.html', '14': '../analyst/report-gen.html',
    '15': '../analyst/sentiment.html', '16': '../analyst/risk-judge.html',
    '17': '../analyst/dq-attribution.html'
  };

  /* ==========================================================================
     七、渲染 helper
     app.js 已被改为不填充克隆行，所有列表统一由 AI.table 按真实数据渲染。
     ========================================================================== */
  var QR_COLOR = { '0': 'orange', '1': 'green', '2': 'blue', '3': 'red' };
  var MX_COLOR = { '0': 'gray', '1': 'orange', '2': 'cyan', '3': 'green', '4': 'gray' };
  var ZSK_COLOR = { '0': 'gray', '1': 'orange', '2': 'green', '3': 'gray' };
  var ZT_COLOR = { '0': 'gray', '1': 'green', '2': 'ai', '3': 'gray' };
  var XS_COLOR = { '0': 'orange', '1': 'green', '2': 'gray' };
  var BG_COLOR = { '0': 'orange', '1': 'blue', '2': 'green' };
  var YQ_COLOR = { '1': 'gray', '2': 'cyan', '3': 'orange', '4': 'red' };

  function badge(text, color) { return '<span class="badge ' + (color || 'blue') + '">' + esc(text) + '</span>'; }
  function qrBadge(v) { return badge(dict('qrzt', v), QR_COLOR[String(v)] || 'gray'); }
  function mxBadge(v) { return badge(dict('mxzt', v), MX_COLOR[String(v)] || 'gray'); }
  function zskBadge(v) { return badge(dict('zskzt', v), ZSK_COLOR[String(v)] || 'gray'); }
  function ztBadge(v) { return badge(dict('ztzt', v), ZT_COLOR[String(v)] || 'gray'); }
  function xsBadge(v) { return badge(dict('xszt', v), XS_COLOR[String(v)] || 'gray'); }
  function bgBadge(v) { return badge(dict('bgzt', v), BG_COLOR[String(v)] || 'gray'); }
  function yqBadge(v) { return badge(dict('yqlv', v), YQ_COLOR[String(v)] || 'gray'); }
  function lv(level, text) { return '<span class="lv ' + level + '">' + esc(text) + '</span>'; }

  /* 「AI 生成 · 需人工确认」标记：约束二的视觉载体 */
  function aiMark(qrzt) {
    var v = String(qrzt == null ? '0' : qrzt);
    if (v === '0') return '<span class="ai-mark"><i class="fa-solid fa-robot"></i>AI 生成 · 需人工确认</span>';
    if (v === '1') return '<span class="ai-mark done"><i class="fa-solid fa-circle-check"></i>已采纳 · 已产生业务效力</span>';
    if (v === '2') return '<span class="ai-mark done"><i class="fa-solid fa-pen"></i>已修正 · 已产生业务效力</span>';
    return '<span class="ai-mark rejected"><i class="fa-solid fa-circle-xmark"></i>已驳回 · 不产生业务效力</span>';
  }

  /* 模型溯源条：约束一的视觉载体 */
  function aiSource(o) {
    var m = byId('models', o.modelId);
    return '<div class="ai-source">' +
      '<span class="as-model"><i class="fa-solid fa-microchip"></i>' + esc(o.mxmc || (m ? m.mc : '—')) + '</span>' +
      '<span class="as-sep"></span><span>版本 ' + esc(o.ver || (m ? m.ver : '—')) + '</span>' +
      '<span class="as-sep"></span>' + confidence(o.conf) +
      '<span class="as-sep"></span><span>溯源 ' + citeChips(o.cites) + '</span>' +
      '</div>';
  }
  function confidence(v) {
    var n = Number(v) || 0;
    var cls = n >= 90 ? '' : (n >= 70 ? ' mid' : ' low');
    return '<span class="confidence' + cls + '"><span class="cf-bar"><span style="width:' + n + '%"></span></span>' +
      '<span class="cf-val">' + n + '%</span></span>';
  }
  /* 知识溯源引用角标：点开看政策原文 */
  function citeChips(ids) {
    if (!ids || !ids.length) return '<span class="cite-none">无引用</span>';
    return ids.map(function (id, i) {
      var doc = byId('kbDocs', id);
      if (!doc) return '';
      return '<span class="cite-chip" title="' + esc(doc.title) + '" onclick="AI.openCite(\'' + id + '\')">' + (i + 1) + '</span>';
    }).join('');
  }
  /* 采纳 / 修正 / 驳回 三联动作 */
  function actTriplet(outputId) {
    return '<span class="act-triplet">' +
      '<button class="btn btn-adopt" onclick="AI.act.adopt(\'' + outputId + '\')"><i class="fa-solid fa-check"></i>采纳</button>' +
      '<button class="btn btn-fix" onclick="AI.act.fix(\'' + outputId + '\')"><i class="fa-solid fa-pen"></i>修正</button>' +
      '<button class="btn btn-reject" onclick="AI.act.reject(\'' + outputId + '\')"><i class="fa-solid fa-xmark"></i>驳回</button>' +
      '</span>';
  }
  function nodeTag(post) { return '<span class="node-tag"><i class="fa-solid fa-user-shield"></i>' + esc(post) + '</span>'; }
  function emptyRow(cols, text, icon) {
    return '<tr class="is-empty"><td colspan="' + cols + '">' +
      '<div class="empty"><i class="fa-regular ' + (icon || 'fa-folder-open') + '"></i>' +
      '<div>' + esc(text || '暂无数据') + '</div></div></td></tr>';
  }

  /* 打开引用抽屉：展示政策原文与条款定位 */
  function openCite(id) {
    var doc = byId('kbDocs', id);
    if (!doc) { toast('引用的知识库文档不存在', 'error'); return; }
    var box = document.getElementById('aiCiteDrawer');
    if (!box) {
      var mask = document.createElement('div');
      mask.className = 'drawer-mask';
      mask.setAttribute('data-close-drawer', '');
      var dr = document.createElement('div');
      dr.className = 'drawer';
      dr.id = 'aiCiteDrawer';
      dr.innerHTML =
        '<div class="drawer-head"><h3>知识溯源 · 政策原文</h3>' +
          '<span class="close" data-close-drawer><i class="fa-solid fa-xmark"></i></span></div>' +
        '<div class="drawer-body" id="aiCiteBody"></div>' +
        '<div class="drawer-foot"><button class="btn" data-close-drawer>关闭</button></div>';
      document.body.appendChild(mask);
      document.body.appendChild(dr);
      box = dr;
    }
    document.getElementById('aiCiteBody').innerHTML =
      '<div class="grp-card"><div class="grp-head"><span class="gi"><i class="fa-solid fa-book"></i></span>' +
        esc(doc.title) + badge(dict('zsfl', doc.cat), 'blue') + zskBadge(doc.zskzt) + '</div>' +
      '<dl class="desc-list">' +
        '<div class="desc-item"><dt>文档版本</dt><dd>' + esc(doc.ver) + '</dd></div>' +
        '<div class="desc-item"><dt>生效时间</dt><dd>' + fmtDate(doc.effectAt) + '</dd></div>' +
        '<div class="desc-item"><dt>审核人</dt><dd>' + esc(doc.auditBy || '—') + '</dd></div>' +
        '<div class="desc-item"><dt>被引用次数</dt><dd>' + num(doc.hits) + '</dd></div>' +
        '<div class="desc-item full"><dt>条款原文</dt><dd>' + esc(doc.clause) + '</dd></div>' +
      '</dl></div>' +
      '<div class="ai-tip"><i class="fa-solid fa-circle-info"></i><span>按 AI 输出治理要求，只有状态为「已生效」的知识库文档才能作为有效引用；' +
        '引用失效的输出会被幻觉防控拦截并转人工。</span></div>';
    if (window.PMS) PMS.openDrawer('aiCiteDrawer');
  }

  /*
    AI.table({
      id:       表格元素 id
      rows:     function() 返回数据数组
      cells:    function(row, index) 返回 <td> 片段数组
      attrs:    function(row) 返回 <tr> 上的附加属性（可选）
      pageSize: 每页条数，默认 10
      empty:    空态文案
      after:    渲染后回调（可选）
    })
    表格需在 HTML 中写好 thead 与空 tbody，并在 <table> 上标 data-static。
  */
  var tableCfgs = {};
  /* app.js 的分页条只提供 10/20/50/100 四档，pageSize 必须落在其中，
     否则每页条数下拉会与实际渲染条数不一致。这里统一向上取整到最近一档。 */
  var PAGE_SIZES = [10, 20, 50, 100];
  function snapSize(n) {
    var v = Number(n) || 10;
    for (var i = 0; i < PAGE_SIZES.length; i++) if (v <= PAGE_SIZES[i]) return PAGE_SIZES[i];
    return PAGE_SIZES[PAGE_SIZES.length - 1];
  }
  function table(cfg) {
    cfg.pageSize = snapSize(cfg.pageSize);
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
      tbody.innerHTML = data.slice(from, from + size).map(function (row, i) {
        var attrs = cfg.attrs ? (cfg.attrs(row) || '') : '';
        return '<tr' + attrs + '><td class="idx-col">' + pad(from + i + 1) + '</td>' +
          cfg.cells(row, from + i).join('') + '</tr>';
      }).join('');
    }
    /* 真实总量的分页条 */
    if (window.PMS && PMS.renderPager) {
      PMS.renderPager(el, {
        pageNum: page, pageSize: size, total: data.length,
        onChange: function (s) { el._page = s.pageNum; el._size = s.pageSize; paint(id); }
      });
    }
    if (cfg.after) cfg.after();
  }
  function repaintAll() { Object.keys(tableCfgs).forEach(paint); }

  function checked(scopeId) {
    var scope = document.getElementById(scopeId) || document;
    return Array.prototype.map.call(
      scope.querySelectorAll('input[type=checkbox][data-pick]:checked'),
      function (x) { return x.getAttribute('data-pick'); }
    );
  }
  function pickAll(box, scopeId) {
    var scope = document.getElementById(scopeId) || document;
    scope.querySelectorAll('input[type=checkbox][data-pick]').forEach(function (x) { x.checked = box.checked; });
  }

  /* 纯 CSS 柱状图 */
  function barChart(items) {
    var max = 1;
    items.forEach(function (it) { if (it.v > max) max = it.v; });
    return '<div class="bar-chart">' + items.map(function (it) {
      return '<div class="bar-col"><div class="bar-val">' + num(it.v) + '</div>' +
        '<div class="bar" style="height:' + Math.max(3, Math.round(it.v / max * 100)) + '%"></div>' +
        '<div class="bar-label">' + esc(it.l) + '</div></div>';
    }).join('') + '</div>';
  }
  /* 环形指标：纯 CSS conic-gradient */
  function ring(pct, label, tip, color) {
    var c = color || 'var(--primary)';
    var p = Math.max(0, Math.min(100, Number(pct) || 0));
    return '<div class="metric-ring"><div class="mr-circle" style="background:conic-gradient(' + c + ' 0 ' + p +
      '%, var(--bg-soft) ' + p + '% 100%)"><div class="mr-hole"><div class="mr-v" style="color:' + c + '">' +
      p + '%</div></div></div><div><div class="mr-l">' + esc(label) + '</div>' +
      (tip ? '<div class="mr-t">' + esc(tip) + '</div>' : '') + '</div></div>';
  }
  /* 迷你趋势条 */
  function spark(vals) {
    var max = 1;
    vals.forEach(function (v) { if (v > max) max = v; });
    return '<div class="kpi-spark">' + vals.map(function (v, i) {
      return '<i class="' + (i === vals.length - 1 ? 'on' : '') + '" style="height:' +
        Math.max(8, Math.round(v / max * 100)) + '%"></i>';
    }).join('') + '</div>';
  }

  /* ==========================================================================
     八、订阅与导航
     ========================================================================== */
  function on(fn) { if (typeof fn === 'function') { subs.push(fn); fn(); } }
  function emit() {
    subs.forEach(function (fn) { try { fn(); } catch (e) {} });
    chrome();
  }
  /* 顶栏红点：由待人工确认的 AI 输出数驱动（约束二的全局可见性） */
  function chrome() {
    var dot = document.querySelector('.app-topbar .topbar-icon .dot');
    if (!dot) return;
    var n = stat('pendingOutputs');
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
  function reset() { db = D.reset(); emit(); }
  /* 跨板块推送：AI 板块自成闭环，流向其他子系统统一用 Toast + 链接示意 */
  function pushTo(sysName, detail, href) {
    toast('已推送至' + sysName + '：' + detail, 'success');
    if (href) {
      var box = document.getElementById('aiPushHint');
      if (box) {
        box.innerHTML = '<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i>' +
          '<span>已推送至' + esc(sysName) + '：' + esc(detail) +
          '　<a class="link" href="' + href + '" target="_blank">前往查看 <i class="fa-solid fa-arrow-up-right-from-square"></i></a></span></div>';
      }
    }
  }

  window.AI = {
    /* 数据 */
    load: load, db: function () { return db; }, commit: commit, get: get, byId: byId, where: where,
    nid: nid, reset: reset, me: me, userById: userById, users: D.USERS,
    /* 格式化与字典 */
    esc: esc, dict: dict, param: param, role: role, num: num,
    fmt: { date: fmtDate, time: fmtTime, ago: fmtAgo, pad: pad },
    /* 状态机与硬约束 */
    can: can, move: move,
    guard: {
      traceable: guardTraceable, hallucination: guardHallucination,
      confirmed: guardConfirmed, clue: guardClueConfirmed,
      askScope: guardAskScope, compliance: guardCompliance
    },
    writeOutput: writeOutput, confirmOutput: confirmOutput,
    /* 统计 */
    stat: stat, scenePage: SCENE_PAGE,
    /* 渲染 */
    badge: badge, qrBadge: qrBadge, mxBadge: mxBadge, zskBadge: zskBadge, ztBadge: ztBadge,
    xsBadge: xsBadge, bgBadge: bgBadge, yqBadge: yqBadge, lv: lv,
    aiMark: aiMark, aiSource: aiSource, confidence: confidence, citeChips: citeChips,
    actTriplet: actTriplet, nodeTag: nodeTag, emptyRow: emptyRow, openCite: openCite,
    table: table, paint: paint, repaintAll: repaintAll, checked: checked, pickAll: pickAll,
    barChart: barChart, ring: ring, spark: spark,
    /* 订阅与导航 */
    on: on, emit: emit, chrome: chrome, goto: goto, toast: toast, confirm: confirmBox,
    pushTo: pushTo
  };

  /* ==========================================================================
     九、39 个功能点闭环动作
     编号与《方案》第 2.3 节一一对应，注释中标注编号与 wsai 菜单代号。
     每个动作统一完成：规则校验 → 状态迁移 → 写流水 → 发消息 → 落盘重绘 → Toast
     ========================================================================== */
  var act = {};

  function notify(xxlx, title, content, href) {
    db.msgs.unshift({
      id: nid('XX'), xxlx: String(xxlx), title: title, content: content,
      href: href || '', read: 0, createdAt: Date.now()
    });
  }

  /* ---------------- 中枢：AI 输出人工确认（动作 9 · wsai-03） ---------------- */
  /* 9 AI 输出留痕：采纳 / 修正 / 驳回 三联动作，驱动模型指标与样本回流 */
  act.adopt = function (id) {
    var o = byId('outputs', id);
    if (!o) return;
    confirmBox({
      title: '采纳 AI 结论', type: 'success', okText: '采纳',
      message: '确定采纳这条 AI 结论吗？',
      detail: '采纳后该结论产生业务效力，并作为正样本回流用于模型调优。模型：' + o.mxmc + ' ' + o.ver + '，置信度 ' + o.conf + '%。',
      onOk: function () { confirmOutput(id, '1'); }
    });
  };
  act.fix = function (id) {
    var o = byId('outputs', id);
    if (!o) return;
    var v = window.prompt('请输入修正后的结论（修正内容将作为纠错样本回流）', o.text || '');
    if (v == null) return;
    if (!String(v).trim()) { toast('修正内容不能为空', 'error'); return; }
    confirmOutput(id, '2', String(v).trim());
  };
  act.reject = function (id) {
    var o = byId('outputs', id);
    if (!o) return;
    confirmBox({
      title: '驳回 AI 结论', type: 'danger', okText: '驳回',
      message: '确定驳回这条 AI 结论吗？',
      detail: '驳回将计入该模型的误报率，并作为负样本回流。模型：' + o.mxmc + ' ' + o.ver + '。',
      onOk: function () { confirmOutput(id, '3'); }
    });
  };
  /* 批量确认：留痕台账的批量采纳 */
  act.adoptBatch = function (ids) {
    if (!ids || !ids.length) { toast('请先勾选待确认的 AI 输出', 'error'); return; }
    var n = 0;
    ids.forEach(function (id) {
      var o = byId('outputs', id);
      if (o && o.qrzt === '0' && confirmOutput(id, '1', null, true)) n++;
    });
    commit();
    toast(n ? ('已批量采纳 ' + n + ' 条' + (n < ids.length ? '，' + (ids.length - n) + ' 条已确认过' : '')) : '所选输出均已确认', n ? 'success' : 'error');
  };
  /* 约束二演示：未确认就提交业务系统会被拦截 */
  act.submitToBiz = function (outputIds, bizName) {
    var items = (outputIds || []).map(function (id) { return byId('outputs', id); }).filter(Boolean);
    if (!guardConfirmed(items, 'AI 结论')) return;
    pushTo(bizName || '统一工作门户', items.length + ' 条已确认结论', '../../统一门户/biz/case-detail.html?role=biz');
  };

  /* ---------------- 模型管理 wsai-02（动作 1~8） ---------------- */
  /* 1 大模型本地化部署：草稿 → 部署中 → 已发布 */
  act.deployModel = function (id) {
    var m = byId('models', id);
    if (!m) return;
    if (m.mxzt === '0') {
      if (!move('mxzt', m, 'mxzt', '1')) return;
      m.updatedAt = Date.now();
      commit();
      toast('已启动本地化部署，正在加载权重与注册统一推理服务', 'success');
      return;
    }
    if (m.mxzt === '1') {
      confirmBox({
        title: '完成部署并发布', type: 'info', okText: '发布',
        message: '部署已完成，确定发布「' + m.mc + '」吗？',
        detail: '发布后该模型进入统一推理服务，可被智能体编排选用。',
        onOk: function () {
          if (!move('mxzt', m, 'mxzt', '3')) return;
          m.enabled = 1;
          m.acc = m.acc || 85;
          m.updatedAt = Date.now();
          db.versions.push({
            id: nid('BB'), modelId: m.id, mxmc: m.mc, ver: m.ver, mxzt: '3',
            note: '本地化部署后首次发布', grayPct: 0, perm: ['pt'], acc: m.acc,
            releaseAt: Date.now(), operator: me().name, rollbackFrom: null
          });
          notify('4', '模型发布', '「' + m.mc + '」' + m.ver + ' 已发布，可被智能体编排选用', '../admin/model-version.html');
          commit();
          toast('已发布，模型进入统一推理服务', 'success');
        }
      });
      return;
    }
    toast('当前状态为「' + dict('mxzt', m.mxzt) + '」，无需再次部署', 'error');
  };
  /* 2 智能算法模型库：启停。停用后编排选择器不可选 */
  act.toggleModel = function (id) {
    var m = byId('models', id);
    if (!m) return;
    if (m.mxzt !== '3' && m.mxzt !== '2') { toast('只有已发布或灰度中的模型可以启停', 'error'); return; }
    /* 停用前检查是否被已上架智能体占用 */
    if (m.enabled) {
      var used = where('agents', function (a) {
        return a.modelId === m.id && (a.ztzt === '1' || a.ztzt === '2');
      });
      if (used.length) {
        toast('「' + m.mc + '」正被 ' + used.length + ' 个已上架智能体调用，请先下架相关智能体', 'error');
        return;
      }
    }
    m.enabled = m.enabled ? 0 : 1;
    m.updatedAt = Date.now();
    commit();
    toast(m.enabled ? '已启用，模型可被编排选用' : '已停用，编排选择器将过滤该模型', 'success');
  };
  /* 3 模型版本管理：发布 / 灰度 / 回滚 */
  act.releaseVer = function (id) {
    var m = byId('models', id);
    if (!m) return;
    if (!move('mxzt', m, 'mxzt', '3')) return;
    m.grayPct = 0;
    m.enabled = 1;
    m.updatedAt = Date.now();
    db.versions.push({
      id: nid('BB'), modelId: m.id, mxmc: m.mc, ver: m.ver, mxzt: '3',
      note: '全量发布', grayPct: 0, perm: ['pt', 'jb', 'fx'], acc: m.acc,
      releaseAt: Date.now(), operator: me().name, rollbackFrom: null
    });
    notify('4', '模型全量发布', '「' + m.mc + '」' + m.ver + ' 已全量发布', '../admin/model-version.html');
    commit();
    toast('已全量发布，后续 AI 输出的版本号将记为 ' + m.ver, 'success');
  };
  act.grayVer = function (id, pct) {
    var m = byId('models', id);
    if (!m) return;
    var p = Number(pct);
    if (!(p > 0 && p < 100)) { toast('灰度比例应在 1~99 之间', 'error'); return; }
    if (!move('mxzt', m, 'mxzt', '2')) return;
    m.grayPct = p;
    m.enabled = 1;
    m.updatedAt = Date.now();
    db.versions.push({
      id: nid('BB'), modelId: m.id, mxmc: m.mc, ver: m.ver, mxzt: '2',
      note: '灰度发布 ' + p + '%', grayPct: p, perm: ['pt'], acc: m.acc,
      releaseAt: Date.now(), operator: me().name, rollbackFrom: null
    });
    commit();
    toast('已灰度发布 ' + p + '%，灰度期间误报率将被重点监控', 'success');
  };
  act.rollbackVer = function (verId) {
    var v = byId('versions', verId);
    if (!v) return;
    var m = byId('models', v.modelId);
    if (!m) return;
    if (v.ver === m.ver) { toast('该版本即为当前版本，无需回滚', 'error'); return; }
    confirmBox({
      title: '回滚模型版本', type: 'warning', okText: '回滚',
      message: '确定把「' + m.mc + '」回滚到 ' + v.ver + ' 吗？',
      detail: '回滚后新产生的 AI 输出将记为 ' + v.ver + '；已确认的历史输出保留原版本号，不受影响。',
      onOk: function () {
        var oldVer = m.ver;
        m.ver = v.ver;
        m.acc = v.acc;
        m.mxzt = '3';
        m.grayPct = 0;
        m.updatedAt = Date.now();
        db.versions.push({
          id: nid('BB'), modelId: m.id, mxmc: m.mc, ver: v.ver, mxzt: '3',
          note: '由 ' + oldVer + ' 回滚', grayPct: 0, perm: v.perm, acc: v.acc,
          releaseAt: Date.now(), operator: me().name, rollbackFrom: oldVer
        });
        notify('4', '模型回滚', '「' + m.mc + '」已由 ' + oldVer + ' 回滚至 ' + v.ver, '../admin/model-version.html');
        commit();
        toast('已回滚至 ' + v.ver, 'success');
      }
    });
  };
  /* 4 模型效果评估：消费待调优样本重训，准确率升误报率降并产生新版本 */
  act.retrain = function (id) {
    var m = byId('models', id);
    if (!m) return;
    if (!m.samples) { toast('暂无待调优样本，先在智能应用页对 AI 结论做修正或驳回', 'error'); return; }
    var used = m.samples;
    confirmBox({
      title: '样本回流重训', type: 'info', okText: '开始重训',
      message: '确定用 ' + used + ' 条待调优样本重训「' + m.mc + '」吗？',
      detail: '重训后生成新的小版本，准确率上升、误报率下降，样本池清空。',
      onOk: function () {
        var seg = m.ver.replace(/^v/, '').split('.');
        seg[2] = String(Number(seg[2] || 0) + 1);
        var newVer = 'v' + seg.join('.');
        m.acc = Math.min(99.5, Math.round((m.acc + Math.min(2.5, used * 0.12)) * 10) / 10);
        m.fpr = Math.max(0.3, Math.round((m.fpr - Math.min(1.5, used * 0.08)) * 10) / 10);
        m.ver = newVer;
        m.samples = 0;
        m.updatedAt = Date.now();
        db.versions.push({
          id: nid('BB'), modelId: m.id, mxmc: m.mc, ver: newVer, mxzt: '3',
          note: '回流 ' + used + ' 条样本重训', grayPct: 0, perm: ['pt', 'jb', 'fx'],
          acc: m.acc, releaseAt: Date.now(), operator: me().name, rollbackFrom: null
        });
        get('feedbacks').forEach(function (f) { if (f.modelId === m.id) f.pushed = 1; });
        notify('4', '模型调优完成', '「' + m.mc + '」重训为 ' + newVer + '，准确率 ' + m.acc + '%', '../admin/model-eval.html');
        commit();
        toast('重训完成，' + newVer + ' 准确率 ' + m.acc + '%、误报率 ' + m.fpr + '%', 'success');
      }
    });
  };
  /* 5 算力资源纳管：按场景分配配额，超总量拦截 */
  act.allocQuota = function (id, delta) {
    var c = byId('computes', id);
    if (!c) return;
    var d = Number(delta);
    if (!d) { toast('请输入要调整的配额数量', 'error'); return; }
    var next = c.used + d;
    if (next < 0) { toast('已用配额不能为负', 'error'); return; }
    if (next > c.quota) {
      toast('超出「' + c.mc + '」总配额 ' + c.quota + ' 千次/日，请先扩容或改分配到其他节点', 'error');
      return;
    }
    c.used = next;
    commit();
    toast('已调整配额，' + c.mc + ' 当前占用 ' + c.used + '/' + c.quota + ' 千次/日', 'success');
  };
  /* 6 智能体编排：五要件校验通过才上架 */
  function agentMissing(a) {
    var miss = [];
    var m = a.modelId ? byId('models', a.modelId) : null;
    if (!m) miss.push('底座模型');
    else if (m.mxzt !== '3' && m.mxzt !== '2') miss.push('模型未发布（当前' + dict('mxzt', m.mxzt) + '）');
    else if (!m.enabled) miss.push('模型已停用');
    /* 需要知识支撑的场景必须挂已生效知识库 */
    if (NEED_CITE_SCENES.indexOf(a.scene) >= 0) {
      var okKb = (a.kbIds || []).filter(function (k) {
        var doc = byId('kbDocs', k);
        return doc && doc.zskzt === '2';
      });
      if (!okKb.length) miss.push('已生效知识库');
    }
    var p = a.promptId ? byId('prompts', a.promptId) : null;
    if (!p) miss.push('提示词模板');
    else if (p.zt !== '2') miss.push('提示词未生效');
    if (!(a.ruleIds || []).length) miss.push('合规过滤规则');
    if (!a.needHuman) miss.push('人工确认节点');
    return miss;
  }
  act.publishAgent = function (id) {
    var a = byId('agents', id);
    if (!a) return;
    var miss = agentMissing(a);
    if (miss.length) {
      toast('五要件不齐，缺少：' + miss.join('、'), 'error');
      emit();
      return;
    }
    if (!move('ztzt', a, 'ztzt', '1')) return;
    a.updatedAt = Date.now();
    notify('4', '智能体上架', '「' + a.mc + '」已上架，可在我的 AI 工作台调用', '../common/my-workbench.html');
    commit();
    toast('五要件校验通过，「' + a.mc + '」已上架', 'success');
  };
  act.shareAgent = function (id) {
    var a = byId('agents', id);
    if (!a) return;
    if (!move('ztzt', a, 'ztzt', '2')) return;
    a.shared = 1;
    a.updatedAt = Date.now();
    commit();
    toast('已按共享复用标准上架，业务部门可按需调用不重复开发', 'success');
  };
  act.offAgent = function (id) {
    var a = byId('agents', id);
    if (!a) return;
    confirmBox({
      title: '停用智能体', type: 'danger', okText: '停用',
      message: '确定停用「' + a.mc + '」吗？',
      detail: '停用后该智能体从工作台入口移除，已产生的输出留痕保留。',
      onOk: function () {
        if (!move('ztzt', a, 'ztzt', '3')) return;
        a.shared = 0;
        a.updatedAt = Date.now();
        commit();
        toast('已停用', 'success');
      }
    });
  };
  act.agentMissing = agentMissing;
  /* 7 上级模型资源复用：标记为上级复用，本地重复模型自动标建议下线 */
  act.adoptUpstream = function (id) {
    var m = byId('models', id);
    if (!m) return;
    if (m.mxly === '2' || m.mxly === '3') { toast('该模型已是上级复用来源', 'error'); return; }
    confirmBox({
      title: '改为复用上级模型', type: 'warning', okText: '确认复用',
      message: '确定把「' + m.mc + '」改为复用上级政务大模型吗？',
      detail: '按不重复建设底座的要求，本平台只做行业适配与场景编排；本地同类模型会被标记为建议下线。',
      onOk: function () {
        m.mxly = '2';
        m.note = '市级政务云统一推理服务 · 本平台只做行业适配与场景编排';
        m.updatedAt = Date.now();
        /* 同类型的本地模型标建议下线 */
        var n = 0;
        get('models').forEach(function (x) {
          if (x.id !== m.id && x.mxlx === m.mxlx && x.mxly === '1' && x.mxzt === '3') {
            x.suggestOff = 1; n++;
          }
        });
        notify('4', '上级模型复用', '「' + m.mc + '」已改为复用上级模型' + (n ? '，' + n + ' 个本地同类模型建议下线' : ''), '../admin/upstream-model.html');
        commit();
        toast('已改为上级复用' + (n ? '，' + n + ' 个本地同类模型已标记建议下线' : ''), 'success');
      }
    });
  };
  /* 8 行业语料管理：未脱敏或未加密拦截发布 */
  act.publishCorpus = function (id) {
    var c = byId('corpus', id);
    if (!c) return;
    if (!c.tmh) { toast('「' + c.mc + '」未完成脱敏，含个人信息的语料不得发布', 'error'); return; }
    if (!c.jm) { toast('「' + c.mc + '」未完成国密加密存储，不得发布', 'error'); return; }
    c.zt = '2';
    c.note = '已脱敏并密文存储，可用于检索增强与轻量微调';
    c.updatedAt = Date.now();
    commit();
    toast('已发布，' + num(c.docs) + ' 篇语料进入可训练池', 'success');
  };
  act.desensitize = function (id) {
    var c = byId('corpus', id);
    if (!c) return;
    c.tmh = 1;
    c.updatedAt = Date.now();
    commit();
    toast('已完成脱敏处理，个人手机号与证件号已替换为掩码', 'success');
  };
  act.encryptCorpus = function (id) {
    var c = byId('corpus', id);
    if (!c) return;
    c.jm = 1;
    c.updatedAt = Date.now();
    commit();
    toast('已完成国密加密存储', 'success');
  };

  /* ---------------- AI 输出治理 wsai-03（动作 10~13） ---------------- */
  /* 10 提示词模板管理：版本化与回滚 */
  act.savePrompt = function (id, content) {
    var p = byId('prompts', id);
    if (!p) return;
    var v = String(content == null ? '' : content).trim();
    if (!v) { toast('提示词内容不能为空', 'error'); return; }
    if (v === p.content) { toast('提示词未发生变化', 'error'); return; }
    /* 旧版本置为历史，新增生效版本 */
    var seg = p.ver.replace(/^v/, '').split('.');
    seg[1] = String(Number(seg[1] || 0) + 1);
    var newVer = 'v' + seg.join('.');
    p.zt = '3';
    var np = {
      id: nid('TS'), scene: p.scene, ver: newVer, zt: '2', content: v,
      operator: me().name, updatedAt: Date.now()
    };
    db.prompts.unshift(np);
    /* 引用旧模板的智能体切到新版本 */
    var n = 0;
    get('agents').forEach(function (a) { if (a.promptId === p.id) { a.promptId = np.id; n++; } });
    commit();
    toast('已保存为 ' + newVer + ' 并生效' + (n ? '，' + n + ' 个智能体已切换' : ''), 'success');
  };
  act.rollbackPrompt = function (id) {
    var p = byId('prompts', id);
    if (!p) return;
    if (p.zt === '2') { toast('该版本已是生效版本', 'error'); return; }
    confirmBox({
      title: '回滚提示词', type: 'warning', okText: '回滚',
      message: '确定回滚到 ' + p.ver + ' 吗？',
      detail: '回滚后同场景的其他版本将置为历史版本。',
      onOk: function () {
        get('prompts').forEach(function (x) { if (x.scene === p.scene && x.zt === '2') x.zt = '3'; });
        p.zt = '2';
        p.updatedAt = Date.now();
        var n = 0;
        get('agents').forEach(function (a) {
          if (a.scene === p.scene) { a.promptId = p.id; n++; }
        });
        commit();
        toast('已回滚到 ' + p.ver + (n ? '，' + n + ' 个智能体已切换' : ''), 'success');
      }
    });
  };
  /* 11 内容合规过滤：规则维护与试算 */
  act.saveRule = function (id, gzdz, enabled) {
    var r = byId('rules', id);
    if (!r) return;
    if (gzdz) r.gzdz = String(gzdz);
    if (enabled != null) r.enabled = enabled ? 1 : 0;
    r.updatedAt = Date.now();
    commit();
    toast('规则「' + r.mc + '」已更新为「' + dict('gzdz', r.gzdz) + '」' + (r.enabled ? '' : '（已停用）'), 'success');
  };
  act.testRule = function (text) {
    var v = String(text == null ? '' : text).trim();
    if (!v) { toast('请输入要试算的内容', 'error'); return null; }
    var out = guardCompliance(v, '01');
    commit();
    if (out === null) return { blocked: true, text: null };
    if (out !== v) { toast('已按脱敏规则处置，敏感片段替换为掩码', 'success'); return { blocked: false, text: out }; }
    toast('未命中任何合规规则，内容可正常提交', 'success');
    return { blocked: false, text: out };
  };
  /* 12 幻觉防控审核：调阈值并试算历史输出会被拦截多少条 */
  act.trialGuard = function (confMin, needCite) {
    var c = Number(confMin);
    if (!(c >= 0 && c <= 100)) return null;
    var hit = get('outputs').filter(function (o) {
      if (o.conf < c) return true;
      if (needCite && NEED_CITE_SCENES.indexOf(o.scene) >= 0) {
        var valid = (o.cites || []).filter(function (id) {
          var d2 = byId('kbDocs', id);
          return d2 && d2.zskzt === '2';
        });
        if (!valid.length) return true;
      }
      return false;
    });
    return { total: get('outputs').length, blocked: hit.length, list: hit };
  };
  act.saveGuard = function (confMin, needCite, blockNoCite) {
    var c = Number(confMin);
    if (!(c >= 50 && c <= 99)) { toast('置信度阈值建议设置在 50~99 之间', 'error'); return; }
    var t = act.trialGuard(c, needCite);
    confirmBox({
      title: '保存幻觉防控配置', type: 'warning', okText: '保存生效',
      message: '确定把置信度阈值设为 ' + c + '% 吗？',
      detail: '按新阈值试算，历史 ' + t.total + ' 条输出中将有 ' + t.blocked + ' 条被拦截并转人工。',
      onOk: function () {
        db.guard.confMin = c;
        db.guard.needCite = needCite ? 1 : 0;
        db.guard.blockNoCite = blockNoCite ? 1 : 0;
        db.guard.updatedAt = Date.now();
        db.guard.operator = me().name;
        commit();
        toast('已生效，后续低于 ' + c + '% 或无有效引用的输出将被拦截', 'success');
      }
    });
  };
  /* 13 人工修正回流：把修正样本推进待调优池 */
  act.pushSamples = function (agentId) {
    var a = byId('agents', agentId);
    if (!a) return;
    var fbs = where('feedbacks', function (f) {
      return !f.pushed && f.scene === a.scene && (f.action === '2' || f.action === '3');
    });
    if (!fbs.length) { toast('该智能体暂无未回流的修正或驳回样本', 'error'); return; }
    var m = byId('models', a.modelId);
    if (!m) { toast('该智能体未绑定底座模型', 'error'); return; }
    fbs.forEach(function (f) { f.pushed = 1; });
    m.samples += fbs.length;
    notify('4', '样本回流', '「' + a.mc + '」回流 ' + fbs.length + ' 条样本至「' + m.mc + '」待调优池', '../admin/model-eval.html');
    commit();
    toast('已回流 ' + fbs.length + ' 条样本，可在模型效果评估页发起重训', 'success');
  };

  /* ---------------- 知识库与图谱 wsai-04（动作 14~18） ---------------- */
  /* 14 政务知识库：提交送审，草稿 → 待审核并生成审核任务 */
  act.submitDoc = function (id) {
    var d2 = byId('kbDocs', id);
    if (!d2) return;
    if (!move('zskzt', d2, 'zskzt', '1')) return;
    d2.submitBy = me().name;
    d2.updatedAt = Date.now();
    db.kbAudits.unshift({
      id: nid('SH'), docId: d2.id, title: d2.title, ver: d2.ver,
      submitBy: me().name, submitAt: Date.now(),
      zt: '1', result: null, opinion: null, auditBy: null, auditAt: null
    });
    notify('0', '知识库审核', '「' + d2.title + '」待业务科室审核，未生效前不参与检索增强', '../admin/knowledge-audit.html');
    commit();
    toast('已提交审核，审核通过后才会进入检索池', 'success');
  };
  act.editDoc = function (id, clause) {
    var d2 = byId('kbDocs', id);
    if (!d2) return;
    var v = String(clause == null ? '' : clause).trim();
    if (!v) { toast('条款内容不能为空', 'error'); return; }
    /* 已生效文档改动必须重新送审，回到待审核 */
    var wasEffective = d2.zskzt === '2';
    d2.clause = v;
    var seg = d2.ver.replace(/^v/, '').split('.');
    seg[1] = String(Number(seg[1] || 0) + 1);
    d2.ver = 'v' + seg.join('.');
    d2.updatedAt = Date.now();
    if (wasEffective) {
      d2.zskzt = '1';
      db.kbAudits.unshift({
        id: nid('SH'), docId: d2.id, title: d2.title, ver: d2.ver,
        submitBy: me().name, submitAt: Date.now(),
        zt: '1', result: null, opinion: null, auditBy: null, auditAt: null
      });
    }
    commit();
    toast(wasEffective
      ? '已改为 ' + d2.ver + '，已生效文档变更需重新审核，期间不参与检索'
      : '已保存为 ' + d2.ver, 'success');
  };
  /* 17 知识库更新审核：通过则生效进检索池，驳回退回草稿 */
  act.auditDoc = function (auditId, pass, opinion) {
    var a = byId('kbAudits', auditId);
    if (!a) return;
    if (a.zt !== '1') { toast('该审核任务已办结', 'error'); return; }
    var d2 = byId('kbDocs', a.docId);
    if (!d2) return;
    if (!pass && !String(opinion || '').trim()) { toast('驳回必须填写审核意见', 'error'); return; }
    if (!move('zskzt', d2, 'zskzt', pass ? '2' : '0')) return;
    a.zt = '3';
    a.result = pass ? '通过' : '驳回';
    a.opinion = opinion || null;
    a.auditBy = me().name;
    a.auditAt = Date.now();
    if (pass) {
      d2.auditBy = me().name;
      d2.effectAt = Date.now();
    }
    d2.updatedAt = Date.now();
    commit();
    toast(pass
      ? '已通过，「' + d2.title + '」' + d2.ver + ' 生效并进入检索池，可作为有效引用'
      : '已驳回并退回草稿，该文档不参与检索增强', pass ? 'success' : 'error');
  };
  act.revokeDoc = function (id) {
    var d2 = byId('kbDocs', id);
    if (!d2) return;
    confirmBox({
      title: '废止知识库文档', type: 'danger', okText: '废止',
      message: '确定废止「' + d2.title + '」吗？',
      detail: '废止后不再作为有效引用，已引用该文档的历史输出会在幻觉防控试算中被标为无有效引用。',
      onOk: function () {
        if (!move('zskzt', d2, 'zskzt', '3')) return;
        d2.updatedAt = Date.now();
        commit();
        toast('已废止，该文档不再参与检索增强', 'success');
      }
    });
  };
  /* 15 监管知识图谱构建 */
  act.buildGraph = function () {
    var n = get('nodes').length, e = get('edges').length;
    confirmBox({
      title: '重建监管知识图谱', type: 'info', okText: '开始构建',
      message: '确定按当前业务数据重建图谱吗？',
      detail: '将重新抽取企业、项目、账户、人员、房屋五类实体及其关联关系。当前 ' + n + ' 个实体、' + e + ' 条关系。',
      onOk: function () {
        get('nodes').forEach(function (x) { x.expanded = 0; });
        notify('4', '图谱构建完成', '已重建 ' + n + ' 个实体与 ' + e + ' 条关联关系', '../admin/graph-explorer.html');
        commit();
        toast('构建完成，' + n + ' 个实体、' + e + ' 条关系已更新', 'success');
      }
    });
  };
  /* 18 图谱可视化查询：逐层展开 */
  act.expandNode = function (id) {
    var n = byId('nodes', id);
    if (!n) return;
    n.expanded = n.expanded ? 0 : 1;
    var kids = where('edges', function (e) { return e.from === id || e.to === id; });
    commit();
    toast(n.expanded
      ? '已展开「' + n.mc + '」的 ' + kids.length + ' 条关联关系'
      : '已收起「' + n.mc + '」', 'success');
  };
  /* 16 风险传导路径挖掘：高风险路径生成线索候选 */
  act.minePath = function (nodeId) {
    var start = byId('nodes', nodeId);
    if (!start) { toast('请先选择一个起始实体', 'error'); return; }
    /* 沿风险边做广度遍历，得到一条传导链 */
    var chain = [start.mc], cur = start.id, guardN = 0, riskCnt = 0;
    while (guardN++ < 6) {
      var next = where('edges', function (e) { return e.from === cur && e.risk; })[0];
      if (!next) break;
      chain.push(next.toMc);
      riskCnt++;
      cur = next.to;
    }
    if (chain.length < 2) {
      toast('「' + start.mc + '」未发现向下的风险传导关系', 'error');
      return;
    }
    var lv2 = riskCnt >= 3 ? 'red' : (riskCnt === 2 ? 'orange' : 'yellow');
    var p = {
      id: nid('LJ'), nodeMcs: chain, lv: lv2,
      reason: '沿风险关系遍历 ' + riskCnt + ' 跳，识别出由「' + chain[0] + '」向「' + chain[chain.length - 1] + '」的风险传导链。',
      at: Date.now(), toClue: 0
    };
    db.paths.unshift(p);
    commit();
    toast('挖掘出 ' + chain.length + ' 跳传导路径，风险等级' + (lv2 === 'red' ? '严重' : lv2 === 'orange' ? '预警' : '提示'), 'success');
  };
  /* 高风险路径转预警线索候选（进待确认池，不直接成案） */
  act.pathToClue = function (pathId) {
    var p = byId('paths', pathId);
    if (!p) return;
    if (p.toClue) { toast('该路径已生成线索', 'error'); return; }
    if (p.lv !== 'red' && p.lv !== 'orange') {
      toast('仅严重与预警级别的传导路径才生成预警线索', 'error');
      return;
    }
    var subj = p.nodeMcs[0];
    var m = byId('models', get('models')[5].id);
    db.clues.unshift({
      id: nid('XS'), subject: subj, stlx: '1',
      score: p.lv === 'red' ? 82 : 68, reason: p.reason,
      xszt: '0', pushAt: null, confirmBy: null, excludeReason: null,
      modelId: m.id, mxmc: m.mc, ver: m.ver, conf: 86, at: Date.now()
    });
    p.toClue = 1;
    notify('3', '预警线索提醒', '图谱传导路径生成 1 条待确认线索：' + subj, '../analyst/risk-clue.html');
    commit();
    toast('已生成待确认线索，需人工确认后才推送预警督办中心', 'success');
  };

  /* ---------------- 智能审核治理 wsai-08（动作 31） ---------------- */
  /* 31 审核结果复核回流：标注对错，重算误报漏报率 */
  act.markSample = function (outputId, right) {
    var o = byId('outputs', outputId);
    if (!o) return;
    if (o.qrzt === '0') { toast('该输出尚未人工确认，先确认后才能复核标注', 'error'); return; }
    o.reviewed = 1;
    o.rightSample = right ? 1 : 0;
    var m = byId('models', o.modelId);
    if (m) {
      if (right) m.acc = Math.min(99.5, Math.round((m.acc + 0.1) * 10) / 10);
      else { m.fpr = Math.round((m.fpr + 0.3) * 10) / 10; m.samples++; }
    }
    commit();
    toast(right
      ? '已标注为判断正确，计入准确率'
      : '已标注为误报，计入误报率并回流待调优样本', 'success');
  };

  window.AI.act = act;
  load();
})();
