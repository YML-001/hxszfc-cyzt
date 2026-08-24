/* ==========================================================================
   AI 应用服务平台 · 闭环动作（智能应用侧） (ai-acts.js)
   职责：承接 ai-flow.js 的 AI.act 命名空间，补齐智能办事助手、智能审核、
         智能核验、智能分析报告、智能风险研判五组功能点的闭环动作。
   依赖：app.js → ai-data.js → ai-flow.js → ai-acts.js（顺序不可颠倒）
   编号：与《方案》第 2.3 节的动作编号一一对应。
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AI;
  var act = A.act;
  var db = A.db();

  function get(c) { return A.get(c); }
  function byId(c, id) { return A.byId(c, id); }
  function where(c, fn) { return A.where(c, fn); }
  function me() { return A.me(); }
  function toast(m, t) { A.toast(m, t); }
  function commit() { A.commit(); }
  function nid(p) { return A.nid(p); }
  function dict(n, c) { return A.dict(n, c); }

  function notify(xxlx, title, content, href) {
    A.db().msgs.unshift({
      id: nid('XX'), xxlx: String(xxlx), title: title, content: content,
      href: href || '', read: 0, createdAt: Date.now()
    });
  }
  /* 取某场景的已上架智能体与其底座模型，未上架则拒绝调用 */
  function agentOf(scene) {
    var a = where('agents', function (x) {
      return x.scene === scene && (x.ztzt === '1' || x.ztzt === '2');
    })[0];
    return a || null;
  }
  function requireAgent(scene, label) {
    var a = agentOf(scene);
    if (!a) {
      toast('「' + label + '」智能体尚未上架，请先在智能体编排页完成五要件校验并上架', 'error');
      return null;
    }
    var m = byId('models', a.modelId);
    if (!m || (m.mxzt !== '3' && m.mxzt !== '2') || !m.enabled) {
      toast('「' + label + '」的底座模型未发布或已停用，无法调用', 'error');
      return null;
    }
    a.calls++;
    return { agent: a, model: m };
  }
  /* 命中已生效知识库：返回引用 id 数组。
     用二字词（bigram）匹配而非逐字匹配 —— 逐字匹配会让「这个项目会升值吗」
     这类无政策依据的问题因为共用「项」「目」等常用字而误判为有依据，
     从而绕过幻觉防控。要求至少命中 2 个不同的二字词才算相关。 */
  function bigrams(s) {
    var out = [], t = String(s || '');
    for (var i = 0; i < t.length - 1; i++) {
      var a = t[i], b = t[i + 1];
      /* 只取汉字构成的二字词，跳过标点与空白 */
      if (a.charCodeAt(0) > 127 && b.charCodeAt(0) > 127) out.push(a + b);
    }
    return out;
  }
  function searchKb(q) {
    var grams = bigrams(q);
    if (!grams.length) return [];
    var scored = [];
    where('kbDocs', function (d) { return d.zskzt === '2'; }).forEach(function (d) {
      var t = d.title + d.clause;
      var seen = {}, n = 0;
      grams.forEach(function (g) {
        if (!seen[g] && t.indexOf(g) >= 0) { seen[g] = 1; n++; }
      });
      if (n >= 2) scored.push({ doc: d, n: n });
    });
    /* 命中词数优先，其次按历史引用热度 */
    scored.sort(function (a, b) { return b.n - a.n || b.doc.hits - a.doc.hits; });
    var top = scored.slice(0, 3);
    top.forEach(function (x) { x.doc.hits++; });
    return top.map(function (x) { return x.doc.id; });
  }

  /* ==========================================================================
     智能办事助手 wsai-05（动作 19~24）
     ========================================================================== */

  /* 19 智能客服问答：合规过滤 → 检索已生效知识 → 出答案带引用与置信度
        → 过幻觉防控 → 写留痕。全链路四条硬约束都在这条动作上体现。 */
  act.ask = function (q, channel) {
    var raw = String(q == null ? '' : q).trim();
    if (!raw) { toast('请输入您要咨询的问题', 'error'); return null; }
    var ctx = requireAgent('01', '政策咨询');
    if (!ctx) return null;
    /* 约束：输入先过合规过滤，命中拦截规则直接终止 */
    var safe = A.guard.compliance(raw, '01');
    if (safe === null) { commit(); return null; }

    var cites = searchKb(safe);
    /* 置信度由命中知识条数决定：无命中则显著偏低，会被幻觉防控拦截 */
    var conf = cites.length >= 2 ? 94 : (cites.length === 1 ? 86 : 58);
    var text;
    if (cites.length) {
      var d = byId('kbDocs', cites[0]);
      text = d.clause + '（依据《' + d.title + '》' + d.ver + '）';
    } else {
      text = '未检索到与该问题匹配的已生效政策依据。';
    }
    var o = A.writeOutput({
      scene: '01', bizId: 'CHAT-' + A.fmt.pad(get('chats').length + 1),
      modelId: ctx.model.id, promptId: ctx.agent.promptId,
      conf: conf, text: text, cites: cites
    });
    db = A.db();
    db.chats.unshift({
      id: nid('HH'), qudao: String(channel || '1'), firstQ: safe, turns: 1,
      satisfied: null, toHuman: o && o.blocked ? 1 : 0, at: Date.now()
    });
    commit();
    if (o && o.blocked) toast('置信度不足或无有效政策依据，已按幻觉防控转人工', 'error');
    else toast('已作答，答复可追溯到政策原文，需人工确认后才产生业务效力', 'success');
    return o;
  };
  act.toHuman = function (chatId) {
    var c = byId('chats', chatId);
    if (c) { c.toHuman = 1; commit(); }
    toast('已转接人工坐席，工单已进入 12345 热线队列', 'success');
  };
  act.rateChat = function (chatId, ok) {
    var c = byId('chats', chatId);
    if (!c) return;
    c.satisfied = ok ? 1 : 0;
    commit();
    toast(ok ? '感谢您的评价' : '已记录不满意，将回流用于提示词与知识库优化', ok ? 'success' : 'error');
  };

  /* 20 智能导办：按情形推荐应办事项、材料与办理路径 */
  var GUIDE_RULES = [
    { key: '新房', sxmc: '商品房买卖合同网签备案', kb: '商品房买卖合同网签备案办事指南',
      mats: ['居民身份证', '商品房预售许可证', '商品房买卖合同', '房屋测绘报告'], days: 3 },
    { key: '二手房', sxmc: '存量房买卖合同网签备案', kb: '存量房买卖合同网签备案办事指南',
      mats: ['居民身份证', '不动产权证书', '存量房买卖合同', '契税完税凭证'], days: 2 },
    { key: '租赁', sxmc: '房屋租赁合同备案', kb: '房屋租赁合同备案办事指南',
      mats: ['居民身份证', '不动产权证书', '房屋租赁合同'], days: 3 },
    { key: '抵押', sxmc: '房屋抵押合同备案', kb: '房屋抵押合同备案办事指南',
      mats: ['房屋抵押合同', '借款合同', '金融机构营业执照', '不动产权证书'], days: 2 }
  ];
  act.guide = function (kind, channel) {
    var r = null;
    GUIDE_RULES.forEach(function (x) { if (x.key === kind) r = x; });
    if (!r) { toast('请先选择您要办理的业务情形', 'error'); return null; }
    var ctx = requireAgent('02', '智能导办');
    if (!ctx) return null;
    var cites = searchKb(r.kb);
    var o = A.writeOutput({
      scene: '02', bizId: 'GUIDE-' + A.fmt.pad(get('outputs').length + 1),
      modelId: ctx.model.id, promptId: ctx.agent.promptId,
      conf: cites.length ? 92 : 60,
      text: '推荐事项：' + r.sxmc + '；需提交 ' + r.mats.length + ' 项材料；承诺时限 ' + r.days + ' 个工作日。',
      cites: cites
    });
    commit();
    if (o && o.blocked) { toast('未检索到该事项的已生效办事指南，已转人工', 'error'); return o; }
    toast('已生成办事清单，材料清单来自事项材料关联表', 'success');
    return { output: o, rule: r };
  };
  act.guideRules = function () { return GUIDE_RULES; };

  /* 21 AI 辅助填报：按历史数据预填，每字段标来源与置信度 */
  act.prefill = function (caseId) {
    var c = byId('cases', caseId);
    if (!c) { toast('请先选择要预填的办件', 'error'); return null; }
    var ctx = requireAgent('03', '辅助填报');
    if (!ctx) return null;
    var fields = [
      { k: 'sqr', label: '申请人姓名', v: c.sqr, src: '历史办件 ' + c.sjbh, conf: 97 },
      { k: 'fw', label: '房屋坐落', v: c.fw, src: '楼盘表与房屋基础数据', conf: 95 },
      { k: 'sxmc', label: '办理事项', v: c.sxmc, src: '事项目录', conf: 98 },
      { k: 'htje', label: '合同金额（万元）', v: c.htje || '', src: c.htje ? '上一份同类合同' : '无依据，留空', conf: c.htje ? 82 : 0 },
      { k: 'ywdlm', label: '业务大类', v: dict('ywdlm', c.ywdlm), src: '事项目录', conf: 96 },
      { k: 'lxdh', label: '联系电话', v: '', src: '无依据，留空不猜测', conf: 0 }
    ];
    var filled = fields.filter(function (f) { return f.conf > 0; });
    var o = A.writeOutput({
      scene: '03', bizId: c.sjbh, modelId: ctx.model.id, promptId: ctx.agent.promptId,
      conf: 88, text: '按历史办件与已知信息预填 ' + filled.length + ' 个字段，' +
        (fields.length - filled.length) + ' 个字段无依据留空。', cites: searchKb(c.sxmc)
    });
    commit();
    toast('已预填 ' + filled.length + ' 个字段，无依据字段留空不猜测', 'success');
    return { output: o, fields: fields };
  };

  /* 22 智能填报校验：实时提示错填漏填，未修完不允许提交 */
  act.validateFill = function (form) {
    var errs = [];
    var f = form || {};
    if (!String(f.sqr || '').trim()) errs.push({ k: 'sqr', msg: '申请人姓名不能为空' });
    if (!/^1[3-9]\d{9}$/.test(String(f.lxdh || ''))) errs.push({ k: 'lxdh', msg: '联系电话格式不正确，应为 11 位手机号' });
    if (!String(f.fw || '').trim()) errs.push({ k: 'fw', msg: '房屋坐落不能为空' });
    var je = Number(f.htje);
    if (!(je > 0)) errs.push({ k: 'htje', msg: '合同金额应大于 0' });
    else if (je > 5000) errs.push({ k: 'htje', msg: '合同金额疑似多填一位，请核对合同文本' });
    if (String(f.mj || '') && !(Number(f.mj) > 0 && Number(f.mj) < 1000)) {
      errs.push({ k: 'mj', msg: '建筑面积应在 0~1000 ㎡ 之间，疑似位序错填' });
    }
    return errs;
  };
  act.submitFill = function (form) {
    var errs = act.validateFill(form);
    if (errs.length) {
      toast('还有 ' + errs.length + ' 项校验未通过，修正后才能提交', 'error');
      return false;
    }
    /* 校验通过也要过合规过滤，避免把敏感信息带入业务系统 */
    var safe = A.guard.compliance(JSON.stringify(form), '04');
    if (safe === null) { commit(); return false; }
    A.pushTo('统一工作门户 · 统一收件', '1 件申报表单已提交', '../../统一门户/biz/intake.html?role=biz');
    commit();
    return true;
  };

  /* 23 语音交互式填报：逐项引导，提交前出缺项与情形提示 */
  var VOICE_STEPS = [
    { k: 'kind', ask: '请问您要办理什么业务？', tip: '例如：新房网签备案、二手房过户、租赁备案' },
    { k: 'sqr', ask: '请说出申请人姓名。', tip: '' },
    { k: 'fw', ask: '请说出房屋坐落，包括小区、楼栋、单元和房号。', tip: '' },
    { k: 'htje', ask: '请说出合同金额，单位万元。', tip: '' },
    { k: 'lxdh', ask: '请说出联系电话。', tip: '' }
  ];
  act.voiceSteps = function () { return VOICE_STEPS; };
  act.voiceTurn = function (stepIdx, text) {
    var s = VOICE_STEPS[stepIdx];
    if (!s) return null;
    var v = String(text == null ? '' : text).trim();
    if (!v) { toast('未识别到语音内容，请重新说一次', 'error'); return null; }
    var ctx = agentOf('01');
    var m = ctx ? byId('models', ctx.modelId) : null;
    /* 语音识别用 ASR 模型，识别置信度随文本长度略有差异 */
    var asr = where('models', function (x) { return x.mxlx === '4' && x.mxzt === '3'; })[0] || m;
    if (asr) asr.calls++;
    commit();
    return { step: s, value: v, conf: v.length >= 4 ? 93 : 78, model: asr };
  };
  act.checkMissing = function (form) {
    var miss = [];
    VOICE_STEPS.forEach(function (s) {
      if (!String((form || {})[s.k] || '').trim()) miss.push(s.ask.replace(/^请(说出|问您要办理什么业务？)?/, '').replace(/。$/, ''));
    });
    /* 情形提示：按业务情形补充材料缺项 */
    var tips = [];
    var kind = String((form || {}).kind || '');
    GUIDE_RULES.forEach(function (r) {
      if (kind.indexOf(r.key) >= 0) {
        tips.push('办理「' + r.sxmc + '」还需携带：' + r.mats.join('、'));
      }
    });
    return { miss: miss, tips: tips };
  };
  act.voiceSubmit = function (form) {
    var r = act.checkMissing(form);
    if (r.miss.length) {
      toast('还有 ' + r.miss.length + ' 项未填写：' + r.miss.join('、'), 'error');
      return false;
    }
    var ctx = requireAgent('01', '政策咨询');
    if (!ctx) return false;
    var o = A.writeOutput({
      scene: '05', bizId: 'VOICE-' + A.fmt.pad(get('outputs').length + 1),
      modelId: ctx.model.id, promptId: ctx.agent.promptId, conf: 90,
      text: '语音填报生成申报表单：' + form.sqr + ' / ' + form.fw + ' / ' + form.htje + ' 万元。',
      cites: searchKb(String(form.kind || ''))
    });
    commit();
    toast('申报表单已生成，需窗口人员确认后正式受理', 'success');
    return o;
  };

  /* 24 数字人导办服务：语音唤起高频事项 */
  act.kioskWake = function (intent) {
    var v = String(intent || '').trim();
    if (!v) { toast('未识别到语音指令，请再说一次', 'error'); return null; }
    var ctx = requireAgent('02', '智能导办');
    if (!ctx) return null;
    var hitRule = null;
    GUIDE_RULES.forEach(function (r) { if (v.indexOf(r.key) >= 0) hitRule = r; });
    var cites = searchKb(hitRule ? hitRule.kb : v);
    var o = A.writeOutput({
      scene: '06', bizId: 'KIOSK-' + A.fmt.pad(get('outputs').length + 1),
      modelId: ctx.model.id, promptId: ctx.agent.promptId,
      conf: hitRule ? 91 : 55,
      text: hitRule
        ? '已为您唤起「' + hitRule.sxmc + '」，承诺时限 ' + hitRule.days + ' 个工作日，需 ' + hitRule.mats.length + ' 项材料。'
        : '未能理解您的需求，已呼叫大厅帮办人员协助。',
      cites: cites
    });
    db = A.db();
    db.chats.unshift({
      id: nid('HH'), qudao: '3', firstQ: v, turns: 1,
      satisfied: null, toHuman: hitRule ? 0 : 1, at: Date.now()
    });
    commit();
    if (!hitRule) toast('未匹配到高频事项，已呼叫帮办人员', 'error');
    else toast('已唤起「' + hitRule.sxmc + '」办理入口', 'success');
    return { output: o, rule: hitRule };
  };

  /* ==========================================================================
     智能审核 wsai-06（动作 25~27）
     ========================================================================== */

  /* 25 合同材料智能审核：出疑点清单 */
  act.runReview = function (caseId) {
    var c = byId('cases', caseId);
    if (!c) { toast('请先选择要审核的办件', 'error'); return null; }
    var exist = where('reviewTasks', function (t) { return t.caseId === caseId; })[0];
    if (exist) { toast('该办件已有审核任务，直接查看疑点清单即可', 'error'); return exist; }
    var ctx = requireAgent('07', '合同审核');
    if (!ctx) return null;
    var t = {
      id: nid('RW'), caseId: c.id, sjbh: c.sjbh, sxmc: c.sxmc, sqr: c.sqr,
      scene: '07', modelId: ctx.model.id, mxmc: ctx.model.mc, ver: ctx.model.ver,
      zt: '0', issues: [], at: Date.now(), pushed: 0
    };
    /* 抽取比对：一致项与疑点各若干，疑点置信度偏低需人工核对 */
    [['买方姓名', c.sqr, c.sqr, 97, '一致'],
     ['房屋坐落', c.fw, c.fw, 95, '一致'],
     ['合同总价', A.num(Math.round(c.htje * 10000)) + ' 元', A.num(Math.round(c.htje * 10000 * 0.98)) + ' 元', 88, '合同文本金额与系统登记不一致，差额约 2%'],
     ['事项名称', c.sxmc, c.sxmc, 96, '一致']
    ].forEach(function (it) {
      t.issues.push({
        id: nid('YD'), field: it[0], aiVal: it[1], sysVal: it[2], conf: it[3],
        note: it[4], same: it[1] === it[2] ? 1 : 0,
        qrzt: '0', fixVal: null, hrBy: null, hrAt: null
      });
    });
    db = A.db();
    db.reviewTasks.unshift(t);
    c.aiChecked = 1;
    var diff = t.issues.filter(function (i) { return !i.same; }).length;
    A.writeOutput({
      scene: '07', bizId: c.sjbh, modelId: ctx.model.id, promptId: ctx.agent.promptId,
      conf: 90, text: '抽取 ' + t.issues.length + ' 个关键字段，发现 ' + diff + ' 处疑点。',
      cites: A.get('kbDocs').filter(function (d) { return d.zskzt === '2' && d.cat === '3'; }).slice(0, 1).map(function (d) { return d.id; })
    });
    commit();
    toast('审核完成，发现 ' + diff + ' 处疑点，只输出建议不下结论', 'success');
    return t;
  };
  /* 逐条确认疑点：采纳 / 修正 / 驳回 */
  act.confirmIssue = function (taskId, issueId, action, fixVal) {
    var t = byId('reviewTasks', taskId);
    if (!t) return;
    var it = null;
    t.issues.forEach(function (x) { if (x.id === issueId) it = x; });
    if (!it) return;
    if (!A.move('qrzt', it, 'qrzt', action)) return;
    it.hrBy = me().name;
    it.hrAt = Date.now();
    if (action === '2') it.fixVal = fixVal || null;
    /* 疑点确认同步影响模型指标：驳回视为误报 */
    var m = byId('models', t.modelId);
    if (m) {
      if (action === '1') m.acc = Math.min(99.5, Math.round((m.acc + 0.1) * 10) / 10);
      if (action === '2') { m.samples++; }
      if (action === '3') { m.fpr = Math.round((m.fpr + 0.2) * 10) / 10; m.samples++; }
    }
    var pending = t.issues.filter(function (x) { return x.qrzt === '0'; }).length;
    if (!pending) t.zt = '1';
    commit();
    toast('已' + dict('qrzt', action) + (pending ? '，还有 ' + pending + ' 项待确认' : '，全部疑点已确认，可推送补正'), 'success');
  };
  /* 全部确认后推送材料补正（约束二：未确认不得推送） */
  act.pushCorrection = function (taskId) {
    var t = byId('reviewTasks', taskId);
    if (!t) return;
    if (!A.guard.confirmed(t.issues, '疑点')) return;
    var need = t.issues.filter(function (x) { return x.qrzt === '1' || x.qrzt === '2'; });
    if (!need.length) { toast('全部疑点均被驳回，无需推送补正', 'error'); return; }
    if (t.pushed) { toast('该办件已推送过补正', 'error'); return; }
    t.pushed = 1;
    notify('1', '补正推送', '办件 ' + t.sjbh + ' 推送 ' + need.length + ' 项补正建议至统一工作门户', '');
    commit();
    A.pushTo('统一工作门户 · 材料补正', '办件 ' + t.sjbh + ' 共 ' + need.length + ' 项补正建议',
      '../../统一门户/biz/material-correct.html?role=biz');
  };

  /* 26 证照识别回填：逐字段置信度，低置信度必须人工确认 */
  var LICENSE_TPL = {
    idcard: { mc: '居民身份证', fields: [
      ['姓名', '韦志强', 98], ['公民身份号码', '4502**********1234', 97],
      ['性别', '男', 99], ['出生日期', '1985-06-12', 96],
      ['住址', '柳州市城中区文昌路 ** 号', 71], ['签发机关', 'XXXX市公安局城中分局', 88]
    ]},
    license: { mc: '营业执照', fields: [
      ['名称', '柳州鸿达置业有限公司', 97], ['统一社会信用代码', '91450200MA5X****3K', 95],
      ['类型', '有限责任公司', 96], ['法定代表人', '陈某', 93],
      ['注册资本', '5000 万元人民币', 89], ['成立日期', '2016-03-18', 94]
    ]},
    estate: { mc: '不动产权证书', fields: [
      ['权利人', '黄启明', 96], ['不动产单元号', '450202001*****F00010028', 92],
      ['坐落', '翰林苑 3 栋 2 单元 0901', 94], ['建筑面积', '96.42 ㎡', 91],
      ['用途', '住宅', 97], ['权利性质', '出让/商品房', 68]
    ]}
  };
  act.licenseTpl = function () { return LICENSE_TPL; };
  act.ocrFill = function (kind) {
    var tpl = LICENSE_TPL[kind];
    if (!tpl) { toast('请先选择要识别的证照类型', 'error'); return null; }
    var ctx = requireAgent('07', '合同审核');
    var ocr = where('models', function (x) { return x.mxlx === '5' && x.mxzt === '3' && x.enabled; })[0];
    if (!ocr) { toast('证照识别模型未发布或已停用，无法识别', 'error'); return null; }
    ocr.calls++;
    var low = tpl.fields.filter(function (f) { return f[2] < 90; });
    var o = A.writeOutput({
      scene: '08', bizId: 'OCR-' + kind.toUpperCase(),
      modelId: ocr.id, promptId: ctx ? ctx.agent.promptId : null,
      conf: Math.round(tpl.fields.reduce(function (s, f) { return s + f[2]; }, 0) / tpl.fields.length),
      text: '识别「' + tpl.mc + '」共 ' + tpl.fields.length + ' 个字段，其中 ' + low.length + ' 个字段置信度低于 90% 需人工确认。',
      cites: []
    });
    commit();
    toast('识别完成，' + low.length + ' 个低置信度字段必须人工确认后才能回填', 'success');
    return { output: o, tpl: tpl, low: low };
  };
  act.applyOcr = function (outputId) {
    var o = byId('outputs', outputId);
    if (!o) return;
    if (o.qrzt === '0') {
      toast('识别结果未人工确认，不能回填到业务表单', 'error');
      return;
    }
    A.pushTo('统一工作门户 · 统一收件', '证照字段已回填至收件表单',
      '../../统一门户/biz/intake.html?role=biz');
  };

  /* 27 材料一致性交叉校验：差异矩阵 */
  act.crossCheck = function (caseId) {
    var c = byId('cases', caseId);
    if (!c) { toast('请先选择要校验的办件', 'error'); return null; }
    var ctx = requireAgent('07', '合同审核');
    if (!ctx) return null;
    var je = Math.round(c.htje * 10000);
    /* 四个关键项 × 三份材料的交叉比对 */
    var matrix = [
      { item: '当事人姓名', vals: [c.sqr, c.sqr, c.sqr], conf: 96 },
      { item: '建筑面积', vals: ['96.42 ㎡', '96.42 ㎡', '96.24 ㎡'], conf: 74 },
      { item: '合同金额', vals: [A.num(je) + ' 元', A.num(je) + ' 元', A.num(Math.round(je * 0.98)) + ' 元'], conf: 82 },
      { item: '签订日期', vals: ['2026-07-18', '2026-07-18', '2026-07-18'], conf: 95 }
    ];
    var cols = ['合同文本', '不动产权证', '完税凭证'];
    matrix.forEach(function (r) {
      r.same = r.vals.every(function (v) { return v === r.vals[0]; }) ? 1 : 0;
    });
    var diff = matrix.filter(function (r) { return !r.same; }).length;
    var o = A.writeOutput({
      scene: '09', bizId: c.sjbh, modelId: ctx.model.id, promptId: ctx.agent.promptId,
      conf: 86, text: '跨 ' + cols.length + ' 份材料交叉校验 ' + matrix.length + ' 个关键项，发现 ' + diff + ' 项不一致。',
      cites: []
    });
    commit();
    toast('交叉校验完成，' + diff + ' 项关键值不一致', diff ? 'error' : 'success');
    return { output: o, matrix: matrix, cols: cols, diff: diff };
  };

  /* ==========================================================================
     智能核验 wsai-07（动作 28~30）
     ========================================================================== */

  /* 28 房源真实性智能核验 */
  act.verifyListing = function (id) {
    var l = byId('listings', id);
    if (!l) return null;
    var m = where('models', function (x) {
      return x.mc.indexOf('ListingGuard') >= 0 && (x.mxzt === '3' || x.mxzt === '2') && x.enabled;
    })[0];
    if (!m) { toast('房源真实性核验模型未发布或已停用', 'error'); return null; }
    m.calls++;
    var conf = l.suspect ? 76 : 93;
    var o = A.writeOutput({
      scene: '10', bizId: 'FY-' + l.id, modelId: m.id, promptId: null, conf: conf,
      text: l.suspect
        ? '一致性得分 ' + l.consist + '、重复性得分 ' + l.dup + '，疑似虚假房源：' + l.note
        : '一致性得分 ' + l.consist + '、重复性得分 ' + l.dup + '，未发现明显异常。',
      cites: []
    });
    l.outputId = o ? o.id : null;
    commit();
    toast(l.suspect ? '核验完成，标记为疑似虚假房源，需人工确认' : '核验完成，未发现明显异常', l.suspect ? 'error' : 'success');
    return o;
  };
  act.concludeListing = function (id, fake) {
    var l = byId('listings', id);
    if (!l) return;
    if (!A.move('qrzt', l, 'qrzt', fake ? '1' : '3')) return;
    l.conclusion = fake ? '认定为虚假房源，已下架并通知挂牌机构' : '核验通过，房源信息真实';
    l.hrBy = me().name;
    l.hrAt = Date.now();
    /* 认定虚假联动信用扣分：写入线索候选，仍需人工确认才成案 */
    if (fake) {
      var m2 = where('models', function (x) { return x.mc.indexOf('CreditRisk') >= 0; })[0];
      db = A.db();
      db.clues.unshift({
        id: nid('XS'), subject: l.org, stlx: '1', score: 63,
        reason: '挂牌机构发布虚假房源被认定：' + l.title + '。建议信用扣分并纳入重点监管。',
        xszt: '0', pushAt: null, confirmBy: null, excludeReason: null,
        modelId: m2 ? m2.id : null, mxmc: m2 ? m2.mc : '—', ver: m2 ? m2.ver : '—',
        conf: 84, at: Date.now()
      });
      notify('3', '预警线索提醒', '虚假房源认定生成 1 条待确认线索：' + l.org, '../analyst/risk-clue.html');
    }
    commit();
    toast(fake ? '已认定为虚假房源并生成待确认信用线索' : '已确认核验通过', 'success');
  };

  /* 29 好房子品质材料智能核验 */
  act.verifyQuality = function (id) {
    var q = byId('qualityApps', id);
    if (!q) return null;
    var m = where('models', function (x) { return x.mc.indexOf('QualityCheck') >= 0; })[0];
    if (!m || m.mxzt !== '3') {
      toast('好房子品质核验模型当前为「' + (m ? dict('mxzt', m.mxzt) : '未建') + '」，需先部署发布才能调用', 'error');
      return null;
    }
    m.calls++;
    var miss = q.items.filter(function (i) { return !i.ok; });
    var o = A.writeOutput({
      scene: '11', bizId: 'HF-' + q.id, modelId: m.id, promptId: null,
      conf: Math.round(q.items.reduce(function (s, i) { return s + i.conf; }, 0) / q.items.length),
      text: '识别 ' + q.items.length + ' 类品质指标，' + miss.length + ' 项要件缺失或未提取到指标。',
      cites: A.get('kbDocs').filter(function (d) {
        return d.zskzt === '2' && d.title.indexOf('好房子') >= 0;
      }).map(function (d) { return d.id; })
    });
    q.outputId = o ? o.id : null;
    commit();
    toast('核验完成，' + miss.length + ' 项要件需补正', miss.length ? 'error' : 'success');
    return o;
  };
  act.pushQualityCorrection = function (id) {
    var q = byId('qualityApps', id);
    if (!q) return;
    var o = q.outputId ? byId('outputs', q.outputId) : null;
    if (!o) { toast('请先执行智能核验', 'error'); return; }
    if (o.qrzt === '0') { toast('核验结果未人工确认，不能推送补正', 'error'); return; }
    var miss = q.items.filter(function (i) { return !i.ok; });
    if (!miss.length) { toast('要件齐全，无需补正', 'error'); return; }
    A.pushTo('统一工作门户 · 材料补正', q.xm + ' 共 ' + miss.length + ' 项品质要件缺失',
      '../../统一门户/biz/material-correct.html?role=biz');
  };

  /* 30 档案影像智能编目 + 自然语言检索 */
  act.catalog = function (id) {
    var a = byId('archives', id);
    if (!a) return null;
    var m = where('models', function (x) { return x.mc.indexOf('ArchiveCat') >= 0; })[0];
    if (!m) { toast('档案编目模型未建', 'error'); return null; }
    if (m.mxzt !== '3') {
      toast('档案编目模型当前为「' + dict('mxzt', m.mxzt) + '」，需先在模型部署页发布才能调用', 'error');
      return null;
    }
    m.calls++;
    a.cataloged = 1;
    a.conf = 90;
    a.keyInfo = '当事人：' + (get('cases')[0] ? get('cases')[0].sqr : '—') +
      '；档号：' + a.dah + '；共 ' + a.pages + ' 页，已提取标题页与备案页关键信息。';
    var o = A.writeOutput({
      scene: '12', bizId: 'DA-' + a.dah, modelId: m.id, promptId: null,
      conf: a.conf, text: '编目完成：' + a.keyInfo, cites: []
    });
    a.outputId = o ? o.id : null;
    commit();
    toast('编目完成，可用自然语言检索该卷档案', 'success');
    return o;
  };
  act.nlSearch = function (q) {
    var kw = String(q == null ? '' : q).trim();
    if (!kw) { toast('请输入检索内容，例如「韦志强的商品房备案档案」', 'error'); return []; }
    var hit = where('archives', function (a) {
      if (!a.cataloged) return false;                   /* 未编目不可检索 */
      var t = a.title + a.dah + a.keyInfo;
      var n = 0;
      for (var i = 0; i < kw.length; i++) {
        if (kw[i] && kw[i].charCodeAt(0) > 127 && t.indexOf(kw[i]) >= 0) n++;
      }
      return n >= 2;
    });
    var un = where('archives', function (a) { return !a.cataloged; }).length;
    commit();
    if (!hit.length) {
      toast('未检索到匹配档案' + (un ? '，另有 ' + un + ' 卷未编目不参与检索' : ''), 'error');
    } else {
      toast('检索到 ' + hit.length + ' 卷档案' + (un ? '，另有 ' + un + ' 卷未编目未纳入' : ''), 'success');
    }
    return hit;
  };

  window.AI.act = act;
})();
