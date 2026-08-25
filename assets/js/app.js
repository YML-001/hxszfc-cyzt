/* ==========================================================================
   华信数智房产交易一体化平台 · 原型布局与组件引擎 (app.js)
   基线：《前端原型设计规范-政务蓝基线v1.0.md》第 11.3 节
   本文件由 tools/gen_config.py 生成，请勿手工修改；改配置请改生成器后重跑。

   相对基线的改动只有两类，均为「业务页面分目录 + 模块级菜单共用占位页」所必需：
     一、配置区改为多端配置表 APP_CONFIGS，按 URL 的 e 参数 / 目录名 / 角色反查选取；
     二、运行时七处补丁 A~D 与 G~I，见各处行内注释，其余部分与基线逐字一致。
   ========================================================================== */

(function () {
  'use strict';

  /* ==========================================================================
     一、配置区 —— 六端各一份配置，按当前 URL 选取
     ========================================================================== */
  var APP_CONFIGS = {
    government: {
      sysName: "华信数智房产交易一体化平台",
      endName: "业务办理端",
      endIcon: "fa-briefcase",
      portalHref: "../index.html",
      defaultRole: "reviewer",
      roles: {
        window: { tag: "业务办理端", user: "覃永明", role: "柳南区交易大厅 · 窗口受理员" },
        reviewer: { tag: "业务办理端", user: "韦国强", role: "市房产交易所 · 业务审核员" },
        manager: { tag: "业务办理端", user: "李慧", role: "市住建局房产科 · 业务管理员" },
        leader: { tag: "业务办理端", user: "张伟", role: "市住建局 · 分管领导" },
        admin: { tag: "业务办理端", user: "蒙丽华", role: "市房产交易所 · 系统管理员" },
        ops: { tag: "业务办理端", user: "陆志明", role: "运维服务商 · 运维工程师" }
      },
      menu: [],
      systems: [
        {
          key: "wsbiz",
          name: "统一工作门户",
          icon: "fa-table-columns",
          line: "综合办理",
          menu: [
            { key: "wsbiz-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsbiz/biz/workbench.html" },
            {
              label: "待办任务",
              icon: "fa-list-check",
              children: [
                { key: "wsbiz-02", label: "待我审批", href: "../modules/wsbiz/biz/my-approval.html" },
                { key: "wsbiz-03", label: "待办中心", href: "../modules/wsbiz/biz/task-center.html" },
                { key: "wsbiz-04", label: "办件看板", href: "../modules/wsbiz/biz/my-board.html" }
              ]
            },
            {
              label: "收件受理",
              icon: "fa-inbox",
              children: [
                { key: "wsbiz-05", label: "事项目录", href: "../modules/wsbiz/biz/item-catalog.html" },
                { key: "wsbiz-06", label: "身份核验", href: "../modules/wsbiz/biz/identity-verify.html" },
                { key: "wsbiz-07", label: "统一收件", href: "../modules/wsbiz/biz/intake.html" },
                { key: "wsbiz-08", label: "材料核验", href: "../modules/wsbiz/biz/material-check.html" },
                { key: "wsbiz-09", label: "收件登记", href: "../modules/wsbiz/biz/intake-register.html" }
              ]
            },
            {
              label: "预约窗口",
              icon: "fa-calendar-check",
              children: [
                { key: "wsbiz-10", label: "预约取号", href: "../modules/wsbiz/biz/appointment.html" },
                { key: "wsbiz-11", label: "窗口排班", href: "../modules/wsbiz/biz/window-schedule.html" },
                { key: "wsbiz-12", label: "帮办代办", href: "../modules/wsbiz/biz/assist-service.html" }
              ]
            },
            {
              label: "材料证照",
              icon: "fa-id-card",
              children: [
                { key: "wsbiz-13", label: "材料库管理", href: "../modules/wsbiz/biz/material-library.html" },
                { key: "wsbiz-14", label: "材料免提交", href: "../modules/wsbiz/biz/material-exempt.html" },
                { key: "wsbiz-15", label: "材料补正", href: "../modules/wsbiz/biz/material-correct.html" }
              ]
            },
            {
              label: "综合查询",
              icon: "fa-magnifying-glass",
              children: [
                { key: "wsbiz-16", label: "跨业务查询", href: "../modules/wsbiz/biz/cross-query.html" },
                { key: "wsbiz-17", label: "办件台账", href: "../modules/wsbiz/biz/case-ledger.html" },
                { key: "wsbiz-18", label: "服务评价", href: "../modules/wsbiz/biz/service-review.html" }
              ]
            },
            {
              label: "指引动态",
              icon: "fa-compass",
              children: [
                { key: "wsbiz-19", label: "业务指引", href: "../modules/wsbiz/biz/guide.html" },
                { key: "wsbiz-20", label: "业务动态", href: "../modules/wsbiz/biz/news.html" }
              ]
            }
          ]
        },
        {
          key: "wsswb",
          name: "新建商品房网签备案管理系统",
          icon: "fa-building",
          line: "交易网签",
          menu: [
            { key: "wsswb-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsswb/index.html" },
            {
              label: "项目管理",
              icon: "fa-diagram-project",
              children: [
                { key: "wsswb-02", label: "项目库管理", href: "../modules/wsswb/project-list.html" },
                { key: "wsswb-03", label: "三类项目台账", href: "../modules/wsswb/project-category.html" },
                { key: "wsswb-04", label: "月度进度填报", href: "../modules/wsswb/progress-report.html" },
                { key: "wsswb-05", label: "问题项目管理", href: "../modules/wsswb/problem-project.html" },
                { key: "wsswb-06", label: "项目融资登记", href: "../modules/wsswb/finance-list.html" }
              ]
            },
            {
              label: "预售管理",
              icon: "fa-folder-open",
              children: [
                { key: "wsswb-07", label: "开发项目备案", href: "../modules/wsswb/develop-filing.html" },
                { key: "wsswb-25", label: "楼盘表销控图", href: "../modules/wsswb/building-table.html" },
                { key: "wsswb-08", label: "预售许可", href: "../modules/wsswb/presale-list.html" },
                { key: "wsswb-09", label: "现房销售", href: "../modules/wsswb/existing-sale.html" },
                { key: "wsswb-10", label: "一房一价备案", href: "../modules/wsswb/price-filing.html" }
              ]
            },
            {
              label: "网签备案",
              icon: "fa-file-circle-check",
              children: [
                { key: "wsswb-11", label: "选房认购", href: "../modules/wsswb/subscribe-list.html" },
                { key: "wsswb-12", label: "合同网签", href: "../modules/wsswb/contract-list.html" },
                { key: "wsswb-13", label: "备案办理", href: "../modules/wsswb/filing-list.html" },
                { key: "wsswb-14", label: "变更注销", href: "../modules/wsswb/filing-change.html" },
                { key: "wsswb-15", label: "备案证明", href: "../modules/wsswb/filing-cert.html" },
                { key: "wsswb-16", label: "交易条件核验", href: "../modules/wsswb/condition-check.html" },
                { key: "wsswb-26", label: "超期未网签督促", href: "../modules/wsswb/overdue-urge.html" },
                { key: "wsswb-17", label: "特殊情形销售", href: "../modules/wsswb/special-sale.html" },
                { key: "wsswb-18", label: "销售台账", href: "../modules/wsswb/sales-ledger.html" }
              ]
            },
            {
              label: "政策性住房",
              icon: "fa-scale-balanced",
              children: [
                { key: "wsswb-19", label: "政策性住房备案", href: "../modules/wsswb/policy-list.html" },
                { key: "wsswb-20", label: "征收安置房源", href: "../modules/wsswb/resettle-house.html" },
                { key: "wsswb-27", label: "房票管理", href: "../modules/wsswb/house-ticket.html" },
                { key: "wsswb-21", label: "存量房收购", href: "../modules/wsswb/acquire-collect.html" }
              ]
            },
            {
              label: "好房子管理",
              icon: "fa-award",
              children: [
                { key: "wsswb-22", label: "好房子认定", href: "../modules/wsswb/goodhouse-list.html" },
                { key: "wsswb-23", label: "住房品质信息", href: "../modules/wsswb/quality-list.html" },
                { key: "wsswb-24", label: "亮点申报", href: "../modules/wsswb/highlight-apply.html" }
              ]
            }
          ]
        },
        {
          key: "wscwb",
          name: "存量房交易网签备案管理系统",
          icon: "fa-house-chimney",
          line: "交易网签",
          menu: [
            { key: "wscwb-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wscwb/index.html" },
            {
              label: "房源采集核验",
              icon: "fa-clipboard-check",
              children: [
                { key: "wscwb-02", label: "房源核验台账", href: "../modules/wscwb/listing-list.html" },
                { key: "wscwb-07", label: "房源采集登记", href: "../modules/wscwb/listing-create.html" },
                { key: "wscwb-08", label: "房源核验办理", href: "../modules/wscwb/listing-verify.html" },
                { key: "wscwb-09", label: "房源发布授权", href: "../modules/wscwb/listing-publish.html" }
              ]
            },
            {
              label: "签约备案",
              icon: "fa-file-signature",
              children: [
                { key: "wscwb-03", label: "合同签约", href: "../modules/wscwb/contract-list.html" },
                { key: "wscwb-10", label: "合同拟定", href: "../modules/wscwb/contract-create.html" },
                { key: "wscwb-11", label: "四通道签约", href: "../modules/wscwb/contract-sign.html" },
                { key: "wscwb-12", label: "移动端签约", href: "../modules/wscwb/sign-mobile.html" },
                { key: "wscwb-13", label: "委托代理签约", href: "../modules/wscwb/agent-authorize.html" },
                { key: "wscwb-04", label: "备案过户联办", href: "../modules/wscwb/filing-list.html" },
                { key: "wscwb-14", label: "备案变更注销", href: "../modules/wscwb/filing-change.html" }
              ]
            },
            {
              label: "交易联办",
              icon: "fa-diagram-project",
              children: [
                { key: "wscwb-05", label: "一件事协同", href: "../modules/wscwb/onething-list.html" },
                { key: "wscwb-15", label: "纳税过户", href: "../modules/wscwb/transfer-tax.html" },
                { key: "wscwb-16", label: "带押过户", href: "../modules/wscwb/mortgage-transfer.html" },
                { key: "wscwb-17", label: "跨行资金协同", href: "../modules/wscwb/cross-bank.html" },
                { key: "wscwb-18", label: "预告登记", href: "../modules/wscwb/pre-notice.html" }
              ]
            },
            {
              label: "成交与监测",
              icon: "fa-folder-open",
              children: [
                { key: "wscwb-06", label: "成交信息管理", href: "../modules/wscwb/deal-ledger.html" },
                { key: "wscwb-19", label: "异常价核查", href: "../modules/wscwb/price-abnormal.html" },
                { key: "wscwb-20", label: "价格评估", href: "../modules/wscwb/appraisal.html" },
                { key: "wscwb-21", label: "成交统计发布", href: "../modules/wscwb/deal-publish.html" },
                { key: "wscwb-22", label: "自助办件监控", href: "../modules/wscwb/self-service.html" },
                { key: "wscwb-23", label: "企业交易协同", href: "../modules/wscwb/enterprise-deal.html" }
              ]
            }
          ]
        },
        {
          key: "wszwb",
          name: "房屋租赁网签备案管理系统",
          icon: "fa-key",
          line: "交易网签",
          menu: [
            { key: "wszwb-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wszwb/index.html" },
            {
              label: "租赁房源管理",
              icon: "fa-house",
              children: [
                { key: "wszwb-02", label: "租赁房源台账", href: "../modules/wszwb/listing-list.html" },
                { key: "wszwb-07", label: "放盘登记", href: "../modules/wszwb/listing-register.html" },
                { key: "wszwb-08", label: "房源核验", href: "../modules/wszwb/listing-verify.html" },
                { key: "wszwb-09", label: "发布审核", href: "../modules/wszwb/listing-publish.html" },
                { key: "wszwb-10", label: "求租撮合", href: "../modules/wszwb/demand-match.html" },
                { key: "wszwb-11", label: "预约看房", href: "../modules/wszwb/viewing-appointment.html" },
                { key: "wszwb-12", label: "保租房专题", href: "../modules/wszwb/affordable-housing.html" }
              ]
            },
            {
              label: "网签备案",
              icon: "fa-file-circle-check",
              children: [
                { key: "wszwb-03", label: "合同网签备案", href: "../modules/wszwb/contract-list.html" },
                { key: "wszwb-13", label: "合同拟定", href: "../modules/wszwb/contract-create.html" },
                { key: "wszwb-14", label: "四通道签约", href: "../modules/wszwb/contract-sign.html" },
                { key: "wszwb-15", label: "备案出证", href: "../modules/wszwb/filing-certificate.html" },
                { key: "wszwb-16", label: "单方备案", href: "../modules/wszwb/tenant-filing.html" },
                { key: "wszwb-04", label: "租赁备案服务", href: "../modules/wszwb/filing-voucher.html" },
                { key: "wszwb-17", label: "变更续租", href: "../modules/wszwb/contract-change.html" },
                { key: "wszwb-18", label: "退租注销", href: "../modules/wszwb/contract-cancel.html" }
              ]
            },
            {
              label: "主体与市场监管",
              icon: "fa-building-shield",
              children: [
                { key: "wszwb-05", label: "租赁主体监管", href: "../modules/wszwb/enterprise-supervise.html" },
                { key: "wszwb-19", label: "开业报告", href: "../modules/wszwb/enterprise-report.html" },
                { key: "wszwb-20", label: "虚假房源处置", href: "../modules/wszwb/publisher-verify.html" }
              ]
            },
            {
              label: "租金监测统计",
              icon: "fa-chart-column",
              children: [
                { key: "wszwb-06", label: "租金托管监管", href: "../modules/wszwb/fund-custody.html" },
                { key: "wszwb-21", label: "租赁台账统计", href: "../modules/wszwb/business-stat.html" }
              ]
            }
          ]
        },
        {
          key: "wsdwb",
          name: "房屋交易备案管理系统",
          icon: "fa-lock",
          line: "交易网签",
          menu: [
            { key: "wsdwb-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsdwb/index.html" },
            {
              label: "抵押合同备案",
              icon: "fa-file-contract",
              children: [
                { key: "wsdwb-02", label: "抵押备案台账", href: "../modules/wsdwb/mortgage-list.html" },
                { key: "wsdwb-19", label: "新增抵押备案", href: "../modules/wsdwb/mortgage-create.html" },
                { key: "wsdwb-05", label: "预购商品房抵押", href: "../modules/wsdwb/presale-mortgage.html" },
                { key: "wsdwb-06", label: "在建工程抵押", href: "../modules/wsdwb/project-mortgage.html" },
                { key: "wsdwb-07", label: "存量房抵押", href: "../modules/wsdwb/stock-mortgage.html" },
                { key: "wsdwb-08", label: "银行线上办理", href: "../modules/wsdwb/bank-online.html" },
                { key: "wsdwb-09", label: "贷款信息台账", href: "../modules/wsdwb/loan-ledger.html" },
                { key: "wsdwb-10", label: "登记推送监控", href: "../modules/wsdwb/registry-push.html" }
              ]
            },
            {
              label: "交易限制管理",
              icon: "fa-ban",
              children: [
                { key: "wsdwb-03", label: "限制状态总览", href: "../modules/wsdwb/restriction-status.html" },
                { key: "wsdwb-11", label: "司法查封台账", href: "../modules/wsdwb/seal-list.html" },
                { key: "wsdwb-20", label: "查封登记办理", href: "../modules/wsdwb/seal-create.html" },
                { key: "wsdwb-12", label: "限售执行解限", href: "../modules/wsdwb/sale-limit.html" },
                { key: "wsdwb-13", label: "限售限购规则", href: "../modules/wsdwb/limit-rule.html" },
                { key: "wsdwb-14", label: "协助执行备案", href: "../modules/wsdwb/assist-execution.html" },
                { key: "wsdwb-15", label: "异议与限制登记", href: "../modules/wsdwb/dissent-list.html" },
                { key: "wsdwb-16", label: "限制校验服务", href: "../modules/wsdwb/check-service.html" }
              ]
            },
            {
              label: "查档服务",
              icon: "fa-folder-open",
              children: [
                { key: "wsdwb-04", label: "查档申请台账", href: "../modules/wsdwb/archive-list.html" },
                { key: "wsdwb-21", label: "查档受理出证", href: "../modules/wsdwb/archive-apply.html" },
                { key: "wsdwb-17", label: "房屋交易备案簿", href: "../modules/wsdwb/archive-book.html" },
                { key: "wsdwb-18", label: "查档留痕审计", href: "../modules/wsdwb/archive-audit.html" }
              ]
            }
          ]
        },
        {
          key: "wschcg",
          name: "房屋交易面积信息管理系统",
          icon: "fa-ruler-combined",
          line: "交易网签",
          menu: [
            { key: "wschcg-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wschcg/index.html" },
            {
              label: "测绘成果接入",
              icon: "fa-ruler-combined",
              children: [
                { key: "wschcg-02", label: "测绘成果台账", href: "../modules/wschcg/result-list.html" },
                { key: "wschcg-06", label: "成果接入导入", href: "../modules/wschcg/result-import.html" },
                { key: "wschcg-07", label: "成果质检整改", href: "../modules/wschcg/result-check.html" },
                { key: "wschcg-08", label: "成果入库同步", href: "../modules/wschcg/result-load.html" },
                { key: "wschcg-09", label: "成果版本管理", href: "../modules/wschcg/result-version.html" },
                { key: "wschcg-10", label: "接入异常重传", href: "../modules/wschcg/import-error.html" },
                { key: "wschcg-11", label: "模板与规则配置", href: "../modules/wschcg/import-config.html" }
              ]
            },
            {
              label: "结构关联关系",
              icon: "fa-sitemap",
              children: [
                { key: "wschcg-03", label: "幢层户结构关联", href: "../modules/wschcg/structure-tree.html" },
                { key: "wschcg-12", label: "楼盘表房号匹配", href: "../modules/wschcg/room-match.html" },
                { key: "wschcg-13", label: "结构异常核查", href: "../modules/wschcg/structure-check.html" }
              ]
            },
            {
              label: "测绘图管理",
              icon: "fa-images",
              children: [
                { key: "wschcg-04", label: "测绘图台账", href: "../modules/wschcg/drawing-list.html" },
                { key: "wschcg-14", label: "分层分户图配图", href: "../modules/wschcg/drawing-match.html" },
                { key: "wschcg-15", label: "测绘图在线查看", href: "../modules/wschcg/drawing-viewer.html" },
                { key: "wschcg-16", label: "测绘图归档", href: "../modules/wschcg/drawing-archive.html" }
              ]
            },
            {
              label: "面积核验管理",
              icon: "fa-clipboard-check",
              children: [
                { key: "wschcg-05", label: "面积核验办理", href: "../modules/wschcg/area-verify.html" },
                { key: "wschcg-17", label: "预实测面积比对", href: "../modules/wschcg/area-compare.html" },
                { key: "wschcg-18", label: "差异处理与找补", href: "../modules/wschcg/area-diff.html" },
                { key: "wschcg-19", label: "面积同步楼盘表", href: "../modules/wschcg/area-sync.html" },
                { key: "wschcg-20", label: "面积异常核查", href: "../modules/wschcg/area-exception.html" },
                { key: "wschcg-21", label: "面积变更记录", href: "../modules/wschcg/area-change.html" },
                { key: "wschcg-22", label: "分摊系数管理", href: "../modules/wschcg/coefficient.html" },
                { key: "wschcg-23", label: "面积成果对外服务", href: "../modules/wschcg/area-service.html" }
              ]
            }
          ]
        },
        {
          key: "wsdagl",
          name: "房屋交易档案管理系统",
          icon: "fa-box-archive",
          line: "交易网签",
          menu: [
            { key: "wsdagl-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsdagl/index.html" },
            {
              label: "档案接收整理",
              icon: "fa-box-archive",
              children: [
                { key: "wsdagl-02", label: "档案案卷台账", href: "../modules/wsdagl/archive-list.html" },
                { key: "wsdagl-04", label: "随办随归归集", href: "../modules/wsdagl/auto-collect.html" },
                { key: "wsdagl-05", label: "影像电子归集", href: "../modules/wsdagl/scan-collect.html" },
                { key: "wsdagl-06", label: "档案著录", href: "../modules/wsdagl/catalog-entry.html" },
                { key: "wsdagl-07", label: "分类目录与规则", href: "../modules/wsdagl/category-tree.html" },
                { key: "wsdagl-08", label: "一房一档全景", href: "../modules/wsdagl/house-archive.html" },
                { key: "wsdagl-09", label: "历史档案数字化", href: "../modules/wsdagl/digitize-batch.html" }
              ]
            },
            {
              label: "档案实体保管",
              icon: "fa-warehouse",
              children: [
                { key: "wsdagl-10", label: "库房与库位管理", href: "../modules/wsdagl/warehouse.html" },
                { key: "wsdagl-11", label: "实体档案盘点", href: "../modules/wsdagl/inventory.html" },
                { key: "wsdagl-12", label: "鉴定与销毁审批", href: "../modules/wsdagl/appraise-destroy.html" },
                { key: "wsdagl-13", label: "档案移交联动", href: "../modules/wsdagl/transfer.html" },
                { key: "wsdagl-14", label: "备份与长期保管", href: "../modules/wsdagl/backup.html" }
              ]
            },
            {
              label: "档案查阅利用",
              icon: "fa-hand-holding-hand",
              children: [
                { key: "wsdagl-03", label: "借阅申请台账", href: "../modules/wsdagl/borrow-list.html" },
                { key: "wsdagl-15", label: "借阅申请与审批", href: "../modules/wsdagl/borrow-apply.html" },
                { key: "wsdagl-16", label: "借出归还与催办", href: "../modules/wsdagl/borrow-return.html" },
                { key: "wsdagl-17", label: "图文一体化查看", href: "../modules/wsdagl/archive-viewer.html" },
                { key: "wsdagl-18", label: "档案复制出证", href: "../modules/wsdagl/copy-cert.html" },
                { key: "wsdagl-19", label: "档案信息勘误", href: "../modules/wsdagl/archive-correct.html" },
                { key: "wsdagl-20", label: "利用留痕审计", href: "../modules/wsdagl/access-audit.html" }
              ]
            }
          ]
        },
        {
          key: "wsztxy",
          name: "从业主体与信用监管系统",
          icon: "fa-user-shield",
          line: "市场监管",
          menu: [
            {
              key: "wsztxy-01",
              label: "我的工作台",
              icon: "fa-table-columns",
              href: "../modules/wsztxy/wsztxy-01.html"
            },
            {
              label: "主体备案",
              icon: "fa-file-circle-check",
              children: [
                { key: "wsztxy-24", label: "事项与办件", href: "../modules/wsztxy/wsztxy-24.html" },
                { key: "wsztxy-02", label: "从业企业管理", href: "../modules/wsztxy/wsztxy-02.html" },
                { key: "wsztxy-03", label: "从业人员管理", href: "../modules/wsztxy/wsztxy-03.html" },
                { key: "wsztxy-23", label: "企业年审管理", href: "../modules/wsztxy/wsztxy-23.html" },
                { key: "wsztxy-04", label: "变更与注销", href: "../modules/wsztxy/wsztxy-04.html" }
              ]
            },
            {
              label: "主体证照库",
              icon: "fa-folder-tree",
              children: [
                { key: "wsztxy-18", label: "证照归集与核验", href: "../modules/wsztxy/wsztxy-18.html" },
                { key: "wsztxy-19", label: "材料回流与档案", href: "../modules/wsztxy/wsztxy-19.html" },
                { key: "wsztxy-20", label: "有效期监控与预警", href: "../modules/wsztxy/wsztxy-20.html" },
                { key: "wsztxy-21", label: "调用授权与日志", href: "../modules/wsztxy/wsztxy-21.html" },
                { key: "wsztxy-22", label: "证照目录与归集规则", href: "../modules/wsztxy/wsztxy-22.html" }
              ]
            },
            {
              key: "wsztxy-25",
              label: "电子钥匙配置管理",
              icon: "fa-key",
              href: "../modules/wsztxy/wsztxy-25.html"
            },
            {
              label: "双随机一公开",
              icon: "fa-bullhorn",
              children: [
                { key: "wsztxy-05", label: "抽查基本信息", href: "../modules/wsztxy/wsztxy-05.html" },
                { key: "wsztxy-06", label: "检查名录库", href: "../modules/wsztxy/wsztxy-06.html" },
                { key: "wsztxy-07", label: "检查实施整改", href: "../modules/wsztxy/wsztxy-07.html" },
                { key: "wsztxy-08", label: "抽查结果公开", href: "../modules/wsztxy/wsztxy-08.html" }
              ]
            },
            {
              label: "信用管理",
              icon: "fa-user-shield",
              children: [
                { key: "wsztxy-09", label: "信用信息管理", href: "../modules/wsztxy/wsztxy-09.html" },
                { key: "wsztxy-10", label: "投诉举报核实", href: "../modules/wsztxy/wsztxy-10.html" },
                { key: "wsztxy-11", label: "信用记分标准", href: "../modules/wsztxy/wsztxy-11.html" },
                { key: "wsztxy-12", label: "信用评价与档案", href: "../modules/wsztxy/wsztxy-12.html" },
                { key: "wsztxy-13", label: "红黑名单与修复", href: "../modules/wsztxy/wsztxy-13.html" },
                { key: "wsztxy-14", label: "奖惩措施应用", href: "../modules/wsztxy/wsztxy-14.html" }
              ]
            },
            {
              label: "监管分析",
              icon: "fa-chart-line",
              children: [
                { key: "wsztxy-15", label: "企业全景画像", href: "../modules/wsztxy/wsztxy-15.html" },
                { key: "wsztxy-16", label: "经营行为查处", href: "../modules/wsztxy/wsztxy-16.html" },
                { key: "wsztxy-17", label: "主体台账统计", href: "../modules/wsztxy/wsztxy-17.html" }
              ]
            },
            {
              label: "系统配置",
              icon: "fa-sliders",
              children: [
                { key: "wsztxy-26", label: "角色权限与数据范围", href: "../modules/wsztxy/wsztxy-26.html" },
                { key: "wsztxy-27", label: "业务闭环与验收", href: "../modules/wsztxy/wsztxy-27.html" }
              ]
            }
          ]
        },
        {
          key: "wsszjjg",
          name: "新建商品房预售资金监管系统",
          icon: "fa-sack-dollar",
          line: "资金监管",
          menu: [
          { key: "wsszjjg-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsszjjg/gov/workbench.html" },
          { label: "监管设置", icon: "fa-sliders", children: [
            { key: "wsszjjg-02", label: "监管职责界定", href: "../modules/wsszjjg/gov/duty.html" },
            { key: "wsszjjg-03", label: "监管关系维护", href: "../modules/wsszjjg/gov/relation.html" },
            { key: "wsszjjg-04", label: "监管规则配置", href: "../modules/wsszjjg/gov/rule.html" }
          ]},
          { label: "项目与账户", icon: "fa-building", children: [
            { key: "wsszjjg-05", label: "监管项目管理", href: "../modules/wsszjjg/gov/project.html" },
            { key: "wsszjjg-06", label: "监管账户管理", href: "../modules/wsszjjg/gov/account.html" },
            { key: "wsszjjg-07", label: "施工名录库", href: "../modules/wsszjjg/gov/contractor.html" }
          ]},
          { label: "资金监管", icon: "fa-sack-dollar", children: [
            { key: "wsszjjg-08", label: "资金归集管理", href: "../modules/wsszjjg/gov/collect.html" },
            { key: "wsszjjg-09", label: "资金使用管理", href: "../modules/wsszjjg/gov/usage.html" },
            { key: "wsszjjg-10", label: "资金核退管理", href: "../modules/wsszjjg/gov/refund.html" },
            { key: "wsszjjg-11", label: "账户清算管理", href: "../modules/wsszjjg/gov/clearing.html" }
          ]},
          { label: "对账与解监", icon: "fa-scale-balanced", children: [
            { key: "wsszjjg-12", label: "资金对账管理", href: "../modules/wsszjjg/gov/reconcile.html" },
            { key: "wsszjjg-13", label: "解除监管管理", href: "../modules/wsszjjg/gov/release.html" }
          ]},
          { label: "开发企业办理", icon: "fa-building-user", children: [
            { label: "开发企业工作台", href: "../modules/wsszjjg/dev/workbench.html" },
            { key: "wsszjjg-15", label: "我的监管账户", href: "../modules/wsszjjg/dev/account.html" },
            { key: "wsszjjg-16", label: "购房款缴存", href: "../modules/wsszjjg/dev/collect.html" },
            { key: "wsszjjg-17", label: "形象进度申报", href: "../modules/wsszjjg/dev/progress-apply.html" },
            { key: "wsszjjg-18", label: "我的用款申请", href: "../modules/wsszjjg/dev/usage.html" },
            { key: "wsszjjg-19", label: "保函替代申请", href: "../modules/wsszjjg/dev/guarantee-apply.html" },
            { key: "wsszjjg-20", label: "解除监管申请", href: "../modules/wsszjjg/dev/release-apply.html" }
          ]},
          { label: "监管银行办理", icon: "fa-building-columns", children: [
            { key: "wsszjjg-14", label: "银行服务工作台", href: "../modules/wsszjjg/bank/workbench.html" },
            { key: "wsszjjg-21", label: "缴存流水报送", href: "../modules/wsszjjg/bank/collect-push.html" },
            { key: "wsszjjg-22", label: "拨付指令与回执", href: "../modules/wsszjjg/bank/order.html" },
            { key: "wsszjjg-23", label: "账户余额报送", href: "../modules/wsszjjg/bank/balance.html" },
            { key: "wsszjjg-24", label: "日终对账", href: "../modules/wsszjjg/bank/reconcile.html" }
          ]},
          { label: "群众服务", icon: "fa-users", children: [
            { key: "wsszjjg-31", label: "监管公示专区", href: "../modules/wsszjjg/portal/index.html" },
            { key: "wsszjjg-32", label: "监管账户核验", href: "../modules/wsszjjg/portal/verify.html" },
            { key: "wsszjjg-33", label: "我的购房款缴存", href: "../modules/wsszjjg/portal/pay.html" },
            { key: "wsszjjg-34", label: "我的缴款通知书", href: "../modules/wsszjjg/portal/notice.html" }
          ]},
          { label: "移动端", icon: "fa-mobile-screen-button", children: [
            { label: "资金监管首页", href: "../modules/wsszjjg/mobile/home.html" },
            { label: "监管账户核验", href: "../modules/wsszjjg/mobile/verify.html" },
            { label: "我的购房款缴存", href: "../modules/wsszjjg/mobile/pay.html" },
            { label: "项目形象进度", href: "../modules/wsszjjg/mobile/progress.html" }
          ]}
        ]
        },
        {
          key: "wszjjg",
          name: "存量房交易资金监管系统",
          icon: "fa-money-bill-transfer",
          line: "资金监管",
          menu: [
          { key: "wszjjg-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wszjjg/gov/workbench.html" },
          { label: "监管办理", icon: "fa-file-signature", children: [
            { key: "wszjjg-02", label: "监管职责界定", href: "../modules/wszjjg/gov/duty.html" },
            { key: "wszjjg-03", label: "资金监管办理", href: "../modules/wszjjg/gov/escrow.html" },
            { key: "wszjjg-04", label: "资金节点监控", href: "../modules/wszjjg/gov/node.html" }
          ]},
          { label: "经纪机构办理", icon: "fa-handshake", children: [
            { key: "wszjjg-11", label: "经纪机构工作台", href: "../modules/wszjjg/agency/workbench.html" },
            { key: "wszjjg-12", label: "代办监管申请", href: "../modules/wszjjg/agency/escrow-apply.html" },
            { key: "wszjjg-13", label: "交易资金进度", href: "../modules/wszjjg/agency/progress.html" }
          ]},
          { label: "监管银行办理", icon: "fa-building-columns", children: [
            { key: "wszjjg-14", label: "划转指令与回执", href: "../modules/wszjjg/bank/order.html" },
            { key: "wszjjg-15", label: "子账号余额报送", href: "../modules/wszjjg/bank/balance.html" }
          ]},
          { label: "群众服务", icon: "fa-users", children: [
            { key: "wszjjg-31", label: "资金托管专区", href: "../modules/wszjjg/portal/index.html" },
            { key: "wszjjg-32", label: "我的交易资金", href: "../modules/wszjjg/portal/my.html" }
          ]},
          { label: "移动端", icon: "fa-mobile-screen-button", children: [
            { label: "资金托管首页", href: "../modules/wszjjg/mobile/home.html" },
            { label: "我的交易资金", href: "../modules/wszjjg/mobile/my.html" }
          ]}
        ]
        },
        {
          key: "wswxzj",
          name: "住宅专项维修资金管理系统",
          icon: "fa-screwdriver-wrench",
          line: "资金监管",
          menu: [
          { key: "wswxzj-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wswxzj/gov/workbench.html" },
          { label: "归集管理", icon: "fa-folder-open", children: [
            { key: "wswxzj-02", label: "监管职责界定", href: "../modules/wswxzj/gov/duty.html" },
            { key: "wswxzj-03", label: "维修资金归集", href: "../modules/wswxzj/gov/collect.html" },
            { key: "wswxzj-04", label: "名录库管理", href: "../modules/wswxzj/gov/roster.html" }
          ]},
          { label: "使用管理", icon: "fa-screwdriver-wrench", children: [
            { key: "wswxzj-05", label: "维修资金使用", href: "../modules/wswxzj/gov/usage.html" },
            { key: "wswxzj-06", label: "房屋养老金", href: "../modules/wswxzj/gov/pension.html" }
          ]},
          { key: "wswxzj-07", label: "核算清算对账", icon: "fa-scale-balanced", href: "../modules/wswxzj/gov/settle.html" },
          { label: "监测公示", icon: "fa-chart-line", children: [
            { key: "wswxzj-08", label: "资金运行监测", href: "../modules/wswxzj/gov/monitor.html" },
            { key: "wswxzj-09", label: "查询服务公示", href: "../modules/wswxzj/gov/public.html" }
          ]},
          { label: "物业与业委会", icon: "fa-building-user", children: [
            { key: "wswxzj-11", label: "物业工作台", href: "../modules/wswxzj/pm/workbench.html" },
            { key: "wswxzj-12", label: "维修资金使用申请", href: "../modules/wswxzj/pm/usage-apply.html" },
            { key: "wswxzj-13", label: "发起业主表决", href: "../modules/wswxzj/pm/vote-launch.html" },
            { key: "wswxzj-14", label: "完工验收申报", href: "../modules/wswxzj/pm/accept-apply.html" }
          ]},
          { label: "代收行 / 专户行", icon: "fa-building-columns", children: [
            { key: "wswxzj-21", label: "代收流水报送", href: "../modules/wswxzj/bank/collect-push.html" },
            { key: "wswxzj-22", label: "拨付指令与回执", href: "../modules/wswxzj/bank/order.html" }
          ]},
          { label: "业主服务", icon: "fa-users", children: [
            { key: "wswxzj-31", label: "维修资金公示专区", href: "../modules/wswxzj/portal/index.html" },
            { key: "wswxzj-32", label: "我的分户账账单", href: "../modules/wswxzj/portal/bill.html" },
            { key: "wswxzj-33", label: "业主线上表决", href: "../modules/wswxzj/portal/vote.html" }
          ]},
          { label: "移动端", icon: "fa-mobile-screen-button", children: [
            { label: "维修资金首页", href: "../modules/wswxzj/mobile/home.html" },
            { label: "我的分户账账单", href: "../modules/wswxzj/mobile/bill.html" },
            { label: "业主线上表决", href: "../modules/wswxzj/mobile/vote.html" }
          ]}
        ]
        },
        {
          key: "wsbzf",
          name: "保障性住房综合管理系统",
          icon: "fa-house-circle-check",
          line: "住房保障",
          menu: [
          { key: "wsbzf-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsbzf/wsbzf-01.html" },
          { label: "规划筹集", icon: "fa-clipboard-list", children: [
            { key: "wsbzf-02", label: "需求摸底", href: "../modules/wsbzf/wsbzf-02.html" },
            { key: "wsbzf-03", label: "年度计划储备", href: "../modules/wsbzf/wsbzf-03.html" },
            { key: "wsbzf-04", label: "房源筹集登记", href: "../modules/wsbzf/wsbzf-04.html" },
            { key: "wsbzf-05", label: "运营单位管理", href: "../modules/wsbzf/wsbzf-05.html" },
            { key: "wsbzf-06", label: "房源核验编码", href: "../modules/wsbzf/wsbzf-06.html" },
            { key: "wsbzf-07", label: "房源房态台账", href: "../modules/wsbzf/wsbzf-07.html" }
          ]},
          { label: "资格准入", icon: "fa-user-check", children: [
            { key: "wsbzf-08", label: "申请受理", href: "../modules/wsbzf/wsbzf-08.html" },
            { key: "wsbzf-09", label: "部门联办核对", href: "../modules/wsbzf/wsbzf-09.html" },
            { key: "wsbzf-10", label: "资格审定公示", href: "../modules/wsbzf/wsbzf-10.html" },
            { key: "wsbzf-11", label: "轮候库管理", href: "../modules/wsbzf/wsbzf-11.html" }
          ]},
          { label: "分配配置", icon: "fa-shuffle", children: [
            { key: "wsbzf-12", label: "公租房配租", href: "../modules/wsbzf/wsbzf-12.html" },
            { key: "wsbzf-13", label: "租赁补贴发放", href: "../modules/wsbzf/wsbzf-13.html" },
            { key: "wsbzf-14", label: "保租房运营", href: "../modules/wsbzf/wsbzf-14.html" },
            { key: "wsbzf-15", label: "配售型配售", href: "../modules/wsbzf/wsbzf-15.html" },
            { key: "wsbzf-16", label: "公开摇号管理", href: "../modules/wsbzf/wsbzf-16.html" },
            { key: "wsbzf-17", label: "选房活动管理", href: "../modules/wsbzf/wsbzf-17.html" }
          ]},
          { label: "合同交付", icon: "fa-file-signature", children: [
            { key: "wsbzf-18", label: "合同签约管理", href: "../modules/wsbzf/wsbzf-18.html" },
            { key: "wsbzf-19", label: "交付入住办理", href: "../modules/wsbzf/wsbzf-19.html" }
          ]},
          { label: "使用监管", icon: "fa-shield-halved", children: [
            { key: "wsbzf-20", label: "租金收缴管理", href: "../modules/wsbzf/wsbzf-20.html" },
            { key: "wsbzf-21", label: "动态资格复核", href: "../modules/wsbzf/wsbzf-21.html" },
            { key: "wsbzf-22", label: "违规查处", href: "../modules/wsbzf/wsbzf-22.html" },
            { key: "wsbzf-23", label: "退出回购管理", href: "../modules/wsbzf/wsbzf-23.html" }
          ]},
          { label: "资金管理", icon: "fa-sack-dollar", children: [
            { key: "wsbzf-24", label: "资金专户监管", href: "../modules/wsbzf/wsbzf-24.html" },
            { key: "wsbzf-25", label: "补助补贴资金", href: "../modules/wsbzf/wsbzf-25.html" }
          ]},
          { label: "小区运营", icon: "fa-city", children: [
            { key: "wsbzf-26", label: "小区资产运营", href: "../modules/wsbzf/wsbzf-26.html" },
            { key: "wsbzf-27", label: "党建网格物业", href: "../modules/wsbzf/wsbzf-27.html" }
          ]},
          { label: "监督统计", icon: "fa-chart-pie", children: [
            { key: "wsbzf-28", label: "信用审计督查", href: "../modules/wsbzf/wsbzf-28.html" },
            { key: "wsbzf-29", label: "信息公开档案", href: "../modules/wsbzf/wsbzf-29.html" },
            { key: "wsbzf-30", label: "安居工程统计", href: "../modules/wsbzf/wsbzf-30.html" },
            { key: "wsbzf-31", label: "保障房一张图", href: "../modules/wsbzf/wsbzf-31.html" }
          ]}
        ]
        },
        {
          key: "wsjcfx",
          name: "房地产市场监管监测系统",
          icon: "fa-chart-line",
          line: "监测决策",
          menu: [
            {
              key: "wsjcfx-01",
              label: "我的工作台",
              icon: "fa-table-columns",
              href: "../modules/wsjcfx/wsjcfx-01.html"
            },
            {
              label: "商品房专题统计",
              icon: "fa-chart-column",
              children: [
                { key: "wsjcfx-02", label: "商品房销售统计", href: "../modules/wsjcfx/wsjcfx-02.html" },
                { key: "wsjcfx-03", label: "商品房库存统计", href: "../modules/wsjcfx/wsjcfx-03.html" },
                { key: "wsjcfx-04", label: "商品房结构分析", href: "../modules/wsjcfx/wsjcfx-04.html" },
                { key: "wsjcfx-05", label: "预售许可统计", href: "../modules/wsjcfx/wsjcfx-05.html" }
              ]
            },
            {
              label: "存量房专题统计",
              icon: "fa-chart-column",
              children: [
                { key: "wsjcfx-06", label: "存量房成交统计", href: "../modules/wsjcfx/wsjcfx-06.html" },
                { key: "wsjcfx-07", label: "存量房挂牌监测", href: "../modules/wsjcfx/wsjcfx-07.html" },
                { key: "wsjcfx-08", label: "存量房结构分析", href: "../modules/wsjcfx/wsjcfx-08.html" }
              ]
            },
            {
              label: "综合报表管理",
              icon: "fa-table-list",
              children: [
                { key: "wsjcfx-09", label: "综合统计分析", href: "../modules/wsjcfx/wsjcfx-09.html" },
                { key: "wsjcfx-10", label: "销售排行分析", href: "../modules/wsjcfx/wsjcfx-10.html" },
                { key: "wsjcfx-11", label: "市场交易日报", href: "../modules/wsjcfx/wsjcfx-11.html" },
                { key: "wsjcfx-12", label: "上报报表管理", href: "../modules/wsjcfx/wsjcfx-12.html" },
                { key: "wsjcfx-13", label: "自定义报表", href: "../modules/wsjcfx/wsjcfx-13.html" }
              ]
            },
            {
              label: "市场监测",
              icon: "fa-binoculars",
              children: [
                { key: "wsjcfx-14", label: "交易市场监测", href: "../modules/wsjcfx/wsjcfx-14.html" },
                { key: "wsjcfx-15", label: "监管业务监测", href: "../modules/wsjcfx/wsjcfx-15.html" },
                { key: "wsjcfx-16", label: "市县对比分析", href: "../modules/wsjcfx/wsjcfx-16.html" }
              ]
            },
            {
              label: "项目监测",
              icon: "fa-binoculars",
              children: [
                { key: "wsjcfx-17", label: "项目总览", href: "../modules/wsjcfx/wsjcfx-17.html" },
                { key: "wsjcfx-18", label: "项目清单", href: "../modules/wsjcfx/wsjcfx-18.html" },
                { key: "wsjcfx-19", label: "专题看板分析", href: "../modules/wsjcfx/wsjcfx-19.html" }
              ]
            },
            {
              label: "综合驾驶舱",
              icon: "fa-gauge-high",
              children: [
                { key: "wsjcfx-20", label: "监测大屏", href: "../modules/wsjcfx/wsjcfx-20.html" },
                { key: "wsjcfx-21", label: "房产一张图", href: "../modules/wsjcfx/wsjcfx-21.html" }
              ]
            },
            {
              label: "预警督办",
              icon: "fa-triangle-exclamation",
              children: [
                { key: "wsjcfx-22", label: "预警总览", href: "../modules/wsjcfx/wsjcfx-22.html" },
                { key: "wsjcfx-23", label: "预警处置工作台", href: "../modules/wsjcfx/wsjcfx-23.html" },
                { key: "wsjcfx-24", label: "督办闭环管理", href: "../modules/wsjcfx/wsjcfx-24.html" },
                { key: "wsjcfx-25", label: "预警规则配置", href: "../modules/wsjcfx/wsjcfx-25.html" }
              ]
            }
          ]
        },
        {
          key: "wspt",
          name: "应用支撑平台",
          icon: "fa-sliders",
          line: "平台支撑",
          menu: [
            { key: "wspt-01", label: "我的工作台", icon: "fa-table-columns", href: "dashboard.html" },
            {
              label: "用户权限",
              icon: "fa-user-gear",
              children: [
                { key: "wspt-02", label: "统一用户管理", href: "../modules/_pending.html?k=wspt-02&e=government" },
                { key: "wspt-03", label: "统一身份认证", href: "../modules/_pending.html?k=wspt-03&e=government" },
                { key: "wspt-04", label: "统一权限配置", href: "../modules/_pending.html?k=wspt-04&e=government" },
                { key: "wspt-05", label: "组织结构设置", href: "../modules/_pending.html?k=wspt-05&e=government" },
                { key: "wspt-06", label: "账号安全管理", href: "../modules/_pending.html?k=wspt-06&e=government" }
              ]
            },
            {
              label: "基础数据",
              icon: "fa-sliders",
              children: [
                { key: "wspt-07", label: "数据字典设置", href: "../modules/_pending.html?k=wspt-07&e=government" },
                { key: "wspt-08", label: "基础数据管理", href: "../modules/_pending.html?k=wspt-08&e=government" },
                { key: "wspt-09", label: "编码规则管理", href: "../modules/_pending.html?k=wspt-09&e=government" },
                { key: "wspt-10", label: "系统组件管理", href: "../modules/_pending.html?k=wspt-10&e=government" },
                { key: "wspt-11", label: "系统参数管理", href: "../modules/_pending.html?k=wspt-11&e=government" }
              ]
            },
            {
              label: "事项配置",
              icon: "fa-sliders",
              children: [
                { key: "wspt-12", label: "事项目录定义", href: "../modules/_pending.html?k=wspt-12&e=government" },
                { key: "wspt-13", label: "业务编码管理", href: "../modules/_pending.html?k=wspt-13&e=government" },
                { key: "wspt-14", label: "业务资源配置", href: "../modules/_pending.html?k=wspt-14&e=government" },
                { key: "wspt-15", label: "办理标准配置", href: "../modules/_pending.html?k=wspt-15&e=government" },
                { key: "wspt-16", label: "事项发布管理", href: "../modules/_pending.html?k=wspt-16&e=government" }
              ]
            },
            {
              label: "流程引擎",
              icon: "fa-sitemap",
              children: [
                { key: "wspt-17", label: "流程建模配置", href: "../modules/_pending.html?k=wspt-17&e=government" },
                { key: "wspt-18", label: "流转规则配置", href: "../modules/_pending.html?k=wspt-18&e=government" },
                { key: "wspt-19", label: "时限督办规则", href: "../modules/_pending.html?k=wspt-19&e=government" },
                { key: "wspt-20", label: "流程版本发布", href: "../modules/_pending.html?k=wspt-20&e=government" },
                { key: "wspt-21", label: "流程运行监控", href: "../modules/_pending.html?k=wspt-21&e=government" }
              ]
            },
            {
              label: "表单定制",
              icon: "fa-pen-ruler",
              children: [
                { key: "wspt-22", label: "低代码表单", href: "../modules/_pending.html?k=wspt-22&e=government" },
                { key: "wspt-23", label: "数据源管理", href: "../modules/_pending.html?k=wspt-23&e=government" },
                { key: "wspt-24", label: "文书模板管理", href: "../modules/_pending.html?k=wspt-24&e=government" },
                { key: "wspt-25", label: "报表模板定制", href: "../modules/_pending.html?k=wspt-25&e=government" }
              ]
            },
            {
              label: "政策配置",
              icon: "fa-scale-balanced",
              children: [
                { key: "wspt-26", label: "政策项目录", href: "../modules/_pending.html?k=wspt-26&e=government" },
                { key: "wspt-27", label: "政策参数维护", href: "../modules/_pending.html?k=wspt-27&e=government" },
                { key: "wspt-28", label: "业务规则配置", href: "../modules/_pending.html?k=wspt-28&e=government" },
                { key: "wspt-29", label: "市县差异配置", href: "../modules/_pending.html?k=wspt-29&e=government" }
              ]
            },
            {
              label: "数据安全",
              icon: "fa-shield-halved",
              children: [
                { key: "wspt-30", label: "数据分级分类", href: "../modules/wspt/wspt-30.html" },
                { key: "wspt-31", label: "传输存储加密", href: "../modules/wspt/wspt-31.html" },
                { key: "wspt-32", label: "数据脱敏管理", href: "../modules/wspt/wspt-32.html" },
                { key: "wspt-33", label: "数据安全审计", href: "../modules/wspt/wspt-33.html" }
              ]
            }
          ]
        },
        {
          key: "wssvc",
          name: "统一应用服务平台",
          icon: "fa-cubes",
          line: "平台支撑",
          menu: [
            { key: "wssvc-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wssvc/common/workbench.html" },
            {
              label: "统一签约服务",
              icon: "fa-file-signature",
              children: [
                { key: "wssvc-21", label: "签约服务概览", href: "../modules/wssvc/sign/overview.html" },
                { key: "wssvc-03", label: "在线签署管理", href: "../modules/wssvc/sign/signing.html" },
                { key: "wssvc-04", label: "签署编排与验签存证", href: "../modules/wssvc/sign/orchestrate.html" },
                { key: "wssvc-22", label: "应用配置", href: "../modules/wssvc/sign/app-config.html" },
                { key: "wssvc-23", label: "签约参数配置", href: "../modules/wssvc/sign/param.html" },
                { key: "wssvc-24", label: "服务调用日志", href: "../modules/wssvc/sign/call-log.html" },
                { key: "wssvc-25", label: "接口调试", href: "../modules/wssvc/sign/api-debug.html" }
              ]
            },
            {
              label: "政银直连服务",
              icon: "fa-building-columns",
              children: [
                { key: "wssvc-26", label: "直连服务概览", href: "../modules/wssvc/direct/overview.html" },
                { key: "wssvc-06", label: "银行准入管理", href: "../modules/wsfyh/gov/access.html" },
                { key: "wssvc-10", label: "对账差错处理", href: "../modules/wsfyh/gov/recon.html" },
                { key: "wssvc-12", label: "直连运行监控", href: "../modules/wsfyh/gov/monitor.html" },
                { key: "wssvc-27", label: "应用配置", href: "../modules/wssvc/direct/app-config.html" },
                { key: "wssvc-28", label: "直连参数配置", href: "../modules/wssvc/direct/param.html" },
                { key: "wssvc-29", label: "服务调用日志", href: "../modules/wssvc/direct/call-log.html" },
                { key: "wssvc-30", label: "接口调试", href: "../modules/wssvc/direct/api-debug.html" }
              ]
            },
            {
              label: "统一文件服务",
              icon: "fa-folder-open",
              children: [
                { key: "wssvc-31", label: "文件服务概览", href: "../modules/wssvc/file/overview.html" },
                { key: "wssvc-14", label: "文件存储管理", href: "../modules/wssvc/file/storage.html" },
                { key: "wssvc-32", label: "在线预览与访问鉴权", href: "../modules/wssvc/file/preview-auth.html" },
                { key: "wssvc-35", label: "应用配置", href: "../modules/wssvc/file/app-config.html" },
                { key: "wssvc-36", label: "文件参数配置", href: "../modules/wssvc/file/param.html" },
                { key: "wssvc-37", label: "服务调用日志", href: "../modules/wssvc/file/call-log.html" },
                { key: "wssvc-38", label: "接口调试", href: "../modules/wssvc/file/api-debug.html" }
              ]
            },
            {
              label: "统一消息服务",
              icon: "fa-comment-sms",
              children: [
                { key: "wssvc-39", label: "消息服务概览", href: "../modules/wssvc/msg/overview.html" },
                { key: "wssvc-16", label: "短信通道管理", href: "../modules/wssvc/msg/channel.html" },
                { key: "wssvc-40", label: "消息模板与合规审核", href: "../modules/wssvc/msg/template.html" },
                { key: "wssvc-17", label: "微信与站内消息", href: "../modules/wssvc/msg/wechat-inner.html" },
                { key: "wssvc-18", label: "通知规则配置", href: "../modules/wssvc/msg/notify-rule.html" },
                { key: "wssvc-41", label: "发送队列与送达回执", href: "../modules/wssvc/msg/queue-receipt.html" },
                { key: "wssvc-42", label: "黑名单与退订管理", href: "../modules/wssvc/msg/blacklist.html" },
                { key: "wssvc-43", label: "发送量与费用统计", href: "../modules/wssvc/msg/cost-stat.html" },
                { key: "wssvc-44", label: "应用配置", href: "../modules/wssvc/msg/app-config.html" },
                { key: "wssvc-45", label: "消息参数配置", href: "../modules/wssvc/msg/param.html" },
                { key: "wssvc-46", label: "服务调用日志", href: "../modules/wssvc/msg/call-log.html" },
                { key: "wssvc-47", label: "接口调试", href: "../modules/wssvc/msg/api-debug.html" }
              ]
            },
            {
              label: "服务接入与治理",
              icon: "fa-plug-circle-check",
              children: [
                { key: "wssvc-57", label: "服务目录管理", href: "../modules/wssvc/gov/service-catalog.html" },
                { key: "wssvc-58", label: "接入应用管理", href: "../modules/wssvc/gov/app-access.html" },
                { key: "wssvc-59", label: "密钥与证书管理", href: "../modules/wssvc/gov/key-cert.html" },
                { key: "wssvc-60", label: "授权与配额策略", href: "../modules/wssvc/gov/quota.html" },
                { key: "wssvc-61", label: "服务运行监控", href: "../modules/wssvc/gov/monitor.html" },
                { key: "wssvc-62", label: "全局调用日志", href: "../modules/wssvc/gov/call-log.html" },
                { key: "wssvc-66", label: "告警与调用审计", href: "../modules/wssvc/gov/audit.html" }
              ]
            }
          ]
        },
        {
          key: "wsops",
          name: "平台运行与运维保障系统",
          icon: "fa-heart-pulse",
          line: "平台支撑",
          menu: [
            { key: "wsops-01", label: "我的工作台", icon: "fa-table-columns", href: "dashboard.html" },
            {
              label: "运行监控",
              icon: "fa-heart-pulse",
              children: [
                { key: "wsops-02", label: "运行监控告警", href: "../modules/_pending.html?k=wsops-02&e=government" },
                { key: "wsops-03", label: "系统日志管理", href: "../modules/_pending.html?k=wsops-03&e=government" },
                { key: "wsops-04", label: "性能巡检管理", href: "../modules/_pending.html?k=wsops-04&e=government" }
              ]
            },
            {
              label: "运维保障",
              icon: "fa-screwdriver-wrench",
              children: [
                { key: "wsops-05", label: "运维知识管理", href: "../modules/_pending.html?k=wsops-05&e=government" },
                { key: "wsops-06", label: "备份恢复管理", href: "../modules/_pending.html?k=wsops-06&e=government" },
                { key: "wsops-07", label: "定时任务管理", href: "../modules/_pending.html?k=wsops-07&e=government" },
                { key: "wsops-08", label: "数据更正审批", href: "../modules/_pending.html?k=wsops-08&e=government" }
              ]
            },
            {
              label: "信创国密",
              icon: "fa-shield-halved",
              children: [
                { key: "wsops-09", label: "国产化适配", href: "../modules/_pending.html?k=wsops-09&e=government" },
                { key: "wsops-10", label: "数据库迁移", href: "../modules/_pending.html?k=wsops-10&e=government" },
                { key: "wsops-11", label: "国密改造", href: "../modules/_pending.html?k=wsops-11&e=government" },
                { key: "wsops-12", label: "密评合规管理", href: "../modules/_pending.html?k=wsops-12&e=government" }
              ]
            },
            {
              label: "实施运营",
              icon: "fa-heart-pulse",
              children: [
                { key: "wsops-13", label: "部署联调管理", href: "../modules/_pending.html?k=wsops-13&e=government" },
                { key: "wsops-14", label: "数据迁移割接", href: "../modules/_pending.html?k=wsops-14&e=government" },
                { key: "wsops-15", label: "培训交接管理", href: "../modules/_pending.html?k=wsops-15&e=government" },
                { key: "wsops-16", label: "试运行质保", href: "../modules/_pending.html?k=wsops-16&e=government" }
              ]
            }
          ]
        }
      ],
      defaultSystem: "wsbiz",
      roleMenu: {
        window: [
          "wsbiz-06", "wsbiz-07", "wsbiz-08", "wsbiz-09", "wsbiz-10", "wsbiz-12", "wsbiz-13", "wsbiz-14",
          "wsbiz-15", "wsswb-01", "wscwb-01", "wscwb-03", "wscwb-05", "wszwb-01", "wsdwb-01", "wsdwb-04",
          "wschcg-01", "wsdagl-01", "wsztxy-01", "wsztxy-25", "wsztxy-18", "wsztxy-24", "wsszjjg-01", "wszjjg-01",
          "wswxzj-01", "wsjcfx-02",
          "wsjcfx-03", "wsjcfx-04", "wsjcfx-05", "wsjcfx-06", "wsjcfx-07", "wsjcfx-08", "wsjcfx-10",
          "wsjcfx-18", "wspt-01", "wssvc-01", "wssvc-31", "wssvc-14", "wsops-01", "wsszjjg-02", "wsszjjg-03",
          "wsszjjg-04", "wsszjjg-05", "wsszjjg-06", "wsszjjg-07", "wsszjjg-08", "wsszjjg-09", "wsszjjg-10",
          "wsszjjg-11", "wsszjjg-12", "wsszjjg-13", "wsszjjg-14", "wsszjjg-15", "wsszjjg-16", "wsszjjg-17",
          "wsszjjg-18", "wsszjjg-19", "wsszjjg-20", "wsszjjg-21", "wsszjjg-22", "wsszjjg-23", "wsszjjg-24",
          "wsszjjg-31", "wsszjjg-32", "wsszjjg-33", "wsszjjg-34", "wswxzj-02", "wswxzj-03", "wswxzj-04",
          "wswxzj-05", "wswxzj-06", "wswxzj-07", "wswxzj-08", "wswxzj-09", "wswxzj-11", "wswxzj-12",
          "wswxzj-13", "wswxzj-14", "wswxzj-21", "wswxzj-22", "wswxzj-31", "wswxzj-32", "wswxzj-33",
          "wszjjg-02", "wszjjg-03", "wszjjg-04", "wszjjg-11", "wszjjg-12", "wszjjg-13", "wszjjg-14",
          "wszjjg-15", "wszjjg-31", "wszjjg-32"
        ],
        reviewer: [
          "wsbiz-01", "wsbiz-02", "wsbiz-03", "wsbiz-04", "wsbiz-16", "wsbiz-19", "wsbiz-20", "wsswb-01",
          "wsswb-02", "wsswb-03", "wsswb-04", "wsswb-05", "wsswb-06", "wsswb-07", "wsswb-08", "wsswb-09",
          "wsswb-10", "wsswb-11", "wsswb-12", "wsswb-13", "wsswb-14", "wsswb-15", "wsswb-16", "wsswb-17",
          "wsswb-18", "wsswb-19", "wsswb-20", "wsswb-21", "wsswb-22", "wsswb-23", "wsswb-24", "wsswb-25",
          "wsswb-26", "wsswb-27", "wscwb-01", "wscwb-02", "wscwb-03", "wscwb-04", "wscwb-05", "wscwb-06",
          "wscwb-07", "wscwb-08", "wscwb-09", "wscwb-10", "wscwb-11", "wscwb-12", "wscwb-13", "wscwb-14",
          "wscwb-15", "wscwb-16", "wscwb-17", "wscwb-18", "wscwb-19", "wscwb-20", "wscwb-21", "wscwb-22",
          "wscwb-23", "wszwb-01", "wszwb-02", "wszwb-03", "wszwb-04", "wszwb-05", "wszwb-06", "wszwb-07",
          "wszwb-08", "wszwb-09", "wszwb-10", "wszwb-11", "wszwb-12", "wszwb-13", "wszwb-14", "wszwb-15",
          "wszwb-16", "wszwb-17", "wszwb-18", "wszwb-19", "wszwb-20", "wszwb-21", "wsdwb-01", "wsdwb-02",
          "wsdwb-03", "wsdwb-04", "wsdwb-05", "wsdwb-06", "wsdwb-07", "wsdwb-08", "wsdwb-09", "wsdwb-10",
          "wsdwb-11", "wsdwb-12", "wsdwb-13", "wsdwb-14", "wsdwb-15", "wsdwb-16", "wsdwb-17", "wsdwb-18",
          "wsdwb-19", "wsdwb-20", "wsdwb-21", "wschcg-01", "wschcg-02", "wschcg-03", "wschcg-04",
          "wschcg-05", "wschcg-06", "wschcg-07", "wschcg-08", "wschcg-09", "wschcg-10", "wschcg-11",
          "wschcg-12", "wschcg-13", "wschcg-14", "wschcg-15", "wschcg-16", "wschcg-17", "wschcg-18",
          "wschcg-19", "wschcg-20", "wschcg-21", "wschcg-22", "wschcg-23", "wsdagl-01", "wsdagl-02",
          "wsdagl-03", "wsdagl-04", "wsdagl-05", "wsdagl-06", "wsdagl-07", "wsdagl-08", "wsdagl-09",
          "wsdagl-10", "wsdagl-11", "wsdagl-12", "wsdagl-13", "wsdagl-14", "wsdagl-15", "wsdagl-16",
          "wsdagl-17", "wsdagl-18", "wsdagl-19", "wsdagl-20", "wsztxy-01", "wsztxy-25", "wsztxy-02", "wsztxy-03",
          "wsztxy-04", "wsztxy-06", "wsztxy-07", "wsztxy-08", "wsztxy-10", "wsztxy-18", "wsztxy-19",
          "wsztxy-23", "wsztxy-24", "wsszjjg-01", "wsszjjg-02", "wsszjjg-05",
          "wsszjjg-06", "wsszjjg-08", "wsszjjg-09", "wsszjjg-10", "wsszjjg-12", "wsszjjg-13", "wszjjg-01",
          "wszjjg-03", "wszjjg-04", "wswxzj-01", "wswxzj-02", "wswxzj-03", "wswxzj-05", "wswxzj-07",
          "wswxzj-09", "wsjcfx-02", "wsjcfx-03", "wsjcfx-04", "wsjcfx-05", "wsjcfx-06", "wsjcfx-07",
          "wsjcfx-08", "wsjcfx-10", "wsjcfx-18", "wspt-01", "wspt-03", "wspt-25", "wssvc-01", "wssvc-21",
          "wssvc-03", "wssvc-04", "wssvc-31", "wssvc-14", "wssvc-32", "wsops-01", "wsszjjg-03", "wsszjjg-04",
          "wsszjjg-07", "wsszjjg-11", "wsszjjg-14", "wsszjjg-15", "wsszjjg-16", "wsszjjg-17", "wsszjjg-18",
          "wsszjjg-19", "wsszjjg-20", "wsszjjg-21", "wsszjjg-22", "wsszjjg-23", "wsszjjg-24", "wsszjjg-31",
          "wsszjjg-32", "wsszjjg-33", "wsszjjg-34", "wswxzj-04", "wswxzj-06", "wswxzj-08", "wswxzj-11",
          "wswxzj-12", "wswxzj-13", "wswxzj-14", "wswxzj-21", "wswxzj-22", "wswxzj-31", "wswxzj-32",
          "wswxzj-33", "wszjjg-02", "wszjjg-11", "wszjjg-12", "wszjjg-13", "wszjjg-14", "wszjjg-15",
          "wszjjg-31", "wszjjg-32"
        ],
        manager: [
          "wsbiz-10", "wsbiz-11", "wsbiz-15", "wsbiz-16", "wsbiz-17", "wsbiz-18", "wsbiz-19", "wsbiz-20",
          "wsswb-01", "wsswb-02", "wsswb-03", "wsswb-04", "wsswb-05", "wsswb-06", "wsswb-09", "wsswb-11",
          "wsswb-12", "wsswb-16", "wsswb-17", "wsswb-18", "wsswb-21", "wsswb-22", "wsswb-23", "wsswb-24",
          "wscwb-01", "wscwb-06", "wszwb-01", "wszwb-02", "wszwb-04", "wszwb-05", "wszwb-06", "wsdwb-01",
          "wsdwb-04", "wschcg-01", "wsdagl-01", "wsztxy-01", "wsztxy-02", "wsztxy-03", "wsztxy-05",
          "wsztxy-06", "wsztxy-07", "wsztxy-08", "wsztxy-09", "wsztxy-10", "wsztxy-11", "wsztxy-12",
          "wsztxy-13", "wsztxy-14", "wsztxy-15", "wsztxy-16", "wsztxy-17", "wsztxy-25", "wsztxy-26", "wsztxy-27", "wsztxy-18", "wsztxy-19",
          "wsztxy-20", "wsztxy-21", "wsztxy-22", "wsztxy-23", "wsztxy-24", "wsszjjg-01", "wsszjjg-02",
          "wsszjjg-03", "wsszjjg-05", "wsszjjg-06", "wsszjjg-07", "wsszjjg-08", "wsszjjg-09", "wsszjjg-11",
          "wszjjg-01", "wszjjg-02", "wswxzj-01", "wswxzj-02", "wswxzj-04", "wswxzj-05", "wswxzj-06",
          "wswxzj-08", "wswxzj-09", "wsjcfx-01", "wsjcfx-02", "wsjcfx-03", "wsjcfx-04", "wsjcfx-05",
          "wsjcfx-06", "wsjcfx-07", "wsjcfx-08", "wsjcfx-09", "wsjcfx-10", "wsjcfx-11", "wsjcfx-12",
          "wsjcfx-13", "wsjcfx-17", "wsjcfx-18", "wsjcfx-23", "wsjcfx-24", "wsjcfx-25", "wspt-01", "wspt-21",
          "wssvc-01", "wssvc-21", "wssvc-26", "wssvc-06", "wssvc-10", "wssvc-12", "wssvc-39", "wssvc-43",
          "wssvc-61", "wsops-01", "wsops-14", "wsops-15", "wsszjjg-04", "wsszjjg-10", "wsszjjg-12",
          "wsszjjg-13", "wsszjjg-14", "wsszjjg-15", "wsszjjg-16", "wsszjjg-17", "wsszjjg-18", "wsszjjg-19",
          "wsszjjg-20", "wsszjjg-21", "wsszjjg-22", "wsszjjg-23", "wsszjjg-24", "wsszjjg-31", "wsszjjg-32",
          "wsszjjg-33", "wsszjjg-34", "wswxzj-03", "wswxzj-07", "wswxzj-11", "wswxzj-12", "wswxzj-13",
          "wswxzj-14", "wswxzj-21", "wswxzj-22", "wswxzj-31", "wswxzj-32", "wswxzj-33", "wszjjg-03",
          "wszjjg-04", "wszjjg-11", "wszjjg-12", "wszjjg-13", "wszjjg-14", "wszjjg-15", "wszjjg-31",
          "wszjjg-32"
        ],
        leader: [
          "wsbiz-17", "wsbiz-18", "wsswb-01", "wscwb-01", "wszwb-01", "wsdwb-01", "wschcg-01", "wsdagl-01",
          "wsztxy-01", "wsztxy-15", "wsztxy-17", "wsztxy-27", "wsztxy-20", "wsszjjg-01", "wszjjg-01", "wswxzj-01",
          "wswxzj-06", "wswxzj-08",
          "wsjcfx-01", "wsjcfx-02", "wsjcfx-03", "wsjcfx-04", "wsjcfx-05", "wsjcfx-06", "wsjcfx-07",
          "wsjcfx-08", "wsjcfx-10", "wsjcfx-11", "wsjcfx-13", "wsjcfx-14", "wsjcfx-15", "wsjcfx-16",
          "wsjcfx-18", "wsjcfx-19", "wsjcfx-20", "wsjcfx-21", "wsjcfx-22", "wspt-01", "wssvc-01", "wssvc-21",
          "wssvc-26", "wssvc-31", "wssvc-39", "wssvc-61", "wsops-01", "wsszjjg-02", "wsszjjg-03",
          "wsszjjg-04", "wsszjjg-05", "wsszjjg-06", "wsszjjg-07", "wsszjjg-08", "wsszjjg-09", "wsszjjg-10",
          "wsszjjg-11", "wsszjjg-12", "wsszjjg-13", "wsszjjg-14", "wsszjjg-15", "wsszjjg-16", "wsszjjg-17",
          "wsszjjg-18", "wsszjjg-19", "wsszjjg-20", "wsszjjg-21", "wsszjjg-22", "wsszjjg-23", "wsszjjg-24",
          "wsszjjg-31", "wsszjjg-32", "wsszjjg-33", "wsszjjg-34", "wswxzj-02", "wswxzj-03", "wswxzj-04",
          "wswxzj-05", "wswxzj-07", "wswxzj-09", "wswxzj-11", "wswxzj-12", "wswxzj-13", "wswxzj-14",
          "wswxzj-21", "wswxzj-22", "wswxzj-31", "wswxzj-32", "wswxzj-33", "wszjjg-02", "wszjjg-03",
          "wszjjg-04", "wszjjg-11", "wszjjg-12", "wszjjg-13", "wszjjg-14", "wszjjg-15", "wszjjg-31",
          "wszjjg-32"
        ],
        admin: [
          "wsbiz-05", "wsbiz-10", "wsbiz-11", "wsbiz-13", "wsbiz-20", "wsswb-01", "wscwb-01", "wszwb-01",
          "wsdwb-01", "wschcg-01", "wschcg-02", "wschcg-05", "wsdagl-01", "wsztxy-01", "wsztxy-25", "wsztxy-26", "wsztxy-27", "wsztxy-20",
          "wsztxy-21", "wsztxy-22", "wsztxy-24", "wsszjjg-01",
          "wsszjjg-02", "wsszjjg-03", "wsszjjg-04", "wszjjg-01", "wswxzj-01", "wswxzj-02", "wsjcfx-02",
          "wsjcfx-03", "wsjcfx-04", "wsjcfx-05", "wsjcfx-06", "wsjcfx-07", "wsjcfx-08", "wsjcfx-09",
          "wsjcfx-10", "wsjcfx-17", "wsjcfx-18", "wsjcfx-25", "wspt-01", "wspt-02", "wspt-03", "wspt-04",
          "wspt-05", "wspt-06", "wspt-07", "wspt-08", "wspt-09", "wspt-10", "wspt-11", "wspt-12", "wspt-13",
          "wspt-14", "wspt-15", "wspt-16", "wspt-17", "wspt-18", "wspt-19", "wspt-20", "wspt-21", "wspt-22",
          "wspt-23", "wspt-24", "wspt-25", "wspt-26", "wspt-27", "wspt-28", "wspt-29", "wspt-30", "wspt-31",
          "wspt-32", "wspt-33", "wssvc-01", "wssvc-21", "wssvc-03", "wssvc-04", "wssvc-22", "wssvc-23",
          "wssvc-24", "wssvc-25", "wssvc-26", "wssvc-06", "wssvc-10", "wssvc-12", "wssvc-27", "wssvc-28",
          "wssvc-29", "wssvc-30", "wssvc-31", "wssvc-14", "wssvc-32", "wssvc-35", "wssvc-36", "wssvc-37",
          "wssvc-38", "wssvc-39", "wssvc-16", "wssvc-40", "wssvc-17", "wssvc-18", "wssvc-41", "wssvc-42",
          "wssvc-43", "wssvc-44", "wssvc-45", "wssvc-46", "wssvc-47", "wssvc-57", "wssvc-58", "wssvc-59",
          "wssvc-60", "wssvc-61", "wssvc-62", "wssvc-66", "wsops-01", "wsops-08", "wsops-11", "wsszjjg-05",
          "wsszjjg-06", "wsszjjg-07", "wsszjjg-08", "wsszjjg-09", "wsszjjg-10", "wsszjjg-11", "wsszjjg-12",
          "wsszjjg-13", "wsszjjg-14", "wsszjjg-15", "wsszjjg-16", "wsszjjg-17", "wsszjjg-18", "wsszjjg-19",
          "wsszjjg-20", "wsszjjg-21", "wsszjjg-22", "wsszjjg-23", "wsszjjg-24", "wsszjjg-31", "wsszjjg-32",
          "wsszjjg-33", "wsszjjg-34", "wswxzj-03", "wswxzj-04", "wswxzj-05", "wswxzj-06", "wswxzj-07",
          "wswxzj-08", "wswxzj-09", "wswxzj-11", "wswxzj-12", "wswxzj-13", "wswxzj-14", "wswxzj-21",
          "wswxzj-22", "wswxzj-31", "wswxzj-32", "wswxzj-33", "wszjjg-02", "wszjjg-03", "wszjjg-04",
          "wszjjg-11", "wszjjg-12", "wszjjg-13", "wszjjg-14", "wszjjg-15", "wszjjg-31", "wszjjg-32"
        ],
        ops: [
          "wsswb-01", "wscwb-01", "wszwb-01", "wsdwb-01", "wschcg-01", "wsdagl-01", "wsdagl-02", "wsztxy-01",
          "wsszjjg-01", "wszjjg-01", "wswxzj-01", "wsjcfx-02", "wsjcfx-03", "wsjcfx-04", "wsjcfx-05",
          "wsjcfx-06", "wsjcfx-07", "wsjcfx-08", "wsjcfx-10", "wsjcfx-18", "wspt-01", "wspt-06", "wspt-33",
          "wssvc-01", "wssvc-57", "wssvc-58", "wssvc-59", "wssvc-60", "wssvc-61", "wssvc-62", "wssvc-66",
          "wsops-01", "wsops-02", "wsops-03", "wsops-04", "wsops-05", "wsops-06", "wsops-07", "wsops-09",
          "wsops-10", "wsops-12", "wsops-13", "wsops-14", "wsops-15", "wsops-16", "wsszjjg-02", "wsszjjg-03",
          "wsszjjg-04", "wsszjjg-05", "wsszjjg-06", "wsszjjg-07", "wsszjjg-08", "wsszjjg-09", "wsszjjg-10",
          "wsszjjg-11", "wsszjjg-12", "wsszjjg-13", "wsszjjg-14", "wsszjjg-15", "wsszjjg-16", "wsszjjg-17",
          "wsszjjg-18", "wsszjjg-19", "wsszjjg-20", "wsszjjg-21", "wsszjjg-22", "wsszjjg-23", "wsszjjg-24",
          "wsszjjg-31", "wsszjjg-32", "wsszjjg-33", "wsszjjg-34", "wswxzj-02", "wswxzj-03", "wswxzj-04",
          "wswxzj-05", "wswxzj-06", "wswxzj-07", "wswxzj-08", "wswxzj-09", "wswxzj-11", "wswxzj-12",
          "wswxzj-13", "wswxzj-14", "wswxzj-21", "wswxzj-22", "wswxzj-31", "wswxzj-32", "wswxzj-33",
          "wszjjg-02", "wszjjg-03", "wszjjg-04", "wszjjg-11", "wszjjg-12", "wszjjg-13", "wszjjg-14",
          "wszjjg-15", "wszjjg-31", "wszjjg-32"
        ]
      },
      dict: {
        said: [
          ["450200", "柳州市本级"],
          ["450202", "城中区"],
          ["450203", "鱼峰区"],
          ["450204", "柳南区"],
          ["450205", "柳北区"],
          ["450206", "柳江区"],
          ["450222", "柳城县"],
          ["450223", "鹿寨县"],
          ["450224", "融安县"],
          ["450225", "融水苗族自治县"],
          ["450226", "三江侗族自治县"]
        ],
        blzt: [
          ["0", "待受理"],
          ["1", "办理中"],
          ["2", "已办结"],
          ["3", "已撤件"],
          ["4", "已退件"],
          ["5", "待补正"],
          ["6", "中止办理"],
          ["7", "已作废"]
        ],
        shzt: [
          ["0", "待审核"],
          ["1", "审核中"],
          ["2", "审核通过"],
          ["3", "审核不通过"],
          ["4", "退回补正"]
        ],
        sjly: [
          ["01", "窗口办理"],
          ["02", "统一服务门户"],
          ["03", "微信小程序"],
          ["04", "自助终端"],
          ["05", "中介机构端"],
          ["06", "企业工作台"],
          ["07", "银行端"],
          ["08", "接口导入"],
          ["09", "历史数据迁移"],
          ["10", "批量导入"],
          ["99", "其他"]
        ],
        ywdl: [
          ["01", "商品房交易"],
          ["02", "存量房交易"],
          ["03", "房屋租赁"],
          ["04", "抵押与交易限制"],
          ["05", "政策性住房与安置房"],
          ["06", "测绘成果与面积"],
          ["07", "房产档案"],
          ["08", "预售资金监管"],
          ["09", "存量房资金监管"],
          ["10", "维修资金监管"],
          ["11", "从业主体与信用"],
          ["12", "项目监管与好房子"],
          ["13", "查询与出证"],
          ["14", "更正与撤销"],
          ["99", "其他"]
        ],
        zjlx: [
          ["01", "居民身份证"],
          ["02", "户口簿"],
          ["03", "护照"],
          ["21", "统一社会信用代码证"],
          ["22", "营业执照"],
          ["99", "其他"]
        ],
        fwyt: [
          ["01", "成套住宅"],
          ["02", "非成套住宅"],
          ["03", "集体宿舍"],
          ["04", "商业服务"],
          ["05", "办公"],
          ["06", "工业仓储"],
          ["07", "车库车位"],
          ["08", "教育医疗"],
          ["09", "公共设施"],
          ["99", "其他"]
        ],
        ztlx: [
          ["01", "房地产开发企业"],
          ["02", "房地产经纪机构"],
          ["04", "物业服务企业"],
          ["06", "房产测绘机构"],
          ["11", "金融机构"],
          ["05", "房地产估价机构"]
        ],
        xyjb: [
          ["A+", "A+ 信用优秀"],
          ["A", "A 信用良好"],
          ["B", "B 信用一般"],
          ["C", "C 信用较差"],
          ["D", "D 信用差"]
        ],
        yesNo: [
          ["1", "是"],
          ["0", "否"]
        ],
        lvColor: [
          ["blue", "蓝色 · 正常"],
          ["yellow", "黄色 · 提示"],
          ["orange", "橙色 · 预警"],
          ["red", "红色 · 严重"]
        ]
      },
      home: {
        window: {
          welcome: "窗口收件与受理工作台",
          heroStats: [
            { v: "38", l: "今日取号" },
            { v: "26", l: "今日收件" },
            { v: "5", l: "待补正" }
          ],
          kpis: [
            { c: "blue", i: "fa-ticket", l: "今日取号", v: "38", t: "当前等候 6 人" },
            { c: "green", i: "fa-inbox", l: "今日收件", v: "26", t: "↑ 较昨日 +4" },
            { c: "orange", i: "fa-file-circle-exclamation", l: "待补正", v: "5", t: "需通知申请人", td: "text-danger" },
            { c: "cyan", i: "fa-stopwatch", l: "平均等候", v: "8.4 分", t: "↓ 1.2 分" }
          ],
          todos: [
            { c: "orange", tag: "收件登记", txt: "荣和公园大道 3 栋 1802 商品房网签收件待登记", time: "剩 2h", warn: 1 },
            { c: "blue", tag: "材料核验", txt: "彰泰滨江学府存量房过户材料待核验", time: "剩 5h" },
            { c: "red", tag: "补正告知", txt: "LZBJ20260218 缺身份证复印件，待一次性告知", time: "已超期", warn: 1 },
            { c: "blue", tag: "预约签到", txt: "今日 14:00 韦某某 抵押备案预约待签到", time: "剩 3h" },
            { c: "green", tag: "出件领取", txt: "LZBJ20260196 备案证明待申请人领取", time: "剩 1天" },
            { c: "orange", tag: "收件登记", txt: "阳光100城市广场租赁备案收件待登记", time: "剩 4h" },
            { c: "blue", tag: "帮办代办", txt: "覃某某 老年人代办申请待受理", time: "剩 6h" },
            { c: "blue", tag: "材料核验", txt: "龙光玖珑湖 车位合同网签材料待核验", time: "剩 1天" }
          ],
          shortcuts: [
            { c: "blue", i: "fa-inbox", l: "统一收件", h: "../modules/wsbiz/biz/intake.html" },
            {
              c: "green",
              i: "fa-folder-tree",
              l: "材料库管理",
              h: "../modules/wsbiz/biz/material-library.html"
            },
            { c: "cyan", i: "fa-ticket", l: "预约取号", h: "../modules/wsbiz/biz/appointment.html" },
            {
              c: "orange",
              i: "fa-file-circle-plus",
              l: "收件登记",
              h: "../modules/wsbiz/biz/intake-register.html"
            },
            {
              c: "purple",
              i: "fa-house-chimney",
              l: "存量房签约",
              h: "../modules/wscwb/contract-list.html"
            },
            { c: "red", i: "fa-folder-open", l: "查档服务", h: "../modules/wsdwb/archive-list.html" }
          ]
        },
        reviewer: {
          welcome: "全市房产交易业务审核工作台",
          heroStats: [
            { v: "1,286", l: "在办件" },
            { v: "32", l: "待我审批" },
            { v: "18", l: "超期预警" }
          ],
          kpis: [
            { c: "blue", i: "fa-inbox", l: "今日收件", v: "126", t: "↑ 较昨日 +18" },
            { c: "cyan", i: "fa-folder-open", l: "在办件", v: "1,286", t: "较上月 +12" },
            { c: "red", i: "fa-clock", l: "超期预警", v: "18", t: "需优先处理", td: "text-danger" },
            { c: "green", i: "fa-circle-check", l: "本月办结", v: "862", t: "按时办结率 94.6%" }
          ],
          todos: [
            { c: "red", tag: "商品房网签", txt: "荣和公园大道 1 号楼 12 份合同待备案审核", time: "剩 3h", warn: 1 },
            { c: "orange", tag: "预售许可", txt: "彰泰滨江学府三期预售许可待复审", time: "剩 6h", warn: 1 },
            { c: "blue", tag: "存量房备案", txt: "文昌路 128 号 3-2-501 网签即备案待审核", time: "剩 1天" },
            { c: "blue", tag: "抵押备案", txt: "柳州银行 8 笔抵押合同备案待审核", time: "剩 1天" },
            { c: "orange", tag: "资金拨付", txt: "保利central park 预售资金拨付 860 万元待审核", time: "剩 8h", warn: 1 },
            { c: "blue", tag: "租赁备案", txt: "阳光100城市广场 6 份租赁合同待备案", time: "剩 2天" },
            { c: "green", tag: "面积核验", txt: "恒大城 5 栋分层分户测绘成果待核验", time: "剩 2天" },
            { c: "blue", tag: "政策性住房", txt: "房票安置 4 户交易备案待审核", time: "剩 3天" }
          ],
          shortcuts: [
            { c: "blue", i: "fa-building", l: "商品房备案办理", h: "../modules/wsswb/filing-list.html" },
            {
              c: "green",
              i: "fa-house-chimney",
              l: "备案过户联办",
              h: "../modules/wscwb/filing-list.html"
            },
            { c: "cyan", i: "fa-key", l: "租赁合同网签备案", h: "../modules/wszwb/contract-list.html" },
            { c: "orange", i: "fa-lock", l: "抵押合同备案", h: "../modules/wsdwb/mortgage-list.html" },
            {
              c: "purple",
              i: "fa-sack-dollar",
              l: "资金使用管理",
              h: "../modules/wsszjjg/gov/usage.html"
            },
            {
              c: "red",
              i: "fa-screwdriver-wrench",
              l: "维修资金使用",
              h: "../modules/wswxzj/gov/usage.html"
            },
            {
              c: "blue",
              i: "fa-file-signature",
              l: "在线签署管理",
              h: "../modules/wssvc/sign/signing.html"
            },
            {
              c: "green",
              i: "fa-ruler-combined",
              l: "面积核验",
              h: "../modules/wschcg/area-verify.html"
            },
            {
              c: "cyan",
              i: "fa-box-archive",
              l: "档案接收整理",
              h: "../modules/wsdagl/archive-list.html"
            },
            {
              c: "orange",
              i: "fa-house-flag",
              l: "政策性住房备案",
              h: "../modules/wsswb/policy-list.html"
            },
            {
              c: "purple",
              i: "fa-magnifying-glass-chart",
              l: "跨业务查询",
              h: "../modules/wsbiz/biz/cross-query.html"
            },
            { c: "red", i: "fa-list-check", l: "待办中心", h: "../modules/wsbiz/biz/task-center.html" }
          ]
        },
        manager: {
          welcome: "全市房产市场与项目监管工作台",
          heroStats: [
            { v: "38", l: "待处置预警" },
            { v: "12", l: "在办督办单" },
            { v: "186", l: "项目在库" }
          ],
          kpis: [
            { c: "red", i: "fa-triangle-exclamation", l: "待处置预警", v: "38", t: "橙色及以上 47 条", td: "text-danger" },
            { c: "orange", i: "fa-flag", l: "在办督办单", v: "12", t: "临期 3 单" },
            { c: "blue", i: "fa-diagram-project", l: "项目在库", v: "186", t: "保交楼问题项目 7 个" },
            { c: "green", i: "fa-file-contract", l: "本月网签量", v: "2,580 套", t: "↑ 9.3%" }
          ],
          todos: [
            { c: "red", tag: "预警处置", txt: "万达华府监管账户资金留存低于监管额度", time: "剩 4h", warn: 1 },
            { c: "orange", tag: "督办派单", txt: "碧桂园天玺湾进度滞后待派单督办", time: "剩 1天", warn: 1 },
            { c: "blue", tag: "进度填报", txt: "本月 186 个项目进度填报，尚有 23 个未报", time: "剩 3天" },
            { c: "blue", tag: "信用评价", txt: "第三季度经纪机构信用评价待复核", time: "剩 5天" },
            { c: "orange", tag: "日报编制", txt: "房地产市场交易信息日报待审签", time: "剩 2h", warn: 1 },
            { c: "green", tag: "好房子认定", txt: "地王国际财富中心好房子认定材料待初核", time: "剩 4天" },
            { c: "blue", tag: "红黑榜", txt: "租赁企业红黑榜公示名单待确认", time: "剩 6天" },
            { c: "blue", tag: "对上报送", txt: "住建部网签备案联网上报待复核", time: "剩 1天" },
            { c: "orange", tag: "主体备案", txt: "经纪机构备案申报 8 件待审核，其中 2 件为代理申报", time: "剩 1天", warn: 1 },
            { c: "red", tag: "整改复查", txt: "中天房地产经纪整改逾期未反馈，待复查或转查处", time: "已逾期 50天", warn: 1 }
          ],
          shortcuts: [
            { c: "red", i: "fa-triangle-exclamation", l: "督办闭环管理", h: "../modules/wsjcfx/wsjcfx-24.html" },
            {
              c: "blue",
              i: "fa-diagram-project",
              l: "项目库管理",
              h: "../modules/wsswb/project-list.html"
            },
            { c: "orange", i: "fa-award", l: "好房子认定", h: "../modules/wsswb/goodhouse-list.html" },
            { c: "purple", i: "fa-user-shield", l: "信用评价与档案", h: "../modules/wsztxy/wsztxy-12.html" },
            { c: "blue", i: "fa-file-circle-check", l: "从业企业管理", h: "../modules/wsztxy/wsztxy-02.html" },
            { c: "orange", i: "fa-dice", l: "双随机抽查", h: "../modules/wsztxy/wsztxy-05.html" },
            { c: "green", i: "fa-table-list", l: "综合统计分析", h: "../modules/wsjcfx/wsjcfx-09.html" },
            { c: "cyan", i: "fa-chart-line", l: "项目总览", h: "../modules/wsjcfx/wsjcfx-17.html" }
          ]
        },
        leader: {
          welcome: "全市房产交易运行总览（只读）",
          heroStats: [
            { v: "186.4 亿", l: "本年交易额" },
            { v: "2,580", l: "本月网签套数" },
            { v: "47", l: "橙红预警" }
          ],
          kpis: [
            { c: "blue", i: "fa-coins", l: "本年交易额", v: "186.4 亿元", t: "↑ 同比 7.8%" },
            { c: "green", i: "fa-file-contract", l: "本月网签套数", v: "2,580 套", t: "↑ 9.3%" },
            { c: "cyan", i: "fa-vault", l: "资金监管余额", v: "42.7 亿元", t: "预售 31.2 亿 · 维修 11.5 亿" },
            { c: "red", i: "fa-triangle-exclamation", l: "橙红预警", v: "47", t: "需关注", td: "text-danger" }
          ],
          body: function (q) { return "<div class=\"grid-2\"><div class=\"card\"><div class=\"card-head\"><h3>四色风险预警分布</h3><span class=\"sub\">规则型预警，人工确认后进入督办</span></div><div class=\"card-body\"><div class=\"flex items-center gap-16\"><div class=\"donut\" style=\"background:conic-gradient(var(--lv-blue) 0.00% 91.41%, var(--lv-yellow) 91.41% 97.67%, var(--lv-orange) 97.67% 99.55%, var(--lv-red) 99.55% 100.00%)\"><div class=\"donut-hole\"><div class=\"fw-700\" style=\"font-size:22px\">173</div><div class=\"text-3 text-sm\">待处置</div></div></div><div class=\"legend\" style=\"flex:1\"><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-blue)\"></span> 蓝色 · 正常<b style=\"margin-left:auto\">1,842</b></div><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-yellow)\"></span> 黄色 · 提示<b style=\"margin-left:auto\">126</b></div><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-orange)\"></span> 橙色 · 预警<b style=\"margin-left:auto\">38</b></div><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-red)\"></span> 红色 · 严重<b style=\"margin-left:auto\">9</b></div></div></div></div></div><div class=\"card\"><div class=\"card-head\"><h3>各县区本月办件量排行</h3><span class=\"sub\">取数口径与统计报表一致</span></div><div class=\"card-body\"><table class=\"data-table\"><thead><tr><th>排名</th><th>行政区划</th><th>占比</th><th class=\"num\">数量</th></tr></thead><tbody><tr><td class=\"nowrap\">1</td><td class=\"nowrap\">柳州市本级</td><td style=\"width:52%\"><div class=\"progress\"><span style=\"width:100%\"></span></div></td><td class=\"num nowrap\">1,286 件</td></tr><tr><td class=\"nowrap\">2</td><td class=\"nowrap\">柳江区</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:32%\"></span></div></td><td class=\"num nowrap\">412 件</td></tr><tr><td class=\"nowrap\">3</td><td class=\"nowrap\">鹿寨县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:24%\"></span></div></td><td class=\"num nowrap\">306 件</td></tr><tr><td class=\"nowrap\">4</td><td class=\"nowrap\">柳城县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:21%\"></span></div></td><td class=\"num nowrap\">268 件</td></tr><tr><td class=\"nowrap\">5</td><td class=\"nowrap\">融安县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:14%\"></span></div></td><td class=\"num nowrap\">184 件</td></tr><tr><td class=\"nowrap\">6</td><td class=\"nowrap\">融水苗族自治县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:12%\"></span></div></td><td class=\"num nowrap\">152 件</td></tr><tr><td class=\"nowrap\">7</td><td class=\"nowrap\">三江侗族自治县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:9%\"></span></div></td><td class=\"num nowrap\">121 件</td></tr></tbody></table></div></div></div><div class=\"card\"><div class=\"card-head\"><h3>本年各月网签套数</h3><span class=\"sub\">含商品房、存量房、租赁备案</span></div><div class=\"card-body\"><div class=\"bar-chart\"><div class=\"bar-col\"><span class=\"bar-val\">1,240</span><div class=\"bar\" style=\"height:46%\"></div><span class=\"bar-label\">1月</span></div><div class=\"bar-col\"><span class=\"bar-val\">860</span><div class=\"bar\" style=\"height:32%\"></div><span class=\"bar-label\">2月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,560</span><div class=\"bar\" style=\"height:58%\"></div><span class=\"bar-label\">3月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,742</span><div class=\"bar\" style=\"height:65%\"></div><span class=\"bar-label\">4月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,935</span><div class=\"bar\" style=\"height:72%\"></div><span class=\"bar-label\">5月</span></div><div class=\"bar-col\"><span class=\"bar-val\">2,364</span><div class=\"bar\" style=\"height:88%\"></div><span class=\"bar-label\">6月</span></div><div class=\"bar-col\"><span class=\"bar-val\">2,580</span><div class=\"bar\" style=\"height:96%\"></div><span class=\"bar-label\">7月</span></div></div></div></div>"; }
        },
        admin: {
          welcome: "平台配置与支撑服务管理",
          heroStats: [
            { v: "486", l: "在用账号" },
            { v: "162", l: "已配事项" },
            { v: "7", l: "政策版本" }
          ],
          kpis: [
            { c: "blue", i: "fa-users", l: "在用账号", v: "486", t: "本月新增 12" },
            { c: "cyan", i: "fa-user-shield", l: "角色数", v: "11", t: "市县两级分级授权" },
            { c: "green", i: "fa-clipboard-list", l: "已配事项", v: "162", t: "含 24 个一件事" },
            { c: "orange", i: "fa-scale-balanced", l: "政策参数版本", v: "7", t: "市本级 + 六县区" }
          ],
          todos: [
            { c: "orange", tag: "权限审批", txt: "柳城县 3 个新账号权限待授权", time: "剩 1天" },
            { c: "blue", tag: "流程发布", txt: "存量房带押过户流程 v3 待灰度发布", time: "剩 2天" },
            { c: "blue", tag: "字典维护", txt: "房屋用途字典新增车位子类待确认", time: "剩 3天" },
            { c: "red", tag: "政策生效", txt: "融安县限售年限调整 8 月 1 日生效待复核", time: "剩 6h", warn: 1 },
            { c: "blue", tag: "表单绑定", txt: "房票安置申请表待绑定流程节点", time: "剩 4天" },
            { c: "green", tag: "模板管理", txt: "商品房买卖合同示范文本 2026 版待启用", time: "剩 5天" },
            { c: "blue", tag: "消息模板", txt: "备案成功短信模板待报备", time: "剩 3天" },
            { c: "blue", tag: "证书轮换", txt: "市房产交易所对外服务证书年度续期", time: "剩 12天" }
          ],
          shortcuts: [
            {
              c: "blue",
              i: "fa-fingerprint",
              l: "统一身份认证",
              h: "../modules/_pending.html?k=wspt-03&e=government"
            },
            { c: "green", i: "fa-sliders", l: "基础数据管理", h: "../modules/_pending.html?k=wspt-08&e=government" },
            {
              c: "cyan",
              i: "fa-clipboard-list",
              l: "事项目录定义",
              h: "../modules/_pending.html?k=wspt-12&e=government"
            },
            { c: "orange", i: "fa-sitemap", l: "流程建模配置", h: "../modules/_pending.html?k=wspt-17&e=government" },
            { c: "purple", i: "fa-pen-ruler", l: "低代码表单", h: "../modules/_pending.html?k=wspt-22&e=government" },
            {
              c: "red",
              i: "fa-scale-balanced",
              l: "政策参数维护",
              h: "../modules/_pending.html?k=wspt-27&e=government"
            }
          ]
        },
        ops: {
          welcome: "系统运行监控与运维保障",
          heroStats: [
            { v: "99.95%", l: "服务在线率" },
            { v: "6", l: "未闭环告警" },
            { v: "9", l: "待办工单" }
          ],
          kpis: [
            { c: "green", i: "fa-heart-pulse", l: "服务在线率", v: "99.95%", t: "近 30 天" },
            { c: "red", i: "fa-bell", l: "未闭环告警", v: "6", t: "严重 1 条", td: "text-danger" },
            { c: "orange", i: "fa-screwdriver-wrench", l: "待办工单", v: "9", t: "超时 2 单" },
            { c: "cyan", i: "fa-plug", l: "接口成功率", v: "99.2%", t: "失败重推 14 次" }
          ],
          todos: [
            { c: "red", tag: "告警处置", txt: "不动产接口连续 3 次超时待排查", time: "剩 1h", warn: 1 },
            { c: "orange", tag: "容量巡检", txt: "影像存储集群使用率 82%，建议扩容", time: "剩 2天" },
            { c: "blue", tag: "版本发布", txt: "存量房模块 v2.6 待发布至生产", time: "剩 1天" },
            { c: "blue", tag: "备份校验", txt: "本周全量备份恢复演练待执行", time: "剩 3天" },
            { c: "green", tag: "工单处理", txt: "柳江区窗口打印机驱动问题待回访", time: "剩 1天" },
            { c: "blue", tag: "定时任务", txt: "日报取数任务执行时长偏长待优化", time: "剩 4天" },
            { c: "orange", tag: "密评整改", txt: "国密改造第二批整改项待复测", time: "剩 6天" },
            { c: "blue", tag: "割接准备", txt: "融水县历史数据迁移校核待安排", time: "剩 8天" }
          ],
          shortcuts: [
            {
              c: "red",
              i: "fa-heart-pulse",
              l: "运行监控告警",
              h: "../modules/_pending.html?k=wsops-02&e=government"
            },
            {
              c: "blue",
              i: "fa-shield-halved",
              l: "国产化适配",
              h: "../modules/_pending.html?k=wsops-09&e=government"
            },
            {
              c: "green",
              i: "fa-truck-ramp-box",
              l: "部署联调管理",
              h: "../modules/_pending.html?k=wsops-13&e=government"
            },
            { c: "cyan", i: "fa-database", l: "备份恢复管理", h: "../modules/_pending.html?k=wsops-06&e=government" },
            {
              c: "orange",
              i: "fa-clock-rotate-left",
              l: "定时任务管理",
              h: "../modules/_pending.html?k=wsops-07&e=government"
            },
            {
              c: "purple",
              i: "fa-fingerprint",
              l: "账号安全管理",
              h: "../modules/_pending.html?k=wspt-06&e=government"
            }
          ]
        }
      }
    },
    company: {
      sysName: "华信数智房产交易一体化平台",
      endName: "单位机构端",
      endIcon: "fa-building-user",
      portalHref: "../index.html",
      defaultRole: "developer",
      roles: {
        developer: { tag: "单位机构端", user: "周建国", role: "XXXX市荣和房地产开发有限公司 · 经办人" },
        agency: { tag: "单位机构端", user: "莫小芳", role: "XXXX市安居房地产经纪有限公司 · 经办人" },
        bank: { tag: "单位机构端", user: "梁美玲", role: "柳州银行营业部 · 监管账户专员" }
      },
      menu: [],
      systems: [
        {
          key: "wsswb",
          name: "新建商品房网签备案管理系统",
          icon: "fa-building",
          line: "交易网签",
          menu: [
            { key: "wsswb-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsswb/index.html" },
            {
              label: "项目管理",
              icon: "fa-diagram-project",
              children: [
                { key: "wsswb-06", label: "项目融资登记", href: "../modules/wsswb/finance-list.html" }
              ]
            },
            {
              label: "预售管理",
              icon: "fa-folder-open",
              children: [
                { key: "wsswb-09", label: "现房销售", href: "../modules/wsswb/existing-sale.html" },
                { key: "wsswb-10", label: "一房一价备案", href: "../modules/wsswb/price-filing.html" }
              ]
            },
            {
              label: "网签备案",
              icon: "fa-file-circle-check",
              children: [
                { key: "wsswb-11", label: "选房认购", href: "../modules/wsswb/subscribe-list.html" },
                { key: "wsswb-12", label: "合同网签", href: "../modules/wsswb/contract-list.html" }
              ]
            },
            {
              label: "好房子管理",
              icon: "fa-award",
              children: [
                { key: "wsswb-22", label: "好房子认定", href: "../modules/wsswb/goodhouse-list.html" },
                { key: "wsswb-23", label: "住房品质信息", href: "../modules/wsswb/quality-list.html" }
              ]
            }
          ]
        },
        {
          key: "wscwb",
          name: "存量房交易网签备案管理系统",
          icon: "fa-house-chimney",
          line: "交易网签",
          menu: [
            { key: "wscwb-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wscwb/index.html" },
            {
              key: "wscwb-02",
              label: "房源采集核验",
              icon: "fa-clipboard-check",
              href: "../modules/wscwb/listing-list.html"
            },
            {
              label: "签约备案",
              icon: "fa-file-signature",
              children: [
                { key: "wscwb-03", label: "合同签约", href: "../modules/wscwb/contract-list.html" }
              ]
            }
          ]
        },
        {
          key: "wszwb",
          name: "房屋租赁网签备案管理系统",
          icon: "fa-key",
          line: "交易网签",
          menu: [
            { key: "wszwb-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wszwb/index.html" },
            {
              key: "wszwb-02",
              label: "租赁房源管理",
              icon: "fa-house",
              href: "../modules/wszwb/listing-list.html"
            },
            {
              label: "网签备案",
              icon: "fa-file-circle-check",
              children: [
                { key: "wszwb-03", label: "合同网签备案", href: "../modules/wszwb/contract-list.html" }
              ]
            }
          ]
        },
        {
          key: "wsdwb",
          name: "房屋交易备案管理系统",
          icon: "fa-lock",
          line: "交易网签",
          menu: [
            { key: "wsdwb-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsdwb/index.html" },
            {
              key: "wsdwb-02",
              label: "抵押合同备案",
              icon: "fa-file-contract",
              href: "../modules/wsdwb/mortgage-list.html"
            },
            {
              key: "wsdwb-06",
              label: "在建工程抵押",
              icon: "fa-helmet-safety",
              href: "../modules/wsdwb/project-mortgage.html"
            }
          ]
        },
        {
          key: "wsztxy",
          name: "从业主体与信用监管系统",
          icon: "fa-user-shield",
          line: "市场监管",
          menu: [
            {
              key: "wsztxy-01",
              label: "我的工作台",
              icon: "fa-table-columns",
              href: "../modules/wsztxy/wsztxy-01.html"
            },
            {
              label: "主体备案",
              icon: "fa-file-circle-check",
              children: [
                { key: "wsztxy-02", label: "从业企业管理", href: "../modules/wsztxy/wsztxy-02.html" },
                { key: "wsztxy-03", label: "从业人员管理", href: "../modules/wsztxy/wsztxy-03.html" }
              ]
            }
          ]
        },
        {
          key: "wsszjjg",
          name: "新建商品房预售资金监管系统",
          icon: "fa-sack-dollar",
          line: "资金监管",
          menu: [
            { key: "wsszjjg-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsszjjg/dev/workbench.html" },
            {
              label: "资金监管",
              icon: "fa-sack-dollar",
              children: [
                { key: "wsszjjg-08", label: "资金归集管理", href: "../modules/wsszjjg/dev/collect.html" },
                { key: "wsszjjg-09", label: "资金使用管理", href: "../modules/wsszjjg/dev/usage.html" }
              ]
            }
          ]
        },
        {
          key: "wssvc",
          name: "统一应用服务平台",
          icon: "fa-cubes",
          line: "平台支撑",
          menu: [
            { key: "wssvc-01", label: "我的工作台", icon: "fa-table-columns", href: "dashboard.html" },
            {
              label: "政银直连服务",
              icon: "fa-building-columns",
              children: [
                { key: "wssvc-11", label: "银行服务工作台", href: "../modules/wsfyh/bank/workbench.html" },
                { key: "wssvc-13", label: "其他机构端", href: "../modules/wsfyh/bank/mortgage.html" }
              ]
            }
          ]
        },
        {
          key: "wsmh",
          name: "统一服务门户",
          icon: "fa-globe",
          line: "对外服务",
          menu: [
            { key: "wsmh-01", label: "我的工作台", icon: "fa-table-columns", href: "dashboard.html" },
            {
              label: "门户首页",
              icon: "fa-globe",
              children: [
                { key: "wsmh-04", label: "办事指南", href: "../modules/_pending.html?k=wsmh-04&e=company" }
              ]
            },
            {
              label: "交易办事",
              icon: "fa-globe",
              children: [
                { key: "wsmh-19", label: "租赁企业办事", href: "../modules/_pending.html?k=wsmh-19&e=company" }
              ]
            },
            {
              label: "从业主体",
              icon: "fa-users",
              children: [
                { key: "wsmh-21", label: "企业入网备案", href: "../modules/_pending.html?k=wsmh-21&e=company" },
                { key: "wsmh-22", label: "从业人员登记", href: "../modules/_pending.html?k=wsmh-22&e=company" },
                { key: "wsmh-23", label: "开发企业工作台", href: "../modules/_pending.html?k=wsmh-23&e=company" },
                { key: "wsmh-24", label: "机构服务工作台", href: "../modules/_pending.html?k=wsmh-24&e=company" }
              ]
            }
          ]
        }
      ],
      defaultSystem: "wsmh",
      roleMenu: {
        developer: [
          "wsswb-01", "wsswb-09", "wsswb-10", "wsswb-11", "wsswb-12", "wsswb-22", "wsswb-23", "wscwb-01",
          "wszwb-01", "wsdwb-01", "wsdwb-02", "wsdwb-06", "wsztxy-01", "wsztxy-02", "wsszjjg-01", "wssvc-01", "wsmh-01",
          "wsmh-04", "wsmh-21", "wsmh-23"
        ],
        agency: [
          "wsswb-01", "wscwb-01", "wscwb-02", "wscwb-03", "wszwb-01", "wszwb-02", "wszwb-03", "wsdwb-01",
          "wsztxy-01", "wsztxy-02", "wsztxy-03", "wsszjjg-01", "wssvc-01", "wsmh-01", "wsmh-19",
          "wsmh-22", "wsmh-24"
        ],
        bank: [
          "wsswb-01", "wsswb-06", "wscwb-01", "wszwb-01", "wsdwb-01", "wsdwb-02", "wsztxy-01",
          "wsztxy-02", "wsszjjg-01", "wsszjjg-08", "wsszjjg-09", "wssvc-01", "wssvc-11", "wssvc-13",
          "wsmh-01"
        ]
      },
      dict: {
        said: [
          ["450200", "柳州市本级"],
          ["450202", "城中区"],
          ["450203", "鱼峰区"],
          ["450204", "柳南区"],
          ["450205", "柳北区"],
          ["450206", "柳江区"],
          ["450222", "柳城县"],
          ["450223", "鹿寨县"],
          ["450224", "融安县"],
          ["450225", "融水苗族自治县"],
          ["450226", "三江侗族自治县"]
        ],
        blzt: [
          ["0", "待受理"],
          ["1", "办理中"],
          ["2", "已办结"],
          ["3", "已撤件"],
          ["4", "已退件"],
          ["5", "待补正"],
          ["6", "中止办理"],
          ["7", "已作废"]
        ],
        shzt: [
          ["0", "待审核"],
          ["1", "审核中"],
          ["2", "审核通过"],
          ["3", "审核不通过"],
          ["4", "退回补正"]
        ],
        sjly: [
          ["01", "窗口办理"],
          ["02", "统一服务门户"],
          ["03", "微信小程序"],
          ["04", "自助终端"],
          ["05", "中介机构端"],
          ["06", "企业工作台"],
          ["07", "银行端"],
          ["08", "接口导入"],
          ["09", "历史数据迁移"],
          ["10", "批量导入"],
          ["99", "其他"]
        ],
        ywdl: [
          ["01", "商品房交易"],
          ["02", "存量房交易"],
          ["03", "房屋租赁"],
          ["04", "抵押与交易限制"],
          ["05", "政策性住房与安置房"],
          ["06", "测绘成果与面积"],
          ["07", "房产档案"],
          ["08", "预售资金监管"],
          ["09", "存量房资金监管"],
          ["10", "维修资金监管"],
          ["11", "从业主体与信用"],
          ["12", "项目监管与好房子"],
          ["13", "查询与出证"],
          ["14", "更正与撤销"],
          ["99", "其他"]
        ],
        zjlx: [
          ["01", "居民身份证"],
          ["02", "户口簿"],
          ["03", "护照"],
          ["21", "统一社会信用代码证"],
          ["22", "营业执照"],
          ["99", "其他"]
        ],
        fwyt: [
          ["01", "成套住宅"],
          ["02", "非成套住宅"],
          ["03", "集体宿舍"],
          ["04", "商业服务"],
          ["05", "办公"],
          ["06", "工业仓储"],
          ["07", "车库车位"],
          ["08", "教育医疗"],
          ["09", "公共设施"],
          ["99", "其他"]
        ],
        ztlx: [
          ["01", "房地产开发企业"],
          ["02", "房地产经纪机构"],
          ["04", "物业服务企业"],
          ["06", "房产测绘机构"],
          ["11", "金融机构"],
          ["05", "房地产估价机构"]
        ],
        xyjb: [
          ["A+", "A+ 信用优秀"],
          ["A", "A 信用良好"],
          ["B", "B 信用一般"],
          ["C", "C 信用较差"],
          ["D", "D 信用差"]
        ],
        yesNo: [
          ["1", "是"],
          ["0", "否"]
        ],
        lvColor: [
          ["blue", "蓝色 · 正常"],
          ["yellow", "黄色 · 提示"],
          ["orange", "橙色 · 预警"],
          ["red", "红色 · 严重"]
        ]
      },
      home: {
        developer: {
          welcome: "开发企业申报工作台 · XXXX市荣和房地产开发有限公司",
          heroStats: [
            { v: "4", l: "在建项目" },
            { v: "1,286", l: "可售房源" },
            { v: "6", l: "待办申报" }
          ],
          kpis: [
            { c: "blue", i: "fa-diagram-project", l: "在建项目", v: "4", t: "已备案 6 个" },
            { c: "cyan", i: "fa-building", l: "可售房源", v: "1,286 套", t: "已售 842 套" },
            { c: "green", i: "fa-file-contract", l: "本月网签套数", v: "186 套", t: "↑ 12.4%" },
            { c: "orange", i: "fa-vault", l: "监管账户可用余额", v: "8,640 万元", t: "本月可申请拨付 860 万" }
          ],
          todos: [
            { c: "red", tag: "补正申报", txt: "荣和公园大道三期预售许可材料需补正", time: "剩 5h", warn: 1 },
            { c: "orange", tag: "一房一价", txt: "3 号楼 168 套一房一价价格备案待提交", time: "剩 1天", warn: 1 },
            { c: "blue", tag: "待签合同", txt: "12 份商品房买卖合同待企业签署", time: "剩 2天" },
            { c: "orange", tag: "许可临期", txt: "二期预售许可证 9 月 30 日到期", time: "剩 60天" },
            { c: "blue", tag: "资金拨付", txt: "主体结构封顶节点拨付申请待提交", time: "剩 3天" },
            { c: "blue", tag: "进度填报", txt: "7 月项目建设进度待填报", time: "剩 2天" },
            { c: "green", tag: "好房子申报", txt: "四期好房子亮点材料待补充上传", time: "剩 6天" },
            { c: "blue", tag: "企业信息", txt: "企业资质证书即将到期，请更新", time: "剩 21天" }
          ],
          shortcuts: [
            {
              c: "blue",
              i: "fa-diagram-project",
              l: "开发企业工作台",
              h: "../modules/_pending.html?k=wsmh-23&e=company"
            },
            { c: "green", i: "fa-certificate", l: "现房销售", h: "../modules/wsswb/existing-sale.html" },
            { c: "cyan", i: "fa-tags", l: "一房一价备案", h: "../modules/wsswb/price-filing.html" },
            {
              c: "orange",
              i: "fa-file-signature",
              l: "合同网签",
              h: "../modules/wsswb/contract-list.html"
            },
            { c: "purple", i: "fa-list-check", l: "选房认购", h: "../modules/wsswb/subscribe-list.html" },
            { c: "red", i: "fa-award", l: "住房品质信息", h: "../modules/wsswb/quality-list.html" },
            { c: "blue", i: "fa-building-user", l: "企业入网备案", h: "../modules/_pending.html?k=wsmh-21&e=company" },
            { c: "green", i: "fa-building-user", l: "从业企业管理", h: "../modules/wsztxy/wsztxy-02.html" }
          ]
        },
        agency: {
          welcome: "经纪机构工作台 · XXXX市安居房地产经纪有限公司",
          heroStats: [
            { v: "36", l: "备案经纪人" },
            { v: "14", l: "待核验房源" },
            { v: "62", l: "本月成交" }
          ],
          kpis: [
            { c: "blue", i: "fa-users", l: "备案经纪人", v: "36", t: "本月新增 3 人" },
            { c: "orange", i: "fa-house-circle-check", l: "待核验房源", v: "14", t: "超 3 天未核验 2 套" },
            { c: "green", i: "fa-handshake", l: "本月成交套数", v: "62 套", t: "↑ 8.7%" },
            { c: "cyan", i: "fa-star-half-stroke", l: "信用评分", v: "92.4", t: "A 级 · 红榜" }
          ],
          todos: [
            { c: "orange", tag: "房源核验", txt: "文昌路 128 号 3-2-501 房源核验待补充产权材料", time: "剩 8h", warn: 1 },
            { c: "blue", tag: "代理签约", txt: "4 组买卖双方存量房合同待代理签约", time: "剩 1天" },
            { c: "blue", tag: "租赁备案", txt: "6 份租赁合同待提交备案", time: "剩 2天" },
            { c: "red", tag: "实名登记", txt: "2 名新入职经纪人实名登记未完成", time: "已超期", warn: 1 },
            { c: "blue", tag: "带押过户", txt: "潭中东路 66 号带押过户资料待补齐", time: "剩 3天" },
            { c: "green", tag: "服务评价", txt: "本月 12 条服务评价待回复", time: "剩 4天" },
            { c: "blue", tag: "门店信息", txt: "桂中大道门店营业信息待更新", time: "剩 7天" },
            { c: "blue", tag: "虚假房源", txt: "1 条房源被举报，待申诉说明", time: "剩 2天" }
          ],
          shortcuts: [
            {
              c: "blue",
              i: "fa-house-circle-check",
              l: "房源采集核验",
              h: "../modules/wscwb/listing-list.html"
            },
            {
              c: "green",
              i: "fa-file-signature",
              l: "合同签约",
              h: "../modules/wscwb/contract-list.html"
            },
            { c: "cyan", i: "fa-key", l: "合同网签备案", h: "../modules/wszwb/contract-list.html" },
            { c: "orange", i: "fa-id-card", l: "从业人员登记", h: "../modules/_pending.html?k=wsmh-22&e=company" },
            { c: "purple", i: "fa-user-group", l: "从业人员管理", h: "../modules/wsztxy/wsztxy-03.html" },
            { c: "red", i: "fa-stamp", l: "机构服务工作台", h: "../modules/_pending.html?k=wsmh-24&e=company" }
          ]
        },
        bank: {
          welcome: "监管银行服务工作台 · 柳州银行营业部",
          heroStats: [
            { v: "86", l: "监管账户" },
            { v: "1,240 万", l: "今日缴存" },
            { v: "7", l: "待复核拨付" }
          ],
          kpis: [
            { c: "blue", i: "fa-building-columns", l: "监管账户", v: "86 个", t: "预售 62 · 维修 24" },
            { c: "green", i: "fa-arrow-down-to-arc", l: "今日缴存额", v: "1,240 万元", t: "笔数 168" },
            { c: "orange", i: "fa-money-check-dollar", l: "待复核拨付", v: "7 笔", t: "合计 3,620 万元" },
            { c: "red", i: "fa-not-equal", l: "对账差错", v: "2 笔", t: "需当日处理", td: "text-danger" }
          ],
          todos: [
            { c: "red", tag: "对账差错", txt: "7 月 30 日日终对账 2 笔金额不一致待处理", time: "剩 2h", warn: 1 },
            { c: "orange", tag: "拨付复核", txt: "保利central park 拨付 860 万元待复核", time: "剩 6h", warn: 1 },
            { c: "blue", tag: "账户备案", txt: "龙光玖珑湖二期监管账户开立待回传", time: "剩 1天" },
            { c: "blue", tag: "放款通知", txt: "12 笔按揭放款到账通知待推送", time: "剩 1天" },
            { c: "green", tag: "解付通知", txt: "存量房 8 笔资金解付待确认", time: "剩 2天" },
            { c: "blue", tag: "缴存回传", txt: "昨日 168 笔缴存明细待回传核对", time: "剩 4h" },
            { c: "blue", tag: "接入维护", txt: "银行直联接口证书 9 月到期", time: "剩 45天" },
            { c: "blue", tag: "维修资金", txt: "3 个专户行分户账数据待上传", time: "剩 3天" }
          ],
          shortcuts: [
            {
              c: "blue",
              i: "fa-building-columns",
              l: "银行服务工作台",
              h: "../modules/wsfyh/bank/workbench.html"
            },
            {
              c: "green",
              i: "fa-file-invoice-dollar",
              l: "资金归集管理",
              h: "../modules/wsszjjg/gov/collect.html"
            },
            {
              c: "orange",
              i: "fa-money-check-dollar",
              l: "资金使用管理",
              h: "../modules/wsszjjg/gov/usage.html"
            },
            {
              c: "cyan",
              i: "fa-hand-holding-dollar",
              l: "项目融资登记",
              h: "../modules/wsswb/finance-list.html"
            },
            {
              c: "red",
              i: "fa-scale-unbalanced",
              l: "抵押合同备案",
              h: "../modules/wsdwb/mortgage-list.html"
            },
            { c: "purple", i: "fa-vault", l: "其他机构端", h: "../modules/wsfyh/bank/mortgage.html" }
          ]
        }
      }
    },
    portal: {
      sysName: "华信数智房产交易一体化平台",
      endName: "统一服务门户",
      endIcon: "fa-globe",
      portalHref: "../index.html",
      defaultRole: "citizen",
      roles: {
        citizen: { tag: "统一服务门户", user: "吴明", role: "个人用户 · 购房群众" },
        tenant: { tag: "统一服务门户", user: "黄雅", role: "个人用户 · 租赁当事人" },
        admin: { tag: "统一服务门户", user: "蒙丽华", role: "市房产交易所 · 门户管理员" }
      },
      menu: [],
      systems: [
        {
          key: "wsmh",
          name: "统一服务门户",
          icon: "fa-globe",
          line: "对外服务",
          menu: [
            { key: "wsmh-01", label: "我的工作台", icon: "fa-table-columns", href: "dashboard.html" },
            {
              label: "门户首页",
              icon: "fa-globe",
              children: [
                { key: "wsmh-02", label: "办事导航", href: "../modules/_pending.html?k=wsmh-02&e=portal" },
                { key: "wsmh-03", label: "网上办事大厅", href: "../modules/_pending.html?k=wsmh-03&e=portal" },
                { key: "wsmh-04", label: "办事指南", href: "../modules/_pending.html?k=wsmh-04&e=portal" },
                { key: "wsmh-05", label: "信息公示", href: "../modules/_pending.html?k=wsmh-05&e=portal" },
                { key: "wsmh-06", label: "一件事专区", href: "../modules/_pending.html?k=wsmh-06&e=portal" }
              ]
            },
            {
              label: "房源超市",
              icon: "fa-house",
              children: [
                { key: "wsmh-07", label: "找房服务", href: "../modules/_pending.html?k=wsmh-07&e=portal" },
                { key: "wsmh-08", label: "新房专区", href: "../modules/_pending.html?k=wsmh-08&e=portal" },
                { key: "wsmh-09", label: "二手房专区", href: "../modules/_pending.html?k=wsmh-09&e=portal" },
                { key: "wsmh-10", label: "租房专区", href: "../modules/_pending.html?k=wsmh-10&e=portal" },
                { key: "wsmh-11", label: "房票房源", href: "../modules/_pending.html?k=wsmh-11&e=portal" },
                { key: "wsmh-12", label: "好房子专区", href: "../modules/_pending.html?k=wsmh-12&e=portal" },
                { key: "wsmh-13", label: "购房办事服务", href: "../modules/_pending.html?k=wsmh-13&e=portal" },
                { key: "wsmh-14", label: "房源自主发布", href: "../modules/_pending.html?k=wsmh-14&e=portal" },
                { key: "wsmh-15", label: "成交公示", href: "../modules/_pending.html?k=wsmh-15&e=portal" }
              ]
            },
            {
              label: "交易办事",
              icon: "fa-globe",
              children: [
                { key: "wsmh-16", label: "二手房自助办理", href: "../modules/_pending.html?k=wsmh-16&e=portal" },
                { key: "wsmh-17", label: "二手房进度查询", href: "../modules/_pending.html?k=wsmh-17&e=portal" },
                { key: "wsmh-18", label: "租房签约备案", href: "../modules/_pending.html?k=wsmh-18&e=portal" },
                { key: "wsmh-19", label: "租赁企业办事", href: "../modules/_pending.html?k=wsmh-19&e=portal" },
                { key: "wsmh-20", label: "租房公共服务", href: "../modules/_pending.html?k=wsmh-20&e=portal" }
              ]
            },
            {
              label: "从业主体",
              icon: "fa-users",
              children: [
                { key: "wsmh-21", label: "企业入网备案", href: "../modules/_pending.html?k=wsmh-21&e=portal" },
                { key: "wsmh-22", label: "从业人员登记", href: "../modules/_pending.html?k=wsmh-22&e=portal" },
                { key: "wsmh-23", label: "开发企业工作台", href: "../modules/_pending.html?k=wsmh-23&e=portal" },
                { key: "wsmh-24", label: "机构服务工作台", href: "../modules/_pending.html?k=wsmh-24&e=portal" },
                { key: "wsmh-25", label: "从业主体公示", href: "../modules/_pending.html?k=wsmh-25&e=portal" }
              ]
            },
            {
              label: "查询中心",
              icon: "fa-magnifying-glass",
              children: [
                { key: "wsmh-26", label: "信息查询", href: "../modules/_pending.html?k=wsmh-26&e=portal" },
                { key: "wsmh-27", label: "证明打印出证", href: "../modules/_pending.html?k=wsmh-27&e=portal" },
                { key: "wsmh-28", label: "自助终端服务", href: "../modules/_pending.html?k=wsmh-28&e=portal" },
                { key: "wsmh-29", label: "查询授权留痕", href: "../modules/_pending.html?k=wsmh-29&e=portal" }
              ]
            },
            {
              label: "个人服务",
              icon: "fa-globe",
              children: [
                { key: "wsmh-30", label: "个人中心", href: "../modules/_pending.html?k=wsmh-30&e=portal" },
                { key: "wsmh-31", label: "智能客服", href: "../modules/_pending.html?k=wsmh-31&e=portal" },
                { key: "wsmh-32", label: "咨询投诉", href: "../modules/_pending.html?k=wsmh-32&e=portal" },
                { key: "wsmh-33", label: "便民工具", href: "../modules/_pending.html?k=wsmh-33&e=portal" }
              ]
            },
            {
              label: "门户配置",
              icon: "fa-sliders",
              children: [
                { key: "wsmh-34", label: "门户框架配置", href: "../modules/_pending.html?k=wsmh-34&e=portal" },
                { key: "wsmh-35", label: "门户站点管理", href: "../modules/_pending.html?k=wsmh-35&e=portal" },
                { key: "wsmh-36", label: "一网通办对接", href: "../modules/_pending.html?k=wsmh-36&e=portal" }
              ]
            }
          ]
        }
      ],
      defaultSystem: "wsmh",
      roleMenu: {
        citizen: [
          "wsmh-01", "wsmh-02", "wsmh-03", "wsmh-04", "wsmh-05", "wsmh-06", "wsmh-07", "wsmh-08",
          "wsmh-09", "wsmh-10", "wsmh-11", "wsmh-12", "wsmh-13", "wsmh-14", "wsmh-15", "wsmh-16",
          "wsmh-17", "wsmh-18", "wsmh-19", "wsmh-20", "wsmh-22", "wsmh-25", "wsmh-26", "wsmh-27",
          "wsmh-28", "wsmh-29", "wsmh-30", "wsmh-31", "wsmh-32", "wsmh-33"
        ],
        tenant: [
          "wsmh-01", "wsmh-02", "wsmh-03", "wsmh-04", "wsmh-05", "wsmh-06", "wsmh-07", "wsmh-08",
          "wsmh-09", "wsmh-10", "wsmh-11", "wsmh-12", "wsmh-13", "wsmh-14", "wsmh-15", "wsmh-16",
          "wsmh-17", "wsmh-18", "wsmh-19", "wsmh-20", "wsmh-22", "wsmh-25", "wsmh-26", "wsmh-27",
          "wsmh-28", "wsmh-29", "wsmh-30", "wsmh-31", "wsmh-32", "wsmh-33"
        ],
        admin: ["wsmh-01", "wsmh-02", "wsmh-21", "wsmh-23", "wsmh-24", "wsmh-29", "wsmh-34", "wsmh-35", "wsmh-36"]
      },
      dict: {
        said: [
          ["450200", "柳州市本级"],
          ["450202", "城中区"],
          ["450203", "鱼峰区"],
          ["450204", "柳南区"],
          ["450205", "柳北区"],
          ["450206", "柳江区"],
          ["450222", "柳城县"],
          ["450223", "鹿寨县"],
          ["450224", "融安县"],
          ["450225", "融水苗族自治县"],
          ["450226", "三江侗族自治县"]
        ],
        blzt: [
          ["0", "待受理"],
          ["1", "办理中"],
          ["2", "已办结"],
          ["3", "已撤件"],
          ["4", "已退件"],
          ["5", "待补正"],
          ["6", "中止办理"],
          ["7", "已作废"]
        ],
        shzt: [
          ["0", "待审核"],
          ["1", "审核中"],
          ["2", "审核通过"],
          ["3", "审核不通过"],
          ["4", "退回补正"]
        ],
        sjly: [
          ["01", "窗口办理"],
          ["02", "统一服务门户"],
          ["03", "微信小程序"],
          ["04", "自助终端"],
          ["05", "中介机构端"],
          ["06", "企业工作台"],
          ["07", "银行端"],
          ["08", "接口导入"],
          ["09", "历史数据迁移"],
          ["10", "批量导入"],
          ["99", "其他"]
        ],
        ywdl: [
          ["01", "商品房交易"],
          ["02", "存量房交易"],
          ["03", "房屋租赁"],
          ["04", "抵押与交易限制"],
          ["05", "政策性住房与安置房"],
          ["06", "测绘成果与面积"],
          ["07", "房产档案"],
          ["08", "预售资金监管"],
          ["09", "存量房资金监管"],
          ["10", "维修资金监管"],
          ["11", "从业主体与信用"],
          ["12", "项目监管与好房子"],
          ["13", "查询与出证"],
          ["14", "更正与撤销"],
          ["99", "其他"]
        ],
        zjlx: [
          ["01", "居民身份证"],
          ["02", "户口簿"],
          ["03", "护照"],
          ["21", "统一社会信用代码证"],
          ["22", "营业执照"],
          ["99", "其他"]
        ],
        fwyt: [
          ["01", "成套住宅"],
          ["02", "非成套住宅"],
          ["03", "集体宿舍"],
          ["04", "商业服务"],
          ["05", "办公"],
          ["06", "工业仓储"],
          ["07", "车库车位"],
          ["08", "教育医疗"],
          ["09", "公共设施"],
          ["99", "其他"]
        ],
        ztlx: [
          ["01", "房地产开发企业"],
          ["02", "房地产经纪机构"],
          ["04", "物业服务企业"],
          ["06", "房产测绘机构"],
          ["11", "金融机构"],
          ["05", "房地产估价机构"]
        ],
        xyjb: [
          ["A+", "A+ 信用优秀"],
          ["A", "A 信用良好"],
          ["B", "B 信用一般"],
          ["C", "C 信用较差"],
          ["D", "D 信用差"]
        ],
        yesNo: [
          ["1", "是"],
          ["0", "否"]
        ],
        lvColor: [
          ["blue", "蓝色 · 正常"],
          ["yellow", "黄色 · 提示"],
          ["orange", "橙色 · 预警"],
          ["red", "红色 · 严重"]
        ]
      },
      home: {
        citizen: {
          welcome: "统一服务门户 · 个人办事空间",
          heroStats: [
            { v: "2", l: "我的房产" },
            { v: "1", l: "在办事项" },
            { v: "3", l: "待我签署" }
          ],
          kpis: [
            { c: "blue", i: "fa-house-user", l: "我的房产", v: "2 套", t: "含 1 套在售" },
            { c: "orange", i: "fa-file-signature", l: "待我签署", v: "3 份", t: "合同签署剩 2 天", td: "text-danger" },
            { c: "green", i: "fa-list-check", l: "在办事项", v: "1 件", t: "存量房过户 · 已受理" },
            { c: "cyan", i: "fa-heart", l: "收藏房源", v: "12 套", t: "新房 5 · 二手房 7" }
          ],
          todos: [
            { c: "orange", tag: "合同签署", txt: "荣和公园大道 3 栋 1802 买卖合同待签署", time: "剩 2天", warn: 1 },
            { c: "red", tag: "材料补正", txt: "存量房过户申请需补交身份证明", time: "已超期", warn: 1 },
            { c: "blue", tag: "预约签到", txt: "城中区交易大厅 今日 14:00 预约取号 A032", time: "剩 3h" },
            { c: "green", tag: "证明出证", txt: "无房证明已出具，可在线下载", time: "剩 6天" },
            { c: "blue", tag: "资金监管", txt: "存量房交易资金已入监管账户，待解付", time: "剩 4天" },
            { c: "blue", tag: "房源核验", txt: "委托挂牌的潭中东路 66 号房源核验通过", time: "剩 9天" }
          ],
          shortcuts: [
            { c: "blue", i: "fa-magnifying-glass", l: "找房服务", h: "../modules/_pending.html?k=wsmh-07&e=portal" },
            {
              c: "green",
              i: "fa-house-chimney",
              l: "二手房自助办理",
              h: "../modules/_pending.html?k=wsmh-16&e=portal"
            },
            { c: "cyan", i: "fa-truck-fast", l: "二手房进度查询", h: "../modules/_pending.html?k=wsmh-17&e=portal" },
            {
              c: "orange",
              i: "fa-magnifying-glass-chart",
              l: "信息查询",
              h: "../modules/_pending.html?k=wsmh-26&e=portal"
            },
            { c: "purple", i: "fa-stamp", l: "证明打印出证", h: "../modules/_pending.html?k=wsmh-27&e=portal" },
            { c: "red", i: "fa-user", l: "个人中心", h: "../modules/_pending.html?k=wsmh-30&e=portal" }
          ]
        },
        tenant: {
          welcome: "统一服务门户 · 住房租赁服务",
          heroStats: [
            { v: "1", l: "在租合同" },
            { v: "1", l: "待办备案" },
            { v: "8", l: "收藏房源" }
          ],
          kpis: [
            { c: "blue", i: "fa-key", l: "在租合同", v: "1 份", t: "2026-12-31 到期" },
            { c: "orange", i: "fa-file-circle-check", l: "待办备案", v: "1 件", t: "租赁合同待提交备案" },
            { c: "green", i: "fa-coins", l: "本月租金", v: "1,800 元", t: "低于同小区参考价" },
            { c: "cyan", i: "fa-heart", l: "收藏房源", v: "8 套", t: "整租 5 · 合租 3" }
          ],
          todos: [
            { c: "orange", tag: "租赁备案", txt: "阳光100城市广场 2-1-702 租赁合同待提交备案", time: "剩 1天", warn: 1 },
            { c: "blue", tag: "在线签约", txt: "房东已发起续租合同，待承租人签署", time: "剩 3天" },
            { c: "green", tag: "备案证明", txt: "租赁备案证明已生成，可用于落户与入学", time: "剩 7天" },
            { c: "blue", tag: "政策提示", txt: "保障性租赁住房申请指南已更新", time: "剩 12天" }
          ],
          shortcuts: [
            { c: "blue", i: "fa-key", l: "租房专区", h: "../modules/_pending.html?k=wsmh-10&e=portal" },
            {
              c: "green",
              i: "fa-file-signature",
              l: "租房签约备案",
              h: "../modules/_pending.html?k=wsmh-18&e=portal"
            },
            { c: "cyan", i: "fa-circle-info", l: "租房公共服务", h: "../modules/_pending.html?k=wsmh-20&e=portal" },
            {
              c: "orange",
              i: "fa-magnifying-glass-chart",
              l: "信息查询",
              h: "../modules/_pending.html?k=wsmh-26&e=portal"
            },
            { c: "purple", i: "fa-user", l: "个人中心", h: "../modules/_pending.html?k=wsmh-30&e=portal" },
            { c: "red", i: "fa-headset", l: "智能客服", h: "../modules/_pending.html?k=wsmh-31&e=portal" }
          ]
        },
        admin: {
          welcome: "统一服务门户 · 栏目与渠道运营",
          heroStats: [
            { v: "36", l: "门户菜单" },
            { v: "24", l: "一件事事项" },
            { v: "6", l: "待处理咨询" }
          ],
          kpis: [
            { c: "blue", i: "fa-globe", l: "门户菜单", v: "36", t: "8 个一级栏目" },
            { c: "green", i: "fa-clipboard-list", l: "一件事事项", v: "24", t: "已接入一网通办 18" },
            { c: "orange", i: "fa-comments", l: "待处理咨询", v: "6", t: "投诉 2 件", td: "text-danger" },
            { c: "cyan", i: "fa-eye", l: "昨日访问量", v: "1.6 万", t: "移动端占 62%" }
          ],
          todos: [
            { c: "orange", tag: "栏目发布", txt: "好房子专区首页推荐位待更新", time: "剩 1天" },
            { c: "blue", tag: "公示核对", txt: "本周预售许可公示数据待核对发布", time: "剩 2天" },
            { c: "red", tag: "投诉处置", txt: "2 件在线咨询投诉超时未回复", time: "已超期", warn: 1 },
            { c: "blue", tag: "对接维护", txt: "一网通办事项映射新增 3 项待报送", time: "剩 3天" },
            { c: "green", tag: "站点管理", txt: "门户无障碍与适老化改造复检", time: "剩 6天" }
          ],
          shortcuts: [
            { c: "blue", i: "fa-compass", l: "办事导航", h: "../modules/_pending.html?k=wsmh-02&e=portal" },
            { c: "green", i: "fa-building-user", l: "企业入网备案", h: "../modules/_pending.html?k=wsmh-21&e=portal" },
            { c: "cyan", i: "fa-sliders", l: "门户框架配置", h: "../modules/_pending.html?k=wsmh-34&e=portal" },
            { c: "orange", i: "fa-globe", l: "门户站点管理", h: "../modules/_pending.html?k=wsmh-35&e=portal" },
            { c: "purple", i: "fa-right-left", l: "一网通办对接", h: "../modules/_pending.html?k=wsmh-36&e=portal" },
            { c: "red", i: "fa-user-lock", l: "查询授权留痕", h: "../modules/_pending.html?k=wsmh-29&e=portal" }
          ]
        }
      }
    },
    datacenter: {
      sysName: "华信数智房产交易一体化平台",
      endName: "数据中心",
      endIcon: "fa-database",
      portalHref: "../index.html",
      defaultRole: "admin",
      roles: {
        admin: { tag: "数据中心", user: "蒙丽华", role: "市房产交易所 · 数据管理员" },
        ops: { tag: "数据中心", user: "陆志明", role: "运维服务商 · 运维工程师" },
        leader: { tag: "数据中心", user: "张伟", role: "市住建局 · 分管领导" }
      },
      menu: [],
      systems: [
        {
          key: "wsdata",
          name: "房产交易数据中心",
          icon: "fa-database",
          line: "数据资产",
          menu: [
            { key: "wsdata-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsdata/overview.html" },
            {
              label: "数据资源管理",
              icon: "fa-folder-open",
              children: [
                { key: "wsdata-03", label: "库表资源目录", href: "../modules/wsdata/wsdata-03.html" },
                { key: "wsdata-05", label: "非结构化数据资源", href: "../modules/wsdata/wsdata-05.html" }
              ]
            },
            {
              label: "统计口径固化",
              icon: "fa-chart-column",
              children: [
                { key: "wsdata-06", label: "统计指标口径", href: "../modules/wsdata/wsdata-06.html" },
                { key: "wsdata-08", label: "固化数据查询", href: "../modules/wsdata/wsdata-08.html" }
              ]
            },
            {
              label: "数据共享与交换",
              icon: "fa-share-nodes",
              children: [
                { key: "wsdata-09", label: "共享单位管理", href: "../modules/wsdata/wsdata-09.html" },
                { key: "wsdata-10", label: "数据交换服务", href: "../modules/wsdata/wsdata-10.html" },
                { key: "wsdata-11", label: "接口运行监控", href: "../modules/wsdata/wsdata-11.html" }
              ]
            },
            {
              label: "上级报送管理",
              icon: "fa-paper-plane",
              children: [
                { key: "wsdata-12", label: "报送单位管理", href: "../modules/wsdata/wsdata-12.html" },
                { key: "wsdata-13", label: "报送接口配置", href: "../modules/wsdata/wsdata-13.html" },
                { key: "wsdata-14", label: "报送监控", href: "../modules/wsdata/wsdata-14.html" }
              ]
            }
          ]
        }
      ],
      defaultSystem: "wsdata",
      roleMenu: {
        admin: [
          "wsdata-01", "wsdata-03", "wsdata-05", "wsdata-06", "wsdata-08", "wsdata-09", "wsdata-10",
          "wsdata-11", "wsdata-12", "wsdata-13", "wsdata-14"
        ],
        ops: ["wsdata-01", "wsdata-05", "wsdata-11"],
        leader: ["wsdata-01", "wsdata-03", "wsdata-05", "wsdata-08", "wsdata-10", "wsdata-11", "wsdata-14"]
      },
      dict: {
        said: [
          ["450200", "柳州市本级"],
          ["450202", "城中区"],
          ["450203", "鱼峰区"],
          ["450204", "柳南区"],
          ["450205", "柳北区"],
          ["450206", "柳江区"],
          ["450222", "柳城县"],
          ["450223", "鹿寨县"],
          ["450224", "融安县"],
          ["450225", "融水苗族自治县"],
          ["450226", "三江侗族自治县"]
        ],
        blzt: [
          ["0", "待受理"],
          ["1", "办理中"],
          ["2", "已办结"],
          ["3", "已撤件"],
          ["4", "已退件"],
          ["5", "待补正"],
          ["6", "中止办理"],
          ["7", "已作废"]
        ],
        shzt: [
          ["0", "待审核"],
          ["1", "审核中"],
          ["2", "审核通过"],
          ["3", "审核不通过"],
          ["4", "退回补正"]
        ],
        sjly: [
          ["01", "窗口办理"],
          ["02", "统一服务门户"],
          ["03", "微信小程序"],
          ["04", "自助终端"],
          ["05", "中介机构端"],
          ["06", "企业工作台"],
          ["07", "银行端"],
          ["08", "接口导入"],
          ["09", "历史数据迁移"],
          ["10", "批量导入"],
          ["99", "其他"]
        ],
        ywdl: [
          ["01", "商品房交易"],
          ["02", "存量房交易"],
          ["03", "房屋租赁"],
          ["04", "抵押与交易限制"],
          ["05", "政策性住房与安置房"],
          ["06", "测绘成果与面积"],
          ["07", "房产档案"],
          ["08", "预售资金监管"],
          ["09", "存量房资金监管"],
          ["10", "维修资金监管"],
          ["11", "从业主体与信用"],
          ["12", "项目监管与好房子"],
          ["13", "查询与出证"],
          ["14", "更正与撤销"],
          ["99", "其他"]
        ],
        zjlx: [
          ["01", "居民身份证"],
          ["02", "户口簿"],
          ["03", "护照"],
          ["21", "统一社会信用代码证"],
          ["22", "营业执照"],
          ["99", "其他"]
        ],
        fwyt: [
          ["01", "成套住宅"],
          ["02", "非成套住宅"],
          ["03", "集体宿舍"],
          ["04", "商业服务"],
          ["05", "办公"],
          ["06", "工业仓储"],
          ["07", "车库车位"],
          ["08", "教育医疗"],
          ["09", "公共设施"],
          ["99", "其他"]
        ],
        ztlx: [
          ["01", "房地产开发企业"],
          ["02", "房地产经纪机构"],
          ["04", "物业服务企业"],
          ["06", "房产测绘机构"],
          ["11", "金融机构"],
          ["05", "房地产估价机构"]
        ],
        xyjb: [
          ["A+", "A+ 信用优秀"],
          ["A", "A 信用良好"],
          ["B", "B 信用一般"],
          ["C", "C 信用较差"],
          ["D", "D 信用差"]
        ],
        yesNo: [
          ["1", "是"],
          ["0", "否"]
        ],
        lvColor: [
          ["blue", "蓝色 · 正常"],
          ["yellow", "黄色 · 提示"],
          ["orange", "橙色 · 预警"],
          ["red", "红色 · 严重"]
        ]
      },
      home: {
        admin: {
          welcome: "数据中心 · 数据资源总览",
          heroStats: [
            { v: "386", l: "纳管数据表" },
            { v: "28.62 亿", l: "结构化数据行数" },
            { v: "55.2 TB", l: "占用总容量" }
          ],
          kpis: [],
          body: function (q) { return "<div class=\"alert alert-warning\"><i class=\"fa-solid fa-triangle-exclamation\"></i><div>影像存储集群 A 区容量已达 96.2%（阈值 95%），按当前增速预计 3 天写满。<a class=\"link\" href=\"../modules/wsdata/wsdata-05.html{q}\">查看容量</a></div></div><div class=\"stat-grid\"><a class=\"stat-card\" href=\"../modules/wsdata/wsdata-03.html{q}\" title=\"查看明细\"><div class=\"s-icon blue\"><i class=\"fa-solid fa-table-cells-large\"></i></div><div><div class=\"s-label\">纳管数据表</div><div class=\"s-value\">386 张</div><div class=\"s-trend text-3\">覆盖 8 个主题库</div></div></a><a class=\"stat-card\" href=\"../modules/wsdata/wsdata-03.html{q}\" title=\"查看明细\"><div class=\"s-icon green\"><i class=\"fa-solid fa-database\"></i></div><div><div class=\"s-label\">结构化数据总量</div><div class=\"s-value\">28.62 亿行</div><div class=\"s-trend text-3\">占用 12.4 TB · 日均增 186 万行</div></div></a><a class=\"stat-card\" href=\"../modules/wsdata/wsdata-05.html{q}\" title=\"查看明细\"><div class=\"s-icon cyan\"><i class=\"fa-solid fa-images\"></i></div><div><div class=\"s-label\">非结构化文件</div><div class=\"s-value\">1,286 万件</div><div class=\"s-trend text-3\">占用 42.8 TB · 日均增 1.6 万件</div></div></a><a class=\"stat-card\" href=\"../modules/wsdata/wsdata-10.html{q}\" title=\"查看明细\"><div class=\"s-icon purple\"><i class=\"fa-solid fa-right-left\"></i></div><div><div class=\"s-label\">数据交换接口</div><div class=\"s-value\">46 个</div><div class=\"s-trend text-3\">共享中 42 · 停用 4</div></div></a><a class=\"stat-card\" href=\"../modules/wsdata/wsdata-11.html{q}\" title=\"查看明细\"><div class=\"s-icon orange\"><i class=\"fa-solid fa-plug\"></i></div><div><div class=\"s-label\">今日接口调用量</div><div class=\"s-value\">12.6 万次</div><div class=\"s-trend text-success\">成功率 99.2%</div></div></a><a class=\"stat-card\" href=\"../modules/wsdata/wsdata-14.html{q}\" title=\"查看明细\"><div class=\"s-icon red\"><i class=\"fa-solid fa-paper-plane\"></i></div><div><div class=\"s-label\">上级报送及时率</div><div class=\"s-value\">96.8%</div><div class=\"s-trend text-3\">住建部 · 住建厅</div></div></a></div><div class=\"mt-16\"><div class=\"card\"><div class=\"card-head\"><h3>数据异常预警</h3><span class=\"sub\">存储、接口、数据质量、报送逾期等异常统一告警</span></div><div class=\"card-body\"><table class=\"data-table compact\"><thead><tr><th>预警时间</th><th>预警类型</th><th>预警内容</th><th>涉及对象</th><th>级别</th><th>处理状态</th></tr></thead><tbody><tr><td>2026-07-31 22:16</td><td>存储容量</td><td>影像存储集群 A 区容量已达 96.2%（阈值 95%），预计 3 天写满</td><td>非结构化存储</td><td><span class=\"badge red\">严重</span></td><td><span class=\"badge orange\">待处理</span></td></tr><tr><td>2026-07-31 20:08</td><td>接口异常</td><td>税务局房交易税费共享接口 10 分钟内连续超时 6 次</td><td>税务局共享接口</td><td><span class=\"badge orange\">预警</span></td><td><span class=\"badge blue\">处理中</span></td></tr><tr><td>2026-07-31 18:42</td><td>数据质量</td><td>商品房网签备案合同房屋坐落非标准化 1,240 条</td><td>商品房网签合同</td><td><span class=\"badge gray\">提示</span></td><td><span class=\"badge orange\">待处理</span></td></tr><tr><td>2026-07-31 09:02</td><td>报送逾期</td><td>住建部房地产市场监测系统日报 7 月 31 日批次逾期未报</td><td>住建部日报</td><td><span class=\"badge orange\">预警</span></td><td><span class=\"badge green\">已补报</span></td></tr><tr><td>2026-07-30 14:20</td><td>数据一致性</td><td>不动产共享数据与网签合同 3 幢楼栋数不一致</td><td>不动产共享</td><td><span class=\"badge gray\">提示</span></td><td><span class=\"badge green\">已核对</span></td></tr></tbody></table></div></div></div><div class=\"mt-16\"><div class=\"card\"><div class=\"card-head\"><h3>数据交换统计分析</h3><span class=\"sub\">上级上报与部门横向共享运行情况</span></div><div class=\"card-body\"><table class=\"data-table compact\"><thead><tr><th>交换事项</th><th>对接单位</th><th>方向</th><th>频率</th><th class=\"num\">今日次数</th><th class=\"num\">成功率</th><th>最近交换</th><th>状态</th></tr></thead><tbody><tr><td>房地产市场监测日报</td><td>住房和城乡建设部</td><td><span class=\"badge blue\">上报</span></td><td>日</td><td class=\"num nowrap\">1</td><td class=\"num nowrap\">100%</td><td>2026-07-31 09:20</td><td><span class=\"badge green\">正常</span></td></tr><tr><td>房地产市场监管数据</td><td>自治区住房和城乡建设厅</td><td><span class=\"badge blue\">上报</span></td><td>实时</td><td class=\"num nowrap\">2,864</td><td class=\"num nowrap\">99.6%</td><td>2026-08-01 08:00</td><td><span class=\"badge green\">正常</span></td></tr><tr><td>存量房交易税费共享</td><td>XXXX市税务局</td><td><span class=\"badge cyan\">双向共享</span></td><td>实时</td><td class=\"num nowrap\">4,286</td><td class=\"num nowrap\">98.2%</td><td>2026-08-01 08:12</td><td><span class=\"badge orange\">超时预警</span></td></tr><tr><td>网签与不动产登记共享</td><td>市自然资源和规划局</td><td><span class=\"badge cyan\">双向共享</span></td><td>实时</td><td class=\"num nowrap\">6,428</td><td class=\"num nowrap\">99.8%</td><td>2026-08-01 08:14</td><td><span class=\"badge green\">正常</span></td></tr><tr><td>政务数据共享</td><td>市大数据发展局</td><td><span class=\"badge green\">提供</span></td><td>日</td><td class=\"num nowrap\">386</td><td class=\"num nowrap\">100%</td><td>2026-08-01 07:00</td><td><span class=\"badge green\">正常</span></td></tr><tr><td>公积金购房核验共享</td><td>市住房公积金管理中心</td><td><span class=\"badge green\">提供</span></td><td>实时</td><td class=\"num nowrap\">1,246</td><td class=\"num nowrap\">99.5%</td><td>2026-08-01 08:10</td><td><span class=\"badge green\">正常</span></td></tr></tbody></table><div class=\"text-sm text-3 mt-16\"><i class=\"fa-solid fa-circle-info\"></i> 共享单位、接口配置与逐笔调用日志详见「数据交换服务」。<a class=\"link\" href=\"../modules/wsdata/wsdata-10.html{q}\"> 查看明细</a></div></div></div></div><div class=\"grid-2 mt-16\"><div class=\"card\"><div class=\"card-head\"><h3>近 12 个月结构化数据增长趋势</h3><span class=\"sub\">单位：亿行</span></div><div class=\"card-body\"><div class=\"bar-chart\"><div class=\"bar-col\"><span class=\"bar-val\">24.16</span><div class=\"bar\" style=\"height:62%\"></div><span class=\"bar-label\">8月</span></div><div class=\"bar-col\"><span class=\"bar-val\">24.62</span><div class=\"bar\" style=\"height:65%\"></div><span class=\"bar-label\">9月</span></div><div class=\"bar-col\"><span class=\"bar-val\">25.08</span><div class=\"bar\" style=\"height:68%\"></div><span class=\"bar-label\">10月</span></div><div class=\"bar-col\"><span class=\"bar-val\">25.54</span><div class=\"bar\" style=\"height:71%\"></div><span class=\"bar-label\">11月</span></div><div class=\"bar-col\"><span class=\"bar-val\">26.02</span><div class=\"bar\" style=\"height:74%\"></div><span class=\"bar-label\">12月</span></div><div class=\"bar-col\"><span class=\"bar-val\">26.46</span><div class=\"bar\" style=\"height:77%\"></div><span class=\"bar-label\">1月</span></div><div class=\"bar-col\"><span class=\"bar-val\">26.78</span><div class=\"bar\" style=\"height:79%\"></div><span class=\"bar-label\">2月</span></div><div class=\"bar-col\"><span class=\"bar-val\">27.24</span><div class=\"bar\" style=\"height:83%\"></div><span class=\"bar-label\">3月</span></div><div class=\"bar-col\"><span class=\"bar-val\">27.66</span><div class=\"bar\" style=\"height:86%\"></div><span class=\"bar-label\">4月</span></div><div class=\"bar-col\"><span class=\"bar-val\">28.02</span><div class=\"bar\" style=\"height:90%\"></div><span class=\"bar-label\">5月</span></div><div class=\"bar-col\"><span class=\"bar-val\">28.36</span><div class=\"bar\" style=\"height:95%\"></div><span class=\"bar-label\">6月</span></div><div class=\"bar-col\"><span class=\"bar-val\">28.62</span><div class=\"bar\" style=\"height:100%\"></div><span class=\"bar-label\">7月</span></div></div></div></div><div class=\"card\"><div class=\"card-head\"><h3>近 12 个月非结构化数据增长趋势</h3><span class=\"sub\">单位：万件</span></div><div class=\"card-body\"><div class=\"bar-chart\"><div class=\"bar-col\"><span class=\"bar-val\">980</span><div class=\"bar\" style=\"height:76%\"></div><span class=\"bar-label\">8月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,030</span><div class=\"bar\" style=\"height:80%\"></div><span class=\"bar-label\">9月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,048</span><div class=\"bar\" style=\"height:82%\"></div><span class=\"bar-label\">10月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,086</span><div class=\"bar\" style=\"height:85%\"></div><span class=\"bar-label\">11月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,120</span><div class=\"bar\" style=\"height:87%\"></div><span class=\"bar-label\">12月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,150</span><div class=\"bar\" style=\"height:90%\"></div><span class=\"bar-label\">1月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,176</span><div class=\"bar\" style=\"height:92%\"></div><span class=\"bar-label\">2月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,204</span><div class=\"bar\" style=\"height:94%\"></div><span class=\"bar-label\">3月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,232</span><div class=\"bar\" style=\"height:96%\"></div><span class=\"bar-label\">4月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,256</span><div class=\"bar\" style=\"height:98%\"></div><span class=\"bar-label\">5月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,272</span><div class=\"bar\" style=\"height:99%\"></div><span class=\"bar-label\">6月</span></div><div class=\"bar-col\"><span class=\"bar-val\">1,286</span><div class=\"bar\" style=\"height:100%\"></div><span class=\"bar-label\">7月</span></div></div></div></div></div>".replace(/\{q\}/g, q).replace(/\{qa\}/g, q.replace("?", "&")); }
        },
        ops: {
          welcome: "数据中心 · 任务与接口监控",
          heroStats: [
            { v: "186", l: "调度任务" },
            { v: "4", l: "失败任务" },
            { v: "99.2%", l: "接口成功率" }
          ],
          kpis: [
            { c: "blue", i: "fa-list-check", l: "调度任务", v: "186", t: "运行中 12" },
            { c: "red", i: "fa-circle-xmark", l: "失败任务", v: "4", t: "需重跑", td: "text-danger" },
            { c: "cyan", i: "fa-plug", l: "接口成功率", v: "99.2%", t: "失败重推 14 次" },
            { c: "orange", i: "fa-hard-drive", l: "影像存储使用率", v: "82%", t: "建议扩容" }
          ],
          todos: [
            { c: "red", tag: "接口告警", txt: "税务局共享接口 10 分钟内连续超时 6 次", time: "剩 1h", warn: 1 },
            { c: "orange", tag: "接口告警", txt: "住房保障中心对端不可达已 146 分钟", time: "剩 4h", warn: 1 },
            { c: "blue", tag: "容量巡检", txt: "非结构化存储集群扩容方案待评审", time: "剩 3天" },
            { c: "blue", tag: "重推处理", txt: "14 笔失败报文待重推核对", time: "剩 1天" },
            { c: "green", tag: "备份校验", txt: "贴源库全量备份恢复演练待执行", time: "剩 4天" },
            { c: "orange", tag: "报送监控", txt: "住建部日报 7 月 31 日批次逾期未报", time: "剩 8h", warn: 1 }
          ],
          shortcuts: [
            { c: "red", i: "fa-plug", l: "接口运行监控", h: "../modules/wsdata/wsdata-11.html" },
            { c: "blue", i: "fa-right-left", l: "数据交换服务", h: "../modules/wsdata/wsdata-10.html" },
            { c: "orange", i: "fa-images", l: "非结构化数据资源", h: "../modules/wsdata/wsdata-05.html" },
            { c: "purple", i: "fa-paper-plane", l: "报送监控", h: "../modules/wsdata/wsdata-14.html" }
          ]
        },
        leader: {
          welcome: "数据资源家底与运行态势（只读）",
          heroStats: [
            { v: "386", l: "纳管数据表" },
            { v: "98.6%", l: "质量合格率" },
            { v: "326 万", l: "接口调用量" }
          ],
          kpis: [
            { c: "blue", i: "fa-database", l: "纳管数据表", v: "386", t: "贴源 268 · 主题专题 76" },
            { c: "green", i: "fa-circle-check", l: "质量合格率", v: "98.6%", t: "↑ 1.2%" },
            { c: "cyan", i: "fa-right-left", l: "接口调用量", v: "326 万次", t: "成功率 99.2%" },
            { c: "orange", i: "fa-paper-plane", l: "上报及时率", v: "96.8%", t: "住建部 · 住建厅" }
          ],
          body: function (q) { return "<div class=\"grid-2\"><div class=\"card\"><div class=\"card-head\"><h3>数据质量问题分级分布</h3><span class=\"sub\">按核查规则严重程度分级</span></div><div class=\"card-body\"><div class=\"flex items-center gap-16\"><div class=\"donut\" style=\"background:conic-gradient(var(--lv-blue) 0.00% 60.03%, var(--lv-yellow) 60.03% 87.88%, var(--lv-orange) 87.88% 97.94%, var(--lv-red) 97.94% 100.00%)\"><div class=\"donut-hole\"><div class=\"fw-700\" style=\"font-size:22px\">1240</div><div class=\"text-3 text-sm\">待处置</div></div></div><div class=\"legend\" style=\"flex:1\"><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-blue)\"></span> 蓝色 · 通过<b style=\"margin-left:auto\">1,862</b></div><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-yellow)\"></span> 黄色 · 提示<b style=\"margin-left:auto\">864</b></div><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-orange)\"></span> 橙色 · 待整改<b style=\"margin-left:auto\">312</b></div><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-red)\"></span> 红色 · 阻断<b style=\"margin-left:auto\">64</b></div></div></div></div></div><div class=\"card\"><div class=\"card-head\"><h3>各县区数据完整率</h3><span class=\"sub\">按行政区划打标后统计</span></div><div class=\"card-body\"><table class=\"data-table\"><thead><tr><th>排名</th><th>行政区划</th><th>占比</th><th class=\"num\">数量</th></tr></thead><tbody><tr><td class=\"nowrap\">1</td><td class=\"nowrap\">柳州市本级</td><td style=\"width:52%\"><div class=\"progress\"><span style=\"width:100%\"></span></div></td><td class=\"num nowrap\">100 %</td></tr><tr><td class=\"nowrap\">2</td><td class=\"nowrap\">柳江区</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:99%\"></span></div></td><td class=\"num nowrap\">99 %</td></tr><tr><td class=\"nowrap\">3</td><td class=\"nowrap\">柳城县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:98%\"></span></div></td><td class=\"num nowrap\">98 %</td></tr><tr><td class=\"nowrap\">4</td><td class=\"nowrap\">鹿寨县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:97%\"></span></div></td><td class=\"num nowrap\">97 %</td></tr><tr><td class=\"nowrap\">5</td><td class=\"nowrap\">融安县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:96%\"></span></div></td><td class=\"num nowrap\">96 %</td></tr><tr><td class=\"nowrap\">6</td><td class=\"nowrap\">融水苗族自治县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:94%\"></span></div></td><td class=\"num nowrap\">94 %</td></tr><tr><td class=\"nowrap\">7</td><td class=\"nowrap\">三江侗族自治县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:91%\"></span></div></td><td class=\"num nowrap\">91 %</td></tr></tbody></table></div></div></div><div class=\"card\"><div class=\"card-head\"><h3>近七月接口调用量</h3><span class=\"sub\">单位：万次</span></div><div class=\"card-body\"><div class=\"bar-chart\"><div class=\"bar-col\"><span class=\"bar-val\">268</span><div class=\"bar\" style=\"height:52%\"></div><span class=\"bar-label\">1月</span></div><div class=\"bar-col\"><span class=\"bar-val\">212</span><div class=\"bar\" style=\"height:41%\"></div><span class=\"bar-label\">2月</span></div><div class=\"bar-col\"><span class=\"bar-val\">306</span><div class=\"bar\" style=\"height:60%\"></div><span class=\"bar-label\">3月</span></div><div class=\"bar-col\"><span class=\"bar-val\">348</span><div class=\"bar\" style=\"height:68%\"></div><span class=\"bar-label\">4月</span></div><div class=\"bar-col\"><span class=\"bar-val\">378</span><div class=\"bar\" style=\"height:74%\"></div><span class=\"bar-label\">5月</span></div><div class=\"bar-col\"><span class=\"bar-val\">440</span><div class=\"bar\" style=\"height:86%\"></div><span class=\"bar-label\">6月</span></div><div class=\"bar-col\"><span class=\"bar-val\">326</span><div class=\"bar\" style=\"height:64%\"></div><span class=\"bar-label\">7月</span></div></div></div></div>"; }
        }
      }
    },
    ai: {
      sysName: "华信数智房产交易一体化平台",
      endName: "数智大脑",
      endIcon: "fa-brain",
      portalHref: "../index.html",
      defaultRole: "admin",
      roles: {
        admin: { tag: "AI 应用", user: "蒙丽华", role: "市房产交易所 · AI 平台管理员" },
        reviewer: { tag: "AI 应用", user: "韦国强", role: "市房产交易所 · 业务审核员" },
        manager: { tag: "AI 应用", user: "李慧", role: "市住建局房产科 · 业务管理员" },
        leader: { tag: "AI 应用", user: "张伟", role: "市住建局 · 分管领导" }
      },
      menu: [],
      systems: [
        {
          key: "wsai",
          name: "AI 应用服务平台",
          icon: "fa-brain",
          line: "智能应用",
          menu: [
            { key: "overview", label: "我的工作台", icon: "fa-gauge-high", href: "../modules/wsai/common/overview.html" },
            {
              label: "模型管理",
              icon: "fa-microchip",
              children: [
                { key: "model-library", label: "模型库管理", href: "../modules/wsai/admin/model-library.html" },
                { key: "model-eval", label: "模型效果评估", href: "../modules/wsai/admin/model-eval.html" },
                { key: "model-version", label: "模型版本管理", href: "../modules/wsai/admin/model-version.html" },
                { key: "model-perm", label: "模型权限管理", href: "../modules/wsai/admin/model-perm.html" },
                { key: "agent-orchestrate", label: "智能体编排", href: "../modules/wsai/admin/agent-orchestrate.html" },
                { key: "compute-resource", label: "算力资源纳管", href: "../modules/wsai/admin/compute-resource.html" }
              ]
            },
            {
              label: "模型调用与适配",
              icon: "fa-plug",
              children: [
                { key: "api-gateway", label: "统一调用接口", href: "../modules/wsai/admin/api-gateway.html" },
                { key: "call-params", label: "调用参数配置", href: "../modules/wsai/admin/call-params.html" },
                { key: "multi-model", label: "多模型协同调用", href: "../modules/wsai/admin/multi-model.html" },
                { key: "model-adapt", label: "模型适配调整", href: "../modules/wsai/admin/model-adapt.html" },
                { key: "model-custom-api", label: "模型定制接口", href: "../modules/wsai/admin/model-custom-api.html" }
              ]
            },
            {
              label: "知识库管理",
              icon: "fa-sitemap",
              children: [
                { key: "knowledge-base", label: "监管知识库管理", href: "../modules/wsai/admin/knowledge-base.html" },
                { key: "knowledge-audit", label: "知识库更新审核", href: "../modules/wsai/admin/knowledge-audit.html" },
                { key: "graph-build", label: "全维度知识图谱构建", href: "../modules/wsai/admin/graph-build.html" },
                { key: "graph-explorer", label: "知识图谱可视化查询", href: "../modules/wsai/admin/graph-explorer.html" }
              ]
            },
            {
              label: "AI 应用辅助",
              icon: "fa-wand-magic-sparkles",
              children: [
                { key: "sentiment", label: "AI 舆情智能分析", href: "../modules/wsai/analyst/sentiment.html" },
                { key: "risk-judge", label: "AI 风险智能研判", href: "../modules/wsai/analyst/risk-judge.html" },
                { key: "fund-analysis", label: "AI 资金智能分析", href: "../modules/wsai/analyst/fund-analysis.html" },
                { key: "chat", label: "AI 智能对话交互", href: "../modules/wsai/public/chat.html" },
                { key: "ask-data", label: "AI 智能问数与报告", href: "../modules/wsai/analyst/ask-data.html" },
                { key: "contract-review", label: "AI 智能审核核验", href: "../modules/wsai/handler/contract-review.html" },
                { key: "guide-bot", label: "AI 智能办事助手", href: "../modules/wsai/public/guide-bot.html" },
                { key: "ai-audit-log", label: "AI 输出治理留痕", href: "../modules/wsai/common/ai-audit-log.html" }
              ]
            }
          ]
        }
      ],
      defaultSystem: "wsai",
      roleMenu: {
        admin: ["overview", "model-library", "model-eval", "model-version", "model-perm", "agent-orchestrate", "compute-resource", "api-gateway", "call-params", "multi-model", "model-adapt", "model-custom-api", "knowledge-base", "knowledge-audit", "graph-build", "graph-explorer", "sentiment", "risk-judge", "fund-analysis", "chat", "ask-data", "contract-review", "guide-bot", "ai-audit-log"],
        reviewer: ["overview", "model-eval", "contract-review", "sentiment", "risk-judge", "fund-analysis", "chat", "guide-bot", "ai-audit-log"],
        manager: ["overview", "knowledge-base", "graph-explorer", "sentiment", "risk-judge", "fund-analysis", "ask-data", "chat", "ai-audit-log"],
        leader: ["overview", "sentiment", "risk-judge", "fund-analysis", "ask-data", "ai-audit-log"]
      },
      dict: {
        said: [
          ["450200", "柳州市本级"],
          ["450202", "城中区"],
          ["450203", "鱼峰区"],
          ["450204", "柳南区"],
          ["450205", "柳北区"],
          ["450206", "柳江区"],
          ["450222", "柳城县"],
          ["450223", "鹿寨县"],
          ["450224", "融安县"],
          ["450225", "融水苗族自治县"],
          ["450226", "三江侗族自治县"]
        ],
        blzt: [
          ["0", "待受理"],
          ["1", "办理中"],
          ["2", "已办结"],
          ["3", "已撤件"],
          ["4", "已退件"],
          ["5", "待补正"],
          ["6", "中止办理"],
          ["7", "已作废"]
        ],
        shzt: [
          ["0", "待审核"],
          ["1", "审核中"],
          ["2", "审核通过"],
          ["3", "审核不通过"],
          ["4", "退回补正"]
        ],
        sjly: [
          ["01", "窗口办理"],
          ["02", "统一服务门户"],
          ["03", "微信小程序"],
          ["04", "自助终端"],
          ["05", "中介机构端"],
          ["06", "企业工作台"],
          ["07", "银行端"],
          ["08", "接口导入"],
          ["09", "历史数据迁移"],
          ["10", "批量导入"],
          ["99", "其他"]
        ],
        ywdl: [
          ["01", "商品房交易"],
          ["02", "存量房交易"],
          ["03", "房屋租赁"],
          ["04", "抵押与交易限制"],
          ["05", "政策性住房与安置房"],
          ["06", "测绘成果与面积"],
          ["07", "房产档案"],
          ["08", "预售资金监管"],
          ["09", "存量房资金监管"],
          ["10", "维修资金监管"],
          ["11", "从业主体与信用"],
          ["12", "项目监管与好房子"],
          ["13", "查询与出证"],
          ["14", "更正与撤销"],
          ["99", "其他"]
        ],
        zjlx: [
          ["01", "居民身份证"],
          ["02", "户口簿"],
          ["03", "护照"],
          ["21", "统一社会信用代码证"],
          ["22", "营业执照"],
          ["99", "其他"]
        ],
        fwyt: [
          ["01", "成套住宅"],
          ["02", "非成套住宅"],
          ["03", "集体宿舍"],
          ["04", "商业服务"],
          ["05", "办公"],
          ["06", "工业仓储"],
          ["07", "车库车位"],
          ["08", "教育医疗"],
          ["09", "公共设施"],
          ["99", "其他"]
        ],
        ztlx: [
          ["01", "房地产开发企业"],
          ["02", "房地产经纪机构"],
          ["04", "物业服务企业"],
          ["06", "房产测绘机构"],
          ["11", "金融机构"],
          ["05", "房地产估价机构"]
        ],
        xyjb: [
          ["A+", "A+ 信用优秀"],
          ["A", "A 信用良好"],
          ["B", "B 信用一般"],
          ["C", "C 信用较差"],
          ["D", "D 信用差"]
        ],
        yesNo: [
          ["1", "是"],
          ["0", "否"]
        ],
        lvColor: [
          ["blue", "蓝色 · 正常"],
          ["yellow", "黄色 · 提示"],
          ["orange", "橙色 · 预警"],
          ["red", "红色 · 严重"]
        ]
      },
      home: {
        admin: {
          welcome: "数智大脑 · 模型与知识库管理",
          heroStats: [
            { v: "12", l: "在用模型" },
            { v: "8.6 万", l: "日调用量" },
            { v: "91.4%", l: "智能审核通过率" }
          ],
          kpis: [
            { c: "blue", i: "fa-microchip", l: "在用模型", v: "12", t: "本地化部署" },
            { c: "cyan", i: "fa-bolt", l: "日调用量", v: "8.6 万次", t: "↑ 6.8%" },
            { c: "green", i: "fa-circle-check", l: "智能审核通过率", v: "91.4%", t: "误报率 2.6%" },
            { c: "orange", i: "fa-percent", l: "平均置信度", v: "88.2%", t: "低于阈值转人工" }
          ],
          todos: [
            { c: "orange", tag: "模型评测", txt: "企业信用风险模型 v3 灰度评测待复核", time: "剩 1天" },
            { c: "blue", tag: "提示词管理", txt: "智能导办提示词模板待评审", time: "剩 2天" },
            { c: "blue", tag: "知识库", txt: "2026 年新政 12 篇待入库并建索引", time: "剩 3天" },
            { c: "red", tag: "输出护栏", txt: "1 条 AI 答复被投诉，需回溯留痕", time: "剩 4h", warn: 1 },
            { c: "green", tag: "样本回流", txt: "智能核验误报样本 86 条待回流调优", time: "剩 5天" },
            { c: "blue", tag: "知识图谱", txt: "项目—账户—企业关联关系图谱待扩边", time: "剩 6天" }
          ],
          shortcuts: [
            { c: "blue", i: "fa-microchip", l: "模型库管理", h: "../modules/wsai/admin/model-library.html" },
            { c: "cyan", i: "fa-plug", l: "统一调用接口", h: "../modules/wsai/admin/api-gateway.html" },
            { c: "green", i: "fa-sitemap", l: "知识库管理", h: "../modules/wsai/admin/knowledge-base.html" },
            { c: "orange", i: "fa-wand-magic-sparkles", l: "AI 应用辅助", h: "../modules/wsai/analyst/sentiment.html" },
            { c: "purple", i: "fa-shield-halved", l: "AI 输出治理留痕", h: "../modules/wsai/common/ai-audit-log.html" }
          ]
        },
        reviewer: {
          welcome: "AI 辅助审核 · 疑点复核工作台",
          heroStats: [
            { v: "126", l: "今日智能审核" },
            { v: "18", l: "待人工复核" },
            { v: "88.2%", l: "平均置信度" }
          ],
          kpis: [
            { c: "blue", i: "fa-file-circle-check", l: "今日智能审核", v: "126 件", t: "自动通过 108 件" },
            { c: "orange", i: "fa-user-check", l: "待人工复核", v: "18 件", t: "置信度低于阈值" },
            { c: "cyan", i: "fa-percent", l: "平均置信度", v: "88.2%", t: "AI 出结论 人工做决策" },
            { c: "green", i: "fa-id-card", l: "证照识别回填", v: "862 次", t: "准确率 96.4%" }
          ],
          todos: [
            { c: "red", tag: "疑点复核", txt: "荣和公园大道 3 份合同价格异常疑点待复核", time: "剩 3h", warn: 1 },
            { c: "orange", tag: "房源核验", txt: "2 套存量房房源真实性智能核验存疑", time: "剩 6h", warn: 1 },
            { c: "blue", tag: "材料审核", txt: "8 份备案材料智能审核疑点待确认", time: "剩 1天" },
            { c: "blue", tag: "档案编目", txt: "126 页档案影像智能编目结果待抽检", time: "剩 2天" },
            { c: "green", tag: "证照回填", txt: "3 条证照识别结果与原件不一致", time: "剩 1天" },
            { c: "blue", tag: "品质核验", txt: "好房子申报材料智能核验待复核", time: "剩 3天" }
          ],
          shortcuts: [
            {
              c: "blue",
              i: "fa-magnifying-glass-plus",
              l: "AI 智能审核核验",
              h: "../modules/wsai/handler/contract-review.html"
            },
            { c: "orange", i: "fa-face-smile", l: "AI 舆情智能分析", h: "../modules/wsai/analyst/sentiment.html" },
            { c: "green", i: "fa-comments", l: "AI 智能办事助手", h: "../modules/wsai/public/guide-bot.html" },
            { c: "cyan", i: "fa-shield-halved", l: "AI 输出治理留痕", h: "../modules/wsai/common/ai-audit-log.html" }
          ]
        },
        manager: {
          welcome: "AI 智能分析与风险研判",
          heroStats: [
            { v: "24", l: "本月智能报告" },
            { v: "38", l: "风险线索" },
            { v: "12", l: "已确认线索" }
          ],
          kpis: [
            { c: "blue", i: "fa-chart-pie", l: "本月智能报告", v: "24 份", t: "月报 · 专题分析" },
            { c: "orange", i: "fa-brain", l: "风险线索", v: "38 条", t: "待人工确认 26 条" },
            { c: "green", i: "fa-check-double", l: "已确认线索", v: "12 条", t: "已回流预警督办" },
            { c: "cyan", i: "fa-comments", l: "舆情监测", v: "6 条", t: "负面 2 条" }
          ],
          todos: [
            { c: "orange", tag: "线索确认", txt: "万达华府资金异动线索待人工确认", time: "剩 5h", warn: 1 },
            { c: "blue", tag: "智能问数", txt: "上半年各县区成交结构分析待生成", time: "剩 1天" },
            { c: "blue", tag: "报告审签", txt: "7 月市场运行分析报告待审签", time: "剩 2天" },
            { c: "red", tag: "舆情处置", txt: "2 条负面舆情待核实并回应", time: "剩 4h", warn: 1 },
            { c: "green", tag: "权重试算", txt: "项目风险因子权重模型待试算对比", time: "剩 4天" },
            { c: "blue", tag: "企业画像", txt: "重点开发企业风险画像待复核", time: "剩 3天" }
          ],
          shortcuts: [
            { c: "blue", i: "fa-chart-pie", l: "AI 智能问数与报告", h: "../modules/wsai/analyst/ask-data.html" },
            { c: "orange", i: "fa-brain", l: "AI 风险智能研判", h: "../modules/wsai/analyst/risk-judge.html" },
            { c: "red", i: "fa-sack-dollar", l: "AI 资金智能分析", h: "../modules/wsai/analyst/fund-analysis.html" },
            { c: "green", i: "fa-sitemap", l: "知识库管理", h: "../modules/wsai/admin/knowledge-base.html" }
          ]
        },
        leader: {
          welcome: "AI 风险研判与分析报告（只读）",
          heroStats: [
            { v: "38", l: "风险线索" },
            { v: "24", l: "智能报告" },
            { v: "88.2%", l: "平均置信度" }
          ],
          kpis: [
            { c: "red", i: "fa-brain", l: "高风险企业", v: "6 家", t: "模型研判 人工确认", td: "text-danger" },
            { c: "orange", i: "fa-diagram-project", l: "高风险项目", v: "9 个", t: "含保交楼 3 个" },
            { c: "blue", i: "fa-chart-pie", l: "本月智能报告", v: "24 份", t: "口径与统计报表一致" },
            { c: "cyan", i: "fa-percent", l: "平均置信度", v: "88.2%", t: "结论均附依据说明" }
          ],
          body: function (q) { return "<div class=\"grid-2\"><div class=\"card\"><div class=\"card-head\"><h3>风险线索分级分布</h3><span class=\"sub\">AI 出结论，人工做决策</span></div><div class=\"card-body\"><div class=\"flex items-center gap-16\"><div class=\"donut\" style=\"background:conic-gradient(var(--lv-blue) 0.00% 84.23%, var(--lv-yellow) 84.23% 94.97%, var(--lv-orange) 94.97% 98.96%, var(--lv-red) 98.96% 100.00%)\"><div class=\"donut-hole\"><div class=\"fw-700\" style=\"font-size:22px\">91</div><div class=\"text-3 text-sm\">待处置</div></div></div><div class=\"legend\" style=\"flex:1\"><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-blue)\"></span> 蓝色 · 正常<b style=\"margin-left:auto\">486</b></div><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-yellow)\"></span> 黄色 · 关注<b style=\"margin-left:auto\">62</b></div><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-orange)\"></span> 橙色 · 预警<b style=\"margin-left:auto\">23</b></div><div class=\"lg-item\"><span class=\"lg-color\" style=\"background:var(--lv-red)\"></span> 红色 · 严重<b style=\"margin-left:auto\">6</b></div></div></div></div></div><div class=\"card\"><div class=\"card-head\"><h3>各县区高风险主体分布</h3><span class=\"sub\">模型研判结果，需人工确认</span></div><div class=\"card-body\"><table class=\"data-table\"><thead><tr><th>排名</th><th>行政区划</th><th>占比</th><th class=\"num\">数量</th></tr></thead><tbody><tr><td class=\"nowrap\">1</td><td class=\"nowrap\">柳州市本级</td><td style=\"width:52%\"><div class=\"progress\"><span style=\"width:100%\"></span></div></td><td class=\"num nowrap\">24 家</td></tr><tr><td class=\"nowrap\">2</td><td class=\"nowrap\">柳江区</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:38%\"></span></div></td><td class=\"num nowrap\">9 家</td></tr><tr><td class=\"nowrap\">3</td><td class=\"nowrap\">鹿寨县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:29%\"></span></div></td><td class=\"num nowrap\">7 家</td></tr><tr><td class=\"nowrap\">4</td><td class=\"nowrap\">柳城县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:25%\"></span></div></td><td class=\"num nowrap\">6 家</td></tr><tr><td class=\"nowrap\">5</td><td class=\"nowrap\">融安县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:17%\"></span></div></td><td class=\"num nowrap\">4 家</td></tr><tr><td class=\"nowrap\">6</td><td class=\"nowrap\">融水苗族自治县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:12%\"></span></div></td><td class=\"num nowrap\">3 家</td></tr><tr><td class=\"nowrap\">7</td><td class=\"nowrap\">三江侗族自治县</td><td style=\"width:52%\"><div class=\"progress green\"><span style=\"width:8%\"></span></div></td><td class=\"num nowrap\">2 家</td></tr></tbody></table></div></div></div><div class=\"card\"><div class=\"card-head\"><h3>近七月 AI 调用量</h3><span class=\"sub\">单位：千次</span></div><div class=\"card-body\"><div class=\"bar-chart\"><div class=\"bar-col\"><span class=\"bar-val\">52</span><div class=\"bar\" style=\"height:38%\"></div><span class=\"bar-label\">1月</span></div><div class=\"bar-col\"><span class=\"bar-val\">41</span><div class=\"bar\" style=\"height:30%\"></div><span class=\"bar-label\">2月</span></div><div class=\"bar-col\"><span class=\"bar-val\">70</span><div class=\"bar\" style=\"height:52%\"></div><span class=\"bar-label\">3月</span></div><div class=\"bar-col\"><span class=\"bar-val\">82</span><div class=\"bar\" style=\"height:61%\"></div><span class=\"bar-label\">4月</span></div><div class=\"bar-col\"><span class=\"bar-val\">96</span><div class=\"bar\" style=\"height:72%\"></div><span class=\"bar-label\">5月</span></div><div class=\"bar-col\"><span class=\"bar-val\">112</span><div class=\"bar\" style=\"height:84%\"></div><span class=\"bar-label\">6月</span></div><div class=\"bar-col\"><span class=\"bar-val\">128</span><div class=\"bar\" style=\"height:96%\"></div><span class=\"bar-label\">7月</span></div></div></div></div>"; }
        }
      }
    },
    mobile: {
      sysName: "华信数智房产交易一体化平台",
      endName: "移动端",
      endIcon: "fa-mobile-screen-button",
      portalHref: "../index.html",
      defaultRole: "citizen",
      roles: {
        citizen: { tag: "移动端", user: "吴明", role: "个人用户 · 购房群众" },
        tenant: { tag: "移动端", user: "黄雅", role: "个人用户 · 租赁当事人" }
      },
      menu: [
        { key: "dashboard", label: "首页", icon: "fa-house", href: "home.html" }
      ],
      systems: [],
      defaultSystem: "",
      roleMenu: { citizen: null, tenant: null },
      dict: {
        said: [
          ["450200", "柳州市本级"],
          ["450202", "城中区"],
          ["450203", "鱼峰区"],
          ["450204", "柳南区"],
          ["450205", "柳北区"],
          ["450206", "柳江区"],
          ["450222", "柳城县"],
          ["450223", "鹿寨县"],
          ["450224", "融安县"],
          ["450225", "融水苗族自治县"],
          ["450226", "三江侗族自治县"]
        ],
        blzt: [
          ["0", "待受理"],
          ["1", "办理中"],
          ["2", "已办结"],
          ["3", "已撤件"],
          ["4", "已退件"],
          ["5", "待补正"],
          ["6", "中止办理"],
          ["7", "已作废"]
        ],
        shzt: [
          ["0", "待审核"],
          ["1", "审核中"],
          ["2", "审核通过"],
          ["3", "审核不通过"],
          ["4", "退回补正"]
        ],
        sjly: [
          ["01", "窗口办理"],
          ["02", "统一服务门户"],
          ["03", "微信小程序"],
          ["04", "自助终端"],
          ["05", "中介机构端"],
          ["06", "企业工作台"],
          ["07", "银行端"],
          ["08", "接口导入"],
          ["09", "历史数据迁移"],
          ["10", "批量导入"],
          ["99", "其他"]
        ],
        ywdl: [
          ["01", "商品房交易"],
          ["02", "存量房交易"],
          ["03", "房屋租赁"],
          ["04", "抵押与交易限制"],
          ["05", "政策性住房与安置房"],
          ["06", "测绘成果与面积"],
          ["07", "房产档案"],
          ["08", "预售资金监管"],
          ["09", "存量房资金监管"],
          ["10", "维修资金监管"],
          ["11", "从业主体与信用"],
          ["12", "项目监管与好房子"],
          ["13", "查询与出证"],
          ["14", "更正与撤销"],
          ["99", "其他"]
        ],
        zjlx: [
          ["01", "居民身份证"],
          ["02", "户口簿"],
          ["03", "护照"],
          ["21", "统一社会信用代码证"],
          ["22", "营业执照"],
          ["99", "其他"]
        ],
        fwyt: [
          ["01", "成套住宅"],
          ["02", "非成套住宅"],
          ["03", "集体宿舍"],
          ["04", "商业服务"],
          ["05", "办公"],
          ["06", "工业仓储"],
          ["07", "车库车位"],
          ["08", "教育医疗"],
          ["09", "公共设施"],
          ["99", "其他"]
        ],
        ztlx: [
          ["01", "房地产开发企业"],
          ["02", "房地产经纪机构"],
          ["04", "物业服务企业"],
          ["06", "房产测绘机构"],
          ["11", "金融机构"],
          ["05", "房地产估价机构"]
        ],
        xyjb: [
          ["A+", "A+ 信用优秀"],
          ["A", "A 信用良好"],
          ["B", "B 信用一般"],
          ["C", "C 信用较差"],
          ["D", "D 信用差"]
        ],
        yesNo: [
          ["1", "是"],
          ["0", "否"]
        ],
        lvColor: [
          ["blue", "蓝色 · 正常"],
          ["yellow", "黄色 · 提示"],
          ["orange", "橙色 · 预警"],
          ["red", "红色 · 严重"]
        ]
      },
      home: {
        citizen: {
          heroStats: [
            { v: "10", l: "一级菜单" },
            { v: "31", l: "二级菜单" },
            { v: "145", l: "功能点" }
          ],
          kpis: [],
          body: function (q) { return "<div class=\"alert alert-info\"><i class=\"fa-solid fa-circle-info\"></i><div>本端已搭好外壳、角色与首页，业务栏目按指令逐个一级菜单生成。页面统一落在 <code>modules/&lt;子系统代号&gt;/</code> 下，与业务办理端同一份文件、同一套口径，登录身份只影响数据范围。</div></div><div class=\"card\"><div class=\"card-head\"><h3>移动端 10 个一级菜单建设清单</h3><span class=\"sub\">菜单口径取自《菜单梳理v1.0》</span></div><div class=\"card-body\"><table class=\"data-table\"><thead><tr><th>序号</th><th>一级菜单</th><th class=\"num\">二级菜单</th><th class=\"num\">功能点</th><th>状态</th></tr></thead><tbody><tr><td class=\"nowrap\">1</td><td>我的工作台</td><td class=\"num nowrap\">0</td><td class=\"num nowrap\">0</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">2</td><td>办事服务</td><td class=\"num nowrap\">3</td><td class=\"num nowrap\">21</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">3</td><td>查询服务</td><td class=\"num nowrap\">2</td><td class=\"num nowrap\">21</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">4</td><td>房源超市</td><td class=\"num nowrap\">5</td><td class=\"num nowrap\">24</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">5</td><td>资讯公开</td><td class=\"num nowrap\">4</td><td class=\"num nowrap\">17</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">6</td><td>便民互动</td><td class=\"num nowrap\">4</td><td class=\"num nowrap\">15</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">7</td><td>移动办公</td><td class=\"num nowrap\">3</td><td class=\"num nowrap\">9</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">8</td><td>领导决策</td><td class=\"num nowrap\">4</td><td class=\"num nowrap\">14</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">9</td><td>统计预警</td><td class=\"num nowrap\">4</td><td class=\"num nowrap\">14</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">10</td><td>渠道运营</td><td class=\"num nowrap\">2</td><td class=\"num nowrap\">10</td><td><span class=\"badge gray\">待建设</span></td></tr></tbody></table></div></div>"; },
          welcome: "移动端 · 公众服务（本期只搭外壳）"
        },
        tenant: {
          heroStats: [
            { v: "10", l: "一级菜单" },
            { v: "31", l: "二级菜单" },
            { v: "145", l: "功能点" }
          ],
          kpis: [],
          body: function (q) { return "<div class=\"alert alert-info\"><i class=\"fa-solid fa-circle-info\"></i><div>本端已搭好外壳、角色与首页，业务栏目按指令逐个一级菜单生成。页面统一落在 <code>modules/&lt;子系统代号&gt;/</code> 下，与业务办理端同一份文件、同一套口径，登录身份只影响数据范围。</div></div><div class=\"card\"><div class=\"card-head\"><h3>移动端 10 个一级菜单建设清单</h3><span class=\"sub\">菜单口径取自《菜单梳理v1.0》</span></div><div class=\"card-body\"><table class=\"data-table\"><thead><tr><th>序号</th><th>一级菜单</th><th class=\"num\">二级菜单</th><th class=\"num\">功能点</th><th>状态</th></tr></thead><tbody><tr><td class=\"nowrap\">1</td><td>我的工作台</td><td class=\"num nowrap\">0</td><td class=\"num nowrap\">0</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">2</td><td>办事服务</td><td class=\"num nowrap\">3</td><td class=\"num nowrap\">21</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">3</td><td>查询服务</td><td class=\"num nowrap\">2</td><td class=\"num nowrap\">21</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">4</td><td>房源超市</td><td class=\"num nowrap\">5</td><td class=\"num nowrap\">24</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">5</td><td>资讯公开</td><td class=\"num nowrap\">4</td><td class=\"num nowrap\">17</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">6</td><td>便民互动</td><td class=\"num nowrap\">4</td><td class=\"num nowrap\">15</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">7</td><td>移动办公</td><td class=\"num nowrap\">3</td><td class=\"num nowrap\">9</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">8</td><td>领导决策</td><td class=\"num nowrap\">4</td><td class=\"num nowrap\">14</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">9</td><td>统计预警</td><td class=\"num nowrap\">4</td><td class=\"num nowrap\">14</td><td><span class=\"badge gray\">待建设</span></td></tr><tr><td class=\"nowrap\">10</td><td>渠道运营</td><td class=\"num nowrap\">2</td><td class=\"num nowrap\">10</td><td><span class=\"badge gray\">待建设</span></td></tr></tbody></table></div></div>"; },
          welcome: "移动端 · 住房租赁（本期只搭外壳）"
        }
      }
    }
  };

/* ==========================================================================
     补丁 K：交易资金监管统一入口
     业务方要求这四个系统「不要分业务端口，直接进系统，所有功能都展示」。
     这里在分端配置之外另建一个端 zjjg：同一子系统在监管端、单位机构端、门户端、
     移动端的菜单合并成一棵树，roleMenu 置空即放行全部菜单（与移动端同一写法）。
     字典与首页配置直接复用业务办理端，避免重复维护。
     ========================================================================== */
  APP_CONFIGS.zjjg = {
    sysName: APP_CONFIGS.government.sysName,
    endName: "交易资金监管",
    endIcon: "fa-money-bill-transfer",
    portalHref: "../index.html",
    defaultRole: "all",
    roles: {
      all: { tag: "交易资金监管", user: "演示账号", role: "全功能视图 · 不分端不分角色" }
    },
    menu: [],
    defaultSystem: "wsszjjg",
    roleMenu: { all: null },
    dict: APP_CONFIGS.government.dict,
    home: APP_CONFIGS.government.home,
    systems: [
      {
        key: "wsszjjg",
        name: "新建商品房预售资金监管系统",
        icon: "fa-sack-dollar",
        line: "交易资金监管",
        menu: [
          { key: "wsszjjg-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wsszjjg/gov/workbench.html" },
          { label: "监管设置", icon: "fa-sliders", children: [
            { key: "wsszjjg-02", label: "监管职责界定", href: "../modules/wsszjjg/gov/duty.html" },
            { key: "wsszjjg-03", label: "监管关系维护", href: "../modules/wsszjjg/gov/relation.html" },
            { key: "wsszjjg-04", label: "监管规则配置", href: "../modules/wsszjjg/gov/rule.html" }
          ]},
          { label: "项目与账户", icon: "fa-building", children: [
            { key: "wsszjjg-05", label: "监管项目管理", href: "../modules/wsszjjg/gov/project.html" },
            { key: "wsszjjg-06", label: "监管账户管理", href: "../modules/wsszjjg/gov/account.html" },
            { key: "wsszjjg-07", label: "施工名录库", href: "../modules/wsszjjg/gov/contractor.html" }
          ]},
          { label: "资金监管", icon: "fa-sack-dollar", children: [
            { key: "wsszjjg-08", label: "资金归集管理", href: "../modules/wsszjjg/gov/collect.html" },
            { key: "wsszjjg-09", label: "资金使用管理", href: "../modules/wsszjjg/gov/usage.html" },
            { key: "wsszjjg-10", label: "资金核退管理", href: "../modules/wsszjjg/gov/refund.html" },
            { key: "wsszjjg-11", label: "账户清算管理", href: "../modules/wsszjjg/gov/clearing.html" }
          ]},
          { label: "对账与解监", icon: "fa-scale-balanced", children: [
            { key: "wsszjjg-12", label: "资金对账管理", href: "../modules/wsszjjg/gov/reconcile.html" },
            { key: "wsszjjg-13", label: "解除监管管理", href: "../modules/wsszjjg/gov/release.html" }
          ]},
          { label: "开发企业办理", icon: "fa-building-user", children: [
            { label: "开发企业工作台", href: "../modules/wsszjjg/dev/workbench.html" },
            { key: "wsszjjg-15", label: "我的监管账户", href: "../modules/wsszjjg/dev/account.html" },
            { key: "wsszjjg-16", label: "购房款缴存", href: "../modules/wsszjjg/dev/collect.html" },
            { key: "wsszjjg-17", label: "形象进度申报", href: "../modules/wsszjjg/dev/progress-apply.html" },
            { key: "wsszjjg-18", label: "我的用款申请", href: "../modules/wsszjjg/dev/usage.html" },
            { key: "wsszjjg-19", label: "保函替代申请", href: "../modules/wsszjjg/dev/guarantee-apply.html" },
            { key: "wsszjjg-20", label: "解除监管申请", href: "../modules/wsszjjg/dev/release-apply.html" }
          ]},
          { label: "监管银行办理", icon: "fa-building-columns", children: [
            { key: "wsszjjg-14", label: "银行服务工作台", href: "../modules/wsszjjg/bank/workbench.html" },
            { key: "wsszjjg-21", label: "缴存流水报送", href: "../modules/wsszjjg/bank/collect-push.html" },
            { key: "wsszjjg-22", label: "拨付指令与回执", href: "../modules/wsszjjg/bank/order.html" },
            { key: "wsszjjg-23", label: "账户余额报送", href: "../modules/wsszjjg/bank/balance.html" },
            { key: "wsszjjg-24", label: "日终对账", href: "../modules/wsszjjg/bank/reconcile.html" }
          ]},
          { label: "群众服务", icon: "fa-users", children: [
            { key: "wsszjjg-31", label: "监管公示专区", href: "../modules/wsszjjg/portal/index.html" },
            { key: "wsszjjg-32", label: "监管账户核验", href: "../modules/wsszjjg/portal/verify.html" },
            { key: "wsszjjg-33", label: "我的购房款缴存", href: "../modules/wsszjjg/portal/pay.html" },
            { key: "wsszjjg-34", label: "我的缴款通知书", href: "../modules/wsszjjg/portal/notice.html" }
          ]},
          { label: "移动端", icon: "fa-mobile-screen-button", children: [
            { label: "资金监管首页", href: "../modules/wsszjjg/mobile/home.html" },
            { label: "监管账户核验", href: "../modules/wsszjjg/mobile/verify.html" },
            { label: "我的购房款缴存", href: "../modules/wsszjjg/mobile/pay.html" },
            { label: "项目形象进度", href: "../modules/wsszjjg/mobile/progress.html" }
          ]}
        ]
      },
      {
        key: "wszjjg",
        name: "存量房交易资金监管系统",
        icon: "fa-money-bill-transfer",
        line: "交易资金监管",
        menu: [
          { key: "wszjjg-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wszjjg/gov/workbench.html" },
          { label: "监管办理", icon: "fa-file-signature", children: [
            { key: "wszjjg-02", label: "监管职责界定", href: "../modules/wszjjg/gov/duty.html" },
            { key: "wszjjg-03", label: "资金监管办理", href: "../modules/wszjjg/gov/escrow.html" },
            { key: "wszjjg-04", label: "资金节点监控", href: "../modules/wszjjg/gov/node.html" }
          ]},
          { label: "经纪机构办理", icon: "fa-handshake", children: [
            { key: "wszjjg-11", label: "经纪机构工作台", href: "../modules/wszjjg/agency/workbench.html" },
            { key: "wszjjg-12", label: "代办监管申请", href: "../modules/wszjjg/agency/escrow-apply.html" },
            { key: "wszjjg-13", label: "交易资金进度", href: "../modules/wszjjg/agency/progress.html" }
          ]},
          { label: "监管银行办理", icon: "fa-building-columns", children: [
            { key: "wszjjg-14", label: "划转指令与回执", href: "../modules/wszjjg/bank/order.html" },
            { key: "wszjjg-15", label: "子账号余额报送", href: "../modules/wszjjg/bank/balance.html" }
          ]},
          { label: "群众服务", icon: "fa-users", children: [
            { key: "wszjjg-31", label: "资金托管专区", href: "../modules/wszjjg/portal/index.html" },
            { key: "wszjjg-32", label: "我的交易资金", href: "../modules/wszjjg/portal/my.html" }
          ]},
          { label: "移动端", icon: "fa-mobile-screen-button", children: [
            { label: "资金托管首页", href: "../modules/wszjjg/mobile/home.html" },
            { label: "我的交易资金", href: "../modules/wszjjg/mobile/my.html" }
          ]}
        ]
      },
      {
        key: "wswxzj",
        name: "住宅专项维修资金管理系统",
        icon: "fa-screwdriver-wrench",
        line: "交易资金监管",
        menu: [
          { key: "wswxzj-01", label: "我的工作台", icon: "fa-table-columns", href: "../modules/wswxzj/gov/workbench.html" },
          { label: "归集管理", icon: "fa-folder-open", children: [
            { key: "wswxzj-02", label: "监管职责界定", href: "../modules/wswxzj/gov/duty.html" },
            { key: "wswxzj-03", label: "维修资金归集", href: "../modules/wswxzj/gov/collect.html" },
            { key: "wswxzj-04", label: "名录库管理", href: "../modules/wswxzj/gov/roster.html" }
          ]},
          { label: "使用管理", icon: "fa-screwdriver-wrench", children: [
            { key: "wswxzj-05", label: "维修资金使用", href: "../modules/wswxzj/gov/usage.html" },
            { key: "wswxzj-06", label: "房屋养老金", href: "../modules/wswxzj/gov/pension.html" }
          ]},
          { key: "wswxzj-07", label: "核算清算对账", icon: "fa-scale-balanced", href: "../modules/wswxzj/gov/settle.html" },
          { label: "监测公示", icon: "fa-chart-line", children: [
            { key: "wswxzj-08", label: "资金运行监测", href: "../modules/wswxzj/gov/monitor.html" },
            { key: "wswxzj-09", label: "查询服务公示", href: "../modules/wswxzj/gov/public.html" }
          ]},
          { label: "物业与业委会", icon: "fa-building-user", children: [
            { key: "wswxzj-11", label: "物业工作台", href: "../modules/wswxzj/pm/workbench.html" },
            { key: "wswxzj-12", label: "维修资金使用申请", href: "../modules/wswxzj/pm/usage-apply.html" },
            { key: "wswxzj-13", label: "发起业主表决", href: "../modules/wswxzj/pm/vote-launch.html" },
            { key: "wswxzj-14", label: "完工验收申报", href: "../modules/wswxzj/pm/accept-apply.html" }
          ]},
          { label: "代收行 / 专户行", icon: "fa-building-columns", children: [
            { key: "wswxzj-21", label: "代收流水报送", href: "../modules/wswxzj/bank/collect-push.html" },
            { key: "wswxzj-22", label: "拨付指令与回执", href: "../modules/wswxzj/bank/order.html" }
          ]},
          { label: "业主服务", icon: "fa-users", children: [
            { key: "wswxzj-31", label: "维修资金公示专区", href: "../modules/wswxzj/portal/index.html" },
            { key: "wswxzj-32", label: "我的分户账账单", href: "../modules/wswxzj/portal/bill.html" },
            { key: "wswxzj-33", label: "业主线上表决", href: "../modules/wswxzj/portal/vote.html" }
          ]},
          { label: "移动端", icon: "fa-mobile-screen-button", children: [
            { label: "维修资金首页", href: "../modules/wswxzj/mobile/home.html" },
            { label: "我的分户账账单", href: "../modules/wswxzj/mobile/bill.html" },
            { label: "业主线上表决", href: "../modules/wswxzj/mobile/vote.html" }
          ]}
        ]
      },
      {
        key: "wssvc",
        name: "政银直连服务",
        icon: "fa-plug-circle-check",
        line: "交易资金监管",
        menu: [
          { key: "wssvc-12", label: "直联运行监控", icon: "fa-heart-pulse", href: "../modules/wsfyh/gov/monitor.html" },
          { label: "银行准入", icon: "fa-file-signature", children: [
            { key: "wssvc-06", label: "银行准入管理", href: "../modules/wsfyh/gov/access.html" },
            { label: "银行接入配置", href: "../modules/wsfyh/gov/access-detail.html" },
            { label: "接口联调上线", href: "../modules/wsfyh/gov/access-test.html" }
          ]},
          { label: "接口服务", icon: "fa-plug", children: [
            { key: "wssvc-07", label: "监管银行接口", href: "../modules/wsfyh/gov/api-jg.html" },
            { key: "wssvc-08", label: "按揭公积金接口", href: "../modules/wsfyh/gov/api-aj.html" },
            { label: "接口详情与报文", href: "../modules/wsfyh/gov/api-detail.html" }
          ]},
          { label: "回传与对账", icon: "fa-reply-all", children: [
            { key: "wssvc-09", label: "资金结果回传", href: "../modules/wsfyh/gov/callback.html" },
            { key: "wssvc-10", label: "日终对账差异", href: "../modules/wsfyh/gov/recon.html" },
            { label: "差错登记处理", href: "../modules/wsfyh/gov/recon-diff.html" }
          ]},
          { label: "运行考核", icon: "fa-ranking-star", children: [
            { label: "银行推送考核统计", href: "../modules/wsfyh/gov/assess.html" }
          ]},
          { label: "银行服务工作台", icon: "fa-building-columns", children: [
            { key: "wssvc-11", label: "银行工作台", href: "../modules/wsfyh/bank/workbench.html" },
            { key: "wssvc-71", label: "监管账户管理", href: "../modules/wsfyh/bank/account.html" },
            { key: "wssvc-72", label: "资金流水查询", href: "../modules/wsfyh/bank/flow.html" },
            { key: "wssvc-73", label: "按揭放款查询", href: "../modules/wsfyh/bank/loan.html" },
            { key: "wssvc-74", label: "日终对账查询", href: "../modules/wsfyh/bank/recon.html" },
            { key: "wssvc-75", label: "账户预警查看", href: "../modules/wsfyh/bank/alert.html" }
          ]},
          { key: "wssvc-13", label: "其他机构端", icon: "fa-file-contract", href: "../modules/wsfyh/bank/mortgage.html" }
        ]
      }
    ]
  };

  /* ==========================================================================
     补丁 L：全功能统一入口 all
     导航页扁平化后，所有子系统统一从这里进入：把同一子系统在各端（监管端、单位
     机构端、门户端、移动端等）的菜单合并成一棵完整菜单树，roleMenu 置空即放行
     全部菜单，不分端、不分角色。wsmh（统一服务门户）、wsyd（移动端）保留各自
     独立应用，不并入本切换器。
     ========================================================================== */
  APP_CONFIGS.all = (function () {
    var SOURCES = ['government', 'company', 'portal', 'datacenter', 'ai', 'zjjg'];
    var SKIP_SYS = { wsmh: 1, wsyd: 1 };
    var order = [], byKey = {};

    function leafId(it) { return it.key || it.href || it.label; }

    function mergeMenu(target, menu) {
      (menu || []).forEach(function (it) {
        if (it.children) {
          var grp = target._groups[it.label];
          if (!grp) {
            grp = { label: it.label, icon: it.icon, children: [], _seen: {} };
            target._groups[it.label] = grp;
            target.menu.push(grp);
          }
          it.children.forEach(function (c) {
            var cid = leafId(c);
            if (grp._seen[cid]) return;
            grp._seen[cid] = 1;
            grp.children.push({ key: c.key, label: c.label, href: c.href, icon: c.icon });
          });
        } else {
          var id = leafId(it);
          if (target._singles[id]) return;
          target._singles[id] = 1;
          target.menu.push({ key: it.key, label: it.label, href: it.href, icon: it.icon });
        }
      });
    }

    SOURCES.forEach(function (e) {
      var cfg = APP_CONFIGS[e];
      if (!cfg) return;
      (cfg.systems || []).forEach(function (sys) {
        if (SKIP_SYS[sys.key]) return;
        var t = byKey[sys.key];
        if (!t) {
          t = { key: sys.key, name: sys.name, icon: sys.icon, line: sys.line, menu: [], _groups: {}, _singles: {} };
          byKey[sys.key] = t;
          order.push(t);
        }
        mergeMenu(t, sys.menu);
      });
    });

    var systems = order.map(function (t) {
      return { key: t.key, name: t.name, icon: t.icon, line: t.line, menu: t.menu };
    });

    /* 全功能视图（all/）目录下没有各端自带的 dashboard.html 等壳内相对首页，
       把这类无路径分隔符的 href 统一改指到该子系统第一个真实功能页，
       否则「我的工作台」默认首页会请求 all/dashboard.html 而 404 空白。 */
    systems.forEach(function (s) {
      var real = '';
      (function scan(items) {
        (items || []).forEach(function (it) {
          if (it.children) { scan(it.children); return; }
          if (!real && it.href && it.href.indexOf('/') >= 0) real = it.href;
        });
      })(s.menu);
      if (!real) return;
      (function fix(items) {
        (items || []).forEach(function (it) {
          if (it.children) { fix(it.children); return; }
          if (it.href && it.href.indexOf('/') < 0) it.href = real;
        });
      })(s.menu);
    });

    var g = APP_CONFIGS.government;
    return {
      sysName: g.sysName,
      endName: "全功能视图（不分端不分角色）",
      endIcon: "fa-layer-group",
      portalHref: "../index.html",
      defaultRole: "all",
      roles: { all: { tag: "全功能视图", user: "演示账号", role: "全功能视图 · 不分端不分角色" } },
      menu: [],
      defaultSystem: "wsbiz",
      roleMenu: { all: null },
      dict: g.dict,
      home: g.home,
      systems: systems
    };
  })();

  /* 角色主端反查：业务页面在 modules/ 下，路径里没有端目录名时靠它定端 */
  var ROLE_END = {
    all: "all",
    window: "government",
    reviewer: "government",
    manager: "government",
    leader: "government",
    admin: "government",
    ops: "government",
    developer: "company",
    agency: "company",
    bank: "company",
    citizen: "portal",
    tenant: "portal"
  };

  /* 端的判定：URL 的 e 参数优先，其次目录名，再次角色反查 */
  var END = (function () {
    var qs = null;
    try { qs = new URLSearchParams(location.search); } catch (e) {}
    var e0 = qs && qs.get('e');
    if (e0 && APP_CONFIGS[e0]) return e0;
    /* modules/<子系统>/gov|dev|bank|agency|pm 是角色目录，不是端目录名 */
    var DIR_END = { gov: 'government', dev: 'company', bank: 'company', agency: 'company', pm: 'company' };
    var segs = location.pathname.split('/');
    for (var i = segs.length - 2; i >= 0; i--) {
      if (APP_CONFIGS[segs[i]]) return segs[i];
      if (DIR_END[segs[i]]) return DIR_END[segs[i]];
    }
    /* 业务页面在 modules/<子系统代号>/ 下，目录名就能定端，比按角色反查准 */
    var dir = segs[segs.length - 2];
    if (dir) {
      for (var k in APP_CONFIGS) {
        var sys = APP_CONFIGS[k].systems || [];
        for (var j = 0; j < sys.length; j++) { if (sys[j].key === dir) return k; }
      }
    }
    var r = (qs && qs.get('role')) || null;
    try { r = r || sessionStorage.getItem('app-role'); } catch (e) {}
    if (r && ROLE_END[r]) return ROLE_END[r];
    return 'government';
  })();

  var APP_CONFIG = APP_CONFIGS[END];
  APP_CONFIG.end = END;
  window.APP_CONFIG = APP_CONFIG;
  window.APP_CONFIGS = APP_CONFIGS;

  /* ==========================================================================
     二、运行时 —— 以下无需修改
     ========================================================================== */
  var DICT = APP_CONFIG.dict || {};
  var ROLE_META = APP_CONFIG.roles || {};
  var MENU = APP_CONFIG.menu || [];
  var ROLE_MENU = APP_CONFIG.roleMenu || {};
  var HOME = APP_CONFIG.home || {};
  var SYS_NAME = APP_CONFIG.sysName || '';

  /* ------- 角色解析：URL ?role= 优先，其次会话记忆，最后页面声明 ------- */
  function resolveRole(declaredRole) {
    var param = null;
    try { param = new URLSearchParams(location.search).get('role'); } catch (e) {}
    var role = param || sessionStorage.getItem('app-role') || declaredRole || APP_CONFIG.defaultRole;
    if (!ROLE_META[role]) role = APP_CONFIG.defaultRole;
    try { sessionStorage.setItem('app-role', role); } catch (e) {}
    /* 补丁 G：角色决定可进入哪些业务子系统，先定角色再定当前子系统 */
    CUR_ROLE = role;
    CUR_SYS = resolveSystem(role);
    return role;
  }

  /* --- 补丁 A：href 已带查询串时用 & 追加角色参数（占位页链接形如 _pending.html?k=xxx） --- */
  function withRole(href, role) {
    if (!role || !href) return href || '';
    return href + (href.indexOf('?') >= 0 ? '&role=' : '?role=') + role;
  }

  /* --- 补丁 B：把绝对路径换算成相对外壳目录的路径，支撑业务页面分目录存放 --- */
  function relFrom(baseDir, path) {
    var a = baseDir.split('/').filter(Boolean), b = path.split('/').filter(Boolean), i = 0;
    while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
    return new Array(a.length - i + 1).join('../') + b.slice(i).join('/');
  }

  /* --- 补丁 C：按菜单 key 高亮，共用占位页下唯一可靠的高亮依据 --- */
  function highlightMenuByKey(sidebar, key) {
    sidebar.querySelectorAll('.menu-single.active, .menu-sub a.active').forEach(function (a) { a.classList.remove('active'); });
    sidebar.querySelectorAll('.menu-item.open').forEach(function (g) { g.classList.remove('open'); });
    var hit = sidebar.querySelector('[data-key="' + key + '"]');
    if (!hit) return false;
    hit.classList.add('active');
    var g = hit.closest('.menu-item');
    if (g) g.classList.add('open');
    return true;
  }

  /* --- 补丁 G：业务子系统。一个功能板块即一个子系统，顶栏切换子系统 → 侧栏换成该子系统的一级功能模块 --- */
  var SYSTEMS = APP_CONFIG.systems || [];
  var SYS_INDEX = {};
  SYSTEMS.forEach(function (s) { SYS_INDEX[s.key] = s; });
  var SYS_STORE = 'app-sys-' + END;
  var CUR_ROLE = APP_CONFIG.defaultRole;
  var CUR_SYS = '';

  /* 静态原型没有构建工具，资源前缀从 app.js 自身的 src 反推，各级目录通用 */
  var ASSET_BASE = (function () {
    var s = document.querySelector('script[src*="assets/js/app.js"]');
    var src = s ? s.getAttribute('src') : 'assets/js/app.js';
    return src.replace(/assets\/js\/app\.js.*$/, 'assets/');
  })();
  var ROOT_BASE = ASSET_BASE.replace(/assets\/$/, '');

  function sysModulesFor(sys, role) {
    var allow = ROLE_MENU[role];
    return ((sys && sys.menu) || []).filter(function (m) {
      /* 有 children 的分组没有 key，只要组内有可见叶子就保留 */
      if (m.children) {
        return m.children.some(function (c) { return !allow || !c.key || allow.indexOf(c.key) >= 0; });
      }
      return !allow || !m.key || allow.indexOf(m.key) >= 0;
    });
  }
  function systemsFor(role) {
    return SYSTEMS.filter(function (s) { return sysModulesFor(s, role).length > 0; });
  }
  function sysOfKey(key) {
    var code = String(key || '').replace(/-\d+$/, '');
    return SYS_INDEX[code] ? code : '';
  }
  function keyInUrl(u) { var m = /[?&]k=([^&#]*)/.exec(u || ''); return m ? decodeURIComponent(m[1]) : ''; }

  /* 当前子系统：URL 的 sys 参数 → 当前业务页所属板块 → 会话记忆 → 端默认值 → 第一个可进入的 */
  function resolveSystem(role) {
    var list = systemsFor(role);
    if (!list.length) return '';
    var has = function (c) { return c && list.some(function (s) { return s.key === c; }) ? c : ''; };
    var qs = null;
    try { qs = new URLSearchParams(location.search); } catch (e) {}
    var cur = has(qs && qs.get('sys'));
    if (!cur) cur = has(sysOfKey(keyInUrl(location.search)));
    if (!cur) cur = has(sysOfKey(keyInUrl(qs && qs.get('page'))));
    if (!cur && document.body) cur = has(sysOfKey(document.body.getAttribute('data-active')));
    if (!cur) { try { cur = has(sessionStorage.getItem(SYS_STORE)); } catch (e) {} }
    if (!cur) cur = has(APP_CONFIG.defaultSystem) || list[0].key;
    try { sessionStorage.setItem(SYS_STORE, cur); } catch (e) {}
    return cur;
  }

  /* 侧栏菜单 = 常驻首页 + 当前子系统的一级菜单。子系统名只出现在顶栏胶囊上，
     侧栏不再重复一行分区标题 */
  function menuOf(sysKey) {
    var base = (APP_CONFIG.menu || []).slice();
    var s = SYS_INDEX[sysKey];
    return s ? base.concat(s.menu) : base;
  }
  function firstModuleOf(sysKey) {
    var ms = sysModulesFor(SYS_INDEX[sysKey], CUR_ROLE);
    return ms.length ? ms[0] : null;
  }

  /* 切换子系统：改会话记忆、换顶栏胶囊文案、重渲染侧栏菜单 */
  function applySystem(code, sidebar) {
    var s = SYS_INDEX[code];
    if (!s) return;
    CUR_SYS = code;
    try { sessionStorage.setItem(SYS_STORE, code); } catch (e) {}
    var cur = document.querySelector('.app-topbar .sys-capsule .sys-cur');
    if (cur) cur.innerHTML = '<span>' + s.name + '</span>';
    if (!sidebar) return;
    var list = sidebar.querySelector('.menu-list');
    if (list) list.innerHTML = buildMenu('', '', CUR_ROLE);
    var box = sidebar.querySelector('.menu-search-input');
    if (box) box.value = '';
    sidebar.classList.remove('searching');
  }

  /* --- 补丁 H：顶栏当前子系统胶囊。底图 txs.png 右侧 112px 已经画好「切换系统」，
         所以标签不带图标、按钮是个盖在图上的空按钮，与参考工程一致 --- */
  function sysCapsuleHTML() {
    var s = SYS_INDEX[CUR_SYS];
    return '<div class="sys-capsule">' +
        '<div class="sys-cur" title="当前业务子系统"><span>' +
          (s ? s.name : (APP_CONFIG.endName || '')) + '</span></div>' +
        '<button type="button" class="sys-switch-btn" aria-label="切换系统" title="切换系统"></button>' +
      '</div>';
  }

  /* --- 补丁 I：切换系统弹层。四列卡片网格，卡片宽度按最长子系统名实测，同参考工程 --- */
  var SYS_GRID_COLS = 4, SYS_GRID_GAP = 14, SYS_CARD_EXTRA = 70, SYS_PANEL_PADDING_X = 64;

  function measureSysCardWidth(list) {
    if (!list.length) return 0;
    var ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return 0;
    ctx.font = '600 14px "Microsoft YaHei", "PingFang SC", sans-serif';
    var max = 0;
    list.forEach(function (s) { max = Math.max(max, ctx.measureText(s.name).width); });
    return Math.ceil(max) + 8 + SYS_CARD_EXTRA;
  }

  /* 量出来的四列宽度放得下就用定宽列，放不下退回等分列，靠 CSS 的省略号收尾 */
  function sizeSysPanel(mask) {
    var panel = mask.querySelector('.sys-panel');
    var grid = mask.querySelector('.sys-grid');
    if (!panel || !grid) return;
    var w = measureSysCardWidth(systemsFor(CUR_ROLE));
    if (!w) return;
    var want = w * SYS_GRID_COLS + SYS_GRID_GAP * (SYS_GRID_COLS - 1) + SYS_PANEL_PADDING_X;
    var avail = window.innerWidth - 48;
    if (want <= avail) {
      grid.style.gridTemplateColumns = 'repeat(' + SYS_GRID_COLS + ', ' + w + 'px)';
      panel.style.width = want + 'px';
    } else {
      grid.style.gridTemplateColumns = '';
      panel.style.width = avail + 'px';
    }
  }

  function sysPanelHTML() {
    var cards = systemsFor(CUR_ROLE).map(function (s) {
      return '<button type="button" class="sys-card' + (s.key === CUR_SYS ? ' current' : '') +
        '" data-sys="' + s.key + '" title="' + s.name + '">' +
        '<span class="sys-card-row"><span class="sc-name">' + s.name + '</span>' +
        '<span class="sc-go" aria-hidden="true"></span></span>' +
        '<span class="sc-jb" aria-hidden="true"></span>' +
      '</button>';
    }).join('');
    var body = cards ? '<div class="sys-grid">' + cards + '</div>'
      : '<div class="sys-empty">当前登录身份在本端没有可进入的业务子系统</div>';
    var foot = Object.keys(APP_CONFIGS).map(function (e) {
      /* 补丁 L：全功能入口不再暴露“切换应用端”，其余端页脚也跳过 all 键 */
      if (e === 'all') return '';
      var c = APP_CONFIGS[e];
      var r = c.roles[CUR_ROLE] ? CUR_ROLE : c.defaultRole;
      var href = ROOT_BASE + e + '/' + (e === 'mobile' ? 'home.html' : 'shell.html') + '?role=' + r;
      return '<a href="' + href + '"' + (e === END ? ' class="cur"' : '') + '>' +
        '<i class="fa-solid ' + c.endIcon + '"></i>' + c.endName + '</a>';
    }).join('');
    var footHTML = END === 'all' ? ''
      : '<div class="sys-panel-foot"><span class="lb">切换应用端</span>' + foot + '</div>';
    return '<div class="sys-panel">' +
        '<div class="sys-panel-head">' +
          '<div class="sys-panel-title"><h3>切换系统</h3>' +
            '<span class="sys-panel-tag">SWITCH THE SYSTEM</span></div>' +
          '<button type="button" class="sys-panel-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="sys-panel-body">' + body + '</div>' +
        footHTML +
      '</div>';
  }

  function initSysSwitch(topbar, onPick) {
    var btn = topbar.querySelector('.sys-switch-btn');
    if (!btn) return;
    var mask = null;
    function close() { if (mask) mask.classList.remove('open'); btn.classList.remove('open'); }
    function open() {
      if (!mask) {
        mask = document.createElement('div');
        mask.className = 'sys-mask';
        document.body.appendChild(mask);
        mask.addEventListener('click', function (e) {
          if (e.target === mask || e.target.closest('.sys-panel-close')) { close(); return; }
          var card = e.target.closest('.sys-card');
          if (card) { close(); onPick(card.getAttribute('data-sys')); }
        });
        window.addEventListener('resize', function () {
          if (mask.classList.contains('open')) sizeSysPanel(mask);
        });
      }
      mask.innerHTML = sysPanelHTML();
      mask.classList.add('open');
      btn.classList.add('open');
      sizeSysPanel(mask);
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (mask && mask.classList.contains('open')) close(); else open();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ------- 侧边栏菜单 HTML（按角色过滤、按当前页高亮、链接带 role） ------- */
  function buildMenu(active, file, role) {
    var allow = ROLE_MENU[role];
    var ok = function (key) { return !allow || !key || allow.indexOf(key) >= 0; };
    var isOn = function (it) { return (it.key && it.key === active) || it.href === file; };
    var html = '';
    menuOf(CUR_SYS).forEach(function (it) {
      if (it.children) {
        var kids = it.children.filter(function (c) { return ok(c.key); });
        if (!kids.length) return;
        var isOpen = kids.some(isOn);
        html += '<div class="menu-item' + (isOpen ? ' open' : '') + '">';
        html += '  <div class="menu-link"><i class="m-icon fa-solid ' + it.icon + '"></i><span>' + it.label + '</span><i class="m-arrow fa-solid fa-chevron-right"></i></div>';
        html += '  <div class="menu-sub">';
        kids.forEach(function (c) {
          html += '<a href="' + withRole(c.href, role) + '" data-key="' + (c.key || '') + '" class="' + (isOn(c) ? 'active' : '') + '">' + c.label + '</a>';
        });
        html += '  </div></div>';
      } else {
        if (!ok(it.key)) return;
        html += '<a href="' + withRole(it.href, role) + '" data-key="' + (it.key || '') + '" class="menu-single' + (isOn(it) ? ' active' : '') + '"><i class="m-icon fa-solid ' + it.icon + '"></i><span>' + it.label + '</span></a>';
      }
    });
    return html;
  }

  function topbarHTML(meta) {
    /* 补丁 H：品牌区换成上传的市局 logo + 平台名，右接当前子系统胶囊 */
    return '<div class="brand">' +
        '<i class="sidebar-toggle fa-solid fa-bars"></i>' +
        '<div class="logo"><img src="' + ASSET_BASE + 'img/logo.png" alt="XXXX市住房和城乡建设局"></div>' +
        '<div class="name">' + SYS_NAME + '</div>' +
      '</div>' + sysCapsuleHTML() +
      '<div class="topbar-right">' +
        '<div class="topbar-icon" title="消息"><i class="fa-solid fa-bell"></i><span class="dot">5</span></div>' +
        '<div class="topbar-icon" title="帮助"><i class="fa-solid fa-circle-question"></i></div>' +
        '<div class="user"><div class="avatar">' + meta.user.charAt(0) + '</div>' +
          '<div class="u-meta"><div class="u-name">' + meta.user + '</div><div class="u-role">' + meta.role + '</div></div>' +
          '<i class="fa-solid fa-angle-down" style="font-size:12px;opacity:.8"></i></div>' +
        '<a href="' + (APP_CONFIG.portalHref || '../index.html') + '" class="topbar-icon" title="返回门户/退出"><i class="fa-solid fa-right-from-bracket"></i></a>' +
      '</div>';
  }

  function sidebarHTML(active, file, role) {
    return '<div class="menu-search">' +
        '<input type="text" class="menu-search-input" placeholder="菜单搜索" autocomplete="off">' +
        '<i class="fa-solid fa-magnifying-glass s-ico"></i>' +
        '<i class="fa-solid fa-xmark s-clear" title="清空"></i>' +
      '</div>' +
      '<div class="menu-list">' + buildMenu(active, file, role) + '</div>';
  }

  /* ------- 首页渲染（由 APP_CONFIG.home 驱动） ------- */
  function greet() { var h = new Date().getHours(); return h < 12 ? '上午好' : h < 18 ? '下午好' : '晚上好'; }
  function todayStr() {
    var d = new Date(), wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 星期' + wk;
  }
  function statCards(list) {
    return '<div class="stat-grid">' + (list || []).map(function (k) {
      return '<div class="stat-card"><div class="s-icon ' + k.c + '"><i class="fa-solid ' + k.i + '"></i></div><div>' +
        '<div class="s-label">' + k.l + '</div><div class="s-value">' + k.v + '</div>' +
        (k.t ? '<div class="s-trend ' + (k.td || 'text-success') + '">' + k.t + '</div>' : '') + '</div></div>';
    }).join('') + '</div>';
  }
  function quickGrid(items, q) {
    return '<div class="quick-grid">' + (items || []).map(function (it) {
      return '<a class="quick-item" href="' + it.h + q + '"><span class="q-ico ' + it.c + '"><i class="fa-solid ' + it.i + '"></i></span><span class="q-label">' + it.l + '</span></a>';
    }).join('') + '</div>';
  }
  function todoRows(items, q) {
    return '<div class="home-todo">' + (items || []).map(function (t) {
      return '<a class="todo-row" href="my-todo.html' + q + '"><span class="badge ' + t.c + '">' + t.tag + '</span>' +
        '<span class="todo-text">' + t.txt + '</span><span class="todo-time ' + (t.warn ? 'is-warn' : '') + '">' + t.time + '</span></a>';
    }).join('') + '</div>';
  }
  function panel(title, moreHref, inner) {
    return '<div class="card home-panel"><div class="card-head"><h3>' + title + '</h3>' +
      (moreHref ? '<a class="home-more" href="' + moreHref + '">查看全部 <i class="fa-solid fa-angle-right"></i></a>' : '') +
      '</div><div class="card-body">' + inner + '</div></div>';
  }
  function renderHome(role, meta) {
    var root = document.getElementById('home-root');
    if (!root) return;
    var q = '?role=' + role;
    var cfg = HOME[role] || HOME[APP_CONFIG.defaultRole];
    if (!cfg) return;
    var html = '<div class="home-hero">' +
      '<div class="hero-l">' +
        '<div class="hero-greet">' + greet() + '，' + meta.user + '</div>' +
        '<div class="hero-sub">' + meta.tag + ' · ' + meta.role + '　|　' + (cfg.welcome || '') + '</div>' +
        '<div class="hero-date"><i class="fa-regular fa-calendar"></i> ' + todayStr() + '</div>' +
      '</div>' +
      '<div class="hero-r">' + (cfg.heroStats || []).map(function (s) {
        return '<div class="hs"><div class="hs-v">' + s.v + '</div><div class="hs-l">' + s.l + '</div></div>';
      }).join('<div class="hs-div"></div>') + '</div>' +
    '</div>';
    /* 补丁 J：KPI 由首页 body 自渲染（数据中心总览）时不输出空的统计卡容器 */
    if (cfg.kpis && cfg.kpis.length) html += statCards(cfg.kpis);
    if (cfg.body) {
      html += cfg.body(q);
    } else {
      html += '<div class="grid-2">' +
        panel('我的待办', 'my-todo.html' + q, todoRows(cfg.todos, q)) +
        panel('快捷入口', '', quickGrid(cfg.shortcuts, q)) +
      '</div>';
    }
    root.innerHTML = html;
  }

  /* ------- 详情分组增强：.section-title + .desc-list → .grp-card ------- */
  function enhanceDetailGroups() {
    Array.prototype.forEach.call(document.querySelectorAll('.section-title'), function (title) {
      if (title.classList.contains('grp-head')) return;
      if (title.closest('.grp-card, .card')) return;
      var next = title.nextElementSibling;
      if (!next || !next.classList.contains('desc-list')) return;
      var bodyEls = [], n = next;
      while (n && n.classList.contains('desc-list')) { var cur = n; n = n.nextElementSibling; bodyEls.push(cur); }
      var icon = title.getAttribute('data-icon') || 'fa-layer-group';
      var card = document.createElement('div');
      card.className = 'grp-card';
      var head = document.createElement('div');
      head.className = 'grp-head';
      head.innerHTML = '<span class="gi"><i class="fa-solid ' + icon + '"></i></span>' + title.innerHTML;
      title.parentNode.insertBefore(card, title);
      card.appendChild(head);
      bodyEls.forEach(function (el) { el.classList.remove('mb-16', 'mt-16', 'mt-8'); card.appendChild(el); });
      title.parentNode.removeChild(title);
    });
  }

  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  /* ------- 布局注入：嵌入外壳时只初始化内容，独立打开则补齐顶栏与侧栏 ------- */
  function injectLayout() {
    var body = document.body;
    var declaredRole = body.getAttribute('data-role');
    if (!declaredRole) return;
    var role = resolveRole(declaredRole);
    var active = body.getAttribute('data-active') || '';
    var file = ((location.pathname.split('/').pop() || '').split('?')[0]) || '';
    var meta = ROLE_META[role];

    if (isEmbedded()) {
      body.classList.add('embedded');
    } else {
      var topbar = document.createElement('header');
      topbar.className = 'app-topbar';
      topbar.innerHTML = topbarHTML(meta);
      var sidebar = document.createElement('aside');
      sidebar.className = 'app-sidebar';
      sidebar.innerHTML = sidebarHTML(active, file, role);
      body.insertBefore(sidebar, body.firstChild);
      body.insertBefore(topbar, body.firstChild);
      sidebar.addEventListener('click', function (e) {
        var link = e.target.closest('.menu-link');
        if (link) { link.parentElement.classList.toggle('open'); }
      });
      topbar.querySelector('.sidebar-toggle').addEventListener('click', function () {
        sidebar.classList.toggle('open');
      });
      initMenuSearch(sidebar);
      ensureSingleActive(sidebar, file);
      /* 补丁 I：独立打开的页面，切换子系统直接跳到该子系统的第一个功能模块 */
      initSysSwitch(topbar, function (code) {
        var m = firstModuleOf(code);
        if (m) { location.href = withRole(m.href, role); return; }
        applySystem(code, sidebar);
      });
    }
    renderHome(role, meta);
    applyRolePerms(role);
    mergeActionsIntoFilter();
    enhanceDetailGroups();
  }

  /* ------- 外壳：常驻顶栏 + 侧栏，右侧 iframe 承载内容 ------- */
  function initShell() {
    var body = document.body;
    var role = resolveRole(body.getAttribute('data-role'));
    body.setAttribute('data-role', role);
    var meta = ROLE_META[role];

    var topbar = document.createElement('header');
    topbar.className = 'app-topbar';
    topbar.innerHTML = topbarHTML(meta);
    var sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML = sidebarHTML('', '', role);
    body.insertBefore(sidebar, body.firstChild);
    body.insertBefore(topbar, body.firstChild);

    var frame = document.getElementById('content-frame');
    function loadPage(href) {
      if (!href) return;
      frame.setAttribute('src', href);
      if (window.innerWidth <= 1100) sidebar.classList.remove('open');
    }

    sidebar.addEventListener('click', function (e) {
      var groupHead = e.target.closest('.menu-link');
      if (groupHead) { groupHead.parentElement.classList.toggle('open'); return; }
      var a = e.target.closest('a.menu-single, .menu-sub a');
      if (a) {
        e.preventDefault();
        setActiveAnchor(sidebar, a);
        loadPage(a.getAttribute('href'));
      }
    });
    topbar.querySelector('.sidebar-toggle').addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
    initMenuSearch(sidebar);
    /* 补丁 I：外壳内切换子系统只换侧栏与右侧内容，不整页刷新 */
    initSysSwitch(topbar, function (code) {
      var m = firstModuleOf(code);
      applySystem(code, sidebar);
      loadPage(withRole(m ? m.href : 'dashboard.html', role));
    });

    frame.addEventListener('load', function () {
      /* 补丁 D：业务页面分目录存放且全部菜单共用一个占位页，
         先按 iframe 内 body[data-active] 的菜单 key 高亮，再回退到相对路径比对。 */
      var key = '', rel = '';
      try {
        var doc = frame.contentDocument;
        if (doc && doc.body) key = doc.body.getAttribute('data-active') || '';
        var loc = frame.contentWindow.location;
        rel = relFrom(location.pathname.replace(/[^/]*$/, ''), loc.pathname) + (loc.search || '');
      } catch (e) {}
      /* 补丁 I：首页快捷入口会跳到别的业务子系统，侧栏与顶栏胶囊自动跟随 */
      var owner = sysOfKey(key);
      if (owner && owner !== CUR_SYS && sysModulesFor(SYS_INDEX[owner], role).length) applySystem(owner, sidebar);
      if (!key || !highlightMenuByKey(sidebar, key)) {
        if (rel) highlightMenu(sidebar, rel.split('?')[0]);
      }
      if (rel) {
        var page = rel.replace(/([?&])role=[^&]*/, '$1').replace(/[?&]+$/, '').replace(/\?&/, '?');
        var url = 'shell.html?role=' + role + (CUR_SYS ? '&sys=' + CUR_SYS : '') + '&page=' + encodeURIComponent(page);
        try { history.replaceState(null, '', url); } catch (e) {}
      }
    });

    var page = null;
    try { page = new URLSearchParams(location.search).get('page'); } catch (e) {}
    if (!page) {
      /* 带 sys= 进入某子系统时，默认打开该子系统工作台；否则走端首页 */
      var m0 = firstModuleOf(CUR_SYS);
      page = (m0 && m0.href) ? m0.href : 'dashboard.html';
    }
    loadPage(page + (page.indexOf('?') >= 0 ? '&' : '?') + 'role=' + role);

    mountAssistant();
  }

  /* ------- 悬浮智能问答助手：外壳级 FAB，点击展开对话面板（内嵌智能问答挂件） ------- */
  function mountAssistant() {
    if (document.querySelector('.ai-fab')) return;

    var dock = document.createElement('div');
    dock.className = 'ai-dock';
    dock.innerHTML =
      '<div class="ai-dock-head">' +
        '<span class="ttl"><i class="fa-solid fa-robot"></i> 智能问答助手<small>房产交易 AI</small></span>' +
        '<button type="button" class="ai-dock-close" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +
      '<iframe class="ai-dock-frame" title="智能问答助手"></iframe>';

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'ai-fab';
    fab.setAttribute('aria-label', '智能问答助手');
    fab.setAttribute('title', '智能问答助手');
    fab.innerHTML = '<i class="fa-solid fa-headset"></i>';

    document.body.appendChild(dock);
    document.body.appendChild(fab);

    var frame = dock.querySelector('.ai-dock-frame');
    var loaded = false;
    function open() {
      if (!loaded) { frame.setAttribute('src', ROOT_BASE + 'modules/wsai/public/chat-widget.html?role=jb'); loaded = true; }
      dock.classList.add('open'); fab.classList.add('hidden');
    }
    function close() { dock.classList.remove('open'); fab.classList.remove('hidden'); }
    fab.addEventListener('click', open);
    dock.querySelector('.ai-dock-close').addEventListener('click', close);
  }

  function setActiveAnchor(sidebar, a) {
    sidebar.querySelectorAll('.menu-single.active, .menu-sub a.active').forEach(function (x) { x.classList.remove('active'); });
    a.classList.add('active');
    var g = a.closest('.menu-item');
    if (g) {
      sidebar.querySelectorAll('.menu-item.open').forEach(function (x) { if (x !== g) x.classList.remove('open'); });
      g.classList.add('open');
    } else {
      sidebar.querySelectorAll('.menu-item.open').forEach(function (x) { x.classList.remove('open'); });
    }
  }

  function highlightMenu(sidebar, file) {
    sidebar.querySelectorAll('.menu-single.active, .menu-sub a.active').forEach(function (a) { a.classList.remove('active'); });
    sidebar.querySelectorAll('.menu-item.open').forEach(function (g) { g.classList.remove('open'); });
    sidebar.querySelectorAll('.menu-single').forEach(function (a) {
      if ((a.getAttribute('href') || '').split('?')[0] === file) a.classList.add('active');
    });
    sidebar.querySelectorAll('.menu-sub a').forEach(function (a) {
      if ((a.getAttribute('href') || '').split('?')[0] === file) {
        a.classList.add('active');
        var g = a.closest('.menu-item'); if (g) g.classList.add('open');
      }
    });
  }

  function ensureSingleActive(sidebar, file) {
    sidebar.querySelectorAll('.menu-single').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('?')[0];
      if (href !== file) a.classList.remove('active');
    });
  }

  /* ------- 页头操作按钮并入查询工具条（整体右对齐） ------- */
  function mergeActionsIntoFilter() {
    var main = document.querySelector('main.app-main');
    if (!main) return;
    var actions = main.querySelector('.page-head .page-actions');
    var fb = main.querySelector('.filter-bar');
    if (!fb) return;
    var group = fb.querySelector('.filter-actions');
    if (!group) { group = document.createElement('div'); group.className = 'filter-actions'; }
    [].slice.call(fb.children).forEach(function (ch) {
      if (ch === group) return;
      if (ch.classList && (ch.classList.contains('btn') || ch.tagName === 'BUTTON')) group.appendChild(ch);
    });
    if (actions) {
      while (actions.firstChild) { group.appendChild(actions.firstChild); }
      if (actions.parentNode) actions.parentNode.removeChild(actions);
    }
    var sp = fb.querySelector('.spacer');
    if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
    if (group.childNodes.length) fb.appendChild(group);
  }

  /* ------- 按角色显隐：data-roles / data-roles-not ------- */
  function applyRolePerms(role) {
    document.querySelectorAll('[data-roles]').forEach(function (el) {
      var roles = (el.getAttribute('data-roles') || '').split(/[,\s]+/).filter(Boolean);
      if (roles.length && roles.indexOf(role) < 0) el.style.display = 'none';
    });
    document.querySelectorAll('[data-roles-not]').forEach(function (el) {
      var roles = (el.getAttribute('data-roles-not') || '').split(/[,\s]+/).filter(Boolean);
      if (roles.indexOf(role) >= 0) el.style.display = 'none';
    });
    if (window.PMS) window.PMS.role = role;
    document.body.setAttribute('data-current-role', role);
  }

  /* ------- 菜单搜索：实时过滤并展开命中分组 ------- */
  function initMenuSearch(sidebar) {
    var box = sidebar.querySelector('.menu-search');
    if (!box) return;
    var input = box.querySelector('.menu-search-input');
    var clear = box.querySelector('.s-clear');
    var list = sidebar.querySelector('.menu-list');
    function textOf(el) { return (el.textContent || '').toLowerCase(); }
    function restore() {
      list.querySelectorAll('.menu-single, .menu-item, .menu-sub a').forEach(function (el) { el.style.display = ''; });
      list.querySelectorAll('.menu-item').forEach(function (g) {
        if (g.querySelector('.menu-sub a.active')) g.classList.add('open'); else g.classList.remove('open');
      });
    }
    function filter(q) {
      q = q.trim().toLowerCase();
      box.classList.toggle('has-value', q.length > 0);
      if (!q) { restore(); return; }
      list.querySelectorAll('.menu-single').forEach(function (el) {
        el.style.display = textOf(el).indexOf(q) >= 0 ? '' : 'none';
      });
      list.querySelectorAll('.menu-item').forEach(function (g) {
        var head = g.querySelector('.menu-link');
        var groupHit = head && textOf(head).indexOf(q) >= 0;
        var subHit = false;
        g.querySelectorAll('.menu-sub a').forEach(function (sub) {
          var hit = groupHit || textOf(sub).indexOf(q) >= 0;
          sub.style.display = hit ? '' : 'none';
          if (hit) subHit = true;
        });
        if (groupHit || subHit) { g.style.display = ''; g.classList.add('open'); }
        else { g.style.display = 'none'; }
      });
    }
    input.addEventListener('input', function () { filter(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; filter(''); input.blur(); } });
    clear.addEventListener('click', function () { input.value = ''; filter(''); input.focus(); });
  }

  /* ==========================================================================
     文件上传：表单中的 URL / 附件字段自动升级为方形宫格上传组件
     ========================================================================== */
  function fileNameFromUrl(url) {
    if (!url || url === '—' || url === '-') return '';
    try {
      var path = String(url).split('?')[0];
      var name = path.substring(path.lastIndexOf('/') + 1);
      return decodeURIComponent(name || path);
    } catch (e) { return String(url); }
  }
  function parseFileList(val) {
    if (val == null) return [];
    var s = String(val).trim();
    if (!s || s === '—' || s === '-') return [];
    if (s.charAt(0) === '[') {
      try {
        var arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map(function (x) { return String(x || '').trim(); }).filter(Boolean);
      } catch (e) {}
    }
    return s.split(/[,;\n]+/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function joinFileList(list) { return (list || []).filter(Boolean).join(','); }
  function isImageName(name) { return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || ''); }
  function fileExt(name) { var m = String(name || '').match(/\.([a-z0-9]+)$/i); return m ? m[1] : 'file'; }
  function isUrlFillName(name) {
    var n = (name || '').toLowerCase();
    return /url$/.test(n) || n.indexOf('url') >= 0 || /file$/.test(n);
  }
  function isUrlField(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    if (el.type === 'hidden' && el.closest('.file-up')) return false;
    if (el.getAttribute('data-upload') === '1') return true;
    var fill = (el.getAttribute('data-fill') || '').toLowerCase();
    if (fill.indexOf('url') >= 0) return true;
    var item = el.closest('.form-item');
    var lab = item ? (item.querySelector('label') || {}) : {};
    var lt = (lab.textContent || '').replace(/\s+/g, '');
    return /URL|链接|附件|材料|凭证/.test(lt) && !/网址入口|接口/.test(lt);
  }
  function acceptForLabel(labelText, fill) {
    var t = (labelText || '') + ' ' + (fill || '');
    if (/照片|图片|平面图|image|photo|plan/i.test(t)) return 'image/*,.jpg,.jpeg,.png,.gif,.webp';
    if (/pdf|文件|合同|备案|材料|凭证/i.test(t)) return '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
    return '*/*';
  }
  function fileViewHtml(value) {
    var list = parseFileList(value);
    if (!list.length) return '<span class="text-3">—</span>';
    return '<span class="file-view">' + list.map(function (v) {
      var nm = fileNameFromUrl(v) || v;
      var icon = isImageName(nm) ? 'fa-regular fa-image' : 'fa-regular fa-file-lines';
      return /^https?:\/\//i.test(v)
        ? ('<a class="file-chip" href="' + v + '" target="_blank" onclick="event.stopPropagation()"><i class="' + icon + '"></i><span class="fv-name">' + nm + '</span></a>')
        : ('<span class="file-chip"><i class="' + icon + '"></i><span class="fv-name">' + nm + '</span></span>');
    }).join('') + '</span>';
  }
  function getFileUpList(wrap) {
    var hid = wrap.querySelector('input[type="hidden"][data-fill], input[type="hidden"].file-up-val');
    return parseFileList(hid ? hid.value : '');
  }
  function setFileUpList(wrap, list) {
    var hid = wrap.querySelector('input[type="hidden"][data-fill], input[type="hidden"].file-up-val');
    if (hid) hid.value = joinFileList(list);
    syncFileUpUI(wrap);
  }
  function tileHtml(v, i, previews) {
    var nm = fileNameFromUrl(v) || v;
    var isImg = isImageName(nm) || /^data:image|^blob:/i.test(v);
    var thumb = (previews && previews[nm]) || (isImg && /^(https?:|data:|blob:)/i.test(v) ? v : '');
    var view = /^https?:\/\//i.test(v) ? ('<a class="view" href="' + v + '" target="_blank" onclick="event.stopPropagation()"></a>') : '';
    if (thumb) {
      return '<div class="file-up-tile thumb" title="' + nm + '"><img src="' + thumb + '" alt="' + nm + '">' + view +
        '<span class="rm" data-file-rm="' + i + '"><i class="fa-solid fa-xmark"></i></span></div>';
    }
    if (isImg) {
      return '<div class="file-up-tile doc" title="' + nm + '"><i class="fa-regular fa-image"></i>' + view +
        '<span class="fname">' + nm + '</span><span class="rm" data-file-rm="' + i + '"><i class="fa-solid fa-xmark"></i></span></div>';
    }
    return '<div class="file-up-tile doc" title="' + nm + '"><i class="fa-regular fa-file-lines"></i><span class="ext">' + fileExt(nm) + '</span>' + view +
      '<span class="fname">' + nm + '</span><span class="rm" data-file-rm="' + i + '"><i class="fa-solid fa-xmark"></i></span></div>';
  }
  function syncFileUpUI(wrap) {
    if (!wrap) return;
    var list = getFileUpList(wrap);
    var grid = wrap.querySelector('.file-up-grid');
    var addTile = wrap.querySelector('.file-up-add');
    var previews = wrap._previews || {};
    wrap.classList.toggle('has-file', list.length > 0);
    if (!grid) return;
    Array.prototype.slice.call(grid.querySelectorAll('.file-up-tile:not(.file-up-add)')).forEach(function (t) { t.remove(); });
    var frag = '';
    list.forEach(function (v, i) { frag += tileHtml(v, i, previews); });
    if (addTile) addTile.insertAdjacentHTML('beforebegin', frag);
    else grid.innerHTML = frag;
  }
  function addFilesToUp(wrap, fileList) {
    if (!fileList || !fileList.length) return;
    var cur = getFileUpList(wrap);
    var names = {};
    cur.forEach(function (x) { names[fileNameFromUrl(x) || x] = 1; });
    wrap._previews = wrap._previews || {};
    var added = 0;
    Array.prototype.forEach.call(fileList, function (f) {
      if (!f || !f.name || names[f.name]) return;
      if (isImageName(f.name)) {
        try { wrap._previews[f.name] = URL.createObjectURL(f); } catch (e) {}
      }
      cur.push(f.name);
      names[f.name] = 1;
      added++;
    });
    setFileUpList(wrap, cur);
    if (added) PMS.toast('已添加 ' + added + ' 个文件', 'success');
  }
  function bindFileUp(wrap) {
    if (!wrap || wrap.getAttribute('data-bound') === '1') { if (wrap) syncFileUpUI(wrap); return; }
    wrap.setAttribute('data-bound', '1');
    var file = wrap.querySelector('input[type="file"]');
    var grid = wrap.querySelector('.file-up-grid');
    if (file) {
      if (!file.hasAttribute('multiple')) file.setAttribute('multiple', 'multiple');
      file.addEventListener('change', function () { addFilesToUp(wrap, file.files); file.value = ''; });
    }
    wrap.addEventListener('dragover', function (e) { e.preventDefault(); wrap.classList.add('is-drag'); });
    wrap.addEventListener('dragleave', function () { wrap.classList.remove('is-drag'); });
    wrap.addEventListener('drop', function (e) {
      e.preventDefault(); wrap.classList.remove('is-drag');
      if (e.dataTransfer && e.dataTransfer.files) addFilesToUp(wrap, e.dataTransfer.files);
    });
    if (grid) {
      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-file-rm]');
        if (!btn) return;
        e.preventDefault(); e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-file-rm'), 10);
        var cur = getFileUpList(wrap);
        if (!isNaN(idx) && idx >= 0 && idx < cur.length) { cur.splice(idx, 1); setFileUpList(wrap, cur); }
      });
    }
    syncFileUpUI(wrap);
  }
  function buildFileUpHtml(opts) {
    opts = opts || {};
    var fill = opts.fill || '';
    var val = opts.value == null ? '' : String(opts.value);
    if (val === '—') val = '';
    var accept = opts.accept || '*/*';
    var fillAttr = fill ? (' data-fill="' + fill + '"') : '';
    var list = parseFileList(val);
    return '<div class="file-up' + (list.length ? ' has-file' : '') + '">' +
      '<input type="hidden" class="file-up-val"' + fillAttr + ' value="' + val.replace(/"/g, '&quot;') + '">' +
      '<div class="file-up-grid">' +
        '<div class="file-up-tile file-up-add" title="添加文件（可多选）">' +
          '<input type="file" multiple accept="' + accept + '">' +
          '<i class="fa-solid fa-plus"></i><span>上传</span>' +
        '</div>' +
      '</div></div>';
  }
  function enhanceUrlUploads(root) {
    var scope = root || document;
    scope.querySelectorAll('.file-up').forEach(function (wrap) {
      var file = wrap.querySelector('input[type="file"]');
      if (file && !file.hasAttribute('multiple')) file.setAttribute('multiple', 'multiple');
      bindFileUp(wrap);
    });
    scope.querySelectorAll('.drawer .form-item input[type="text"], .modal .form-item input[type="text"], form .form-item input[type="text"]').forEach(function (inp) {
      if (!isUrlField(inp) || inp.closest('.file-up')) return;
      var item = inp.closest('.form-item');
      if (!item) return;
      var lab = item.querySelector('label');
      var labelText = lab ? lab.textContent : '';
      if (lab) {
        lab.innerHTML = lab.innerHTML.replace(/\s*URL\s*/gi, '').replace(/文件链接|链接/g, '').replace(/\s+$/, '');
        if (!(lab.textContent || '').trim()) lab.textContent = '附件';
      }
      var fill = inp.getAttribute('data-fill') || '';
      inp.insertAdjacentHTML('beforebegin', buildFileUpHtml({ fill: fill, value: inp.value, accept: acceptForLabel(labelText, fill) }));
      inp.remove();
      bindFileUp(item.querySelector('.file-up'));
    });
  }

  /* ==========================================================================
     交互组件 PMS
     ========================================================================== */
  function formatMonth(v) {
    if (v == null || v === '' || v === '—') return '';
    var s = String(v).trim();
    if (/^\d{4}-\d{2}$/.test(s)) return s;
    if (/^\d{6}$/.test(s)) return s.slice(0, 4) + '-' + s.slice(4, 6);
    return s;
  }

  var PMS = {
    fileUpHtml: buildFileUpHtml,
    fileViewHtml: fileViewHtml,
    enhanceUrlUploads: enhanceUrlUploads,
    formatMonth: formatMonth,
    statMonth: function () {
      var d = new Date(), m = d.getMonth() + 1;
      return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m;
    },
    openDrawer: function (id) {
      var d = document.getElementById(id); if (!d) return;
      var mask = d.previousElementSibling && d.previousElementSibling.classList.contains('drawer-mask') ? d.previousElementSibling : null;
      d.classList.add('open'); if (mask) mask.classList.add('open');
      enhanceUrlUploads(d);
      d.querySelectorAll('.file-up').forEach(syncFileUpUI);
    },
    closeDrawer: function (id) {
      var d = id ? document.getElementById(id) : document.querySelector('.drawer.open');
      if (!d) return;
      d.classList.remove('open');
      var mask = d.previousElementSibling && d.previousElementSibling.classList.contains('drawer-mask') ? d.previousElementSibling : null;
      if (mask) mask.classList.remove('open');
    },
    openModal: function (id) {
      var m = document.getElementById(id); if (!m) return;
      m.classList.add('open');
      enhanceUrlUploads(m);
      m.querySelectorAll('.file-up').forEach(syncFileUpUI);
    },
    closeModal: function (id) {
      var m = id ? document.getElementById(id) : document.querySelector('.modal-mask.open');
      if (m) m.classList.remove('open');
    },
    toast: function (msg, type) {
      var wrap = document.querySelector('.toast-wrap');
      if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
      var t = document.createElement('div');
      t.className = 'toast' + (type ? ' ' + type : '');
      var icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';
      t.innerHTML = '<i class="fa-solid ' + icon + '"></i>' + msg;
      wrap.appendChild(t);
      setTimeout(function () {
        t.style.opacity = '0'; t.style.transition = '.3s';
        setTimeout(function () { t.remove(); }, 300);
      }, 2200);
    },
    /* PMS.confirm({ title, message, detail, type, okText, cancelText, onOk, onCancel })
       type: danger | warning | info | success */
    confirm: function (opts) {
      opts = opts || {};
      var type = opts.type || 'danger';
      var icons = { danger: 'fa-trash-can', warning: 'fa-triangle-exclamation', info: 'fa-circle-question', success: 'fa-circle-check' };
      var okCls = type === 'danger' ? 'btn-danger-solid' : 'btn-primary';
      var mask = document.getElementById('appConfirmMask');
      if (!mask) {
        mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'appConfirmMask';
        mask.innerHTML =
          '<div class="modal modal-sm">' +
            '<div class="modal-head" style="display:flex;align-items:center;justify-content:space-between">' +
              '<span data-confirm-title>确认</span>' +
              '<span class="close" data-confirm-cancel style="cursor:pointer;color:var(--text-3);width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px"><i class="fa-solid fa-xmark"></i></span>' +
            '</div>' +
            '<div class="modal-body"><div class="confirm-box">' +
              '<div class="confirm-ico" data-confirm-ico><i class="fa-solid fa-trash-can"></i></div>' +
              '<div><div class="confirm-msg" data-confirm-msg></div><div class="confirm-detail" data-confirm-detail></div></div>' +
            '</div></div>' +
            '<div class="modal-foot">' +
              '<button type="button" class="btn" data-confirm-cancel>取消</button>' +
              '<button type="button" class="btn" data-confirm-ok>确定</button>' +
            '</div>' +
          '</div>';
        document.body.appendChild(mask);
        mask.addEventListener('click', function (e) {
          if (e.target === mask) PMS._confirmCancel();
          if (e.target.closest('[data-confirm-cancel]')) PMS._confirmCancel();
          if (e.target.closest('[data-confirm-ok]')) PMS._confirmOk();
        });
      }
      PMS._confirmCb = { onOk: opts.onOk || null, onCancel: opts.onCancel || null };
      mask.querySelector('[data-confirm-title]').textContent = opts.title || '确认';
      mask.querySelector('[data-confirm-msg]').textContent = opts.message || '确定执行该操作吗？';
      var detailEl = mask.querySelector('[data-confirm-detail]');
      detailEl.textContent = opts.detail || '';
      detailEl.style.display = opts.detail ? '' : 'none';
      var ico = mask.querySelector('[data-confirm-ico]');
      ico.className = 'confirm-ico ' + type;
      ico.innerHTML = '<i class="fa-solid ' + (icons[type] || icons.danger) + '"></i>';
      var okBtn = mask.querySelector('[data-confirm-ok]');
      okBtn.className = 'btn ' + okCls;
      okBtn.textContent = opts.okText || '确定';
      var cancelBtn = mask.querySelector('.modal-foot [data-confirm-cancel]');
      if (cancelBtn) cancelBtn.textContent = opts.cancelText || '取消';
      mask.classList.add('open');
    },
    _confirmOk: function () {
      var cb = PMS._confirmCb || {};
      PMS._confirmCb = null;
      PMS.closeModal('appConfirmMask');
      if (cb.onOk) cb.onOk();
    },
    _confirmCancel: function () {
      var cb = PMS._confirmCb || {};
      PMS._confirmCb = null;
      PMS.closeModal('appConfirmMask');
      if (cb.onCancel) cb.onCancel();
    },
    /* 生成字典下拉选项：value=编号，text=名称 */
    opts: function (name, selected, placeholder) {
      var list = DICT[name] || [];
      var ph = placeholder == null ? '请选择' : placeholder;
      var html = ph === false ? '' : '<option value="">' + ph + '</option>';
      var sel = selected == null ? '' : String(selected).trim();
      list.forEach(function (it) {
        var on = (sel !== '' && (sel === it[0] || sel === it[1])) ? ' selected' : '';
        html += '<option value="' + it[0] + '"' + on + '>' + it[1] + '</option>';
      });
      return html;
    },
    /* 按 data-fill 键名批量填充抽屉 / 详情字段 */
    fill: function (scopeId, data) {
      var scope = document.getElementById(scopeId) || document;
      Object.keys(data).forEach(function (k) {
        scope.querySelectorAll('[data-fill="' + k + '"]').forEach(function (el) {
          var v = data[k];
          if (el.tagName === 'SELECT') {
            var s = v == null ? '' : String(v).trim();
            el.value = s;
            if (el.value !== s) {
              Array.prototype.forEach.call(el.options, function (o) {
                if (o.textContent.trim() === s) el.value = o.value;
              });
            }
          } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = (el.type === 'month') ? formatMonth(v) : (v == null ? '' : v);
          } else if (isUrlFillName(k) || el.getAttribute('data-file-view') === '1') {
            el.innerHTML = fileViewHtml(v);
          } else {
            el.textContent = v == null ? '' : v;
          }
        });
      });
      enhanceUrlUploads(scope);
      scope.querySelectorAll('.file-up').forEach(syncFileUpUI);
    },
    /* 列表行删除：确认 → 移除该行 → 提示 */
    delRow: function (tr, name) {
      if (!tr) return;
      var label = name || '该记录';
      PMS.confirm({
        title: '删除确认',
        message: '确定删除「' + label + '」吗？',
        detail: '此操作不可撤销。',
        type: 'danger',
        okText: '删除',
        onOk: function () {
          if (tr.parentNode) tr.parentNode.removeChild(tr);
          PMS.toast('已删除', 'success');
        }
      });
    }
  };
  window.PMS = PMS;

  /* ------- 全局事件委托 ------- */
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open-drawer]');
    if (o) PMS.openDrawer(o.getAttribute('data-open-drawer'));
    var m = e.target.closest('[data-open-modal]');
    if (m) PMS.openModal(m.getAttribute('data-open-modal'));
    if (e.target.closest('[data-close-drawer]') || e.target.classList.contains('drawer-mask')) PMS.closeDrawer();
    if (e.target.closest('[data-close-modal]')) PMS.closeModal();
    else if (e.target.classList.contains('modal-mask')) {
      if (e.target.id === 'appConfirmMask') PMS._confirmCancel();
      else PMS.closeModal();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var cm = document.getElementById('appConfirmMask');
      if (cm && cm.classList.contains('open')) { PMS._confirmCancel(); e.preventDefault(); }
    }
  });

  /* ------- 标签页 ------- */
  function initTabs() {
    document.querySelectorAll('.tabs').forEach(function (tabs) {
      tabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.tab'); if (!tab) return;
        var name = tab.getAttribute('data-tab');
        var scope = tabs.closest('[data-tabs-scope]') || document;
        tabs.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        scope.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === name);
        });
        scope.querySelectorAll('.tab-panel.active .table-wrap > table.data-table').forEach(function (t) {
          if (t.getAttribute('data-fill') === '1') { applyListLayout(t); fillRows(t); }
        });
      });
    });
  }

  /* ==========================================================================
     列表增强：定高布局 + 序号列 + 右侧固定操作列 + 综合分页
     ========================================================================== */
  var PAGE_SIZES = [10, 20, 50, 100];
  var DEFAULT_PAGE_SIZE = 20;

  function listTables() {
    var out = [];
    document.querySelectorAll('main.app-main .table-wrap > table.data-table').forEach(function (t) {
      if (!t.closest('.drawer')) out.push(t);
    });
    return out;
  }
  function addIndexColumn(table) {
    var headRow = table.querySelector('thead tr');
    if (headRow && !headRow.querySelector('th.idx-col')) {
      var th = document.createElement('th');
      th.className = 'idx-col'; th.textContent = '序号';
      headRow.insertBefore(th, headRow.firstChild);
    }
  }
  function markOpsColumn(table) {
    if (!table) return;
    var headRow = table.querySelector('thead tr');
    if (!headRow) return;
    var ths = headRow.children, idx = -1, i;
    for (i = 0; i < ths.length; i++) {
      if ((ths[i].textContent || '').replace(/\s+/g, '') === '操作') { idx = i; break; }
    }
    if (idx < 0) return;
    for (i = 0; i < ths.length; i++) ths[i].classList.toggle('col-ops', i === idx);
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      var cells = tr.children;
      for (var j = 0; j < cells.length; j++) {
        if (cells[j].tagName === 'TD') cells[j].classList.toggle('col-ops', j === idx);
      }
    });
  }
  function watchOpsColumn(table) {
    if (!table || table._opsWatch || typeof MutationObserver === 'undefined') return;
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    table._opsWatch = new MutationObserver(function () { markOpsColumn(table); });
    table._opsWatch.observe(tbody, { childList: true });
  }
  function renumber(table, start) {
    var n = start || 1;
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      var cell = tr.querySelector('td.idx-col');
      if (!cell) { cell = document.createElement('td'); cell.className = 'idx-col'; tr.insertBefore(cell, tr.firstChild); }
      cell.textContent = n < 10 ? '0' + n : String(n);
      n++;
    });
  }
  function applyListLayout(table) {
    var main = table.closest('main.app-main');
    if (main) {
      main.classList.add('list-layout');
      document.documentElement.classList.add('list-page');
      document.body.classList.add('list-page');
    }
    var card = table.closest('.card'); if (card) card.classList.add('list-card');
    var body = table.closest('.card-body'); if (body) body.classList.add('list-body');
    var panelEl = table.closest('.tab-panel'); if (panelEl) panelEl.classList.add('list-panel');
  }
  function ensureFoot(table) {
    var wrap = table.parentElement;
    var next = wrap.nextElementSibling;
    if (next && next.classList.contains('table-foot')) return next;
    var foot = document.createElement('div');
    foot.className = 'table-foot';
    wrap.parentNode.insertBefore(foot, wrap.nextSibling);
    return foot;
  }
  function buildPageNums(cur, total) {
    var pages = [], i;
    if (total <= 7) { for (i = 1; i <= total; i++) pages.push(i); return pages; }
    pages.push(1);
    var start = Math.max(2, cur - 1), end = Math.min(total - 1, cur + 1);
    if (cur <= 3) { start = 2; end = 4; }
    if (cur >= total - 2) { start = total - 3; end = total - 1; }
    if (start > 2) pages.push('…');
    for (i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push('…');
    pages.push(total);
    return pages;
  }
  function renderPager(foot, state) {
    var pageNum = Math.max(1, state.pageNum || 1);
    var pageSize = state.pageSize || DEFAULT_PAGE_SIZE;
    var total = Math.max(0, state.total || 0);
    var pages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (pageNum > pages) pageNum = pages;

    var sizeOpts = PAGE_SIZES.map(function (n) {
      return '<option value="' + n + '"' + (n === pageSize ? ' selected' : '') + '>' + n + '</option>';
    }).join('');

    var btns = '';
    btns += '<button type="button" data-pg="first" title="首页"' + (pageNum <= 1 ? ' disabled' : '') + '><i class="fa-solid fa-angles-left"></i></button>';
    btns += '<button type="button" data-pg="prev" title="上一页"' + (pageNum <= 1 ? ' disabled' : '') + '><i class="fa-solid fa-angle-left"></i></button>';
    buildPageNums(pageNum, pages).forEach(function (p) {
      if (p === '…') btns += '<span class="pager-ellipsis">…</span>';
      else btns += '<button type="button" class="' + (p === pageNum ? 'active' : '') + '" data-pg="' + p + '">' + p + '</button>';
    });
    btns += '<button type="button" data-pg="next" title="下一页"' + (pageNum >= pages ? ' disabled' : '') + '><i class="fa-solid fa-angle-right"></i></button>';
    btns += '<button type="button" data-pg="last" title="末页"' + (pageNum >= pages ? ' disabled' : '') + '><i class="fa-solid fa-angles-right"></i></button>';

    var from = total === 0 ? 0 : (pageNum - 1) * pageSize + 1;
    var to = Math.min(total, pageNum * pageSize);

    foot.innerHTML =
      '<div class="pager-info">共 <b>' + total + '</b> 条，显示 <b>' + from + '</b>–<b>' + to + '</b> 条</div>' +
      '<div class="pager-controls">' +
        '<label class="pager-size">每页 <select data-page-size>' + sizeOpts + '</select> 条</label>' +
        '<div class="pager">' + btns + '</div>' +
        '<label class="pager-jump">前往 <input type="number" min="1" max="' + pages + '" value="' + pageNum + '" data-page-jump> 页</label>' +
        '<span class="pager-pages">共 ' + pages + ' 页</span>' +
      '</div>';

    foot._pagerState = { pageNum: pageNum, pageSize: pageSize, total: total, pages: pages, onChange: state.onChange };

    function go(nextNum, nextSize) {
      var st = foot._pagerState;
      var size = nextSize != null ? nextSize : st.pageSize;
      var max = Math.max(1, Math.ceil(st.total / size) || 1);
      var num = Math.min(Math.max(1, nextNum), max);
      if (typeof st.onChange === 'function') { st.onChange({ pageNum: num, pageSize: size }); return; }
      var table = foot._table;
      if (!table && foot.previousElementSibling) table = foot.previousElementSibling.querySelector('table.data-table');
      if (table && table.getAttribute('data-fill') === '1') {
        table._pageNum = num; table._pageSize = size; fillRows(table);
      } else {
        renderPager(foot, { pageNum: num, pageSize: size, total: st.total, onChange: st.onChange });
      }
    }

    foot.querySelectorAll('.pager button[data-pg]').forEach(function (b) {
      b.addEventListener('click', function () {
        var st = foot._pagerState, pg = b.getAttribute('data-pg'), target = st.pageNum;
        if (pg === 'first') target = 1;
        else if (pg === 'prev') target = st.pageNum - 1;
        else if (pg === 'next') target = st.pageNum + 1;
        else if (pg === 'last') target = st.pages;
        else target = parseInt(pg, 10);
        go(target);
      });
    });
    var sizeSel = foot.querySelector('[data-page-size]');
    if (sizeSel) sizeSel.addEventListener('change', function () { go(1, parseInt(sizeSel.value, 10) || DEFAULT_PAGE_SIZE); });
    var jumpInput = foot.querySelector('[data-page-jump]');
    if (jumpInput) {
      var doJump = function () { var v = parseInt(jumpInput.value, 10); if (!isNaN(v)) go(v); };
      jumpInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doJump(); } });
      jumpInput.addEventListener('blur', doJump);
    }
  }
  PMS.renderPager = function (footOrTable, opts) {
    var foot = footOrTable;
    if (footOrTable && footOrTable.tagName === 'TABLE') {
      foot = ensureFoot(footOrTable);
      applyListLayout(footOrTable);
    }
    if (!foot) return;
    renderPager(foot, opts || {});
  };

  /* 列表模拟总量：每张表固定随机 500～20000，刷新页面前保持不变 */
  function mockTotalFor(table) {
    if (table._total != null) return table._total;
    var key = 'app.mockTotal:' + (location.pathname || '') + '#' + (table.id || '');
    var head = table.querySelector('thead');
    if (head) key += ':' + (head.textContent || '').replace(/\s+/g, '').slice(0, 40);
    try {
      var cached = sessionStorage.getItem(key);
      if (cached) {
        var n = parseInt(cached, 10);
        if (n >= 500 && n <= 20000) { table._total = n; return n; }
      }
    } catch (e) {}
    var total = 500 + Math.floor(Math.random() * 19501);
    table._total = total;
    try { sessionStorage.setItem(key, String(total)); } catch (e2) {}
    return total;
  }
  function fillRows(table) {
    var tbody = table.querySelector('tbody'); if (!tbody) return;
    if (!table._origRows) {
      table._origRows = Array.prototype.map.call(tbody.querySelectorAll('tr'), function (tr) { return tr.cloneNode(true); });
    }
    var orig = table._origRows;
    if (!orig.length) return;

    var pageSize = table._pageSize || DEFAULT_PAGE_SIZE;
    var pageNum = table._pageNum || 1;
    var total = mockTotalFor(table);
    table._pageSize = pageSize;

    var pages = Math.max(1, Math.ceil(total / pageSize));
    if (pageNum > pages) pageNum = pages;
    if (pageNum < 1) pageNum = 1;
    table._pageNum = pageNum;

    var showCount = Math.min(pageSize, total - (pageNum - 1) * pageSize);
    if (showCount < 0) showCount = 0;

    tbody.innerHTML = '';
    for (var i = 0; i < showCount; i++) {
      var seq = (pageNum - 1) * pageSize + i;
      var row = orig[seq % orig.length].cloneNode(true);
      row.classList.add('is-clone');
      tbody.appendChild(row);
    }
    renumber(table, (pageNum - 1) * pageSize + 1);
    markOpsColumn(table);
    var foot = ensureFoot(table);
    foot._table = table;
    renderPager(foot, { pageNum: pageNum, pageSize: pageSize, total: total });
  }
  function enhanceTables() {
    var all = listTables();
    all.forEach(addIndexColumn);
    all.forEach(markOpsColumn);
    all.forEach(watchOpsColumn);
    var layoutOnly = all.filter(function (t) { return t.hasAttribute('data-static') || t.getAttribute('data-fill') === '0'; });
    var fillable = all.filter(function (t) {
      return !t.closest('.grid-2, .grid-3') && !t.hasAttribute('data-static') && t.getAttribute('data-fill') !== '0';
    });
    layoutOnly.forEach(function (t) { t.setAttribute('data-fill', '0'); applyListLayout(t); });
    fillable.forEach(function (t) {
      t.setAttribute('data-fill', '1');
      t._pageSize = DEFAULT_PAGE_SIZE;
      t._pageNum = 1;
      applyListLayout(t);
    });
    all.forEach(function (t) { if (t.getAttribute('data-fill') !== '1') renumber(t); });
    fillable.forEach(fillRows);
    all.forEach(markOpsColumn);
  }

  /* ------- 字典下拉自动填充：<select data-dict="xxx"> ------- */
  function populateDicts(root) {
    (root || document).querySelectorAll('select[data-dict]').forEach(function (sel) {
      if (sel.getAttribute('data-dict-done') === '1') return;
      var name = sel.getAttribute('data-dict');
      if (!DICT[name]) return;
      var ph = '请选择';
      if (sel.hasAttribute('data-ph')) { ph = sel.getAttribute('data-ph'); if (ph === '') ph = false; }
      sel.innerHTML = PMS.opts(name, sel.getAttribute('data-selected'), ph);
      sel.setAttribute('data-dict-done', '1');
    });
  }
  PMS.populateDicts = populateDicts;

  /* ------- 引导 ------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.hasAttribute('data-shell')) { initShell(); return; }
    injectLayout();
    initTabs();
    enhanceTables();
    populateDicts();
    enhanceUrlUploads(document);
    document.querySelectorAll('.filter-item input[type="month"]').forEach(function (el) {
      if (!el.value) el.value = PMS.statMonth();
    });
  });
})();
