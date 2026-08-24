/* ==========================================================================
   统一工作门户 · 演示数据仓 (flow-data.js)
   职责：定义 mock 业务状态的存储与种子数据。逻辑（状态机、业务规则、66 个
         闭环动作、渲染helper）在 flow.js 中，本文件只负责「数据长什么样」。
   引入顺序：app.js → flow-data.js → flow.js
   口径：字段名对齐《第01章 统一工作门户（wsbiz）》表结构，行政区划、人名、
         楼盘名均为演示用中性名称，证件号与手机号脱敏。
   ========================================================================== */
(function () {
  'use strict';

  var DAY = 86400000, HOUR = 3600000;
  var STORE_KEY = 'wsbiz.flow.v2';
  var memory = null;   /* file:// 下 localStorage 不可用时的兜底 */

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function shift(days, hours) { return Date.now() + (days || 0) * DAY + (hours || 0) * HOUR; }
  function ymd(ts) { var d = new Date(ts); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function pick(arr, i) { return arr[((i % arr.length) + arr.length) % arr.length]; }
  function nid(db, prefix) { db._seq = (db._seq || 0) + 1; return prefix + pad(db._seq); }

  /* ------------------------------- 基础名录 ------------------------------- */
  var ME = { id: 'U001', name: '韦晓明', dept: '综合受理科', post: '业务审核员', said: '100100', roles: ['sl', 'sh'] };

  var USERS = [
    ME,
    { id: 'U002', name: '覃丽华', dept: '商品房备案科', post: '业务审核员', said: '100100', roles: ['sh'] },
    { id: 'U003', name: '梁建平', dept: '综合受理科', post: '科室负责人', said: '100100', roles: ['fzr', 'sh'] },
    { id: 'U004', name: '莫振华', dept: '交易大厅一窗受理', post: '窗口受理员', said: '100100', roles: ['sl'] },
    { id: 'U005', name: '陆雨晴', dept: '新城区房产交易所', post: '县区经办员', said: '100106', roles: ['sl', 'sh'] },
    { id: 'U006', name: '黄敏', dept: '存量房备案科', post: '业务审核员', said: '100100', roles: ['sh'] },
    { id: 'U007', name: '廖建华', dept: '综合受理科', post: '事项管理员', said: '100100', roles: ['pz'] }
  ];

  /* 事项目录：[事项代码, 名称, 业务大类, 办理层级, 承办科室, 法定工作日, 承诺工作日, 收费类型, 热门] */
  var ITEMS = [
    ['SX0101', '商品房买卖合同网签备案', '01', '3', '商品房备案科', 10, 3, '4', 1],
    ['SX0102', '商品房预售许可申请', '12', '1', '市场监管科', 20, 10, '0', 0],
    ['SX0103', '商品房现售备案', '01', '1', '商品房备案科', 10, 5, '4', 0],
    ['SX0104', '商品房买卖合同变更备案', '01', '3', '商品房备案科', 10, 3, '4', 0],
    ['SX0105', '商品房买卖合同撤销备案', '01', '3', '商品房备案科', 10, 5, '4', 0],
    ['SX0201', '存量房买卖合同网签备案', '02', '3', '存量房备案科', 7, 2, '4', 1],
    ['SX0202', '存量房交易资金监管账户开立', '09', '3', '资金监管科', 5, 2, '4', 0],
    ['SX0301', '房屋租赁合同备案', '03', '3', '租赁管理科', 7, 3, '4', 1],
    ['SX0302', '住房租赁企业开业报告', '03', '2', '租赁管理科', 10, 5, '4', 0],
    ['SX0401', '房屋抵押合同备案', '04', '3', '抵押备案科', 7, 2, '3', 1],
    ['SX0402', '房屋抵押注销备案', '04', '3', '抵押备案科', 5, 1, '4', 0],
    ['SX0403', '房屋交易限制登记', '04', '1', '抵押备案科', 5, 3, '4', 0],
    ['SX0501', '安置房交易备案', '05', '3', '政策性住房科', 10, 5, '4', 1],
    ['SX0601', '房产测绘成果备案', '06', '1', '测绘成果科', 15, 7, '1', 1],
    ['SX0701', '房产档案查询出证', '07', '3', '档案管理科', 3, 1, '3', 1],
    ['SX0801', '商品房预售资金监管账户开立', '08', '1', '资金监管科', 10, 5, '4', 1],
    ['SX0901', '住宅专项维修资金缴存', '10', '3', '维修资金科', 5, 2, '4', 1],
    ['SX1401', '办结件信息更正', '14', '3', '综合受理科', 10, 5, '4', 1]
  ];

  /* 材料目录：[编码, 名称, 类型, 格式, 有效期(月,0=长期), 可复用] */
  var MDEFS = [
    ['CL01', '居民身份证', '身份证明', 'PDF/JPG', 0, 1],
    ['CL02', '户口簿', '身份证明', 'PDF/JPG', 0, 1],
    ['CL03', '结婚证', '身份证明', 'PDF/JPG', 0, 1],
    ['CL04', '营业执照', '主体资格', 'PDF', 0, 1],
    ['CL05', '法定代表人身份证明', '主体资格', 'PDF', 12, 1],
    ['CL06', '授权委托书', '委托材料', 'PDF', 6, 0],
    ['CL07', '商品房预售许可证', '许可证照', 'PDF', 0, 1],
    ['CL08', '商品房买卖合同', '合同文本', 'PDF', 0, 0],
    ['CL09', '不动产权证书', '权属证明', 'PDF/JPG', 0, 1],
    ['CL10', '房屋测绘报告', '技术报告', 'PDF', 0, 1],
    ['CL11', '契税完税凭证', '税费凭证', 'PDF', 0, 0],
    ['CL12', '维修资金缴存凭证', '税费凭证', 'PDF', 0, 0],
    ['CL13', '房屋抵押合同', '合同文本', 'PDF', 0, 0],
    ['CL14', '金融机构营业执照', '主体资格', 'PDF', 0, 1],
    ['CL15', '借款合同', '合同文本', 'PDF', 0, 0],
    ['CL16', '房屋租赁合同', '合同文本', 'PDF', 0, 0],
    ['CL17', '房屋交付使用证明', '权属证明', 'PDF', 0, 0],
    ['CL18', '竣工验收备案表', '许可证照', 'PDF', 0, 1],
    ['CL19', '国有土地使用权证', '权属证明', 'PDF', 0, 1],
    ['CL20', '建设工程规划许可证', '许可证照', 'PDF', 0, 1],
    ['CL21', '建筑工程施工许可证', '许可证照', 'PDF', 0, 1],
    ['CL22', '资金监管协议', '合同文本', 'PDF', 0, 0],
    ['CL23', '银行开户许可证', '主体资格', 'PDF', 0, 1],
    ['CL24', '婚姻状况证明', '身份证明', 'PDF', 6, 0],
    ['CL25', '无房证明', '权属证明', 'PDF', 3, 0],
    ['CL26', '居住证', '身份证明', 'PDF/JPG', 12, 1]
  ];

  /* 申请人：[名称, 主体类型, 证件号(脱敏), 联系电话(脱敏)] */
  var APPS = [
    ['韦志强', '1', '10010219850312****', '137****2856'],
    ['覃美玲', '1', '10010219900726****', '138****4471'],
    ['莫小燕', '1', '10012619880419****', '135****9023'],
    ['黄建国', '1', '10010319761105****', '136****6612'],
    ['陆文斌', '1', '10010419920228****', '139****3308'],
    ['梁秀英', '1', '10010519830917****', '133****7745'],
    ['廖桂芳', '1', '10012319870604****', '188****2190'],
    ['蒙志伟', '1', '10012219910813****', '159****5567'],
    ['罗永年', '1', '10010619790502****', '186****6034'],
    ['潘秀珍', '1', '10012419861220****', '177****8815'],
    ['华信置地房地产开发有限公司', '2', '91100100MA5K3X****', '0100-286****'],
    ['华信嘉苑置业有限公司', '2', '91100100718825****', '0100-388****'],
    ['华信建工地产有限责任公司', '2', '91100100196204****', '0100-266****'],
    ['华信安居房屋租赁有限公司', '2', '91100100MA5PQ7****', '0100-215****']
  ];

  /* 房屋：[坐落, 房屋编码, 项目名, 区划, 项目地址]
     项目名与道路名均为演示用虚构名称，不指向任何真实楼盘 */
  var HOUSES = [
    ['锦绣家园 12 栋 1 单元 1802', '100104-JX-12-1802', '锦绣家园', '100104', '南城区兴华大道 8 号'],
    ['翰林苑 5 栋 2 单元 0906', '100104-HL-05-0906', '翰林苑', '100104', '南城区学苑路 66 号'],
    ['中央公园里 3 栋 2501', '100102-ZY-03-2501', '中央公园里', '100102', '东城区滨河路 12 号'],
    ['学府壹号 8 栋 1 单元 1103', '100103-XF-08-1103', '学府壹号', '100103', '西城区文昌路 188 号'],
    ['江山原著 2 栋 1602', '100105-JS-02-1602', '江山原著', '100105', '北城区长虹路 39 号'],
    ['翠湖天地 15 栋 0703', '100106-CH-15-0703', '翠湖天地', '100106', '新城区科技大道 5 号'],
    ['环球金融广场 A 座 2208', '100102-HQ-0A-2208', '环球金融广场', '100102', '东城区中山东路 9 号'],
    ['滨江玖玺 6 栋 1205', '100123-BJ-06-1205', '滨江玖玺', '100123', '长丰县平安路 28 号'],
    ['阳光新城 21 栋 0801', '100104-YG-21-0801', '阳光新城', '100104', '南城区解放路 216 号'],
    ['江畔人家 4 栋 0602', '100124-JP-04-0602', '江畔人家', '100124', '清河县清河大道 15 号']
  ];

  var NODES = ['一窗受理', '材料初审', '业务复核', '科长审批', '出件登簿'];
  var WEEK = ['周一', '周二', '周三', '周四', '周五'];
  var SLOTS = ['09:00-10:30', '10:30-12:00', '14:30-16:00', '16:00-17:30'];

  /* ============================== 种子数据 ============================== */
  function seed() {
    var db = {
      _seq: 0,
      me: ME, users: USERS,
      items: [], materialDefs: [], cases: [], tasks: [], taskLogs: [], caseLogs: [],
      materials: [], corrections: [], docs: [], verifies: [], appts: [], queue: [],
      windows: [], shifts: [], reviews: [], rectifies: [], msgs: [], queries: [],
      policies: [], hardCases: [], news: [], notices: [], archives: [], guides: [],
      prefs: {
        quick: ['intake', 'my-approval', 'material-correct', 'cross-query', 'appointment', 'case-ledger'],
        cards: { todo: 1, kpi: 1, chart: 1, msg: 1 }
      },
      shiftPublished: 1
    };

    /* ---------- 事项目录与办事指南 ---------- */
    ITEMS.forEach(function (r, i) {
      var it = {
        id: nid(db, 'I'), sxdm: r[0], sxmc: r[1], ywdlm: r[2], bllj: r[3], dept: r[4],
        fdsx: r[5], cnsx: r[6], sflx: r[7], hot: r[8], enabled: 1,
        cond: '申请人为合同当事人或其合法授权代理人；房屋权属清晰，无查封、异议登记等交易限制。',
        sample: '示范样表.pdf', flow: NODES.slice(0, 4), clist: [], localDiff: [],
        /* 办理指引：审核要点与常见退件原因 */
        points: ['核对合同当事人与不动产权证书权利人是否一致', '核对成交价格是否低于计税指导价', '核对是否存在在先备案或查封信息'],
        rejects: ['合同金额与完税凭证不一致', '授权委托书未载明具体事项范围', '测绘报告与合同约定面积不符']
      };
      var n = 4 + (i % 3);
      for (var k = 0; k < n; k++) {
        var d = pick(MDEFS, i * 3 + k);
        it.clist.push({ cldm: d[0], clmc: d[1], must: k < 2 ? 1 : 0, exempt: k === n - 1 ? 1 : 0 });
      }
      db.items.push(it);
    });
    /* 县区属地差异：新城区对存量房备案压缩时限并减免一项材料 */
    db.items[5].localDiff.push({ said: '100106', dept: '新城区房产交易所', cnsx: 1, note: '减免「无房证明」，由数据共享代替' });
    db.items[0].localDiff.push({ said: '100123', dept: '长丰县房产交易所', cnsx: 4, note: '承诺时限延长至 4 个工作日' });

    /* ---------- 材料目录 ---------- */
    MDEFS.forEach(function (r, i) {
      db.materialDefs.push({
        id: nid(db, 'M'), cldm: r[0], clmc: r[1], cllx: r[2], gs: r[3], yxq: r[4],
        reuse: r[5], useCount: 26 + (i * 37) % 420, bzCount: (i * 13) % 19
      });
    });

    /* ---------- 窗口与排班 ---------- */
    [['W01', '1 号窗口', '综合窗口', '全部业务', '100100'],
     ['W02', '2 号窗口', '综合窗口', '全部业务', '100100'],
     ['W03', '3 号窗口', '专业窗口', '商品房交易', '100100'],
     ['W04', '4 号窗口', '专业窗口', '存量房交易', '100100'],
     ['W05', '5 号窗口', '专业窗口', '抵押与交易限制', '100100'],
     ['W06', '6 号窗口', '专业窗口', '资金监管与维修资金', '100100'],
     ['W07', '新城区 1 号窗口', '综合窗口', '全部业务', '100106']
    ].forEach(function (r) {
      db.windows.push({ id: r[0], name: r[1], type: r[2], scope: r[3], said: r[4], enabled: 1, cap: 12 });
    });
    db.windows.forEach(function (w, wi) {
      WEEK.forEach(function (day, di) {
        var u = pick(USERS, wi + di + 3);
        db.shifts.push({ id: nid(db, 'S'), wid: w.id, wname: w.name, day: day, userId: u.id, userName: u.name });
      });
    });

    /* ---------- 办件 40 条 ---------- */
    /* 状态配比：在办 20 条支撑待办与预警演示，办结 15 条支撑台账与趋势演示 */
    var plan = [];
    var add = function (zt, n) { for (var i = 0; i < n; i++) plan.push(zt); };
    add('0', 3); add('1', 12); add('2', 15); add('3', 1); add('4', 3); add('5', 5); add('6', 1);

    plan.forEach(function (zt, i) {
      var it = pick(db.items, i * 5 + 1);
      var ap = pick(APPS, i * 3);
      var hs = pick(HOUSES, i * 7);
      var said = (i % 5 === 0) ? hs[3] : '100100';
      var span = Math.round(it.cnsx * 1.4) * DAY;
      var sjsj, slsj, cnwcsj;
      if (zt === '0' || zt === '1' || zt === '5' || zt === '6') {
        /* 在办件按「已消耗时限占比」分档，让四色预警各有样本，
           且以正常件为主（约 2 条超期、2 条预警、1 条提示，其余正常） */
        var b = i % 11, frac;
        if (b === 1 || b === 7) frac = 1.3;        /* 红 · 超期 */
        else if (b === 3 || b === 9) frac = 0.88;  /* 橙 · 预警 */
        else if (b === 5) frac = 0.62;             /* 黄 · 提示 */
        else frac = 0.12 + (b % 4) * 0.08;         /* 蓝 · 正常 */
        var consumed = Math.round(span * frac);
        cnwcsj = Date.now() + (span - consumed);
        slsj = cnwcsj - span;
        sjsj = slsj - 2 * HOUR;
        if (zt === '0') slsj = null;               /* 待受理件尚未签收，时限未起算 */
      } else {
        /* 已办结、已退件、已撤件铺在近半年内，且向近期加权（幂次分布），
           这样近 6 个月趋势图有走势，本月办结量也不会失真地偏低 */
        var r = ((i * 7) % 20) / 20;
        sjsj = shift(-(3 + Math.round(Math.pow(r, 2.2) * 150)), -(i % 9));
        slsj = sjsj + 2 * HOUR;
        cnwcsj = slsj + span;
      }
      /* 办结件与退件里各有一半归当前用户，个人看板才有足够样本 */
      var mineHist = (zt === '2' || zt === '4') && (i % 2 === 0);
      var jbr = (zt === '0') ? null : (mineHist ? ME : pick(USERS, i));
      var pre = it.ywdlm === '01' ? 'SWB' : it.ywdlm === '02' ? 'CWB' : it.ywdlm === '03' ? 'ZWB' : 'DWB';
      var c = {
        id: nid(db, 'C'),
        sjbh: 'HX' + said + ymd(sjsj).slice(0, 6) + pad((i * 7 % 90) + 6),
        sxdm: it.sxdm, sxmc: it.sxmc, ywdlm: it.ywdlm, dept: it.dept,
        blzt: zt, said: said, sjfs: String(i % 9),
        sjly: pick(['01', '01', '02', '03', '05', '07'], i),
        sqr: ap[0], sqrlx: ap[1], sqrzjh: ap[2], sqrdh: ap[3],
        fw: hs[0], fwbm: hs[1], xmmc: hs[2], zl: hs[4],
        htbh: 'HX' + pre + '2026-' + pad(100 + i) + '66',
        gllx: '0', glbjzj: null, gzbs: '0', ygzsjbh: null,
        sjsj: sjsj, slsj: slsj, cnwcsj: cnwcsj,
        /* 十条办结件中留两条超期办结，按时办结率才不会是失真的 100% */
        bjsj: (zt === '2') ? (i % 9 === 4 ? cnwcsj + 9 * HOUR : cnwcsj - 6 * HOUR) : null,
        jbr: jbr ? jbr.id : null, jbrmc: jbr ? jbr.name : null,
        jd: (zt === '2' || zt === '4') ? '出件登簿' : pick(NODES, i + 1),
        ztsc: (zt === '6') ? 2 * DAY : 0,
        bzcs: (zt === '5') ? 1 : (i % 11 === 0 ? 2 : 0),
        thcs: (zt === '4') ? 1 : (i % 13 === 0 ? 2 : 0),
        gdbs: (zt === '2') ? 1 : 0,
        sfje: it.sflx === '4' ? 0 : (it.sflx === '3' ? 10 : 550 + (i % 7) * 120),
        sfzt: it.sflx === '4' ? '免收' : (zt === '2' ? '已缴' : '待缴'),
        cxm: 'CX' + pad(100 + i) + (i % 9) + (i % 7),
        aiChecked: 0, precheck: null, receiptAt: null, smsAt: null, corrNotified: 0
      };
      db.cases.push(c);

      db.caseLogs.push({
        id: nid(db, 'L'), bjzj: c.id, czlx: '1', jd: '一窗受理', czr: pick(USERS, i + 3).name,
        czsj: sjsj, yj: '材料齐全，符合受理条件，予以受理。'
      });
      if (c.slsj) {
        db.caseLogs.push({
          id: nid(db, 'L'), bjzj: c.id, czlx: '2', jd: '材料初审', czr: c.jbrmc,
          czsj: c.slsj + 4 * HOUR, yj: '要件形式审查通过，转业务复核。'
        });
      }
      if (zt === '2') {
        db.caseLogs.push({
          id: nid(db, 'L'), bjzj: c.id, czlx: '5', jd: '出件登簿', czr: c.jbrmc,
          czsj: c.bjsj, yj: '审核通过，出具备案证明，材料影像同步归档。'
        });
        db.docs.push({
          id: nid(db, 'D'), bjzj: c.id, sjbh: c.sjbh, cjlx: '0', cjmc: '备案证明',
          czr: c.jbrmc, czsj: c.bjsj, printed: 1
        });
        db.archives.push({
          id: nid(db, 'A'), bjzj: c.id, sjbh: c.sjbh, dabh: 'DA' + ymd(c.bjsj) + pad(i + 1),
          count: 4 + (i % 4), czsj: c.bjsj, way: '随办随归'
        });
      }
      if (zt === '4') {
        db.caseLogs.push({
          id: nid(db, 'L'), bjzj: c.id, czlx: '4', jd: '业务复核', czr: c.jbrmc,
          czsj: shift(-1, 0), yj: '合同金额与契税完税凭证不一致，且逾期未补正，依规退件。'
        });
        db.docs.push({
          id: nid(db, 'D'), bjzj: c.id, sjbh: c.sjbh, cjlx: '4', cjmc: '退件通知书',
          czr: c.jbrmc, czsj: shift(-1, 0), printed: 1
        });
      }
      if (zt === '6') {
        db.caseLogs.push({
          id: nid(db, 'L'), bjzj: c.id, czlx: '6', jd: '业务复核', czr: c.jbrmc,
          czsj: shift(-3, 0), yj: '申请人申请中止办理，等待补充司法查封解除证明，中止期间不计入时限。'
        });
      }

      it.clist.forEach(function (m, k) {
        db.materials.push({
          id: nid(db, 'MT'), bjzj: c.id, cldm: m.cldm, clmc: m.clmc, must: m.must,
          tjfs: m.exempt ? '2' : (c.sjly === '02' ? '1' : '0'),
          got: (zt === '0') ? 0 : 1,
          ok: (zt === '5' && k === 2) ? 0 : 1,
          bad: (zt === '5' && k === 2) ? '签章缺失，需补盖单位公章' : '',
          previewed: 0, pages: 2 + (k % 4)
        });
      });
    });

    /* 一件事：主件 + 两个子件（第01章 1.1.3） */
    var doing = db.cases.filter(function (c) { return c.blzt === '1'; });
    if (doing.length >= 3) {
      doing[0].gllx = '1';
      doing[1].gllx = '2'; doing[1].glbjzj = doing[0].id;
      doing[2].gllx = '2'; doing[2].glbjzj = doing[0].id;
    }

    /* ---------- 待办任务 ----------
       约三分之二派给当前用户构成「待我审批」，其余留在任务池待领办。
       任务承办人与办件经办人保持一致，避免两处口径打架。 */
    db.cases.forEach(function (c, i) {
      if (c.blzt !== '1' && c.blzt !== '5' && c.blzt !== '0') return;
      var rwlx = c.blzt === '5' ? '1' : (c.blzt === '0' ? '2' : '0');
      var mine = (i % 3 !== 2);
      var zt = (c.blzt === '0') ? '0' : (mine ? (i % 4 === 0 ? '2' : '1') : '0');
      var owner = (zt === '0') ? null : (mine ? ME : pick(USERS, i + 2));
      if (owner) { c.jbr = owner.id; c.jbrmc = owner.name; }
      db.tasks.push({
        id: nid(db, 'T'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc, ywdlm: c.ywdlm,
        rwlx: rwlx, rwzt: zt,
        blryzj: owner ? owner.id : null,
        blrmc: owner ? owner.name : null,
        jsdm: c.dept, jjcd: String(i % 7 === 1 ? 2 : (i % 5 === 0 ? 1 : 0)),
        jd: c.jd, said: c.said, sjly: c.sjly,
        cnwcsj: c.cnwcsj, qssj: (zt === '1' || zt === '2') ? c.slsj : null,
        createdAt: c.sjsj, sfsc: 0, urged: 0
      });
    });
    /* 任务流水：已办结的件补一条办结流水，用于「我的已办」反查 */
    db.cases.forEach(function (c) {
      if (c.blzt !== '2') return;
      db.taskLogs.push({
        id: nid(db, 'TL'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc,
        czlx: '2', czr: c.jbr, czrmc: c.jbrmc, czsj: c.bjsj, jd: '出件登簿', yj: '审核通过'
      });
    });

    /* ---------- 补正任务 ---------- */
    db.cases.filter(function (c) { return c.blzt === '5'; }).forEach(function (c, i) {
      var bad = db.materials.filter(function (m) { return m.bjzj === c.id && !m.ok; });
      var deadline = shift(i === 0 ? -2 : (i === 1 ? 1 : 5 + i), 0);   /* 第一条已逾期 */
      db.corrections.push({
        id: nid(db, 'BZ'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc, sqr: c.sqr, sqrdh: c.sqrdh,
        items: bad.length ? bad.map(function (m) { return m.clmc; }) : ['契税完税凭证'],
        reason: bad.length ? bad[0].bad : '完税凭证金额与合同金额不一致',
        deadline: deadline, createdAt: shift(-(3 + i), 0), createdBy: c.jbrmc,
        zt: '1', submitAt: null, reviewAt: null, reviewBy: null, way: '一次性告知'
      });
      c.corrNotified = 1;
    });

    /* ---------- 身份核验记录 ---------- */
    db.cases.slice(0, 14).forEach(function (c, i) {
      db.verifies.push({
        id: nid(db, 'HY'), bjzj: c.id, sjbh: c.sjbh, ztlx: c.sqrlx,
        xm: c.sqr, zjh: c.sqrzjh, hyfs: String(i % 8),
        result: (i === 5) ? 0 : 1,
        note: (i === 5) ? '姓名与身份证号不一致，已拦截并要求现场核对' : '核验通过',
        czr: pick(USERS, i + 3).name, czsj: c.sjsj + HOUR,
        proxy: (i % 6 === 2) ? { name: '罗永年', zjh: '10010619790502****', scope: c.sxmc, expire: shift(60, 0) } : null
      });
    });

    /* ---------- 预约与叫号 ---------- */
    for (var a = 0; a < 16; a++) {
      var w = pick(db.windows, a);
      var ap2 = pick(APPS, a * 2);
      var it2 = pick(db.items, a * 3);
      var st = a < 6 ? '0' : (a < 9 ? '1' : (a < 12 ? '2' : (a === 12 ? '3' : (a === 13 ? '4' : '5'))));
      db.appts.push({
        id: nid(db, 'YY'), yyh: 'YY' + ymd(shift(0, 0)) + pad(a + 1),
        sqr: ap2[0], sqrdh: ap2[3], sxdm: it2.sxdm, sxmc: it2.sxmc,
        wid: w.id, wname: w.name, said: w.said,
        date: shift(a < 9 ? 0 : -(a - 8), 0), slot: pick(SLOTS, a),
        yyzt: st, createdAt: shift(-(1 + a % 5), 0), way: pick(['统一服务门户', '微信小程序', '移动端'], a)
      });
    }
    db.appts.filter(function (x) { return x.yyzt === '1'; }).forEach(function (x, i) {
      db.queue.push({
        id: nid(db, 'PD'), pdh: 'A' + pad(i + 1), yyid: x.id, sqr: x.sqr,
        wid: x.wid, wname: x.wname, sxmc: x.sxmc, pdzt: i === 0 ? '2' : '0',
        isAppt: 1, createdAt: shift(0, -2 + i)
      });
    });
    ['莫小燕', '潘秀珍', '罗永年'].forEach(function (n, i) {
      db.queue.push({
        id: nid(db, 'PD'), pdh: 'B' + pad(i + 1), yyid: null, sqr: n,
        wid: 'W01', wname: '1 号窗口', sxmc: '房产档案查询出证', pdzt: '0',
        isAppt: 0, createdAt: shift(0, -1 + i)
      });
    });

    /* ---------- 好差评与核实 ---------- */
    var pjWays = ['窗口评价器', '统一服务门户', '移动端'];
    db.cases.filter(function (c) { return c.blzt === '2'; }).forEach(function (c, i) {
      var dj = i < 2 ? '4' : (i === 2 ? '5' : (i % 2 ? '1' : '2'));
      db.reviews.push({
        id: nid(db, 'PJ'), bjzj: c.id, sjbh: c.sjbh, sxmc: c.sxmc, sqr: c.sqr,
        pjdj: dj, way: pick(pjWays, i), content: dj >= '4' ? '等待时间较长，材料要求前后不一致。' : '办理很快，工作人员讲解清楚。',
        jbr: c.jbr, jbrmc: c.jbrmc, wid: pick(db.windows, i).id, wname: pick(db.windows, i).name,
        said: c.said, czsj: c.bjsj + HOUR, hsZt: dj >= '4' ? '0' : '-'
      });
    });
    /* 追加 10 条历史评价，凑够 20 条便于统计 */
    for (var p = 0; p < 10; p++) {
      var cc = pick(db.cases, p * 3);
      db.reviews.push({
        id: nid(db, 'PJ'), bjzj: cc.id, sjbh: cc.sjbh, sxmc: cc.sxmc, sqr: cc.sqr,
        pjdj: p < 6 ? '1' : (p < 8 ? '2' : '3'), way: pick(pjWays, p),
        content: '服务规范，一次办好。', jbr: cc.jbr || 'U002', jbrmc: cc.jbrmc || '覃丽华',
        wid: pick(db.windows, p).id, wname: pick(db.windows, p).name,
        said: cc.said, czsj: shift(-(5 + p), 0), hsZt: '-'
      });
    }

    /* ---------- 政策速查 / 疑难案例 ---------- */
    [['华建房〔2024〕12 号', '全省商品房预售资金监管办法', '资金监管', '现行有效', '1'],
     ['华信建房〔2025〕3 号', '华信市存量房交易资金监管实施细则', '资金监管', '现行有效', '3'],
     ['华信房〔2025〕18 号', '华信市商品房买卖合同网签备案操作规程', '交易网签', '现行有效', '3'],
     ['华信房〔2024〕41 号', '华信市住宅专项维修资金管理实施办法', '维修资金', '现行有效', '3'],
     ['华信房〔2023〕9 号', '华信市房屋租赁登记备案实施细则', '房屋租赁', '已废止', '3'],
     ['华建房〔2025〕6 号', '全省住房租赁企业开业报告管理规定', '房屋租赁', '现行有效', '1']
    ].forEach(function (r, i) {
      db.policies.push({
        id: nid(db, 'ZC'), wh: r[0], title: r[1], cat: r[2], status: r[3], bllj: r[4],
        pubAt: shift(-(60 + i * 40), 0), fav: 0
      });
    });
    [['存量房买卖中一方当事人在境外如何完成网签', '存量房交易', '已发布'],
     ['预售资金监管账户被司法冻结时的拨付处理', '资金监管', '已发布'],
     ['继承取得房屋后再交易的完税凭证认定', '存量房交易', '已发布'],
     ['同一房屋存在在先租赁备案时的抵押登记', '抵押与限制', '待审核']
    ].forEach(function (r, i) {
      db.hardCases.push({
        id: nid(db, 'AL'), title: r[0], cat: r[1], status: r[2],
        author: pick(USERS, i + 1).name, createdAt: shift(-(10 + i * 9), 0),
        body: '结合《民法典》与省级备案口径，按「先核权属、再核意思表示」的顺序处理，具体分三步：核验当事人身份与授权、核验房屋权属与限制状态、核验合同要件与税费凭证。',
        views: 40 + i * 23
      });
    });

    /* ---------- 消息 / 动态 / 通知 ---------- */
    var msgSeed = [
      ['0', '待办提醒', '您有 1 件商品房买卖合同网签备案待签收', 'my-approval.html'],
      ['3', '预警通知', '收件编号 HX100100202607 系列中有 3 件已超期，请优先处理', 'case-ledger.html'],
      ['1', '催办通知', '梁建平 催办：存量房买卖合同网签备案已临期', 'my-approval.html'],
      ['6', '评价提醒', '新增 2 条差评待核实整改', 'service-review.html'],
      ['0', '待办提醒', '新城区转办 1 件属地办件待接收', 'task-center.html'],
      ['4', '系统公告', '7 月 25 日 20:00-22:00 系统例行维护，期间暂停网签', 'news.html'],
      ['5', '业务动态', '本月全市商品房网签备案量同比增长 8.6%', 'news.html'],
      ['3', '预警通知', '有 1 件补正任务已逾期未补，请按规则终止或退件', 'material-correct.html'],
      ['2', '督办通知', '科室负责人督办：预售资金监管账户开立件三级递进处置', 'task-center.html'],
      ['0', '待办提醒', '您有 1 件房屋抵押合同备案待办理', 'my-approval.html'],
      ['4', '系统公告', '事项目录新增「办结件信息更正」，请及时查阅办事指南', 'item-catalog.html'],
      ['5', '业务动态', '一窗受理平均办理时长压缩至 1.8 小时', 'my-board.html']
    ];
    msgSeed.forEach(function (r, i) {
      db.msgs.push({
        id: nid(db, 'XX'), xxlx: r[0], title: r[1], content: r[2], href: r[3],
        read: i < 3 ? 0 : (i < 5 ? 0 : 1), createdAt: shift(0, -(2 + i * 3))
      });
    });
    [['本月商品房网签备案办理情况', '全市累计办理 1,286 件，按时办结率 96.2%，平均办理时长 1.8 小时。'],
     ['存量房「带押过户」推行进展', '南城区、东城区已实现全流程网办，累计办理 168 件。'],
     ['一窗受理改革阶段成效', '综合窗口占比提升至 70%，群众跑动次数由 3.2 次降至 1.1 次。']
    ].forEach(function (r, i) {
      db.news.push({
        id: nid(db, 'DT'), title: r[0], content: r[1], scope: '全市',
        author: pick(USERS, i + 2).name, createdAt: shift(-(1 + i * 4), 0)
      });
    });
    [['系统例行维护通知', '7 月 25 日 20:00-22:00 进行版本升级，期间暂停网签与备案业务。', 1],
     ['商品房买卖合同示范文本更新通知', '自 8 月 1 日起启用 2026 版示范文本，旧版本不再受理。', 1],
     ['交易大厅窗口调整通知', '3 号窗口临时调整为存量房专业窗口，为期两周。', 0]
    ].forEach(function (r, i) {
      db.notices.push({
        id: nid(db, 'TZ'), title: r[0], content: r[1], must: r[2],
        author: '综合受理科', createdAt: shift(-(2 + i * 3), 0), confirmed: 0, confirmAt: null
      });
    });

    /* ---------- 综合查询留痕 ---------- */
    [['fw', '锦绣家园 12 栋 1 单元 1802'], ['ds', '韦志强'], ['xm', '翰林苑']].forEach(function (r, i) {
      db.queries.push({
        id: nid(db, 'CX'), dim: r[0], kw: r[1], czr: ME.name,
        czsj: shift(0, -(4 + i * 6)), hit: 3 + i
      });
    });

    return db;
  }

  /* ============================== 存取 ============================== */
  function load() {
    if (memory) return memory;
    var raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) {}
    if (raw) { try { return JSON.parse(raw); } catch (e2) {} }
    var db = seed();
    persist(db);
    return db;
  }
  function persist(db) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); memory = null; }
    catch (e) { memory = db; }
  }
  function reset() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    memory = null;
    return load();
  }

  window.FLOW_DATA = {
    load: load, persist: persist, reset: reset, seed: seed,
    ME: ME, USERS: USERS, NODES: NODES, WEEK: WEEK, SLOTS: SLOTS,
    key: STORE_KEY, DAY: DAY, HOUR: HOUR
  };
})();
