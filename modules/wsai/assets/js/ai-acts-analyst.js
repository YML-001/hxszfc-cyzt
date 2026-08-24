/* ==========================================================================
   AI 应用服务平台 · 闭环动作（分析与风险侧） (ai-acts-analyst.js)
   职责：补齐智能分析报告 wsai-09 与智能风险研判 wsai-10 的闭环动作
         （动作 32~39），含智能问数的权限与口径双约束、报告溯源定稿、
         风险权重试算、预警线索确认后才推送督办。
   依赖：app.js → ai-data.js → ai-flow.js → ai-acts.js → 本文件
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AI;
  var act = A.act;

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
  function agentOf(scene) {
    return where('agents', function (x) {
      return x.scene === scene && (x.ztzt === '1' || x.ztzt === '2');
    })[0] || null;
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

  /* ==========================================================================
     智能分析报告 wsai-09（动作 32~35）
     ========================================================================== */

  /* 指标口径库：问数答案必须引用这里的口径，与综合统计报表保持一致 */
  var METRICS = [
    { key: '网签备案量', metric: '商品房网签备案量（口径：按备案日期统计已办结件，剔除撤销件）',
      sources: ['商品房交易管理 BUSI_YWBJJBXX', '综合统计与报表管理 · 网签备案月报'],
      chart: [['3月', 1042], ['4月', 1128], ['5月', 1186], ['6月', 1234], ['7月', 1286]], unit: '套' },
    { key: '成交均价', metric: '新建商品房成交均价（口径：合同总价合计 / 建筑面积合计，剔除亲属间转让）',
      sources: ['商品房交易管理', '综合统计与报表管理 · 价格监测'],
      chart: [['3月', 10120], ['4月', 10042], ['5月', 9968], ['6月', 9904], ['7月', 9842]], unit: '元/㎡' },
    { key: '存量房', metric: '存量房网签备案量（口径：按备案日期统计已办结件）',
      sources: ['存量房交易管理', '综合统计与报表管理 · 网签备案月报'],
      chart: [['3月', 826], ['4月', 902], ['5月', 968], ['6月', 1024], ['7月', 1086]], unit: '套' },
    { key: '监管账户', metric: '预售资金监管账户余额与重点监管额度比值（口径：月末时点值）',
      sources: ['商品房预售资金监管 ZJ_JGZHXX'],
      chart: [['3月', 128], ['4月', 122], ['5月', 116], ['6月', 108], ['7月', 96]], unit: '%' },
    { key: '办件', metric: '办件按时办结率（口径：承诺时限内办结件 / 办结总件，中止期间不计时）',
      sources: ['统一工作门户 MS_BJTZXX', '综合统计与报表管理 · 效能监督'],
      chart: [['3月', 94], ['4月', 95], ['5月', 95], ['6月', 96], ['7月', 96]], unit: '%' },
    { key: '租赁', metric: '房屋租赁备案量（口径：按备案日期统计已办结件）',
      sources: ['房屋租赁管理', '综合统计与报表管理'],
      chart: [['3月', 412], ['4月', 446], ['5月', 478], ['6月', 502], ['7月', 534]], unit: '件' }
  ];
  act.metrics = function () { return METRICS; };

  /* 32 智能问数 + 35 口径约束：越权拦截并记日志，答案必附口径与来源 */
  act.askData = function (q) {
    var raw = String(q == null ? '' : q).trim();
    if (!raw) { toast('请输入您要查询的问题', 'error'); return null; }
    var ctx = requireAgent('13', '智能问数');
    if (!ctx) return null;

    /* 约束四之一：输入先过合规过滤，防止把个人信息带进查询 */
    var safe = A.guard.compliance(raw, '13');
    if (safe === null) { commit(); return null; }

    /* 约束四之二：数据权限范围校验，越权直接拦截并记日志 */
    var scope = A.guard.askScope(safe);
    if (!scope.ok) {
      A.db().asks.unshift({
        id: nid('WS'), q: safe, scope: dict('said', me().said), metric: '—',
        sources: [], blocked: 1, blockReason: scope.reason,
        czr: me().name, at: Date.now(), modelId: ctx.model.id, conf: 0
      });
      commit();
      toast(scope.reason + '，本次提问已拦截并记入越权日志', 'error');
      return null;
    }

    /* 约束四之三：必须命中指标口径库，否则不作答 */
    var hit = null;
    METRICS.forEach(function (m) { if (!hit && safe.indexOf(m.key) >= 0) hit = m; });
    if (!hit) {
      A.db().asks.unshift({
        id: nid('WS'), q: safe, scope: scope.scope, metric: '—', sources: [],
        blocked: 1, blockReason: '未匹配到统计口径库中的指标，按口径一致性要求不予作答',
        czr: me().name, at: Date.now(), modelId: ctx.model.id, conf: 0
      });
      commit();
      toast('未匹配到统计口径库中的指标，按口径一致性要求不予作答', 'error');
      return null;
    }

    var rec = {
      id: nid('WS'), q: safe, scope: scope.scope, metric: hit.metric,
      sources: hit.sources, blocked: 0, blockReason: null,
      czr: me().name, at: Date.now(), modelId: ctx.model.id, conf: 94
    };
    A.db().asks.unshift(rec);
    var last = hit.chart[hit.chart.length - 1];
    var prev = hit.chart[hit.chart.length - 2];
    var delta = prev ? Math.round((last[1] - prev[1]) / prev[1] * 1000) / 10 : 0;
    var o = A.writeOutput({
      scene: '13', bizId: rec.id, modelId: ctx.model.id, promptId: ctx.agent.promptId,
      conf: 94,
      text: last[0] + hit.key + '为 ' + A.num(last[1]) + ' ' + hit.unit +
        '，环比' + (delta >= 0 ? '增长 ' : '下降 ') + Math.abs(delta) + '%。',
      cites: get('kbDocs').filter(function (d) { return d.zskzt === '2' && d.cat === '5'; })
        .slice(0, 1).map(function (d) { return d.id; })
    });
    rec.outputId = o ? o.id : null;
    commit();
    toast('已按「' + scope.scope + '」权限范围作答，答案附口径与数据来源', 'success');
    return { ask: rec, output: o, metric: hit, delta: delta };
  };

  /* 33 AI 智能报告生成：分段生成带溯源 */
  var REPORT_TPL = {
    '1': { title: 'XXXX市房地产市场分析报告', secs: [
      ['市场总体运行情况', '网签备案量'], ['价格走势分析', '成交均价'],
      ['存量房市场情况', '存量房'], ['风险提示', null] ] },
    '2': { title: '房产交易监管月报', secs: [
      ['办件效能', '办件'], ['资金监管', '监管账户'], ['租赁市场', '租赁'] ] },
    '3': { title: '房地产市场形势汇报材料初稿', secs: [
      ['总体判断', '网签备案量'], ['价格与库存', '成交均价'], ['存在问题', null] ] },
    '4': { title: '专题研判报告', secs: [
      ['专题背景', '网签备案量'], ['数据分析', '监管账户'], ['研判结论', null] ] }
  };
  act.reportTpl = function () { return REPORT_TPL; };
  act.genReport = function (bglx) {
    var tpl = REPORT_TPL[String(bglx)];
    if (!tpl) { toast('请先选择报告类型', 'error'); return null; }
    var ctx = requireAgent('14', '报告生成');
    if (!ctx) return null;
    var d = new Date();
    var rp = {
      id: nid('BG'), bglx: String(bglx),
      title: d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月' + tpl.title,
      bgzt: '0', sections: [], modelId: ctx.model.id, mxmc: ctx.model.mc, ver: ctx.model.ver,
      conf: 90, czr: me().name, at: Date.now(), finalBy: null, finalAt: null
    };
    tpl.secs.forEach(function (s) {
      var mk = null;
      METRICS.forEach(function (m) { if (m.key === s[1]) mk = m; });
      var last = mk ? mk.chart[mk.chart.length - 1] : null;
      rp.sections.push({
        id: nid('DL'), title: s[0],
        text: mk
          ? last[0] + mk.key + '为 ' + A.num(last[1]) + ' ' + mk.unit + '，口径：' + mk.metric
          : '待补充：本段缺少数据来源，需接入对应指标后才能定稿。',
        sources: mk ? mk.sources : []
      });
    });
    A.db().reports.unshift(rp);
    /* 生成完即进入待人工，段落缺溯源的不可定稿 */
    A.move('bgzt', rp, 'bgzt', '1');
    var noCite = rp.sections.filter(function (s) { return !s.sources.length; }).length;
    A.writeOutput({
      scene: '14', bizId: rp.id, modelId: ctx.model.id, promptId: ctx.agent.promptId,
      conf: 90, text: '生成 ' + rp.sections.length + ' 个段落' +
        (noCite ? '，其中 ' + noCite + ' 段缺少数据来源，不可定稿' : '，全部段落均有数据来源'),
      cites: get('kbDocs').filter(function (x) { return x.zskzt === '2' && x.cat === '1'; })
        .slice(0, 2).map(function (x) { return x.id; })
    });
    commit();
    toast('已生成 ' + rp.sections.length + ' 段' + (noCite ? '，' + noCite + ' 段缺溯源需补充后才能定稿' : ''), 'success');
    return rp;
  };
  /* 补齐段落溯源 */
  act.fillSection = function (reportId, secId, metricKey) {
    var rp = byId('reports', reportId);
    if (!rp) return;
    var sec = null;
    rp.sections.forEach(function (s) { if (s.id === secId) sec = s; });
    if (!sec) return;
    var mk = null;
    METRICS.forEach(function (m) { if (m.key === metricKey) mk = m; });
    if (!mk) { toast('请选择要挂接的指标口径', 'error'); return; }
    var last = mk.chart[mk.chart.length - 1];
    sec.sources = mk.sources;
    sec.text = last[0] + mk.key + '为 ' + A.num(last[1]) + ' ' + mk.unit + '，口径：' + mk.metric;
    commit();
    toast('已为「' + sec.title + '」挂接指标口径与数据来源', 'success');
  };
  /* 定稿：段落必须全部有溯源 */
  act.finalizeReport = function (id) {
    var rp = byId('reports', id);
    if (!rp) return;
    var noCite = rp.sections.filter(function (s) { return !s.sources.length; });
    if (noCite.length) {
      toast('还有 ' + noCite.length + ' 个段落缺少数据来源，按输出治理要求不可定稿：' +
        noCite.map(function (s) { return s.title; }).join('、'), 'error');
      return;
    }
    A.confirm({
      title: '报告定稿', type: 'info', okText: '定稿',
      message: '确定把《' + rp.title + '》定稿吗？',
      detail: '全部 ' + rp.sections.length + ' 个段落均已挂接数据来源。定稿后即视为人工确认，可对外报送。',
      onOk: function () {
        if (!A.move('bgzt', rp, 'bgzt', '2')) return;
        rp.finalBy = me().name;
        rp.finalAt = Date.now();
        commit();
        toast('已定稿，可对外报送', 'success');
      }
    });
  };

  /* 34 AI 舆情监测：分类分级溯源 + 处置建议 */
  act.classifySentiment = function (id) {
    var s = byId('sentiments', id);
    if (!s) return null;
    var m = where('models', function (x) {
      return x.mc.indexOf('SentimentBERT') >= 0 && x.mxzt === '3' && x.enabled;
    })[0];
    if (!m) { toast('舆情研判模型未发布或已停用', 'error'); return null; }
    m.calls++;
    var o = A.writeOutput({
      scene: '15', bizId: 'YQ-' + s.id, modelId: m.id, promptId: null, conf: s.conf,
      text: '分类：' + dict('yqfl', s.yqfl) + '；级别：' + dict('yqlv', s.yqlv) +
        '；来源：' + s.src + '。处置建议：' + s.advice,
      cites: []
    });
    s.outputId = o ? o.id : null;
    commit();
    toast('已完成分类分级与溯源，处置建议需人工确认', 'success');
    return o;
  };
  act.handleSentiment = function (id) {
    var s = byId('sentiments', id);
    if (!s) return;
    var o = s.outputId ? byId('outputs', s.outputId) : null;
    if (!o) { toast('请先执行智能研判', 'error'); return; }
    if (o.qrzt === '0') { toast('研判结论未人工确认，不能执行处置', 'error'); return; }
    s.zt = '1';
    s.handleBy = me().name;
    s.handleAt = Date.now();
    commit();
    toast('已按处置建议办理并留痕', 'success');
  };
  /* 高级别舆情转预警线索（仍进待确认池） */
  act.sentimentToClue = function (id) {
    var s = byId('sentiments', id);
    if (!s) return;
    if (s.toClue) { toast('该舆情已生成线索', 'error'); return; }
    if (s.yqlv !== '3' && s.yqlv !== '4') {
      toast('仅「重要」与「紧急」级别舆情才转预警线索', 'error');
      return;
    }
    var m = where('models', function (x) { return x.mc.indexOf('ProjectRisk') >= 0; })[0];
    A.db().clues.unshift({
      id: nid('XS'), subject: s.title.replace(/^.*?（?/, '').slice(0, 20) || s.title,
      stlx: '2', score: s.yqlv === '4' ? 80 : 66,
      reason: '高级别舆情触发：' + s.title + '。' + s.advice,
      xszt: '0', pushAt: null, confirmBy: null, excludeReason: null,
      modelId: m ? m.id : null, mxmc: m ? m.mc : '—', ver: m ? m.ver : '—',
      conf: s.conf, at: Date.now()
    });
    s.toClue = 1;
    notify('3', '预警线索提醒', '高级别舆情生成 1 条待确认线索', '../analyst/risk-clue.html');
    commit();
    toast('已生成待确认线索，需人工确认后才推送预警督办中心', 'success');
  };

  /* ==========================================================================
     智能风险研判 wsai-10（动作 36~39）
     ========================================================================== */

  /* 按因子权重算主体风险分：正向因子加分，反向因子减分 */
  function scoreOf(subject, factors) {
    var total = 0, sumW = 0, contrib = [];
    factors.forEach(function (f, i) {
      var raw = subject.raw[i] == null ? 0 : subject.raw[i];
      var v = f.dir > 0 ? raw : (100 - raw);
      var c = v * f.weight / 100;
      total += c;
      sumW += f.weight;
      contrib.push({ mc: f.mc, weight: f.weight, raw: raw, dir: f.dir, contrib: Math.round(c * 10) / 10 });
    });
    var score = sumW ? Math.round(total / sumW * 100) : 0;
    contrib.sort(function (a, b) { return b.contrib - a.contrib; });
    return { score: score, contrib: contrib };
  }
  function lvOf(score) {
    return score >= 80 ? 'red' : score >= 65 ? 'orange' : score >= 45 ? 'yellow' : 'blue';
  }
  act.scoreOf = scoreOf;
  act.lvOf = lvOf;

  /* 36 风险智能研判：出分数、因子贡献与监管建议，超阈值自动生成线索 */
  var CLUE_THRESHOLD = 78;
  act.clueThreshold = function () { return CLUE_THRESHOLD; };
  act.judgeRisk = function (id) {
    var s = byId('subjects', id);
    if (!s) return null;
    var ctx = requireAgent('16', '风险研判');
    if (!ctx) return null;
    var r = scoreOf(s, get('factors'));
    s.score = r.score;
    s.lv = lvOf(r.score);
    s.judged = 1;
    s.updatedAt = Date.now();
    var top = r.contrib.slice(0, 2).map(function (c) { return c.mc; }).join('、');
    s.advice = r.score >= CLUE_THRESHOLD
      ? '建议约谈' + (s.stlx === '1' ? '企业负责人' : '项目负责人') + '，重点核查' + top + '，并纳入重点监管名单。'
      : (r.score >= 65 ? '建议加强日常监测，关注' + top + '的变化趋势。' : '风险可控，按常规频次监测即可。');
    var o = A.writeOutput({
      scene: '16', bizId: 'ZT-' + s.mc, modelId: ctx.model.id, promptId: ctx.agent.promptId,
      conf: 90, text: '风险分 ' + r.score + '（' + dict('yqlv', s.lv === 'red' ? '4' : s.lv === 'orange' ? '3' : '2') +
        '），主要贡献因子：' + top + '。' + s.advice,
      cites: get('kbDocs').filter(function (d) {
        return d.zskzt === '2' && d.title.indexOf('信用') >= 0;
      }).map(function (d) { return d.id; })
    });
    s.outputId = o ? o.id : null;
    /* 超阈值自动生成待确认线索（约束三：不直接成案） */
    var made = false;
    if (r.score >= CLUE_THRESHOLD) {
      var dup = where('clues', function (c) { return c.subject === s.mc && c.xszt === '0'; }).length;
      if (!dup) {
        A.db().clues.unshift({
          id: nid('XS'), subject: s.mc, stlx: s.stlx, score: r.score,
          reason: '风险分 ' + r.score + ' 超过 ' + CLUE_THRESHOLD + ' 分阈值，主要贡献因子：' + top + '。',
          xszt: '0', pushAt: null, confirmBy: null, excludeReason: null,
          modelId: ctx.model.id, mxmc: ctx.model.mc, ver: ctx.model.ver,
          conf: 90, at: Date.now()
        });
        made = true;
        notify('3', '预警线索提醒', '「' + s.mc + '」风险分 ' + r.score + '，生成 1 条待确认线索', '../analyst/risk-clue.html');
      }
    }
    commit();
    toast('研判完成，风险分 ' + r.score + (made ? '，已生成待确认预警线索' : ''), r.score >= CLUE_THRESHOLD ? 'error' : 'success');
    return { subject: s, result: r, output: o };
  };
  act.judgeAll = function () {
    var ctx = requireAgent('16', '风险研判');
    if (!ctx) return;
    var n = 0, made = 0;
    get('subjects').forEach(function (s) {
      var r = scoreOf(s, get('factors'));
      s.score = r.score;
      s.lv = lvOf(r.score);
      s.judged = 1;
      s.updatedAt = Date.now();
      n++;
      if (r.score >= CLUE_THRESHOLD) {
        var dup = where('clues', function (c) { return c.subject === s.mc && c.xszt === '0'; }).length;
        if (!dup) {
          A.db().clues.unshift({
            id: nid('XS'), subject: s.mc, stlx: s.stlx, score: r.score,
            reason: '批量研判：风险分 ' + r.score + ' 超过 ' + CLUE_THRESHOLD + ' 分阈值。',
            xszt: '0', pushAt: null, confirmBy: null, excludeReason: null,
            modelId: ctx.model.id, mxmc: ctx.model.mc, ver: ctx.model.ver,
            conf: 88, at: Date.now()
          });
          made++;
        }
      }
    });
    commit();
    toast('已批量研判 ' + n + ' 个主体' + (made ? '，新增 ' + made + ' 条待确认线索' : ''), 'success');
  };

  /* 37 风险权重模型管理：试算立即重算全部主体分数，保存才生效 */
  act.trialWeights = function (weights) {
    var fs = get('factors').map(function (f, i) {
      return {
        id: f.id, mc: f.mc, dir: f.dir,
        weight: weights && weights[i] != null ? Number(weights[i]) : f.weight
      };
    });
    var sum = fs.reduce(function (s, f) { return s + f.weight; }, 0);
    var rows = get('subjects').map(function (s) {
      var oldR = scoreOf(s, get('factors'));
      var newR = scoreOf(s, fs);
      return {
        mc: s.mc, stlx: s.stlx,
        oldScore: oldR.score, newScore: newR.score,
        oldLv: lvOf(oldR.score), newLv: lvOf(newR.score),
        delta: newR.score - oldR.score
      };
    });
    var willClue = rows.filter(function (r) {
      return r.newScore >= CLUE_THRESHOLD && r.oldScore < CLUE_THRESHOLD;
    }).length;
    var dropClue = rows.filter(function (r) {
      return r.oldScore >= CLUE_THRESHOLD && r.newScore < CLUE_THRESHOLD;
    }).length;
    return { sum: sum, rows: rows, willClue: willClue, dropClue: dropClue, factors: fs };
  };
  act.saveWeights = function (weights) {
    var t = act.trialWeights(weights);
    if (t.sum !== 100) {
      toast('因子权重合计为 ' + t.sum + '%，必须等于 100% 才能保存', 'error');
      return;
    }
    A.confirm({
      title: '保存风险权重模型', type: 'warning', okText: '保存并生效',
      message: '确定保存新的因子权重吗？',
      detail: '按新权重试算：' + t.willClue + ' 个主体将新增超阈值、' + t.dropClue +
        ' 个主体将回落到阈值以下。保存后会生成新的权重版本，历史版本可回溯试算。',
      onOk: function () {
        var fs = get('factors');
        var seg = (fs[0] ? fs[0].ver : 'v2.0').replace(/^v/, '').split('.');
        seg[1] = String(Number(seg[1] || 0) + 1);
        var newVer = 'v' + seg.join('.');
        fs.forEach(function (f, i) {
          if (weights && weights[i] != null) f.weight = Number(weights[i]);
          f.ver = newVer;
        });
        /* 权重生效后重算全部主体，可能增减线索 */
        var made = 0;
        get('subjects').forEach(function (s) {
          if (!s.judged) return;
          var r = scoreOf(s, fs);
          s.score = r.score;
          s.lv = lvOf(r.score);
          s.updatedAt = Date.now();
          if (r.score >= CLUE_THRESHOLD) {
            var dup = where('clues', function (c) { return c.subject === s.mc && c.xszt === '0'; }).length;
            if (!dup) {
              A.db().clues.unshift({
                id: nid('XS'), subject: s.mc, stlx: s.stlx, score: r.score,
                reason: '权重模型 ' + newVer + ' 生效后重算：风险分 ' + r.score + ' 超过阈值。',
                xszt: '0', pushAt: null, confirmBy: null, excludeReason: null,
                modelId: null, mxmc: '风险权重模型 ' + newVer, ver: newVer,
                conf: 85, at: Date.now()
              });
              made++;
            }
          }
        });
        notify('4', '权重模型更新', '风险权重模型已更新为 ' + newVer + (made ? '，新增 ' + made + ' 条待确认线索' : ''), '../analyst/risk-weight.html');
        commit();
        toast('权重模型 ' + newVer + ' 已生效' + (made ? '，新增 ' + made + ' 条待确认线索' : ''), 'success');
      }
    });
  };

  /* 38 预警线索智能生成：确认后才推送预警督办（约束三） */
  act.confirmClue = function (id) {
    var c = byId('clues', id);
    if (!c) return;
    A.confirm({
      title: '确认预警线索', type: 'warning', okText: '确认并推送',
      message: '确定确认「' + c.subject + '」这条线索吗？',
      detail: '确认后线索推送至综合预警与督办闭环中心（wsyjdb），进入正式预警与督办流程。风险分 ' + c.score + '，置信度 ' + c.conf + '%。',
      onOk: function () {
        if (!A.move('xszt', c, 'xszt', '1')) return;
        c.confirmBy = me().name;
        c.pushAt = Date.now();
        /* 确认动作本身也是一次人工确认，回流为正样本 */
        if (c.modelId) {
          var m = byId('models', c.modelId);
          if (m) m.acc = Math.min(99.5, Math.round((m.acc + 0.1) * 10) / 10);
        }
        /* 命中的因子累计命中次数，供权重优化参考 */
        get('factors').forEach(function (f) {
          if (c.reason.indexOf(f.mc) >= 0) f.hits++;
        });
        notify('2', '督办推送', '线索「' + c.subject + '」已推送至综合预警与督办闭环中心', '');
        commit();
        /* 约束三满足后才真正推送 */
        if (A.guard.clue(c)) {
          A.pushTo('综合预警与督办闭环中心（wsyjdb）', '线索「' + c.subject + '」风险分 ' + c.score, null);
        }
      }
    });
  };
  /* 未确认直接点推送：演示约束三的拦截 */
  act.pushClue = function (id) {
    var c = byId('clues', id);
    if (!A.guard.clue(c)) return;
    A.pushTo('综合预警与督办闭环中心（wsyjdb）', '线索「' + c.subject + '」风险分 ' + c.score, null);
  };
  act.excludeClue = function (id) {
    var c = byId('clues', id);
    if (!c) return;
    var reason = window.prompt('请填写排除理由（将回流用于因子权重优化）', '');
    if (reason == null) return;
    if (!String(reason).trim()) { toast('排除线索必须填写理由', 'error'); return; }
    if (!A.move('xszt', c, 'xszt', '2')) return;
    c.excludeReason = String(reason).trim();
    c.confirmBy = me().name;
    /* 排除视为误报，回流调模型与因子 */
    if (c.modelId) {
      var m = byId('models', c.modelId);
      if (m) { m.fpr = Math.round((m.fpr + 0.3) * 10) / 10; m.samples++; }
    }
    commit();
    toast('已排除，误报已回流用于因子权重优化', 'success');
  };

  /* 39 数据质量问题智能归因 + 推送整改 */
  act.attribute = function (id) {
    var d = byId('dqIssues', id);
    if (!d) return null;
    var ctx = requireAgent('13', '智能问数');
    if (!ctx) return null;
    d.attributed = 1;
    var o = A.writeOutput({
      scene: '17', bizId: 'ZL-' + d.tbl + '.' + d.field,
      modelId: ctx.model.id, promptId: ctx.agent.promptId, conf: d.conf,
      text: '归因：' + d.cause + ' 整改建议：' + d.advice, cites: []
    });
    d.outputId = o ? o.id : null;
    commit();
    toast('归因完成，整改建议需人工确认后才能推送', 'success');
    return o;
  };
  act.pushRectify = function (id) {
    var d = byId('dqIssues', id);
    if (!d) return;
    if (!d.attributed) { toast('请先执行智能归因', 'error'); return; }
    var o = d.outputId ? byId('outputs', d.outputId) : null;
    if (!o) { toast('请先执行智能归因', 'error'); return; }
    if (o.qrzt === '0') { toast('归因结论未人工确认，不能推送整改', 'error'); return; }
    if (d.pushed) { toast('该问题已推送整改', 'error'); return; }
    d.pushed = 1;
    d.zt = '1';
    d.handleBy = me().name;
    d.handleAt = Date.now();
    commit();
    A.pushTo('房产交易数据中心 · 数据标准与质量治理', d.tbl + '.' + d.field + ' 共 ' + A.num(d.cnt) + ' 条问题', null);
  };

  window.AI.act = act;
})();
