/* ==========================================================================
   统一服务门户 · 演示数据仓 (portal-data.js)
   职责：只定义「数据长什么样」。字段名对齐《第18章 统一服务门户（wspsp）》
         的 26 张 PSP_ 表；状态机、业务规则与闭环动作在 portal-flow.js。
   存储：localStorage（键 wsmh.flow.v1），file:// 下自动退化为内存。
   口径：行政区划为柳州真实的 4 区 6 县；姓名、证件号、手机号均已脱敏。
   ========================================================================== */
(function () {
  'use strict';

  var DAY = 86400000;
  var STORE_KEY = 'wsmh.flow.v1';
  var memory = null;

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function shift(d) { return Date.now() + (d || 0) * DAY; }
  function ymd(ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ymdhm(ts) { var d = new Date(ts); return ymd(ts) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function pick(a, i) { return a[((i % a.length) + a.length) % a.length]; }
  function rnd(seed) { var x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  function ri(seed, min, max) { return min + Math.floor(rnd(seed) * (max - min + 1)); }

  /* ------------------------------ 基础名录 ------------------------------ */
  var QX = ['城中区', '鱼峰区', '柳南区', '柳北区', '柳江区', '柳城县', '鹿寨县', '融安县', '融水苗族自治县', '三江侗族自治县'];
  var SQ = ['文昌商圈', '五星商圈', '桂中大道', '航岭路', '柳石路', '潭中东路', '屏山大道', '静兰片区', '阳和新区', '河东新区'];

  var DEVS = [
    'XXXX市龙城房地产开发有限公司', 'XXXX市城投置业有限公司', '广西桂中置业集团有限公司',
    '柳州东城投资开发集团有限公司', 'XXXX市宏信房地产开发有限公司', 'XXXX市新城建设发展有限公司'
  ];
  var BANKS = ['柳州银行文昌支行', '桂林银行柳州分行', '中国银行柳州分行', '中国建设银行柳州分行', '中国工商银行柳州分行', '中国农业银行柳州分行'];
  var BROKERS = [
    'XXXX市安家房地产经纪有限公司', 'XXXX市宜居房产经纪服务有限公司', 'XXXX市信通房地产经纪有限公司',
    'XXXX市万家和房地产经纪有限公司', 'XXXX市龙城置业顾问有限公司'
  ];
  var RENTCOS = ['柳州安居住房租赁有限公司', 'XXXX市青年公寓管理有限公司', 'XXXX市乐居住房租赁服务有限公司'];
  var SURVEYS = ['XXXX市房产测绘队', '广西柳建测绘技术有限公司', 'XXXX市天正测绘有限公司'];
  var WULIYE = ['XXXX市龙城物业服务有限公司', '柳州保利物业服务有限公司', 'XXXX市金桂物业管理有限公司'];

  var PROJ_NAMES = [
    '龙城华府', '翠湖天著', '锦绣江南', '云顶星河', '柳江雅苑', '桂中新城',
    '阳和悦府', '静兰春晓', '文昌壹号', '河东学府', '屏山名邸', '柳北新天地',
    '融水嘉苑', '鹿寨金岸', '三江侗韵新城', '融安碧水湾'
  ];
  var COMM_NAMES = [
    '文昌小区', '五星花园', '静兰新村', '航岭家园', '潭中花苑', '桂中苑',
    '屏山雅居', '柳石小区', '河东名居', '阳和佳苑', '龙泽苑', '雅儒新村'
  ];

  /* ------------------------------ 事项目录 ------------------------------ */
  /* [代码, 名称, 业务主题, 情形, 法定工作日, 承诺工作日, 全程网办, 材料数, 热门, 承办科室] */
  var ITEMS = [
    ['SX0101', '商品房买卖合同网签备案', 'new', 'buy-new', 10, 3, 1, 6, 1, '商品房备案科'],
    ['SX0102', '商品房预售许可申请', 'new', 'company', 20, 10, 1, 12, 0, '市场监管科'],
    ['SX0103', '商品房现售备案', 'new', 'company', 10, 5, 1, 9, 0, '商品房备案科'],
    ['SX0104', '商品房买卖合同变更备案', 'new', 'buy-new', 10, 3, 1, 5, 0, '商品房备案科'],
    ['SX0105', '商品房退房与备案撤销', 'new', 'buy-new', 10, 5, 0, 7, 0, '商品房备案科'],
    ['SX0201', '存量房买卖合同网签备案', 'second', 'buy-second', 7, 2, 1, 6, 1, '存量房备案科'],
    ['SX0202', '存量房交易资金监管协议签订', 'fund', 'buy-second', 5, 2, 1, 4, 1, '资金监管科'],
    ['SX0203', '存量房交易直通车联办', 'second', 'buy-second', 15, 8, 1, 10, 1, '综合受理科'],
    ['SX0301', '房屋租赁合同备案', 'rent', 'rent', 7, 3, 1, 4, 1, '租赁管理科'],
    ['SX0302', '住房租赁企业开业报告', 'rent', 'company', 10, 5, 1, 8, 0, '租赁管理科'],
    ['SX0303', '房屋租赁备案变更', 'rent', 'rent', 5, 2, 1, 4, 0, '租赁管理科'],
    ['SX0304', '房屋租赁备案注销', 'rent', 'rent', 5, 1, 1, 3, 0, '租赁管理科'],
    ['SX0401', '房屋抵押合同备案', 'mortgage', 'loan', 7, 2, 1, 6, 1, '抵押备案科'],
    ['SX0402', '房屋抵押注销备案', 'mortgage', 'loan', 5, 1, 1, 4, 0, '抵押备案科'],
    ['SX0501', '安置房交易备案', 'policy', 'buy-second', 10, 5, 0, 8, 0, '政策性住房科'],
    ['SX0502', '房票安置房源购买登记', 'policy', 'buy-new', 5, 3, 1, 5, 1, '政策性住房科'],
    ['SX0601', '房产测绘成果备案', 'survey', 'company', 15, 7, 1, 6, 0, '测绘成果科'],
    ['SX0701', '房产档案查询出证', 'query', 'cert', 3, 1, 1, 2, 1, '档案管理科'],
    ['SX0801', '商品房预售资金监管账户开立', 'fund', 'company', 10, 5, 1, 7, 0, '资金监管科'],
    ['SX0802', '预售资金使用申请', 'fund', 'company', 7, 3, 1, 8, 0, '资金监管科'],
    ['SX0901', '住宅专项维修资金缴存', 'fund', 'buy-new', 5, 2, 1, 4, 1, '维修资金科'],
    ['SX1001', '房地产企业入网备案', 'subject', 'company', 10, 5, 1, 9, 0, '市场监管科'],
    ['SX1002', '从业人员实名登记', 'subject', 'company', 5, 2, 1, 5, 0, '市场监管科'],
    ['SX1101', '保障性租赁住房承租申请', 'rent', 'rent', 15, 10, 1, 6, 1, '住房保障科']
  ];

  var THEMES = [
    { k: 'new', n: '商品房', i: 'fa-building' }, { k: 'second', n: '存量房', i: 'fa-house' },
    { k: 'rent', n: '住房租赁', i: 'fa-key' }, { k: 'fund', n: '资金监管', i: 'fa-shield-halved' },
    { k: 'mortgage', n: '抵押与限制', i: 'fa-file-contract' }, { k: 'policy', n: '政策性住房', i: 'fa-hand-holding-heart' },
    { k: 'survey', n: '测绘与档案', i: 'fa-ruler-combined' }, { k: 'subject', n: '从业主体', i: 'fa-briefcase' },
    { k: 'query', n: '查询出证', i: 'fa-magnifying-glass' }
  ];

  var SCENES = [
    { k: 'buy-new', n: '买新房', d: '选房 · 签约 · 备案 · 缴存', ico: 'fa-building-circle-check', c: 'blue' },
    { k: 'buy-second', n: '买卖二手房', d: '核验 · 签约 · 资金监管 · 过户', ico: 'fa-house-chimney-user', c: 'red' },
    { k: 'rent', n: '租房', d: '找房 · 签约 · 备案 · 出证', ico: 'fa-key', c: 'green' },
    { k: 'sell', n: '卖房出租', d: '挂牌 · 核验 · 委托 · 带看', ico: 'fa-hand-holding-dollar', c: 'orange' },
    { k: 'loan', n: '办贷款', d: '抵押备案 · 放款 · 注销', ico: 'fa-building-columns', c: 'cyan' },
    { k: 'cert', n: '办证明', d: '查询 · 出证 · 验真 · 亮证', ico: 'fa-file-shield', c: 'purple' },
    { k: 'progress', n: '查进度', d: '备案 · 资金 · 纳税过户', ico: 'fa-magnifying-glass-chart', c: 'gold' }
  ];

  /* ------------------------------ 种子数据 ------------------------------ */
  function seed() {
    var db = { _seq: 1000, _v: 1 };

    /* 1. 站点配置（PSP_ZDXX） */
    db.site = {
      zdmc: '房产交易管理网', fbt: '统一服务门户 · 一网通办',
      zbdw: 'XXXX市住房和城乡建设局', jsdw: 'XXXX市房产交易管理中心',
      icp: '桂ICP备11003243号', gab: '桂公网安备 45020202000188号', zwbs: '4502000047',
      tel: '0772-2822168', addr: '柳州市城中区文昌路1号房产交易大厅',
      gzsj: '周一至周五 9:00-12:00、13:00-17:00（法定节假日除外）',
      ljfws: 12864503, rjfws: 8642,
      /* wsmh-34-06 未登录浏览范围 */
      guestScope: { house: 1, notice: 1, guide: 1, contact: 0, query: 0, apply: 0, rate: 0 },
      sessionTimeout: 30,
      /* wsmh-35-06 脱敏口径 */
      mask: { qlrxm: 1, zjhm: 1, lxfs: 1, fh: 1 },
      priceNote: '备案（拟售）价格，实际成交以合同为准',
      /* wsmh-35-03 县区频道 */
      channels: QX.map(function (q, i) { return { name: q, on: 1, tel: '0772-' + (2800000 + i * 1111) }; }),
      /* wsmh-35-02 子平台入口 */
      subs: [
        { n: '商品房网签备案', i: 'fa-building', on: 1 }, { n: '存量房交易服务', i: 'fa-house', on: 1 },
        { n: '住房租赁服务', i: 'fa-key', on: 1 }, { n: '从业主体监管', i: 'fa-briefcase', on: 1 },
        { n: '资金监管服务', i: 'fa-shield-halved', on: 1 }, { n: '维修资金服务', i: 'fa-screwdriver-wrench', on: 1 }
      ],
      /* wsmh-34-01 门户分设 */
      portals: [
        { n: '统一工作门户', d: '面向内部业务人员的业务办理中心', on: 1, url: '../../统一门户/index.html' },
        { n: '统一服务门户', d: '面向群众与企业的对外一网通办入口', on: 1, url: 'web/home.html' }
      ]
    };

    /* 2. 楼盘项目（含好房子） */
    db.projects = PROJ_NAMES.map(function (n, i) {
      var good = i % 4 === 0;
      var risk = i === 7 ? 3 : (i === 11 ? 2 : 0);
      return {
        id: 'XM' + pad(i + 1), xmmc: n, kfqy: pick(DEVS, i), qx: pick(QX, i), sq: pick(SQ, i),
        dz: pick(QX, i) + pick(SQ, i) + (100 + i * 7) + '号',
        yszh: '柳房预售证第' + (2025000 + i * 13) + '号', ysrq: ymd(shift(-320 + i * 12)),
        zt: i % 7 === 6 ? '现售' : '预售', jzmj: 68000 + i * 9600, zts: 320 + i * 46,
        ksts: Math.max(0, 180 - i * 9), jjts: 60 + i * 5,
        junjia: 8600 + i * 420, jgqj: (8000 + i * 400) + '-' + (11200 + i * 460),
        wuye: pick(WULIYE, i), wyf: (1.8 + (i % 5) * 0.35).toFixed(2),
        wxzj: (66 + (i % 4) * 8).toFixed(0), byfz: (12 + (i % 3) * 2).toFixed(0),
        jgyh: pick(BANKS, i), jgzh: '4501' + (100000000000 + i * 7654321),
        chjg: pick(SURVEYS, i), ycmj: 68000 + i * 9600, scmj: 68120 + i * 9600,
        good: good ? 1 : 0,
        gTags: good ? ['绿色建筑三星', '装配率 62%', '适老化设计', '全龄社区'].slice(0, 2 + (i % 3)) : [],
        gIdx: good ? { cg: (3.0 + (i % 3) * 0.1).toFixed(1), dfl: (78 + i % 6) + '%', gt: (18 - i % 4) + '%', gs: 'Ⅱ级', jn: '75%', rz: '≥3小时' } : null,
        wfzt: good ? [
          { r: '建设单位', n: pick(DEVS, i), p: '韦*明' }, { r: '勘察单位', n: '广西柳勘岩土工程有限公司', p: '覃*华' },
          { r: '设计单位', n: 'XXXX市建筑设计科学研究院', p: '梁*平' }, { r: '施工单位', n: '广西建工集团第五建筑工程公司', p: '莫*华' },
          { r: '监理单位', n: 'XXXX市宏图工程监理有限公司', p: '陆*晴' }
        ] : [],
        rdpc: good ? '2026 年第' + (1 + i % 3) + '批' : '', rdyxq: good ? ymd(shift(600)) : '',
        risk: risk, riskNote: risk === 3 ? '项目施工进度滞后，已纳入保交楼重点监测' : (risk === 2 ? '资金监管额度接近预警线' : ''),
        jfjd: [
          { n: '主体结构封顶', d: ymd(shift(-160 + i * 6)), s: 1 },
          { n: '竣工验收备案', d: ymd(shift(-40 + i * 8)), s: i % 3 === 0 ? 1 : 0 },
          { n: '计划交付', d: ymd(shift(90 + i * 12)), s: 0 },
          { n: '实际交付', d: '', s: 0 }
        ],
        zjdy: i % 5 === 1 ? { lc: '3-5 号楼', fw: '共 168 套', zt: '在建工程抵押中', yh: pick(BANKS, i + 2) } : null,
        img: 'https://images.unsplash.com/photo-' + pick([
          '1486406146926-c627a92ad1ab', '1545324418-cc1a3fa10c00', '1512917774080-9991f1c4c750',
          '1580587771525-78b9dba3b914', '1560518883-ce09059eeffa', '1518005020951-eccb494ad742',
          '1522708323590-d24dbb6b0267', '1600596542815-ffad4c1539a9'
        ], i) + '?auto=format&fit=crop&w=800&q=70'
      };
    });

    /* 3. 小区 */
    db.communities = COMM_NAMES.map(function (n, i) {
      return {
        id: 'XQ' + pad(i + 1), mc: n, qx: pick(QX, i), sq: pick(SQ, i),
        jcnd: 1998 + i * 2, zts: 460 + i * 88, zsts: 6 + i % 9, zzts: 4 + i % 7,
        gpj: (7200 + i * 380), cjj: (6900 + i * 360), wuye: pick(WULIYE, i),
        yjcj: 3 + i % 8
      };
    });

    /* 4. 房源（PSP_FYCSXX）：新房套 / 二手房 / 租赁 / 房票 */
    db.houses = [];
    var HX = ['2室1厅1卫', '3室2厅1卫', '3室2厅2卫', '4室2厅2卫', '1室1厅1卫'];
    var CX = ['朝南', '南北通透', '朝东南', '朝西南', '朝东'];
    var ZX = ['毛坯', '简装', '精装修', '豪华装修'];
    /* 二手房 24 套 */
    for (var i = 0; i < 24; i++) {
      var c = db.communities[i % db.communities.length];
      var mj = 62 + ri(i + 1, 0, 68);
      var dj = 6800 + ri(i + 2, 0, 5200);
      db.houses.push({
        id: 'FY2' + pad(i + 1), lx: '2', lxmc: '二手房',
        bt: c.mc + ' ' + pick(HX, i) + ' ' + pick(ZX, i + 1),
        xqmc: c.mc, xqzj: c.id, qx: c.qx, sq: c.sq, dz: c.qx + c.sq + c.mc + (i % 12 + 1) + '栋',
        fh: (i % 12 + 1) + '栋' + (i % 26 + 1) + '0' + (i % 4 + 1) + '室', fhMask: (i % 12 + 1) + '栋**0' + (i % 4 + 1) + '室',
        mj: mj, hx: pick(HX, i), cx: pick(CX, i), zx: pick(ZX, i + 1),
        lc: (i % 26 + 1) + '/' + (26 + i % 8), jcnd: c.jcnd,
        dj: dj, zj: Math.round(mj * dj / 10000),
        hym: 'LZ2H' + (2026000000 + i * 137), hyyxq: ymd(shift(i === 3 ? 5 : (i === 9 ? 2 : 40 + i * 6))),
        fyzt: '1', ztmc: '已核验',
        ly: i % 3 === 0 ? '1' : (i % 3 === 1 ? '2' : '3'),
        lymc: i % 3 === 0 ? '个人自主房源' : (i % 3 === 1 ? '居间代理房源' : '企业房源'),
        wtjg: i % 3 === 0 ? '' : pick(BROKERS, i), wtjjr: i % 3 === 0 ? '' : '韦*' + pick(['明', '华', '强', '丽'], i),
        jjrzsh: i % 3 === 0 ? '' : '桂经纪证第' + (450200000 + i * 37) + '号',
        gpsj: ymd(shift(-60 + i * 2)), gxsj: ymdhm(shift(-i * 0.4)),
        tjjl: i % 5 === 0 ? [{ d: ymd(shift(-30)), o: dj + 300, n: dj }] : [],
        sjly: '存量房交易网签备案管理系统',
        img: 'https://images.unsplash.com/photo-' + pick([
          '1522708323590-d24dbb6b0267', '1502672260266-1c1ef2d93688', '1493809842364-78817add7ffb',
          '1484154218962-a197022b5858', '1556911220-bff31c812dba', '1600585154340-be6161a56a0c'
        ], i) + '?auto=format&fit=crop&w=800&q=70'
      });
    }
    /* 租赁 12 套 */
    for (i = 0; i < 12; i++) {
      var c2 = db.communities[(i + 3) % db.communities.length];
      var mj2 = 32 + ri(i + 20, 0, 58);
      var zj2 = 900 + ri(i + 21, 0, 2600);
      db.houses.push({
        id: 'FY3' + pad(i + 1), lx: '3', lxmc: '租房',
        bt: c2.mc + ' ' + pick(HX, i + 2) + ' ' + (i % 3 === 0 ? '整租' : i % 3 === 1 ? '合租' : '整租'),
        xqmc: c2.mc, xqzj: c2.id, qx: c2.qx, sq: c2.sq, dz: c2.qx + c2.sq + c2.mc,
        fh: (i % 8 + 1) + '栋' + (i % 18 + 1) + '02室', fhMask: (i % 8 + 1) + '栋**02室',
        mj: mj2, hx: pick(HX, i + 2), cx: pick(CX, i + 1), zx: pick(ZX, i + 2),
        lc: (i % 18 + 1) + '/' + (18 + i % 6), zjlx: i % 3 === 1 ? '合租' : '整租',
        bzx: i % 5 === 0 ? 1 : 0,
        zj: zj2, ckj: [Math.round(zj2 * 0.85), Math.round(zj2 * 1.12)],
        pianli: zj2 > Math.round(zj2 * 1.12) ? 1 : (i === 6 ? 1 : 0),
        hym: 'LZ3H' + (2026000000 + i * 211), hyyxq: ymd(shift(50 + i * 5)),
        fyzt: '1', ztmc: '已核验', ly: '3', lymc: '企业房源',
        wtjg: pick(RENTCOS, i), qsjl: '权属核验通过，房屋权利人与出租人一致',
        gpsj: ymd(shift(-40 + i * 2)), gxsj: ymdhm(shift(-i * 0.3)),
        sjly: '房屋租赁网签备案管理系统',
        img: 'https://images.unsplash.com/photo-' + pick([
          '1560448204-e02f11c3d0e2', '1502005229762-cf1b2da7c5d6', '1567767292278-a4f21aa2d36e',
          '1522771739844-6a9f6d5f14af', '1505873242700-f289a29e1e0f'
        ], i) + '?auto=format&fit=crop&w=800&q=70'
      });
    }
    /* 房票适用房源 6 套（指向项目） */
    db.vouchers = {
      ye: 486000, ysy: 120000, kyy: 366000, yxq: ymd(shift(280)), bh: 'FP2026' + pad(37),
      hx: [{ d: ymd(shift(-60)), xm: '龙城华府', je: 120000 }]
    };

    /* 5. 楼盘表销控（PSP 快照，取前 3 个项目） */
    db.plates = {};
    db.projects.slice(0, 6).forEach(function (p, pi) {
      var units = [];
      for (var u = 1; u <= 2; u++) {
        var floors = [];
        for (var f = 26; f >= 1; f--) {
          var cells = [];
          for (var r = 1; r <= 4; r++) {
            var seedn = pi * 1000 + u * 100 + f * 4 + r;
            var st = ri(seedn, 0, 100);
            var s = st < 34 ? 0 : st < 50 ? 1 : st < 74 ? 2 : st < 84 ? 4 : 3;
            var mj3 = [88, 105, 118, 136][r - 1];
            var dj3 = p.junjia + (f - 13) * 45 + (r - 2) * 120;
            cells.push({
              fh: pad(f) + '0' + r, s: s, mj: mj3, tnmj: Math.round(mj3 * 0.78),
              dj: dj3, tndj: Math.round(dj3 / 0.78), zj: Math.round(mj3 * dj3 / 10000),
              hx: pick(HX, r), cx: pick(CX, r + f)
            });
          }
          floors.push({ f: f, cells: cells });
        }
        units.push({ u: u, floors: floors });
      }
      db.plates[p.id] = { xmzj: p.id, lc: '1号楼', units: units };
    });

    /* 6. 事项目录（PSP_BSZNXX） */
    db.items = ITEMS.map(function (a) {
      return {
        code: a[0], name: a[1], theme: a[2], scene: a[3], fdrq: a[4], nsrq: a[5],
        wb: a[6], clnum: a[7], hot: a[8], dept: a[9],
        tj: '申请人为房屋权利人或经合法授权的代理人，房屋无查封、无异议登记等限制交易情形。',
        sf: a[0] === 'SX0601' ? '按柳价费〔2019〕15 号文标准收取测绘费' : '不收费',
        dd: '柳州市城中区文昌路1号房产交易大厅 ' + (1 + a[0].charCodeAt(4) % 9) + ' 号窗口',
        tjyy: ['材料不齐全或不符合法定形式', '申请人主体资格不符', '房屋存在限制交易情形', '合同要素与备案信息不一致'],
        cl: buildMats(a[7], a[0])
      };
    });
    function buildMats(n, code) {
      var pool = [
        ['身份证明', '居民身份证原件及复印件', 1, 1], ['权属证明', '不动产权证书', 1, 1],
        ['合同文本', '存量房买卖合同', 1, 0], ['税费凭证', '契税完税凭证', 0, 0],
        ['委托材料', '授权委托书', 0, 0], ['主体资格', '营业执照', 1, 1],
        ['技术报告', '房屋测绘报告', 1, 1], ['许可证照', '商品房预售许可证', 1, 1],
        ['身份证明', '户口簿', 0, 1], ['身份证明', '婚姻状况证明', 0, 0],
        ['合同文本', '资金监管协议', 1, 0], ['其他', '申请表', 1, 0]
      ];
      var r = [];
      for (var i = 0; i < n; i++) {
        var m = pool[(i + code.charCodeAt(5)) % pool.length];
        r.push({ lx: m[0], mc: m[1], bt: m[2], fy: m[3], mian: m[3] && i % 3 === 0 ? 1 : 0 });
      }
      return r;
    }

    /* 7. 一件事套餐（PSP_YJSTCXX） */
    db.packages = [
      {
        id: 'YJS01', mc: '新房购置一件事', ico: 'fa-building-circle-check', d: '购房合同网签备案 + 维修资金缴存 + 契税申报 3 个事项集成办理',
        items: ['SX0101', 'SX0901', 'SX0701'], mode: '串联', cl: 8, day: 5, cs: 1268
      },
      {
        id: 'YJS02', mc: '二手房交易一件事', ico: 'fa-house-chimney-user', d: '存量房网签备案 + 资金监管 + 纳税过户联办，一次填报一套材料',
        items: ['SX0201', 'SX0202', 'SX0203'], mode: '并联', cl: 10, day: 8, cs: 2145
      },
      {
        id: 'YJS03', mc: '房屋租赁一件事', ico: 'fa-key', d: '租赁合同签约 + 备案申请 + 备案证明获取一次办结',
        items: ['SX0301'], mode: '串联', cl: 4, day: 3, cs: 986
      },
      {
        id: 'YJS04', mc: '带押过户一件事', ico: 'fa-building-columns', d: '抵押注销 + 网签备案 + 新抵押设立并联办理，无需提前还贷',
        items: ['SX0402', 'SX0201', 'SX0401'], mode: '并联', cl: 12, day: 10, cs: 432
      }
    ];

    /* 8. 办件（PSP_WSSQXX + 办件进度） */
    db.cases = [];
    var CASE_SEED = [
      ['SX0201', '2', '存量房买卖合同网签备案', -12, '文昌小区 3栋**02室'],
      ['SX0101', '3', '商品房买卖合同网签备案', -26, '龙城华府 1号楼 1802'],
      ['SX0301', '1', '房屋租赁合同备案', -3, '五星花园 2栋**05室'],
      ['SX0901', '4', '住宅专项维修资金缴存', -40, '龙城华府 1号楼 1802'],
      ['SX0202', '2', '存量房交易资金监管协议签订', -8, '文昌小区 3栋**02室'],
      ['SX0401', '5', '房屋抵押合同备案', -55, '静兰新村 5栋**11室']
    ];
    CASE_SEED.forEach(function (a, i) {
      var it = db.items.filter(function (x) { return x.code === a[0]; })[0];
      db.cases.push(mkCase(db, {
        sxdm: a[0], sxmc: a[2], zt: a[1], days: a[3], fw: a[4], dept: it ? it.dept : '综合受理科'
      }));
    });

    /* 9. 草稿（PSP_WSSQXX 未提交） */
    db.drafts = [{
      id: 'CG001', sxdm: 'SX0201', sxmc: '存量房买卖合同网签备案', step: 2,
      data: { mfxm: '韦志强', mfzj: '450202198703****', fwzl: '文昌小区 3栋**02室', jymj: 96.5, cjjg: 82.4 },
      files: ['居民身份证.pdf', '不动产权证书.pdf'],
      cjsj: ymdhm(shift(-2)), yxq: ymd(shift(28)), from: 'PC 端门户'
    }, {
      id: 'CG002', sxdm: 'SX0301', sxmc: '房屋租赁合同备案', step: 1,
      data: { czr: '覃美玲', cyr: '梁建平', fwzl: '五星花园 2栋**05室', zj: 1800 },
      files: [], cjsj: ymdhm(shift(-9)), yxq: ymd(shift(3)), from: '微信小程序'
    }];

    /* 10. 合同与交易 */
    db.contracts = [{
      id: 'HT001', bh: 'LZCF2026' + pad(1287), lx: '商品房买卖合同', xmmc: '龙城华府', fw: '1号楼 1802',
      mj: 118, zj: 1286400, ba: '已备案', bash: ymd(shift(-24)), ver: 2,
      nodes: [
        { n: '认购登记', d: ymd(shift(-40)), s: 1 }, { n: '合同网签', d: ymd(shift(-28)), s: 1 },
        { n: '合同备案', d: ymd(shift(-24)), s: 1 }, { n: '购房款缴存', d: ymd(shift(-20)), s: 1 },
        { n: '维修资金缴存', d: '', s: 2 }, { n: '产权过户', d: '', s: 0 }, { n: '房屋交付', d: '', s: 0 }
      ],
      vers: [{ v: 1, d: ymd(shift(-28)), note: '首次网签' }, { v: 2, d: ymd(shift(-25)), note: '付款方式变更为按揭' }]
    }, {
      id: 'HT002', bh: 'LZCC2026' + pad(864), lx: '存量房买卖合同', xmmc: '文昌小区', fw: '3栋**02室',
      mj: 96.5, zj: 824000, ba: '备案中', bash: '', ver: 1,
      nodes: [
        { n: '房源核验', d: ymd(shift(-16)), s: 1 }, { n: '合同网签', d: ymd(shift(-12)), s: 1 },
        { n: '资金监管', d: ymd(shift(-8)), s: 1 }, { n: '合同备案', d: '', s: 2 },
        { n: '纳税申报', d: '', s: 0 }, { n: '产权过户', d: '', s: 0 }
      ], vers: [{ v: 1, d: ymd(shift(-12)), note: '首次网签' }]
    }];

    /* 11. 缴款与贷款 */
    db.payments = [
      { id: 'JK001', lx: '购房款', xm: '龙城华府 1号楼 1802', je: 385920, zt: '已到账', yh: '柳州银行文昌支行', zh: '4501****7821', d: ymd(shift(-20)), note: '首付款 30%' },
      { id: 'JK002', lx: '住宅专项维修资金', xm: '龙城华府 1号楼 1802', je: 7788, zt: '待缴存', yh: '中国建设银行柳州分行', zh: '4502****3390', d: '', note: '按 66 元/㎡ × 118㎡ 计缴' },
      { id: 'JK003', lx: '契税', xm: '文昌小区 3栋**02室', je: 8240, zt: '待缴存', yh: 'XXXX市税务局', zh: '—', d: '', note: '首套 90㎡ 以上按 1.5% 计征' }
    ];
    db.loans = [
      { id: 'DK001', lx: '商业按揭贷款', yh: '中国建设银行柳州分行', je: 900000, nx: 25, lv: 3.45, zt: '已放款', fkrq: ymd(shift(-18)), jd: 100 },
      { id: 'DK002', lx: '住房公积金贷款', yh: 'XXXX市住房公积金管理中心', je: 600000, nx: 25, lv: 2.85, zt: '审批中', fkrq: '', jd: 60 }
    ];

    /* 12. 收藏 / 预约 / 求购求租 / 举报 */
    db.favs = [{ hid: 'FY201', t: ymdhm(shift(-3)) }, { hid: 'FY205', t: ymdhm(shift(-1)) }];
    db.appts = [{
      id: 'YY001', hid: 'FY202', hname: '五星花园 3室2厅1卫 精装修', jg: BROKERS[1],
      d: ymd(shift(2)), sd: '上午 10:00-11:00', zt: '待确认', tel: '137****2856'
    }];
    db.demands = [
      { id: 'QG001', lx: '求购', qx: '城中区', mj: '90-120㎡', ys: '80-100万', hx: '3室', lxr: '韦先生', tel: '137****2856', d: ymd(shift(-6)), zt: '展示中' },
      { id: 'QG002', lx: '求租', qx: '鱼峰区', mj: '50-80㎡', ys: '1500-2200元/月', hx: '2室', lxr: '覃女士', tel: '138****4471', d: ymd(shift(-2)), zt: '展示中' }
    ];
    db.reports = [];

    /* 13. 查询 / 授权 / 出证 / 留痕 */
    db.qlogs = [
      { id: 'CX001', cxr: '韦志强', dx: '本人名下房产', lx: '个人房产信息查询', yt: '贷款', d: ymdhm(shift(-30)), way: '门户网站' },
      { id: 'CX002', cxr: '韦志强', dx: '文昌小区 3栋**02室', lx: '网签备案进度查询', yt: '自用', d: ymdhm(shift(-12)), way: '门户网站' }
    ];
    db.auths = [
      { id: 'SQ001', sqr: '柳州银行文昌支行', qlr: '韦志强', fw: '本人名下房产套数与状态', yt: '贷款审批', qx: ymd(shift(20)), zt: '1', ztmc: '已授权', d: ymd(shift(-10)) },
      { id: 'SQ002', sqr: '广西同信律师事务所', qlr: '韦志强', fw: '文昌小区 3栋**02室 权属状况', yt: '诉讼', qx: ymd(shift(15)), zt: '0', ztmc: '待授权', d: ymd(shift(-1)) }
    ];
    db.certs = [{
      id: 'ZM001', bh: 'LZZM2026' + pad(3172), lx: '商品房买卖合同备案证明',
      fw: '龙城华府 1号楼 1802', yzm: 'K7M2X9', d: ymdhm(shift(-24)), yxq: ymd(shift(66)),
      yt: '办理不动产登记', zt: '1', ztmc: '有效',
      nr: '兹证明韦*强与XXXX市龙城房地产开发有限公司于 ' + ymd(shift(-28)) + ' 签订《商品房买卖合同》，合同编号 LZCF2026' + pad(1287) + '，坐落龙城华府1号楼1802室，建筑面积118.00㎡，已于 ' + ymd(shift(-24)) + ' 完成备案。'
    }];

    /* 14. 投诉 / 会话 / 反馈 / 评价 */
    db.complaints = [{
      id: 'TS001', bh: 'TS2026' + pad(218), lb: '中介服务', bt: '经纪机构未按约定退还看房定金',
      dx: 'XXXX市安家房地产经纪有限公司', qx: '城中区', d: ymd(shift(-9)), zt: '2', ztmc: '处置中',
      dept: '市场监管科', xz: [
        { n: '提交投诉', d: ymdhm(shift(-9)), r: '投诉人' },
        { n: '自动分派', d: ymdhm(shift(-9)), r: '系统', c: '按投诉类别分派至市场监管科' },
        { n: '受理登记', d: ymdhm(shift(-8)), r: '市场监管科', c: '已联系投诉人核实情况' }
      ], xqts: 5
    }];
    db.chats = [];
    db.feedbacks = [];
    db.ratings = [
      { id: 'PJ001', dx: '商品房买卖合同网签备案', lx: '事项', star: 5, c: '全程网办，两天就办结了', d: ymd(shift(-22)), bh: 'BJ2026001287' },
      { id: 'PJ002', dx: 'XXXX市安家房地产经纪有限公司', lx: '机构', star: 3, c: '', d: ymd(shift(-14)), bh: '' }
    ];

    /* 15. 企业与从业人员 */
    db.agencies = [];
    var AG_TYPES = [
      { t: '房地产开发企业', list: DEVS }, { t: '房地产经纪机构', list: BROKERS },
      { t: '住房租赁企业', list: RENTCOS }, { t: '房产测绘机构', list: SURVEYS }
    ];
    var agi = 0;
    AG_TYPES.forEach(function (g, gi) {
      g.list.forEach(function (n, ni) {
        agi++;
        var score = 96 - agi * 2 + (agi % 3) * 4;
        db.agencies.push({
          id: 'QY' + pad(agi), mc: n, lx: g.t, tyshxydm: '91450200MA' + (5000000 + agi * 137) + 'X' + agi,
          fddbr: '韦*' + pick(['明', '华', '强', '丽', '平'], agi), qx: pick(QX, agi),
          dz: pick(QX, agi) + pick(SQ, agi) + (66 + agi * 3) + '号', tel: '0772-2' + (800000 + agi * 1357),
          zzdj: gi === 0 ? pick(['一级', '二级', '三级'], agi) : '—',
          rwzt: agi === 5 ? '3' : (agi === 9 ? '2' : '1'),
          rwztmc: agi === 5 ? '已注销' : (agi === 9 ? '异常' : '已入网'),
          rwrq: ymd(shift(-800 + agi * 30)), yxq: ymd(shift(400 + agi * 20)),
          score: Math.max(58, score), dj: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D',
          hb: score >= 90 ? 1 : 0, heb: score < 66 ? 1 : 0,
          xmnum: gi === 0 ? 2 + agi % 4 : 0, fynum: gi === 1 ? 6 + agi * 2 : (gi === 2 ? 4 + agi : 0),
          pjnum: 12 + agi * 3, pjscore: (3.6 + (agi % 5) * 0.26).toFixed(1),
          cnsj: ymd(shift(-500 + agi * 20)), cnlx: '诚信经营承诺书', lyqk: agi === 9 ? '存在 1 次违规记录' : '履约良好',
          ssjc: agi % 4 === 0 ? { pc: '2026 年第 2 批', jg: agi === 8 ? '发现问题已整改' : '未发现问题', d: ymd(shift(-90)) } : null,
          mendian: gi === 2 ? [
            { n: n.slice(0, 4) + '文昌店', dz: '城中区文昌路 88 号', zt: '已备案', ts: 0 },
            { n: n.slice(0, 4) + '航岭店', dz: '鱼峰区航岭路 12 号', zt: '已备案', ts: 1 }
          ] : []
        });
      });
    });
    db.staffs = [];
    for (i = 0; i < 18; i++) {
      var ag = db.agencies[(i % 5) + 6];
      db.staffs.push({
        id: 'RY' + pad(i + 1), xm: '韦*' + pick(['明', '华', '强', '丽', '平', '晴', '敏'], i),
        zjhm: '4502021985' + pad(i + 1) + '12****', jg: ag ? ag.mc : BROKERS[0], jgzj: ag ? ag.id : 'QY07',
        gw: pick(['房地产经纪人', '房地产经纪人协理', '测绘员', '房地产估价师'], i),
        zsbh: '桂经纪证第' + (450200000 + i * 37) + '号', djrq: ymd(shift(-400 + i * 18)),
        zt: i === 4 ? '3' : (i === 11 ? '2' : '1'),
        ztmc: i === 4 ? '已注销' : (i === 11 ? '受限' : '正常'),
        tel: '13' + (7 + i % 3) + '****' + (1000 + i * 37), yjnum: 6 + i * 2, pjscore: (3.8 + (i % 4) * 0.3).toFixed(1)
      });
    }

    /* 16. 资讯 / 政策 / 公示（PSP_NRXX） */
    db.articles = [];
    var ART = [
      ['notice', '关于优化我市存量房交易资金监管有关事项的通知', 'XXXX市住房和城乡建设局', 0],
      ['notice', '关于开展 2026 年度房地产经纪机构「双随机、一公开」检查的公告', 'XXXX市住房和城乡建设局', 0],
      ['notice', '关于临时调整市本级房产交易「周末服务」安排的通告', 'XXXX市房产交易管理中心', 0],
      ['news', '资金托管兜底交易安全 我市首推现房「双带押」服务', 'XXXX市房产交易管理中心', 1],
      ['news', '小窗口践初心 优服务惠民生 —— 交易中心文昌分中心服务全览', 'XXXX市房产交易管理中心', 1],
      ['news', '打通租房维权最后一公里 柳州首批 12 处租赁调解网点投用', 'XXXX市住房和城乡建设局', 1],
      ['news', '柳州「二手房交易一件事」上线满月 办结时限压缩至 3 个工作日', 'XXXX市房产交易管理中心', 0],
      ['policy', '柳州市 2026 年个人房屋交易税费政策指引', 'XXXX市税务局', 0],
      ['policy', '关于优化本市住房公积金使用政策的通知', 'XXXX市住房公积金管理中心', 0],
      ['policy', 'XXXX市关于促进房地产市场平稳健康发展的若干措施', 'XXXX市人民政府', 0],
      ['policy', '《柳州市住房租赁管理办法》政策解读', 'XXXX市住房和城乡建设局', 0],
      ['policy', '柳州市「好房子」建设标准与认定管理办法（试行）', 'XXXX市住房和城乡建设局', 0],
      ['open', 'XXXX市住房和城乡建设局政府信息公开指南', 'XXXX市住房和城乡建设局', 0],
      ['open', '2026 年上半年房地产市场运行情况通报', 'XXXX市房产交易管理中心', 0],
      ['risk', '二手房交易风险提示：警惕「阴阳合同」与私下交易', 'XXXX市房产交易管理中心', 0],
      ['risk', '住房租赁风险提示：签约前务必核验房源核验码与出租人身份', 'XXXX市住房和城乡建设局', 0],
      ['risk', '涉房诈骗防范提醒：官方渠道不会以任何名义要求转账至个人账户', 'XXXX市公安局', 0],
      ['train', '2026 年房地产经纪从业人员业务培训通知', 'XXXX市房地产业协会', 0],
      ['train', '网签备案系统企业端操作培训材料（2026 版）', 'XXXX市房产交易管理中心', 0]
    ];
    ART.forEach(function (a, i) {
      db.articles.push({
        id: 'WZ' + pad(i + 1), lm: a[0], bt: a[1], ly: a[2], pic: a[3],
        fbsj: ymd(shift(-i * 4 - 1)), llcs: 320 + i * 137, zt: '1',
        yxq: a[0] === 'notice' ? ymd(shift(60 - i * 3)) : '',
        zy: '本文围绕' + a[1].replace(/^关于/, '').slice(0, 18) + '等内容作出具体规定，自发布之日起施行，有效期五年。',
        zw: '<p>为进一步优化我市房地产交易服务，规范交易行为，保障交易双方合法权益，根据《城市房地产管理法》《商品房销售管理办法》等有关规定，结合我市实际，现就有关事项通知如下：</p>'
          + '<p><b>一、适用范围。</b>本通知适用于柳州市行政区域内的房屋交易备案、资金监管与信息公示等业务。</p>'
          + '<p><b>二、办理渠道。</b>申请人可通过房产交易管理网（统一服务门户）、微信小程序、政务自助终端以及各交易网点窗口办理，四个渠道服务能力等价、数据实时同步。</p>'
          + '<p><b>三、办理时限。</b>材料齐全并符合法定形式的，自受理之日起 3 个工作日内办结；需要补正材料的，一次性告知全部补正内容。</p>'
          + '<p><b>四、施行日期。</b>本通知自发布之日起施行，此前有关规定与本通知不一致的，以本通知为准。</p>',
        img: a[3] ? 'https://images.unsplash.com/photo-' + pick(['1454165804606-c3d57bc86b40', '1497215728101-856f4ea42174', '1521791136064-7986c2920216'], i) + '?auto=format&fit=crop&w=600&q=70' : ''
      });
    });
    db.subs = [];
    db.msgs = [
      { id: 'XX001', lx: '办件通知', bt: '您的「存量房买卖合同网签备案」已受理', c: '办件编号 BJ2026001864，承办科室存量房备案科，承诺办结时限 2 个工作日。', d: ymdhm(shift(-12)), r: 1 },
      { id: 'XX002', lx: '补正提醒', bt: '您有 1 件办件需要补正材料', c: '「商品房买卖合同网签备案」缺少契税完税凭证，请于 5 个工作日内补交。', d: ymdhm(shift(-2)), r: 0 },
      { id: 'XX003', lx: '公示订阅', bt: '您订阅的「预售楼盘公示」有 3 条新增', c: '龙城华府、翠湖天著、锦绣江南新取得预售许可。', d: ymdhm(shift(-1)), r: 0 }
    ];

    /* 17. 市场数据 */
    db.market = {
      today: { wq: 186, cj: 142, mj: 15860, je: 13268 },
      month: { wq: 3842, cj: 3126, mj: 342800, je: 296400, junjia: 8646 },
      trend: [
        { m: '2月', v: 2680 }, { m: '3月', v: 3120 }, { m: '4月', v: 3460 },
        { m: '5月', v: 3280 }, { m: '6月', v: 3620 }, { m: '7月', v: 3842 }
      ],
      qxRank: QX.slice(0, 6).map(function (q, i) { return { n: q, v: 860 - i * 108 }; }),
      xmRank: PROJ_NAMES.slice(0, 8).map(function (n, i) { return { n: n, v: 186 - i * 17 }; }),
      rentRef: QX.slice(0, 6).map(function (q, i) {
        return { qx: q, one: 800 + i * 60, two: 1400 + i * 90, three: 2100 + i * 130, hb: (i % 3 === 0 ? '+' : '-') + (0.4 + i * 0.2).toFixed(1) + '%' };
      }),
      daily: [0, 1, 2, 3, 4, 5, 6].map(function (i) {
        return { d: ymd(shift(-i)), wq: 186 - i * 7, cj: 142 - i * 5, mj: 15860 - i * 620, junjia: 8646 + i * 12 };
      })
    };

    /* 18. 资金监管 */
    db.funds = {
      accounts: db.projects.slice(0, 10).map(function (p, i) {
        return {
          xm: p.xmmc, qy: p.kfqy, yh: p.jgyh, zh: p.jgzh, lc: (i % 3 + 1) + '-' + (i % 3 + 4) + ' 号楼',
          zt: i === 7 ? '预警' : '正常', jc: 8600 + i * 940, sy: 5200 + i * 620, ye: 3400 + i * 320,
          bl: (18 + i % 8) + '%', d: ymd(shift(-200 + i * 15))
        };
      }),
      banks: BANKS.map(function (b, i) {
        return { n: b, sx: (2 + i % 3) + ' 个工作日', xm: 4 + i * 2, zt: '合作中', d: ymd(shift(-600 + i * 40)) };
      }),
      zjzx: ['广西柳工程造价咨询有限公司', '柳州中兴工程造价咨询有限公司', '广西信德工程咨询有限公司'].map(function (n, i) {
        return { n: n, zz: '甲级', d: ymd(shift(-400 + i * 60)), bd: i === 2 ? '2026-05 新增入库' : '—' };
      }),
      wxzj: COMM_NAMES.slice(0, 8).map(function (n, i) {
        return { xq: n, gj: 862 + i * 96, sy: 186 + i * 32, ye: 676 + i * 64, xm: 2 + i % 4, d: ymd(shift(-30)) };
      })
    };

    /* 19. 网点与排队 */
    db.outlets = [
      { id: 'WD01', n: 'XXXX市房产交易大厅（市本级）', lx: '交易备案办理点', dz: '城中区文昌路 1 号', tel: '0772-2822168', sj: '09:00-17:00', ck: 12, jh: 'A0186', dd: 8, xm: ['商品房备案', '存量房备案', '租赁备案', '抵押备案', '查询出证'] },
      { id: 'WD02', n: '鱼峰区房产交易分中心', lx: '交易备案办理点', dz: '鱼峰区航岭路 26 号', tel: '0772-3822108', sj: '09:00-17:00', ck: 6, jh: 'B0092', dd: 3, xm: ['存量房备案', '租赁备案', '查询出证'] },
      { id: 'WD03', n: '柳北区房产交易分中心', lx: '交易备案办理点', dz: '柳北区跃进路 8 号', tel: '0772-2622135', sj: '09:00-17:00', ck: 5, jh: 'C0061', dd: 2, xm: ['存量房备案', '查询出证'] },
      { id: 'WD04', n: '柳江区房产交易服务点', lx: '交易备案办理点', dz: '柳江区柳堡路 15 号', tel: '0772-7212098', sj: '09:00-17:00', ck: 4, jh: 'D0038', dd: 0, xm: ['存量房备案', '租赁备案'] },
      { id: 'WD05', n: '文昌大厅自助服务区', lx: '自助终端点位', dz: '城中区文昌路 1 号一层', tel: '0772-2822168', sj: '07:00-22:00', ck: 4, jh: '—', dd: 1, xm: ['自助查询', '自助打印', '自助缴款取号'] },
      { id: 'WD06', n: '柳州银行文昌支行', lx: '资金监管合作银行', dz: '城中区文昌路 66 号', tel: '0772-2821000', sj: '09:00-17:00', ck: 3, jh: '—', dd: 0, xm: ['存量房资金监管', '监管协议签订'] },
      { id: 'WD07', n: '桂林银行柳州分行', lx: '资金监管合作银行', dz: '鱼峰区潭中东路 12 号', tel: '0772-2661000', sj: '09:00-17:00', ck: 2, jh: '—', dd: 0, xm: ['存量房资金监管'] },
      { id: 'WD08', n: '鹿寨县房产交易服务点', lx: '交易备案办理点', dz: '鹿寨县城中路 39 号', tel: '0772-6812077', sj: '09:00-17:00', ck: 3, jh: 'E0022', dd: 1, xm: ['存量房备案', '租赁备案'] }
    ];

    /* 20. 知识库与常见问题 */
    db.faq = [
      { lb: '存量房', q: '二手房网签备案需要哪些材料？', a: '需提供买卖双方居民身份证、不动产权证书、存量房买卖合同、契税完税凭证；已完成实名认证的，身份证明可通过电子证照免提交。' },
      { lb: '存量房', q: '什么是房源核验码？在哪里查？', a: '房源核验码是平台对房源权属与挂牌资格核验通过后生成的唯一编码，在房源详情页展示，也可在「查询中心 → 扫码验真」输入核验码验真。' },
      { lb: '商品房', q: '一房一价在哪里查询？', a: '在「房源超市 → 新房专区 → 楼盘详情 → 一房一价」查看，按楼栋-单元-层-房号可视化展示逐套价格与销售状态。' },
      { lb: '商品房', q: '购房款要交到哪个账户？', a: '必须缴入该项目的预售资金监管账户。账户信息在楼盘详情「购房关键信息公示」与「信息公示 → 监管账户公示」都可核对，切勿转入个人账户。' },
      { lb: '住房租赁', q: '租赁备案证明有什么用？', a: '可用于办理落户、子女入学、公积金提取、居住证申领等事项，在「租房签约备案 → 备案证明」在线获取电子件。' },
      { lb: '住房租赁', q: '租金参考价是强制标准吗？', a: '不是。租金参考价供交易双方议价参考，明显偏离参考价的房源平台会作出提示，但不限制成交价格。' },
      { lb: '资金监管', q: '存量房交易资金监管怎么办理？', a: '买卖双方与监管银行在线签订资金监管协议，买方资金存入监管专户，过户完成后解付给卖方，全程可在「二手房进度查询 → 资金监管」查看。' },
      { lb: '查询出证', q: '可以查别人名下的房产吗？', a: '不可以。非本人查询必须取得权利人在线授权，授权范围、期限与撤回情况全程留痕；银行、法院等机构的批量查询须经审核后执行。' },
      { lb: '查询出证', q: '备案证明怎么验真？', a: '在「查询中心 → 扫码验真」输入证明上的验真码，或直接扫描证明二维码，即可核验真伪与有效期。' },
      { lb: '一件事', q: '「二手房交易一件事」能省多少事？', a: '把网签备案、资金监管、纳税过户 3 个事项集成为一次申报，一表申请、一套材料，办结时限由 15 个工作日压缩至 8 个工作日。' }
    ];
    db.kb = { gaps: [], hit: 0, total: 0 };

    /* 21. 个人偏好 */
    db.prefs = {
      quick: ['SX0201', 'SX0301', 'SX0701', 'SX0901'],
      recent: [],
      subTypes: { case: 1, pay: 1, notice: 1, presale: 1, credit: 0 }
    };

    /* 22. 一网通办对接 */
    db.onenet = {
      pending: [
        { bh: 'GX2026' + pad(8812), sx: '房屋租赁合同备案', sqr: '覃*玲', d: ymdhm(shift(-1)), zt: '待接收' },
        { bh: 'GX2026' + pad(8813), sx: '存量房买卖合同网签备案', sqr: '梁*平', d: ymdhm(shift(-0.5)), zt: '待接收' }
      ],
      pushLogs: [
        { bh: 'BJ2026001287', jd: '办结', d: ymdhm(shift(-24)), zt: '成功', hz: 'ACK-20260' + pad(87) },
        { bh: 'BJ2026001864', jd: '受理', d: ymdhm(shift(-12)), zt: '成功', hz: 'ACK-20260' + pad(91) },
        { bh: 'BJ2026001902', jd: '受理', d: ymdhm(shift(-3)), zt: '失败', hz: '接口超时' }
      ],
      syncTime: ymdhm(shift(-1)), syncCount: 24,
      stat: { sxs: 24, sxjs: 24, sxl: 100, wbl: 91.7, qcwbl: 79.2, bjl: 3842 }
    };

    return db;
  }

  /* 构造一条办件 */
  function mkCase(db, o) {
    db._seq++;
    var no = 'BJ2026' + pad(db._seq - 1000 + 1860);
    var ZT = { '1': '已提交', '2': '已受理', '3': '待补正', '4': '已办结', '5': '已退件' };
    var steps = [
      { n: '在线提交', s: 1, d: ymdhm(shift(o.days)) },
      { n: '收件受理', s: o.zt >= '2' ? 1 : 0, d: o.zt >= '2' ? ymdhm(shift(o.days + 0.4)) : '' },
      { n: '业务审核', s: o.zt === '4' ? 1 : (o.zt === '3' ? 3 : (o.zt >= '2' ? 2 : 0)), d: o.zt === '4' ? ymdhm(shift(o.days + 1.6)) : '' },
      { n: '办结出件', s: o.zt === '4' ? 1 : 0, d: o.zt === '4' ? ymdhm(shift(o.days + 2)) : '' }
    ];
    return {
      id: 'BJ' + (db._seq), bh: no, sxdm: o.sxdm, sxmc: o.sxmc, fw: o.fw, dept: o.dept,
      zt: o.zt, ztmc: ZT[o.zt], sqrq: ymdhm(shift(o.days)),
      bjrq: o.zt === '4' ? ymdhm(shift(o.days + 2)) : '',
      xqts: o.zt === '3' ? 5 : 0,
      bzyq: o.zt === '3' ? '缺少契税完税凭证，请补充上传后重新提交。' : '',
      tjly: o.zt === '5' ? '房屋存在查封限制，不符合交易备案条件。' : '',
      steps: steps,
      files: ['居民身份证.pdf', '不动产权证书.pdf', '买卖合同.pdf'],
      pj: o.zt === '4' ? 0 : -1,   /* 0 待评价 / 1 已评价 / -1 不适用 */
      source: '门户网站', pkg: ''
    };
  }

  /* ------------------------------ 存取 ------------------------------ */
  function canLS() {
    try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; } catch (e) { return false; }
  }
  var useLS = canLS();

  function load() {
    if (!useLS) { if (!memory) memory = seed(); return memory; }
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) { var d = seed(); persist(d); return d; }
      var db = JSON.parse(raw);
      if (!db || db._v !== 1) { var d2 = seed(); persist(d2); return d2; }
      return db;
    } catch (e) { if (!memory) memory = seed(); return memory; }
  }
  function persist(db) {
    if (!useLS) { memory = db; return; }
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { memory = db; }
  }
  function reset() {
    if (useLS) { try { localStorage.removeItem(STORE_KEY); } catch (e) { } }
    memory = null;
    return load();
  }

  window.PDATA = {
    STORE_KEY: STORE_KEY, load: load, persist: persist, reset: reset, seed: seed,
    ymd: ymd, ymdhm: ymdhm, shift: shift, pad: pad,
    QX: QX, SQ: SQ, DEVS: DEVS, BANKS: BANKS, BROKERS: BROKERS, RENTCOS: RENTCOS,
    THEMES: THEMES, SCENES: SCENES
  };
})();
