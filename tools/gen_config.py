# -*- coding: utf-8 -*-
"""华信数智房产交易一体化平台 原型工程生成器

⚠️ 危险警告（务必先读）：
  本生成器的数据源（规范 md 的 10.1/10.2/11.3 节）已落后于手工维护的产物文件，
  直接重跑会造成回归，且此前已发生过一次导致全部子系统导航瘫痪：
    · 会用旧版覆盖并截断 assets/css/app.css、assets/css/mobile.css；
    · 会重写 assets/js/app.js，丢失手工补丁 K（zjjg 交易资金监管统一入口）与
      补丁 L（all 全功能视图入口）——导航页 index.html 与 all/shell.html 全靠它，
      丢失后所有子系统首页都进不去、菜单错乱。
  保障性住房（wsbzf）目前是手工加进 app.js(government.systems) 与 catalog.js 的，
  重跑同样会被抹掉。
  如需重跑：必须先把上述三个产物文件的最新内容回灌到规范 md 对应小节，并在本文件
  内补齐 zjjg/all 两个端与 wsbzf 子系统的生成逻辑；否则请勿运行，改为手工维护产物。

职责：
  1. 从《前端原型设计规范-政务蓝基线v1.0.md》抽取第 10.1 / 10.2 / 11.3 节代码，
     落盘 assets/css/app.css、assets/css/mobile.css、assets/js/app.js。
  2. 以 tools/menu_spec.py 为菜单主数据（即《柳州市数智房产交易一体化平台菜单梳理
     v1.0.xlsx》的口径：业务子系统 / 一级菜单 / 二级菜单），生成 app.js 的多端配置区
     （菜单树 / 角色 / roleMenu / 首页）与 assets/js/catalog.js 目录数据；二级功能点
     从《功能板块梳理v1.9.xlsx》按菜单归属带过来，只进页面不进菜单。
  3. 在 modules/ 下按子系统代号建目录，并清掉不再使用的空目录。

只在开发期运行，不参与页面运行。菜单主数据或梳理表升版后重跑即可。
用法：在 prototype/ 下执行 python tools/gen_config.py

目录约定：原型全部产物在 prototype/ 下（即 ROOT），
需求与规范文档在 prototype/ 的上一级（即 DOCS）。
"""

import json
import os
import re
import sys
from urllib.parse import quote

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
DOCS = os.path.dirname(ROOT)
SPEC = os.path.join(DOCS, '前端原型设计规范-政务蓝基线v1.0.md')

sys.path.insert(0, TOOLS)
from gen_menu import build_menu, load_v19  # noqa: E402
from menu_spec import SUBSYSTEMS  # noqa: E402

SUB_INDEX = {s['key']: s for s in SUBSYSTEMS}

# 一级菜单分组与顶层单项的图标：按菜单名关键字命中，命中不了退回子系统图标。
# 顺序即优先级，长词、专有词在前。
MODULE_ICON_RULES = [
    ('驾驶舱', 'fa-gauge-high'), ('一张图', 'fa-map-location-dot'), ('工作台', 'fa-table-columns'),
    ('知识图谱', 'fa-circle-nodes'), ('知识库', 'fa-book-open'),
    ('预警', 'fa-triangle-exclamation'), ('督办', 'fa-bullhorn'), ('看板', 'fa-gauge-high'),
    ('审核', 'fa-user-check'), ('核验', 'fa-clipboard-check'), ('审批', 'fa-stamp'),
    ('签章', 'fa-stamp'), ('签约', 'fa-file-signature'), ('合同', 'fa-file-contract'),
    ('备案', 'fa-file-circle-check'), ('证照', 'fa-id-card'), ('证明', 'fa-file-lines'),
    ('台账', 'fa-table-list'), ('报表', 'fa-table-list'), ('报送', 'fa-paper-plane'),
    ('上报', 'fa-paper-plane'), ('报告', 'fa-file-lines'),
    ('统计', 'fa-chart-column'), ('分析', 'fa-chart-line'), ('监测', 'fa-binoculars'),
    ('查询', 'fa-magnifying-glass'), ('检索', 'fa-magnifying-glass'), ('查档', 'fa-folder-open'),
    ('待办', 'fa-list-check'), ('任务', 'fa-list-check'), ('预约', 'fa-calendar-check'),
    ('排班', 'fa-calendar-days'), ('窗口', 'fa-shop'), ('取号', 'fa-ticket'),
    ('收件', 'fa-inbox'), ('受理', 'fa-inbox'), ('材料', 'fa-folder-tree'),
    ('档案', 'fa-box-archive'), ('影像', 'fa-images'), ('文件', 'fa-file-image'),
    ('资金', 'fa-sack-dollar'), ('账户', 'fa-building-columns'), ('银行', 'fa-building-columns'),
    ('拨付', 'fa-money-bill-transfer'), ('缴存', 'fa-piggy-bank'), ('额度', 'fa-coins'),
    ('项目', 'fa-diagram-project'), ('楼盘', 'fa-building'), ('房源', 'fa-house'),
    ('测绘', 'fa-ruler-combined'), ('面积', 'fa-ruler-combined'),
    ('抵押', 'fa-lock'), ('查封', 'fa-ban'), ('限制', 'fa-ban'),
    ('名录库', 'fa-address-book'), ('公开', 'fa-bullhorn'), ('抽查', 'fa-dice'),
    ('名单', 'fa-flag'), ('记分', 'fa-scale-balanced'), ('归集', 'fa-cloud-arrow-down'),
    ('投诉', 'fa-comment-dots'), ('修复', 'fa-wrench'), ('奖惩', 'fa-gavel'),
    ('查处', 'fa-gavel'), ('画像', 'fa-id-badge'), ('检查', 'fa-clipboard-check'),
    ('变更', 'fa-pen-to-square'),
    ('租赁', 'fa-key'), ('信用', 'fa-user-shield'), ('主体', 'fa-users'),
    ('机构', 'fa-building-user'), ('企业', 'fa-building-user'), ('人员', 'fa-user-group'),
    ('用户', 'fa-user-gear'), ('角色', 'fa-users-gear'), ('权限', 'fa-user-lock'),
    ('认证', 'fa-fingerprint'), ('单点登录', 'fa-right-to-bracket'),
    ('流程', 'fa-sitemap'), ('表单', 'fa-pen-ruler'), ('模板', 'fa-file-code'),
    ('规则', 'fa-scale-balanced'), ('政策', 'fa-scale-balanced'), ('参数', 'fa-sliders'),
    ('配置', 'fa-sliders'), ('字典', 'fa-book'), ('目录', 'fa-list'), ('事项', 'fa-clipboard-list'),
    ('接口', 'fa-right-left'), ('共享', 'fa-share-nodes'), ('交换', 'fa-right-left'),
    ('汇聚', 'fa-cloud-arrow-down'), ('采集', 'fa-cloud-arrow-down'),
    ('质量', 'fa-broom'), ('治理', 'fa-broom'), ('标准', 'fa-ruler'),
    ('主题', 'fa-layer-group'), ('资产', 'fa-database'), ('口径', 'fa-scale-balanced'),
    ('安全', 'fa-shield-halved'), ('加密', 'fa-user-lock'), ('国密', 'fa-shield-halved'),
    ('日志', 'fa-clock-rotate-left'), ('留痕', 'fa-clock-rotate-left'), ('溯源', 'fa-timeline'),
    ('监控', 'fa-heart-pulse'), ('运维', 'fa-screwdriver-wrench'), ('部署', 'fa-truck-ramp-box'),
    ('培训', 'fa-chalkboard-user'), ('迁移', 'fa-arrow-right-arrow-left'),
    ('模型', 'fa-microchip'), ('算力', 'fa-microchip'), ('语料', 'fa-file-import'),
    ('助手', 'fa-headset'), ('问答', 'fa-comments'), ('研判', 'fa-brain'), ('识别', 'fa-eye'),
    ('消息', 'fa-comment-sms'), ('通知', 'fa-bell'), ('评价', 'fa-star'),
    ('指引', 'fa-compass'), ('动态', 'fa-newspaper'), ('公示', 'fa-bullhorn'),
    ('好房子', 'fa-award'), ('品质', 'fa-award'), ('维修', 'fa-screwdriver-wrench'),
    ('管理', 'fa-folder-open'),
]


def menu_icon(name, fallback):
    for kw, ico in MODULE_ICON_RULES:
        if kw in name:
            return ico
    return fallback


# 梳理表「主要使用对象」→ 角色 key
OBJ_ROLE = {
    '窗口受理人员': 'window',
    '业务审核人员': 'reviewer',
    '业务管理人员': 'manager',
    '分管领导': 'leader',
    '系统管理员': 'admin',
    '运维人员': 'ops',
    '购房群众': 'citizen',
    '租赁当事人': 'tenant',
    '开发企业': 'developer',
    '经纪机构': 'agency',
    '监管银行': 'bank',
}

# 各端的角色。统一服务门户比梳理表多一个「门户管理员」：门户配置、一网通办对接一类
# 菜单在梳理表里标给系统管理员，落到门户端需要有个内部身份承接。
END_ROLES = {
    'government': ['window', 'reviewer', 'manager', 'leader', 'admin', 'ops'],
    'company': ['developer', 'agency', 'bank'],
    'portal': ['citizen', 'tenant', 'admin'],
    'datacenter': ['admin', 'ops', 'leader'],
    'ai': ['admin', 'reviewer', 'manager', 'leader'],
}

# 子系统归属端由 menu_spec 的 end 决定。单位机构端不在菜单梳理表里单列子系统，
# 它进的是下面这些子系统中「主要使用对象 = 开发企业 / 经纪机构 / 监管银行」的菜单，
# 其余菜单不进它的侧栏。
EXT_SYSTEMS = {
    'company': ['wsmh', 'wsswb', 'wscwb', 'wszwb', 'wsdwb', 'wsszjjg', 'wssvc', 'wsztxy'],
}

# 本端子系统里的菜单，使用对象全部落在本端角色之外时的兜底归属
END_FALLBACK = {'government': ['manager', 'reviewer'], 'datacenter': ['admin'],
                'ai': ['admin'], 'portal': ['admin']}

# 同一批人的角色：门户是一个对外站点，梳理表把功能点标给购房群众还是租赁当事人，
# 只是举例用的办事人身份，两者在门户里看到的栏目是同一套。
SAME_AUDIENCE = {'portal': [['citizen', 'tenant']]}

# 管理类一级菜单。梳理表的「主要使用对象」写的是这条功能面向谁，门户站点管理这类
# 配置菜单因此也带上了购房群众，直接按表放行会把配置页放进公众侧栏，这里收口到管理员。
ADMIN_ONLY_GROUPS = {'portal': [('wsmh', '门户配置')]}

# 无功能点的新增菜单默认对本端全部角色放行（「我的工作台」靠这条）。子系统在这里
# 给出收口范围时，除「我的工作台」外的新增菜单按此表放行；空列表表示该端不放行。
# 从业主体与信用监管被单位机构端借用（见 EXT_SYSTEMS），名录库、红黑名单这类内部
# 监管菜单不能跟着漏进企业侧栏，故 company 给空。
NEW_MENU_AUDIENCE = {
    'wsztxy': {'government': ['manager', 'reviewer'], 'company': []},
    # 报送单位管理是新增菜单（v1.9 无对应模块），只给数据管理员，别漏进运维 / 领导侧栏。
    'wsdata': {'datacenter': ['admin']},
}

# 白名单补充：梳理表按功能点标注使用对象，个别角色因此覆盖过窄，按角色定位补齐菜单。
ROLE_MENU_EXTRA = {
    # 数据中心的分管领导定位是「数据资源家底与运行态势（只读）」
    'datacenter': {'leader': ['wsdata-03', 'wsdata-05', 'wsdata-08', 'wsdata-10',
                              'wsdata-11', 'wsdata-14']},
    # 企业全景画像的使用对象在梳理表里只标了分管领导，但画像是市场监管岗查一家企业时
    # 的常用入口（从主体详情、检查、查处都要跳过来），不补齐会让业务管理员看不到这条菜单。
    'government': {'manager': ['wsztxy-15']},
}

# 保留在 menu_spec 里占位（维持后续菜单代号稳定）、但不在侧栏与角色白名单里渲染的菜单。
# 市县一体化数据中心不做数据汇聚，且主题库/专题库、数据快照按需求下线，这三项隐藏不展示。
HIDDEN_MENUS = {
    'datacenter': {'wsdata-02', 'wsdata-04', 'wsdata-07'},
}


# ---------------------------------------------------------------------------
# 一、从设计规范抽取样式表与运行时代码
# ---------------------------------------------------------------------------
def extract_block(md, heading):
    """取指定小节标题后的第一个围栏代码块正文。"""
    i = md.index(heading)
    j = md.index('\n```', i)
    j = md.index('\n', j + 1) + 1          # 跳过 ```lang 行
    k = md.index('\n```', j)
    return md[j:k] + '\n'


# ---------------------------------------------------------------------------
# 二、菜单主数据：子系统 / 一级菜单 / 二级菜单 + 各菜单承接的二级功能点
# ---------------------------------------------------------------------------
def load_catalog():
    """展开 menu_spec 的菜单树，并把 v1.9 的二级功能点按归属挂到菜单项上。

    返回 (subs, menus)：
      subs[子系统代号]  子系统元信息 + 本子系统的菜单代号清单
      menus[菜单代号]   一级 / 二级菜单名、承接的 v1.9 板块与模块、功能点、可用角色
    校验交给 tools/gen_menu.py，这里只在不一致时中止，避免生成半成品配置。
    """
    boards = load_v19()
    items, errors = build_menu(boards)
    if errors:
        sys.exit('菜单主数据与《功能板块梳理v1.9》不一致，共 %d 条，先跑 tools/gen_menu.py：\n  %s'
                 % (len(errors), '\n  '.join(errors)))

    subs = {}
    for sub in SUBSYSTEMS:
        legacy = []
        for b in sub['boards']:
            for x in (boards.get(b, {}).get('legacy', '') or '').split('；'):
                x = x.strip()
                if x and x != '—' and x not in legacy:
                    legacy.append(x)
        subs[sub['key']] = {
            'name': sub['name'], 'end': sub['end'], 'line': sub['line'], 'icon': sub['icon'],
            'boards': list(sub['boards']), 'legacy': '；'.join(legacy),
            'menus': [],
        }

    menus = {}
    for it in items:
        sub = it['sub']
        subs[sub['key']]['menus'].append(it['key'])
        roles = []
        for p in it['points']:
            r = OBJ_ROLE.get(p['obj'])
            if r and r not in roles:
                roles.append(r)
        note = ('按功能点拆分' if any(len(s) == 3 for s in it['srcs'])
                else '多模块合并' if len(it['src_modules']) > 1
                else '新增菜单' if not it['srcs'] else '')
        menus[it['key']] = {
            'sub': sub['key'], 'group': it['group'], 'label': it['label'],
            'level': next((p['level'] for p in it['points'] if p['level']), '市县两级'),
            'boards': it['src_boards'], 'modules': it['src_modules'],
            'note': note, 'roles': roles,
            'points': [{'n': p['name'], 'd': p['desc'], 'lv': p['level'],
                        'ai': p['ai'], 'cfg': p['cfg']} for p in it['points']],
        }
    return subs, menus


# ---------------------------------------------------------------------------
# 三、各端可见范围、菜单树与角色白名单
# ---------------------------------------------------------------------------
def visible_roles(end, subs, menus):
    """菜单项在本端可见于哪些角色。

    本端子系统：使用对象命中本端角色的按命中走，没命中的落到兜底角色；
    「我的工作台」这类新增菜单没有使用对象，本端全部角色可见；子系统在
    NEW_MENU_AUDIENCE 里给了收口范围时，其余新增菜单按那张表放行。
    外部机构端借用的子系统：只留使用对象正好是本端角色的菜单，不做兜底。
    ADMIN_ONLY_GROUPS 里的管理类一级菜单不按表放行，只给本端管理员。
    """
    roles = END_ROLES[end]
    ext = EXT_SYSTEMS.get(end, [])
    out = {}
    for key, m in menus.items():
        native = subs[m['sub']]['end'] == end
        if not native and m['sub'] not in ext:
            continue
        if not m['points']:
            aud = NEW_MENU_AUDIENCE.get(m['sub'], {})
            if m['label'] == '我的工作台' or m['sub'] not in NEW_MENU_AUDIENCE:
                out[key] = list(roles)
            else:
                rs = [r for r in roles if r in aud.get(end, [])]
                if rs:
                    out[key] = rs
            continue
        if (m['sub'], m['group']) in ADMIN_ONLY_GROUPS.get(end, []):
            out[key] = [r for r in roles if r == 'admin']
            continue
        rs = [r for r in m['roles'] if r in roles]
        for group in SAME_AUDIENCE.get(end, []):
            if any(r in rs for r in group):
                rs = rs + [r for r in group if r not in rs]
        if not rs and native:
            rs = [r for r in END_FALLBACK[end] if r in roles]
        if rs:
            out[key] = [r for r in roles if r in rs]
    for role, keys in ROLE_MENU_EXTRA.get(end, {}).items():
        for key in keys:
            if role not in out.setdefault(key, []):
                out[key].append(role)
    return out


_BUILT_CACHE = {}


PAGE_OVERRIDES = {
    "wsbiz-01": "../modules/wsbiz/biz/workbench.html",
    "wsbiz-02": "../modules/wsbiz/biz/my-approval.html",
    "wsbiz-03": "../modules/wsbiz/biz/task-center.html",
    "wsbiz-04": "../modules/wsbiz/biz/my-board.html",
    "wsbiz-05": "../modules/wsbiz/biz/item-catalog.html",
    "wsbiz-06": "../modules/wsbiz/biz/identity-verify.html",
    "wsbiz-07": "../modules/wsbiz/biz/intake.html",
    "wsbiz-08": "../modules/wsbiz/biz/material-check.html",
    "wsbiz-09": "../modules/wsbiz/biz/intake-register.html",
    "wsbiz-10": "../modules/wsbiz/biz/appointment.html",
    "wsbiz-11": "../modules/wsbiz/biz/window-schedule.html",
    "wsbiz-12": "../modules/wsbiz/biz/assist-service.html",
    "wsbiz-13": "../modules/wsbiz/biz/material-library.html",
    "wsbiz-14": "../modules/wsbiz/biz/material-exempt.html",
    "wsbiz-15": "../modules/wsbiz/biz/material-correct.html",
    "wsbiz-16": "../modules/wsbiz/biz/cross-query.html",
    "wsbiz-17": "../modules/wsbiz/biz/case-ledger.html",
    "wsbiz-18": "../modules/wsbiz/biz/service-review.html",
    "wsbiz-19": "../modules/wsbiz/biz/guide.html",
    "wsbiz-20": "../modules/wsbiz/biz/news.html",
    "wscwb-01": "../modules/wscwb/index.html",
    "wscwb-02": "../modules/wscwb/listing-list.html",
    "wscwb-03": "../modules/wscwb/contract-list.html",
    "wscwb-04": "../modules/wscwb/filing-list.html",
    "wscwb-05": "../modules/wscwb/onething-list.html",
    "wscwb-06": "../modules/wscwb/deal-ledger.html",
    "wsszjjg-01": "../modules/wsszjjg/gov/workbench.html",
    "wsszjjg-02": "../modules/wsszjjg/gov/duty.html",
    "wsszjjg-03": "../modules/wsszjjg/gov/relation.html",
    "wsszjjg-04": "../modules/wsszjjg/gov/rule.html",
    "wsszjjg-05": "../modules/wsszjjg/gov/project.html",
    "wsszjjg-06": "../modules/wsszjjg/gov/account.html",
    "wsszjjg-07": "../modules/wsszjjg/gov/contractor.html",
    "wsszjjg-08": "../modules/wsszjjg/gov/collect.html",
    "wsszjjg-09": "../modules/wsszjjg/gov/usage.html",
    "wsszjjg-10": "../modules/wsszjjg/gov/refund.html",
    "wsszjjg-11": "../modules/wsszjjg/gov/clearing.html",
    "wsszjjg-12": "../modules/wsszjjg/gov/reconcile.html",
    "wsszjjg-13": "../modules/wsszjjg/gov/release.html",
    "wszjjg-01": "../modules/wszjjg/gov/workbench.html",
    "wszjjg-02": "../modules/wszjjg/gov/duty.html",
    "wszjjg-03": "../modules/wszjjg/gov/escrow.html",
    "wszjjg-04": "../modules/wszjjg/gov/node.html",
    "wswxzj-01": "../modules/wswxzj/gov/workbench.html",
    "wswxzj-02": "../modules/wswxzj/gov/duty.html",
    "wswxzj-03": "../modules/wswxzj/gov/collect.html",
    "wswxzj-04": "../modules/wswxzj/gov/roster.html",
    "wswxzj-05": "../modules/wswxzj/gov/usage.html",
    "wswxzj-06": "../modules/wswxzj/gov/pension.html",
    "wswxzj-07": "../modules/wswxzj/gov/settle.html",
    "wswxzj-08": "../modules/wswxzj/gov/monitor.html",
    "wswxzj-09": "../modules/wswxzj/gov/public.html",
    "wssvc-01": "../modules/wssvc/common/workbench.html",
    "wssvc-21": "../modules/wssvc/sign/overview.html",
    "wssvc-03": "../modules/wssvc/sign/signing.html",
    "wssvc-04": "../modules/wssvc/sign/orchestrate.html",
    "wssvc-22": "../modules/wssvc/sign/app-config.html",
    "wssvc-23": "../modules/wssvc/sign/param.html",
    "wssvc-24": "../modules/wssvc/sign/call-log.html",
    "wssvc-25": "../modules/wssvc/sign/api-debug.html",
    "wssvc-26": "../modules/wssvc/direct/overview.html",
    "wssvc-06": "../modules/wsfyh/gov/access.html",
    "wssvc-10": "../modules/wsfyh/gov/recon.html",
    "wssvc-12": "../modules/wsfyh/gov/monitor.html",
    "wssvc-27": "../modules/wssvc/direct/app-config.html",
    "wssvc-28": "../modules/wssvc/direct/param.html",
    "wssvc-29": "../modules/wssvc/direct/call-log.html",
    "wssvc-30": "../modules/wssvc/direct/api-debug.html",
    "wssvc-31": "../modules/wssvc/file/overview.html",
    "wssvc-14": "../modules/wssvc/file/storage.html",
    "wssvc-32": "../modules/wssvc/file/preview-auth.html",
    "wssvc-35": "../modules/wssvc/file/app-config.html",
    "wssvc-36": "../modules/wssvc/file/param.html",
    "wssvc-37": "../modules/wssvc/file/call-log.html",
    "wssvc-38": "../modules/wssvc/file/api-debug.html",
    "wssvc-39": "../modules/wssvc/msg/overview.html",
    "wssvc-16": "../modules/wssvc/msg/channel.html",
    "wssvc-40": "../modules/wssvc/msg/template.html",
    "wssvc-17": "../modules/wssvc/msg/wechat-inner.html",
    "wssvc-18": "../modules/wssvc/msg/notify-rule.html",
    "wssvc-41": "../modules/wssvc/msg/queue-receipt.html",
    "wssvc-42": "../modules/wssvc/msg/blacklist.html",
    "wssvc-43": "../modules/wssvc/msg/cost-stat.html",
    "wssvc-44": "../modules/wssvc/msg/app-config.html",
    "wssvc-45": "../modules/wssvc/msg/param.html",
    "wssvc-46": "../modules/wssvc/msg/call-log.html",
    "wssvc-47": "../modules/wssvc/msg/api-debug.html",
    "wssvc-57": "../modules/wssvc/gov/service-catalog.html",
    "wssvc-58": "../modules/wssvc/gov/app-access.html",
    "wssvc-59": "../modules/wssvc/gov/key-cert.html",
    "wssvc-60": "../modules/wssvc/gov/quota.html",
    "wssvc-61": "../modules/wssvc/gov/monitor.html",
    "wssvc-62": "../modules/wssvc/gov/call-log.html",
    "wssvc-66": "../modules/wssvc/gov/audit.html",
    # 银行端界面留在单位机构端与交易资金监管端，不进统一应用服务平台菜单
    "wssvc-11": "../modules/wsfyh/bank/workbench.html",
    "wssvc-13": "../modules/wsfyh/bank/mortgage.html",
    "wsai-01": "../modules/wsai/common/my-workbench.html",
    "wsai-02": "../modules/wsai/admin/model-library.html",
    "wsai-03": "../modules/wsai/admin/prompt-template.html",
    "wsai-04": "../modules/wsai/admin/knowledge-base.html",
    "wsai-05": "../modules/wsai/handler/assist-fill.html",
    "wsai-06": "../modules/wsai/handler/contract-review.html",
    "wsai-07": "../modules/wsai/handler/listing-verify.html",
    "wsai-08": "../modules/wsai/admin/review-feedback.html",
    "wsai-09": "../modules/wsai/analyst/ask-data.html",
    "wsai-10": "../modules/wsai/analyst/risk-judge.html",
}

def built_pages():
    """扫描 modules/ 下已建成的业务页面，得到「二级菜单 key → 页面路径」映射。

    只认文件名与菜单 key 完全一致的页面（如 wsjcfx-05.html 对应菜单 wsjcfx-05）。
    详情页、档案页这类从列表进入的页面（如 wsjcfx-10-xmda.html）不进映射——
    它们本就不该出现在菜单里。

    语义命名的合并页（如 wscwb/contract-list.html）走 PAGE_OVERRIDES，
    扫描结果之后再覆盖进去，保证重跑生成器时菜单仍指向真页。
    """
    if _BUILT_CACHE:
        return _BUILT_CACHE
    base = os.path.join(ROOT, 'modules')
    if not os.path.isdir(base):
        _BUILT_CACHE.update(PAGE_OVERRIDES)
        return _BUILT_CACHE
    for code in sorted(os.listdir(base)):
        d = os.path.join(base, code)
        if not os.path.isdir(d):
            continue
        for fn in sorted(os.listdir(d)):
            if not fn.endswith('.html'):
                continue
            key = fn[:-5]
            if key.startswith(code + '-') and key.count('-') == 1:
                _BUILT_CACHE[key] = '../modules/%s/%s' % (code, fn)
    _BUILT_CACHE.update(PAGE_OVERRIDES)
    return _BUILT_CACHE


def page_href(key, end):
    """菜单与首页快捷入口共用的取链接口径：建好了就进真页，没建成才回占位页。"""
    return built_pages().get(key) or ('../modules/_pending.html?k=%s&e=%s' % (key, end))


def build_systems(end, subs, menus, vis):
    """一个业务子系统 = 顶栏可切换的一套侧栏菜单：一级菜单分组 + 其下二级菜单。

    一级菜单名为空串的分组，其二级菜单直接作为顶层单项渲染（对应 menu_spec 的约定）。
    """
    out = []
    ext = EXT_SYSTEMS.get(end, [])
    for sub in SUBSYSTEMS:
        if sub['end'] != end and sub['key'] not in ext:
            continue
        tree, keys = [], list(subs[sub['key']]['menus'])
        i = 0
        for gname, entries in sub['menu']:
            kids = []
            for _label, _srcs in entries:
                key = keys[i]
                i += 1
                m = menus[key]
                if key not in vis:
                    continue
                # 占位保号但不展示的菜单（见 HIDDEN_MENUS）：跳过渲染，其后菜单代号不变。
                if key in HIDDEN_MENUS.get(end, set()):
                    continue
                # 「我的工作台」默认就是本端首页，不另设占位页；但子系统若自建了
                # 专属工作台（modules/<代号>/<代号>-01.html），优先进那张真页——
                # 监管监测这类需要在工作台上铺全市总览的子系统就靠这条。
                page = (built_pages().get(key) or 'dashboard.html'
                        if m['label'] == '我的工作台' else page_href(key, end))
                kids.append({'key': key, 'label': m['label'],
                             'icon': menu_icon(m['label'], sub['icon']), 'href': page})
            if not kids:
                continue
            if gname:
                tree.append({'label': gname, 'icon': menu_icon(gname, sub['icon']),
                             'children': [{'key': k['key'], 'label': k['label'],
                                           'href': k['href']} for k in kids]})
            else:
                tree.extend(kids)
        if tree:
            out.append({'key': sub['key'], 'name': sub['name'], 'icon': sub['icon'],
                        'line': sub['line'], 'menu': tree})
    return out


def build_role_menu(end, systems, vis):
    """角色白名单：只列本端菜单代号，顺序与侧栏一致，便于人工核对。"""
    allow = {r: [] for r in END_ROLES[end]}
    for s in systems:
        for it in s['menu']:
            for leaf in (it['children'] if it.get('children') else [it]):
                for r in vis.get(leaf['key'], []):
                    if r in allow:
                        allow[r].append(leaf['key'])
    return allow


def build_nav(end, cfg, subs, menus):
    """导航页数据：本端有哪些业务子系统、各自多大、以哪个身份进去菜单最全。

    导航页按子系统进入，身份只是进入时带的参数，所以每个子系统给出 byRole
    可见二级菜单数，导航页据此标注并挡住该身份进去会空侧栏的子系统。
    """
    out = {'end': end, 'name': END_NAME[end], 'icon': END_ICON[end], 'subs': [],
           'roles': [{'key': r, 'user': ROLES[end][r]['user'],
                      'label': ROLE_LABEL[end][r],
                      'org': ROLES[end][r]['role']} for r in ROLES[end]]}
    for s in cfg['systems']:
        keys = [leaf['key'] for it in s['menu']
                for leaf in (it['children'] if it.get('children') else [it])]
        by_role = {r: len([k for k in ks if k in set(keys)])
                   for r, ks in cfg['roleMenu'].items() if ks is not None}
        out['subs'].append({
            'key': s['key'], 'name': s['name'], 'line': s['line'], 'icon': s['icon'],
            'l1': len(s['menu']), 'l2': len(keys),
            'pts': sum(len(menus[k]['points']) for k in keys),
            'role': max(by_role, key=lambda r: by_role[r]) if by_role else cfg['defaultRole'],
            'byRole': by_role,
        })
    if end == 'mobile':
        # 移动端是单页式 H5，没有 PC 外壳与侧栏，导航页直接进它的首页
        spec = next(x for x in SUBSYSTEMS if x['end'] == 'mobile')
        keys = subs[spec['key']]['menus']
        out['subs'].append({
            'key': spec['key'], 'name': spec['name'], 'line': spec['line'], 'icon': spec['icon'],
            'l1': sum(1 if g else len(entries) for g, entries in spec['menu']),
            'l2': len(keys), 'pts': sum(len(menus[k]['points']) for k in keys),
            'role': cfg['defaultRole'], 'byRole': {}, 'href': 'mobile/home.html',
        })
    return out


# ---------------------------------------------------------------------------
# 四、序列化为 JS
# ---------------------------------------------------------------------------
RAW = '\u0000RAW\u0000'


def js(value, indent=0):
    """把 Python 结构写成可读的 JS 字面量；字符串以 RAW 开头的原样输出。"""
    pad = '  ' * indent
    if isinstance(value, str) and value.startswith(RAW):
        return value[len(RAW):]
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if value is None:
        return 'null'
    if isinstance(value, (int, float)):
        return repr(value)
    if isinstance(value, list):
        if not value:
            return '[]'
        flat = all(isinstance(x, (str, int, float)) and not (isinstance(x, str) and x.startswith(RAW)) for x in value)
        if flat:
            body = ', '.join(js(x) for x in value)
            if len(body) <= 100:
                return '[' + body + ']'
            out, line = [], ''
            for x in value:
                piece = js(x) + ', '
                if len(line) + len(piece) > 96:
                    out.append(pad + '  ' + line.rstrip())
                    line = ''
                line += piece
            if line:
                out.append(pad + '  ' + line.rstrip().rstrip(','))
            return '[\n' + '\n'.join(out) + '\n' + pad + ']'
        items = [pad + '  ' + js(x, indent + 1) for x in value]
        return '[\n' + ',\n'.join(items) + '\n' + pad + ']'
    if isinstance(value, dict):
        if not value:
            return '{}'
        parts = []
        for k, v in value.items():
            key = k if re.match(r'^[A-Za-z_$][A-Za-z0-9_$]*$', k) else json.dumps(k, ensure_ascii=False)
            parts.append(pad + '  ' + key + ': ' + js(v, indent + 1))
        one = '{ ' + ', '.join(p.strip() for p in parts) + ' }'
        if len(one) <= 100 and '\n' not in one:
            return one
        return '{\n' + ',\n'.join(parts) + '\n' + pad + '}'
    raise TypeError(type(value))


def raw(code):
    return RAW + code


# ---------------------------------------------------------------------------
# 五、角色元信息、字典与首页
# ---------------------------------------------------------------------------
ROLES = {
    'government': {
        'window': {'tag': '业务办理端', 'user': '覃永明', 'role': '柳南区交易大厅 · 窗口受理员'},
        'reviewer': {'tag': '业务办理端', 'user': '韦国强', 'role': '市房产交易所 · 业务审核员'},
        'manager': {'tag': '业务办理端', 'user': '李慧', 'role': '市住建局房产科 · 业务管理员'},
        'leader': {'tag': '业务办理端', 'user': '张伟', 'role': '市住建局 · 分管领导'},
        'admin': {'tag': '业务办理端', 'user': '蒙丽华', 'role': '市房产交易所 · 系统管理员'},
        'ops': {'tag': '业务办理端', 'user': '陆志明', 'role': '运维服务商 · 运维工程师'},
    },
    'company': {
        'developer': {'tag': '单位机构端', 'user': '周建国', 'role': 'XXXX市荣和房地产开发有限公司 · 经办人'},
        'agency': {'tag': '单位机构端', 'user': '莫小芳', 'role': 'XXXX市安居房地产经纪有限公司 · 经办人'},
        'bank': {'tag': '单位机构端', 'user': '梁美玲', 'role': '柳州银行营业部 · 监管账户专员'},
    },
    'portal': {
        'citizen': {'tag': '统一服务门户', 'user': '吴明', 'role': '个人用户 · 购房群众'},
        'tenant': {'tag': '统一服务门户', 'user': '黄雅', 'role': '个人用户 · 租赁当事人'},
        'admin': {'tag': '统一服务门户', 'user': '蒙丽华', 'role': '市房产交易所 · 门户管理员'},
    },
    'datacenter': {
        'admin': {'tag': '数据中心', 'user': '蒙丽华', 'role': '市房产交易所 · 数据管理员'},
        'ops': {'tag': '数据中心', 'user': '陆志明', 'role': '运维服务商 · 运维工程师'},
        'leader': {'tag': '数据中心', 'user': '张伟', 'role': '市住建局 · 分管领导'},
    },
    'ai': {
        'admin': {'tag': 'AI 应用', 'user': '蒙丽华', 'role': '市房产交易所 · AI 平台管理员'},
        'reviewer': {'tag': 'AI 应用', 'user': '韦国强', 'role': '市房产交易所 · 业务审核员'},
        'manager': {'tag': 'AI 应用', 'user': '李慧', 'role': '市住建局房产科 · 业务管理员'},
        'leader': {'tag': 'AI 应用', 'user': '张伟', 'role': '市住建局 · 分管领导'},
    },
    'mobile': {
        'citizen': {'tag': '移动端', 'user': '吴明', 'role': '个人用户 · 购房群众'},
        'tenant': {'tag': '移动端', 'user': '黄雅', 'role': '个人用户 · 租赁当事人'},
    },
}

# 导航页胶囊上的身份短名。ROLES 的 role 字段是「单位 · 岗位」，单位机构端三个角色的
# 岗位都叫经办人，直接截取会重名，这里按使用对象给名。
ROLE_LABEL = {
    'government': {'window': '窗口受理人员', 'reviewer': '业务审核人员', 'manager': '业务管理人员',
                   'leader': '分管领导', 'admin': '系统管理员', 'ops': '运维人员'},
    'company': {'developer': '开发企业', 'agency': '经纪机构', 'bank': '监管银行'},
    'portal': {'citizen': '购房群众', 'tenant': '租赁当事人', 'admin': '门户管理员'},
    'datacenter': {'admin': '数据管理员', 'ops': '运维人员', 'leader': '分管领导'},
    'ai': {'admin': 'AI 平台管理员', 'reviewer': '业务审核人员', 'manager': '业务管理人员',
           'leader': '分管领导'},
    'mobile': {'citizen': '购房群众', 'tenant': '租赁当事人'},
}

ROLE_END = {'window': 'government', 'reviewer': 'government', 'manager': 'government',
            'leader': 'government', 'admin': 'government', 'ops': 'government',
            'developer': 'company', 'agency': 'company', 'bank': 'company',
            'citizen': 'portal', 'tenant': 'portal'}

DICT = {
    'said': [['450200', '柳州市本级'], ['450202', '城中区'], ['450203', '鱼峰区'],
             ['450204', '柳南区'], ['450205', '柳北区'], ['450206', '柳江区'],
             ['450222', '柳城县'], ['450223', '鹿寨县'], ['450224', '融安县'],
             ['450225', '融水苗族自治县'], ['450226', '三江侗族自治县']],
    'blzt': [['0', '待受理'], ['1', '办理中'], ['2', '已办结'], ['3', '已撤件'],
             ['4', '已退件'], ['5', '待补正'], ['6', '中止办理'], ['7', '已作废']],
    'shzt': [['0', '待审核'], ['1', '审核中'], ['2', '审核通过'], ['3', '审核不通过'],
             ['4', '退回补正']],
    'sjly': [['01', '窗口办理'], ['02', '统一服务门户'], ['03', '微信小程序'],
             ['04', '自助终端'], ['05', '中介机构端'], ['06', '企业工作台'],
             ['07', '银行端'], ['08', '接口导入'], ['09', '历史数据迁移'],
             ['10', '批量导入'], ['99', '其他']],
    'ywdl': [['01', '商品房交易'], ['02', '存量房交易'], ['03', '房屋租赁'],
             ['04', '抵押与交易限制'], ['05', '政策性住房与安置房'], ['06', '测绘成果与面积'],
             ['07', '房产档案'], ['08', '预售资金监管'], ['09', '存量房资金监管'],
             ['10', '维修资金监管'], ['11', '从业主体与信用'], ['12', '项目监管与好房子'],
             ['13', '查询与出证'], ['14', '更正与撤销'], ['99', '其他']],
    'zjlx': [['01', '居民身份证'], ['02', '户口簿'], ['03', '护照'],
             ['21', '统一社会信用代码证'], ['22', '营业执照'], ['99', '其他']],
    'fwyt': [['01', '成套住宅'], ['02', '非成套住宅'], ['03', '集体宿舍'],
             ['04', '商业服务'], ['05', '办公'], ['06', '工业仓储'],
             ['07', '车库车位'], ['08', '教育医疗'], ['09', '公共设施'], ['99', '其他']],
    # 从业主体类型。本轮收敛为六类：施工与监理企业改由「预售资金监管 > 施工名录库」
    # 维护，住房租赁经营降为经纪机构的经营范围选项，其余类型本期不建设。
    'ztlx': [['01', '房地产开发企业'], ['02', '房地产经纪机构'], ['04', '物业服务企业'],
             ['06', '房产测绘机构'], ['11', '金融机构'], ['05', '房地产估价机构']],
    'xyjb': [['A+', 'A+ 信用优秀'], ['A', 'A 信用良好'], ['B', 'B 信用一般'],
             ['C', 'C 信用较差'], ['D', 'D 信用差']],
    'yesNo': [['1', '是'], ['0', '否']],
    'lvColor': [['blue', '蓝色 · 正常'], ['yellow', '黄色 · 提示'],
                ['orange', '橙色 · 预警'], ['red', '红色 · 严重']],
}


def sc(code, icon, label, color, end):
    """首页快捷入口：与菜单同源，页面建好后一并指向真页。"""
    return {'c': color, 'i': icon, 'l': label, 'h': page_href(code, end)}


def card(title, sub, body, cls='card'):
    head = '<div class="card-head"><h3>%s</h3>%s</div>' % (
        title, ('<span class="sub">%s</span>' % sub) if sub else '')
    return '<div class="%s">%s<div class="card-body">%s</div></div>' % (cls, head, body)


def bar_chart(rows):
    """纯 CSS 柱状图（规范 6.22）。rows = [(标签, 高度百分比, 数值)]"""
    return '<div class="bar-chart">%s</div>' % ''.join(
        '<div class="bar-col"><span class="bar-val">%s</span>'
        '<div class="bar" style="height:%d%%"></div>'
        '<span class="bar-label">%s</span></div>' % (v, h, lb) for lb, h, v in rows)


def rank_table(rows, unit):
    """排行：无 .table-wrap 包裹的 data-table，不触发自动分页增强；进度条用 .progress。"""
    top = max(v for _, v in rows) or 1
    body = ''.join(
        '<tr><td class="nowrap">%d</td><td class="nowrap">%s</td>'
        '<td style="width:52%%"><div class="progress%s"><span style="width:%d%%"></span></div></td>'
        '<td class="num nowrap">%s %s</td></tr>'
        % (i + 1, n, ' green' if i else '', round(v * 100.0 / top), format(v, ','), unit)
        for i, (n, v) in enumerate(rows))
    return ('<table class="data-table"><thead><tr><th>排名</th><th>行政区划</th>'
            '<th>占比</th><th class="num">数量</th></tr></thead><tbody>%s</tbody></table>' % body)


def donut(counts):
    """四色预警环形图 + 图例（规范 6.22）。counts = [(色令牌, 名称, 数量)]"""
    total = sum(c for _, _, c in counts) or 1
    stops, acc = [], 0.0
    for token, _, c in counts:
        a, acc = acc, acc + c * 100.0 / total
        stops.append('var(--lv-%s) %.2f%% %.2f%%' % (token, a, acc))
    legend = ''.join(
        '<div class="lg-item"><span class="lg-color" style="background:var(--lv-%s)"></span> %s'
        '<b style="margin-left:auto">%s</b></div>' % (token, name, format(c, ','))
        for token, name, c in counts)
    return ('<div class="flex items-center gap-16">'
            '<div class="donut" style="background:conic-gradient(%s)">'
            '<div class="donut-hole"><div class="fw-700" style="font-size:22px">%d</div>'
            '<div class="text-3 text-sm">待处置</div></div></div>'
            '<div class="legend" style="flex:1">%s</div></div>'
            % (', '.join(stops), counts[1][2] + counts[2][2] + counts[3][2], legend))


LEADER_BODY = {
    'government': lambda: (
        '<div class="grid-2">'
        + card('四色风险预警分布', '规则型预警，人工确认后进入督办',
               donut([('blue', '蓝色 · 正常', 1842), ('yellow', '黄色 · 提示', 126),
                      ('orange', '橙色 · 预警', 38), ('red', '红色 · 严重', 9)]))
        + card('各县区本月办件量排行', '取数口径与统计报表一致',
               rank_table([('柳州市本级', 1286), ('柳江区', 412), ('鹿寨县', 306), ('柳城县', 268),
                           ('融安县', 184), ('融水苗族自治县', 152), ('三江侗族自治县', 121)], '件'))
        + '</div>'
        + card('本年各月网签套数', '含商品房、存量房、租赁备案',
               bar_chart([('1月', 46, '1,240'), ('2月', 32, '860'), ('3月', 58, '1,560'),
                          ('4月', 65, '1,742'), ('5月', 72, '1,935'), ('6月', 88, '2,364'),
                          ('7月', 96, '2,580')]))),
    'datacenter': lambda: (
        '<div class="grid-2">'
        + card('数据质量问题分级分布', '按核查规则严重程度分级',
               donut([('blue', '蓝色 · 通过', 1862), ('yellow', '黄色 · 提示', 864),
                      ('orange', '橙色 · 待整改', 312), ('red', '红色 · 阻断', 64)]))
        + card('各县区数据完整率', '按行政区划打标后统计',
               rank_table([('柳州市本级', 100), ('柳江区', 99), ('柳城县', 98), ('鹿寨县', 97),
                           ('融安县', 96), ('融水苗族自治县', 94), ('三江侗族自治县', 91)], '%'))
        + '</div>'
        + card('近七月接口调用量', '单位：万次',
               bar_chart([('1月', 52, '268'), ('2月', 41, '212'), ('3月', 60, '306'),
                          ('4月', 68, '348'), ('5月', 74, '378'), ('6月', 86, '440'),
                          ('7月', 64, '326')]))),
    'ai': lambda: (
        '<div class="grid-2">'
        + card('风险线索分级分布', 'AI 出结论，人工做决策',
               donut([('blue', '蓝色 · 正常', 486), ('yellow', '黄色 · 关注', 62),
                      ('orange', '橙色 · 预警', 23), ('red', '红色 · 严重', 6)]))
        + card('各县区高风险主体分布', '模型研判结果，需人工确认',
               rank_table([('柳州市本级', 24), ('柳江区', 9), ('鹿寨县', 7), ('柳城县', 6),
                           ('融安县', 4), ('融水苗族自治县', 3), ('三江侗族自治县', 2)], '家'))
        + '</div>'
        + card('近七月 AI 调用量', '单位：千次',
               bar_chart([('1月', 38, '52'), ('2月', 30, '41'), ('3月', 52, '70'),
                          ('4月', 61, '82'), ('5月', 72, '96'), ('6月', 84, '112'),
                          ('7月', 96, '128')]))),
}


def leader_body(end):
    """分管领导首页：只读，纯 CSS 图表 + 排行，全部使用规范既有 class。"""
    return raw('function (q) { return %s; }'
               % json.dumps(LEADER_BODY[end](), ensure_ascii=False))


def pending_body(title, rows):
    """外壳已搭、业务未建的端，首页给一张待建设清单卡片。rows = [(一级菜单, 二级菜单数, 功能点数)]"""
    items = ''.join(
        '<tr><td class="nowrap">%s</td><td>%s</td><td class="num nowrap">%s</td>'
        '<td class="num nowrap">%s</td><td><span class="badge gray">待建设</span></td></tr>'
        % (i + 1, name, subs, pts) for i, (name, subs, pts) in enumerate(rows))
    tbl = ('<table class="data-table"><thead><tr><th>序号</th><th>一级菜单</th>'
           '<th class="num">二级菜单</th><th class="num">功能点</th><th>状态</th></tr></thead>'
           '<tbody>%s</tbody></table>' % items)
    alert = ('<div class="alert alert-info"><i class="fa-solid fa-circle-info"></i>'
             '<div>本端已搭好外壳、角色与首页，业务栏目按指令逐个一级菜单生成。'
             '页面统一落在 <code>modules/&lt;子系统代号&gt;/</code> 下，与业务办理端同一份文件、'
             '同一套口径，登录身份只影响数据范围。</div></div>')
    return raw('function (q) { return %s; }' % json.dumps(
        alert + card(title, '菜单口径取自《菜单梳理v1.0》', tbl), ensure_ascii=False))


# --- 数据中心首页：数据资源总览。市县一体化后全市一个数据中心、一套数据，
#     首页先回答「有多少数据、什么结构、多大体量、昨天固化没有」，再给待办与入口。
def dc_href(key):
    """首页内部链接：页面建好了进真页，角色参数按目标链接有无问号选 ? 或 &。"""
    h = page_href(key, 'datacenter')
    return h + ('{qa}' if '?' in h else '{q}')


def dc_kpi(color, icon, label, value, trend, key, td='text-3', alarm=False):
    """KPI 统计卡整卡可点，点进对应明细页（PRD：点「待处理质量问题数」跳 wsdata-02）。"""
    return ('<a class="stat-card%s" href="%s" title="查看明细">'
            '<div class="s-icon %s"><i class="fa-solid %s"></i></div><div>'
            '<div class="s-label">%s</div><div class="s-value">%s</div>'
            '<div class="s-trend %s">%s</div></div></a>'
            % (' dc-alarm' if alarm else '', dc_href(key), color, icon, label, value, td, trend))


def dc_todo(rows):
    """待办：默认 5 条，每条直达其处置页；无待办时走 .empty 空状态。"""
    if not rows:
        return ('<div class="empty"><i class="fa-regular fa-face-smile"></i>'
                '<div class="fw-700">暂无待办事项</div>'
                '<div class="text-sm text-3">当前没有需要您处理的事项</div></div>')
    return '<div class="home-todo">%s</div>' % ''.join(
        '<a class="todo-row" href="%s"><span class="badge %s">%s</span>'
        '<span class="todo-text">%s</span><span class="todo-time%s">%s</span></a>'
        % (dc_href(key), c, tag, txt, ' is-warn' if warn else '', time)
        for c, tag, txt, time, warn, key in rows)


def dc_quick(items):
    return '<div class="quick-grid">%s</div>' % ''.join(
        '<a class="quick-item" href="%s"><span class="q-ico %s"><i class="fa-solid %s"></i></span>'
        '<span class="q-label">%s</span></a>' % (dc_href(key), color, icon, label)
        for key, icon, label, color in items)


def dc_panel(title, more_key, more_text, inner):
    more = ('<a class="home-more" href="%s">%s <i class="fa-solid fa-angle-right"></i></a>'
            % (dc_href(more_key), more_text)) if more_key else ''
    return ('<div class="card home-panel"><div class="card-head"><h3>%s</h3>%s</div>'
            '<div class="card-body">%s</div></div>' % (title, more, inner))


def dc_tbl(heads, rows, key=None, tip=''):
    """总览用的紧凑表。heads = [(表头, 是否数值列)]，rows 的单元格已是成品 HTML 片段。"""
    th = ''.join('<th%s>%s</th>' % (' class="num"' if num else '', h) for h, num in heads)
    body = ''
    for cells in rows:
        tds = ''.join('<td%s>%s</td>' % (' class="num nowrap"' if num else '', c)
                      for c, (_, num) in zip(cells, heads))
        body += '<tr>%s</tr>' % tds
    more = ('<div class="text-sm text-3 mt-16"><i class="fa-solid fa-circle-info"></i> %s'
            '<a class="link" href="%s"> 查看明细</a></div>' % (tip, dc_href(key))) if key else ''
    return ('<table class="data-table compact"><thead><tr>%s</tr></thead>'
            '<tbody>%s</tbody></table>%s' % (th, body, more))


def _bg(text, token):
    """行内徽标：token 为色令牌（red/orange/blue/green/cyan/gray）。"""
    return '<span class="badge %s">%s</span>' % (token, text)


def dc_body():
    """数据中心首页：数据资源总览 + 数据异常预警 + 数据交换统计分析 + 数据增长趋势。

    市县一体化后全市一个数据中心、一套数据，不做数据汇聚。首页只回答三件事：
    有多少数据（家底）、哪里出了异常（预警）、对外交换与上报情况（统计分析）。
    """
    alerts = (
        '<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i>'
        '<div>影像存储集群 A 区容量已达 96.2%（阈值 95%），按当前增速预计 3 天写满。'
        '<a class="link" href="' + dc_href('wsdata-05') + '">查看容量</a></div></div>')
    kpis = '<div class="stat-grid">' + ''.join([
        dc_kpi('blue', 'fa-table-cells-large', '纳管数据表', '386 张',
               '覆盖 8 个主题库', 'wsdata-03'),
        dc_kpi('green', 'fa-database', '结构化数据总量', '28.62 亿行',
               '占用 12.4 TB · 日均增 186 万行', 'wsdata-03'),
        dc_kpi('cyan', 'fa-images', '非结构化文件', '1,286 万件',
               '占用 42.8 TB · 日均增 1.6 万件', 'wsdata-05'),
        dc_kpi('purple', 'fa-right-left', '数据交换接口', '46 个',
               '共享中 42 · 停用 4', 'wsdata-10'),
        dc_kpi('orange', 'fa-plug', '今日接口调用量', '12.6 万次',
               '成功率 99.2%', 'wsdata-11', 'text-success'),
        dc_kpi('red', 'fa-paper-plane', '上级报送及时率', '96.8%',
               '住建部 · 住建厅', 'wsdata-14'),
    ]) + '</div>'
    warn = dc_tbl(
        [('预警时间', 0), ('预警类型', 0), ('预警内容', 0), ('涉及对象', 0), ('级别', 0), ('处理状态', 0)],
        [['2026-07-31 22:16', '存储容量', '影像存储集群 A 区容量已达 96.2%（阈值 95%），预计 3 天写满',
          '非结构化存储', _bg('严重', 'red'), _bg('待处理', 'orange')],
         ['2026-07-31 20:08', '接口异常', '税务局房交易税费共享接口 10 分钟内连续超时 6 次',
          '税务局共享接口', _bg('预警', 'orange'), _bg('处理中', 'blue')],
         ['2026-07-31 18:42', '数据质量', '商品房网签备案合同房屋坐落非标准化 1,240 条',
          '商品房网签合同', _bg('提示', 'gray'), _bg('待处理', 'orange')],
         ['2026-07-31 09:02', '报送逾期', '住建部房地产市场监测系统日报 7 月 31 日批次逾期未报',
          '住建部日报', _bg('预警', 'orange'), _bg('已补报', 'green')],
         ['2026-07-30 14:20', '数据一致性', '不动产共享数据与网签合同 3 幢楼栋数不一致',
          '不动产共享', _bg('提示', 'gray'), _bg('已核对', 'green')]])
    exch = dc_tbl(
        [('交换事项', 0), ('对接单位', 0), ('方向', 0), ('频率', 0), ('今日次数', 1),
         ('成功率', 1), ('最近交换', 0), ('状态', 0)],
        [['房地产市场监测日报', '住房和城乡建设部', _bg('上报', 'blue'), '日', '1', '100%',
          '2026-07-31 09:20', _bg('正常', 'green')],
         ['房地产市场监管数据', '自治区住房和城乡建设厅', _bg('上报', 'blue'), '实时', '2,864',
          '99.6%', '2026-08-01 08:00', _bg('正常', 'green')],
         ['存量房交易税费共享', 'XXXX市税务局', _bg('双向共享', 'cyan'), '实时', '4,286', '98.2%',
          '2026-08-01 08:12', _bg('超时预警', 'orange')],
         ['网签与不动产登记共享', '市自然资源和规划局', _bg('双向共享', 'cyan'), '实时', '6,428',
          '99.8%', '2026-08-01 08:14', _bg('正常', 'green')],
         ['政务数据共享', '市大数据发展局', _bg('提供', 'green'), '日', '386', '100%',
          '2026-08-01 07:00', _bg('正常', 'green')],
         ['公积金购房核验共享', '市住房公积金管理中心', _bg('提供', 'green'), '实时', '1,246',
          '99.5%', '2026-08-01 08:10', _bg('正常', 'green')]],
        'wsdata-10', '共享单位、接口配置与逐笔调用日志详见「数据交换服务」。')
    charts = ('<div class="grid-2 mt-16">'
              + card('近 12 个月结构化数据增长趋势', '单位：亿行', bar_chart([
                  ('8月', 62, '24.16'), ('9月', 65, '24.62'), ('10月', 68, '25.08'),
                  ('11月', 71, '25.54'), ('12月', 74, '26.02'), ('1月', 77, '26.46'),
                  ('2月', 79, '26.78'), ('3月', 83, '27.24'), ('4月', 86, '27.66'),
                  ('5月', 90, '28.02'), ('6月', 95, '28.36'), ('7月', 100, '28.62')]))
              + card('近 12 个月非结构化数据增长趋势', '单位：万件', bar_chart([
                  ('8月', 76, '980'), ('9月', 80, '1,030'), ('10月', 82, '1,048'),
                  ('11月', 85, '1,086'), ('12月', 87, '1,120'), ('1月', 90, '1,150'),
                  ('2月', 92, '1,176'), ('3月', 94, '1,204'), ('4月', 96, '1,232'),
                  ('5月', 98, '1,256'), ('6月', 99, '1,272'), ('7月', 100, '1,286')]))
              + '</div>')
    html = (alerts + kpis
            + '<div class="mt-16">'
            + card('数据异常预警', '存储、接口、数据质量、报送逾期等异常统一告警', warn) + '</div>'
            + '<div class="mt-16">'
            + card('数据交换统计分析', '上级上报与部门横向共享运行情况', exch) + '</div>'
            + charts)
    return raw('function (q) { return %s.replace(/\\{q\\}/g, q).replace(/\\{qa\\}/g, q.replace("?", "&")); }'
               % json.dumps(html, ensure_ascii=False))


def menu_outline(sub_key, subs, menus):
    """子系统的一级菜单概览：[(一级菜单名, 二级菜单数, 功能点数)]，顶层单项算一条无下级。"""
    rows, order = [], []
    for key in subs[sub_key]['menus']:
        m = menus[key]
        name = m['group'] or m['label']
        if name not in order:
            order.append(name)
            rows.append([name, 0, 0])
        row = rows[order.index(name)]
        if m['group']:
            row[1] += 1
        row[2] += len(m['points'])
    return [tuple(r) for r in rows]


def homes(end, subs, menus):
    """各角色首页配置。"""
    g = 'government'
    if end == 'government':
        return {
            'window': {
                'welcome': '窗口收件与受理工作台',
                'heroStats': [{'v': '38', 'l': '今日取号'}, {'v': '26', 'l': '今日收件'}, {'v': '5', 'l': '待补正'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-ticket', 'l': '今日取号', 'v': '38', 't': '当前等候 6 人'},
                    {'c': 'green', 'i': 'fa-inbox', 'l': '今日收件', 'v': '26', 't': '↑ 较昨日 +4'},
                    {'c': 'orange', 'i': 'fa-file-circle-exclamation', 'l': '待补正', 'v': '5', 't': '需通知申请人', 'td': 'text-danger'},
                    {'c': 'cyan', 'i': 'fa-stopwatch', 'l': '平均等候', 'v': '8.4 分', 't': '↓ 1.2 分'},
                ],
                'todos': [
                    {'c': 'orange', 'tag': '收件登记', 'txt': '荣和公园大道 3 栋 1802 商品房网签收件待登记', 'time': '剩 2h', 'warn': 1},
                    {'c': 'blue', 'tag': '材料核验', 'txt': '彰泰滨江学府存量房过户材料待核验', 'time': '剩 5h'},
                    {'c': 'red', 'tag': '补正告知', 'txt': 'LZBJ20260218 缺身份证复印件，待一次性告知', 'time': '已超期', 'warn': 1},
                    {'c': 'blue', 'tag': '预约签到', 'txt': '今日 14:00 韦某某 抵押备案预约待签到', 'time': '剩 3h'},
                    {'c': 'green', 'tag': '出件领取', 'txt': 'LZBJ20260196 备案证明待申请人领取', 'time': '剩 1天'},
                    {'c': 'orange', 'tag': '收件登记', 'txt': '阳光100城市广场租赁备案收件待登记', 'time': '剩 4h'},
                    {'c': 'blue', 'tag': '帮办代办', 'txt': '覃某某 老年人代办申请待受理', 'time': '剩 6h'},
                    {'c': 'blue', 'tag': '材料核验', 'txt': '龙光玖珑湖 车位合同网签材料待核验', 'time': '剩 1天'},
                ],
                'shortcuts': [
                    sc('wsbiz-07', 'fa-inbox', '统一收件', 'blue', g),
                    sc('wsbiz-13', 'fa-folder-tree', '材料库管理', 'green', g),
                    sc('wsbiz-10', 'fa-ticket', '预约取号', 'cyan', g),
                    sc('wsbiz-09', 'fa-file-circle-plus', '收件登记', 'orange', g),
                    sc('wscwb-03', 'fa-house-chimney', '存量房签约', 'purple', g),
                    sc('wsdwb-04', 'fa-folder-open', '查档服务', 'red', g),
                ],
            },
            'reviewer': {
                'welcome': '全市房产交易业务审核工作台',
                'heroStats': [{'v': '1,286', 'l': '在办件'}, {'v': '32', 'l': '待我审批'}, {'v': '18', 'l': '超期预警'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-inbox', 'l': '今日收件', 'v': '126', 't': '↑ 较昨日 +18'},
                    {'c': 'cyan', 'i': 'fa-folder-open', 'l': '在办件', 'v': '1,286', 't': '较上月 +12'},
                    {'c': 'red', 'i': 'fa-clock', 'l': '超期预警', 'v': '18', 't': '需优先处理', 'td': 'text-danger'},
                    {'c': 'green', 'i': 'fa-circle-check', 'l': '本月办结', 'v': '862', 't': '按时办结率 94.6%'},
                ],
                'todos': [
                    {'c': 'red', 'tag': '商品房网签', 'txt': '荣和公园大道 1 号楼 12 份合同待备案审核', 'time': '剩 3h', 'warn': 1},
                    {'c': 'orange', 'tag': '预售许可', 'txt': '彰泰滨江学府三期预售许可待复审', 'time': '剩 6h', 'warn': 1},
                    {'c': 'blue', 'tag': '存量房备案', 'txt': '文昌路 128 号 3-2-501 网签即备案待审核', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '抵押备案', 'txt': '柳州银行 8 笔抵押合同备案待审核', 'time': '剩 1天'},
                    {'c': 'orange', 'tag': '资金拨付', 'txt': '保利central park 预售资金拨付 860 万元待审核', 'time': '剩 8h', 'warn': 1},
                    {'c': 'blue', 'tag': '租赁备案', 'txt': '阳光100城市广场 6 份租赁合同待备案', 'time': '剩 2天'},
                    {'c': 'green', 'tag': '面积核验', 'txt': '恒大城 5 栋分层分户测绘成果待核验', 'time': '剩 2天'},
                    {'c': 'blue', 'tag': '政策性住房', 'txt': '房票安置 4 户交易备案待审核', 'time': '剩 3天'},
                ],
                'shortcuts': [
                    sc('wsswb-13', 'fa-building', '商品房备案办理', 'blue', g),
                    sc('wscwb-04', 'fa-house-chimney', '备案过户联办', 'green', g),
                    sc('wszwb-03', 'fa-key', '租赁合同网签备案', 'cyan', g),
                    sc('wsdwb-02', 'fa-lock', '抵押合同备案', 'orange', g),
                    sc('wsszjjg-09', 'fa-sack-dollar', '资金使用管理', 'purple', g),
                    sc('wswxzj-05', 'fa-screwdriver-wrench', '维修资金使用', 'red', g),
                    sc('wssvc-03', 'fa-file-signature', '在线签署管理', 'blue', g),
                    sc('wschcg-05', 'fa-ruler-combined', '面积核验', 'green', g),
                    sc('wsdagl-02', 'fa-box-archive', '档案接收整理', 'cyan', g),
                    sc('wsswb-19', 'fa-house-flag', '政策性住房备案', 'orange', g),
                    sc('wsbiz-16', 'fa-magnifying-glass-chart', '跨业务查询', 'purple', g),
                    sc('wsbiz-03', 'fa-list-check', '待办中心', 'red', g),
                ],
            },
            'manager': {
                'welcome': '全市房产市场与项目监管工作台',
                'heroStats': [{'v': '38', 'l': '待处置预警'}, {'v': '12', 'l': '在办督办单'}, {'v': '186', 'l': '项目在库'}],
                'kpis': [
                    {'c': 'red', 'i': 'fa-triangle-exclamation', 'l': '待处置预警', 'v': '38', 't': '橙色及以上 47 条', 'td': 'text-danger'},
                    {'c': 'orange', 'i': 'fa-flag', 'l': '在办督办单', 'v': '12', 't': '临期 3 单'},
                    {'c': 'blue', 'i': 'fa-diagram-project', 'l': '项目在库', 'v': '186', 't': '保交楼问题项目 7 个'},
                    {'c': 'green', 'i': 'fa-file-contract', 'l': '本月网签量', 'v': '2,580 套', 't': '↑ 9.3%'},
                ],
                'todos': [
                    {'c': 'red', 'tag': '预警处置', 'txt': '万达华府监管账户资金留存低于监管额度', 'time': '剩 4h', 'warn': 1},
                    {'c': 'orange', 'tag': '督办派单', 'txt': '碧桂园天玺湾进度滞后待派单督办', 'time': '剩 1天', 'warn': 1},
                    {'c': 'blue', 'tag': '进度填报', 'txt': '本月 186 个项目进度填报，尚有 23 个未报', 'time': '剩 3天'},
                    {'c': 'blue', 'tag': '信用评价', 'txt': '第三季度经纪机构信用评价待复核', 'time': '剩 5天'},
                    {'c': 'orange', 'tag': '日报编制', 'txt': '房地产市场交易信息日报待审签', 'time': '剩 2h', 'warn': 1},
                    {'c': 'green', 'tag': '好房子认定', 'txt': '地王国际财富中心好房子认定材料待初核', 'time': '剩 4天'},
                    {'c': 'blue', 'tag': '红黑榜', 'txt': '租赁企业红黑榜公示名单待确认', 'time': '剩 6天'},
                    {'c': 'blue', 'tag': '对上报送', 'txt': '住建部网签备案联网上报待复核', 'time': '剩 1天'},
                    {'c': 'orange', 'tag': '主体备案', 'txt': '经纪机构备案申报 8 件待审核，其中 2 件为代理申报', 'time': '剩 1天', 'warn': 1},
                    {'c': 'red', 'tag': '整改复查', 'txt': '中天房地产经纪整改逾期未反馈，待复查或转查处', 'time': '已逾期 50天', 'warn': 1},
                ],
                'shortcuts': [
                    sc('wsjcfx-24', 'fa-triangle-exclamation', '督办闭环管理', 'red', g),
                    sc('wsswb-02', 'fa-diagram-project', '项目库管理', 'blue', g),
                    sc('wsswb-22', 'fa-award', '好房子认定', 'orange', g),
                    sc('wsztxy-12', 'fa-user-shield', '信用评价与档案', 'purple', g),
                    sc('wsztxy-02', 'fa-file-circle-check', '从业企业管理', 'blue', g),
                    sc('wsztxy-05', 'fa-dice', '双随机抽查', 'orange', g),
                    sc('wsjcfx-09', 'fa-table-list', '综合统计分析', 'green', g),
                    sc('wsjcfx-17', 'fa-chart-line', '项目总览', 'cyan', g),
                ],
            },
            'leader': {
                'welcome': '全市房产交易运行总览（只读）',
                'heroStats': [{'v': '186.4 亿', 'l': '本年交易额'}, {'v': '2,580', 'l': '本月网签套数'}, {'v': '47', 'l': '橙红预警'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-coins', 'l': '本年交易额', 'v': '186.4 亿元', 't': '↑ 同比 7.8%'},
                    {'c': 'green', 'i': 'fa-file-contract', 'l': '本月网签套数', 'v': '2,580 套', 't': '↑ 9.3%'},
                    {'c': 'cyan', 'i': 'fa-vault', 'l': '资金监管余额', 'v': '42.7 亿元', 't': '预售 31.2 亿 · 维修 11.5 亿'},
                    {'c': 'red', 'i': 'fa-triangle-exclamation', 'l': '橙红预警', 'v': '47', 't': '需关注', 'td': 'text-danger'},
                ],
                'body': leader_body('government'),
            },
            'admin': {
                'welcome': '平台配置与支撑服务管理',
                'heroStats': [{'v': '486', 'l': '在用账号'}, {'v': '162', 'l': '已配事项'}, {'v': '7', 'l': '政策版本'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-users', 'l': '在用账号', 'v': '486', 't': '本月新增 12'},
                    {'c': 'cyan', 'i': 'fa-user-shield', 'l': '角色数', 'v': '11', 't': '市县两级分级授权'},
                    {'c': 'green', 'i': 'fa-clipboard-list', 'l': '已配事项', 'v': '162', 't': '含 24 个一件事'},
                    {'c': 'orange', 'i': 'fa-scale-balanced', 'l': '政策参数版本', 'v': '7', 't': '市本级 + 六县区'},
                ],
                'todos': [
                    {'c': 'orange', 'tag': '权限审批', 'txt': '柳城县 3 个新账号权限待授权', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '流程发布', 'txt': '存量房带押过户流程 v3 待灰度发布', 'time': '剩 2天'},
                    {'c': 'blue', 'tag': '字典维护', 'txt': '房屋用途字典新增车位子类待确认', 'time': '剩 3天'},
                    {'c': 'red', 'tag': '政策生效', 'txt': '融安县限售年限调整 8 月 1 日生效待复核', 'time': '剩 6h', 'warn': 1},
                    {'c': 'blue', 'tag': '表单绑定', 'txt': '房票安置申请表待绑定流程节点', 'time': '剩 4天'},
                    {'c': 'green', 'tag': '模板管理', 'txt': '商品房买卖合同示范文本 2026 版待启用', 'time': '剩 5天'},
                    {'c': 'blue', 'tag': '消息模板', 'txt': '备案成功短信模板待报备', 'time': '剩 3天'},
                    {'c': 'blue', 'tag': '证书轮换', 'txt': '市房产交易所对外服务证书年度续期', 'time': '剩 12天'},
                ],
                'shortcuts': [
                    sc('wspt-03', 'fa-fingerprint', '统一身份认证', 'blue', g),
                    sc('wspt-08', 'fa-sliders', '基础数据管理', 'green', g),
                    sc('wspt-12', 'fa-clipboard-list', '事项目录定义', 'cyan', g),
                    sc('wspt-17', 'fa-sitemap', '流程建模配置', 'orange', g),
                    sc('wspt-22', 'fa-pen-ruler', '低代码表单', 'purple', g),
                    sc('wspt-27', 'fa-scale-balanced', '政策参数维护', 'red', g),
                ],
            },
            'ops': {
                'welcome': '系统运行监控与运维保障',
                'heroStats': [{'v': '99.95%', 'l': '服务在线率'}, {'v': '6', 'l': '未闭环告警'}, {'v': '9', 'l': '待办工单'}],
                'kpis': [
                    {'c': 'green', 'i': 'fa-heart-pulse', 'l': '服务在线率', 'v': '99.95%', 't': '近 30 天'},
                    {'c': 'red', 'i': 'fa-bell', 'l': '未闭环告警', 'v': '6', 't': '严重 1 条', 'td': 'text-danger'},
                    {'c': 'orange', 'i': 'fa-screwdriver-wrench', 'l': '待办工单', 'v': '9', 't': '超时 2 单'},
                    {'c': 'cyan', 'i': 'fa-plug', 'l': '接口成功率', 'v': '99.2%', 't': '失败重推 14 次'},
                ],
                'todos': [
                    {'c': 'red', 'tag': '告警处置', 'txt': '不动产接口连续 3 次超时待排查', 'time': '剩 1h', 'warn': 1},
                    {'c': 'orange', 'tag': '容量巡检', 'txt': '影像存储集群使用率 82%，建议扩容', 'time': '剩 2天'},
                    {'c': 'blue', 'tag': '版本发布', 'txt': '存量房模块 v2.6 待发布至生产', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '备份校验', 'txt': '本周全量备份恢复演练待执行', 'time': '剩 3天'},
                    {'c': 'green', 'tag': '工单处理', 'txt': '柳江区窗口打印机驱动问题待回访', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '定时任务', 'txt': '日报取数任务执行时长偏长待优化', 'time': '剩 4天'},
                    {'c': 'orange', 'tag': '密评整改', 'txt': '国密改造第二批整改项待复测', 'time': '剩 6天'},
                    {'c': 'blue', 'tag': '割接准备', 'txt': '融水县历史数据迁移校核待安排', 'time': '剩 8天'},
                ],
                'shortcuts': [
                    sc('wsops-02', 'fa-heart-pulse', '运行监控告警', 'red', g),
                    sc('wsops-09', 'fa-shield-halved', '国产化适配', 'blue', g),
                    sc('wsops-13', 'fa-truck-ramp-box', '部署联调管理', 'green', g),
                    sc('wsops-06', 'fa-database', '备份恢复管理', 'cyan', g),
                    sc('wsops-07', 'fa-clock-rotate-left', '定时任务管理', 'orange', g),
                    sc('wspt-06', 'fa-fingerprint', '账号安全管理', 'purple', g),
                ],
            },
        }

    if end == 'company':
        return {
            'developer': {
                'welcome': '开发企业申报工作台 · XXXX市荣和房地产开发有限公司',
                'heroStats': [{'v': '4', 'l': '在建项目'}, {'v': '1,286', 'l': '可售房源'}, {'v': '6', 'l': '待办申报'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-diagram-project', 'l': '在建项目', 'v': '4', 't': '已备案 6 个'},
                    {'c': 'cyan', 'i': 'fa-building', 'l': '可售房源', 'v': '1,286 套', 't': '已售 842 套'},
                    {'c': 'green', 'i': 'fa-file-contract', 'l': '本月网签套数', 'v': '186 套', 't': '↑ 12.4%'},
                    {'c': 'orange', 'i': 'fa-vault', 'l': '监管账户可用余额', 'v': '8,640 万元', 't': '本月可申请拨付 860 万'},
                ],
                'todos': [
                    {'c': 'red', 'tag': '补正申报', 'txt': '荣和公园大道三期预售许可材料需补正', 'time': '剩 5h', 'warn': 1},
                    {'c': 'orange', 'tag': '一房一价', 'txt': '3 号楼 168 套一房一价价格备案待提交', 'time': '剩 1天', 'warn': 1},
                    {'c': 'blue', 'tag': '待签合同', 'txt': '12 份商品房买卖合同待企业签署', 'time': '剩 2天'},
                    {'c': 'orange', 'tag': '许可临期', 'txt': '二期预售许可证 9 月 30 日到期', 'time': '剩 60天'},
                    {'c': 'blue', 'tag': '资金拨付', 'txt': '主体结构封顶节点拨付申请待提交', 'time': '剩 3天'},
                    {'c': 'blue', 'tag': '进度填报', 'txt': '7 月项目建设进度待填报', 'time': '剩 2天'},
                    {'c': 'green', 'tag': '好房子申报', 'txt': '四期好房子亮点材料待补充上传', 'time': '剩 6天'},
                    {'c': 'blue', 'tag': '企业信息', 'txt': '企业资质证书即将到期，请更新', 'time': '剩 21天'},
                ],
                'shortcuts': [
                    sc('wsmh-23', 'fa-diagram-project', '开发企业工作台', 'blue', 'company'),
                    sc('wsswb-09', 'fa-certificate', '现房销售', 'green', 'company'),
                    sc('wsswb-10', 'fa-tags', '一房一价备案', 'cyan', 'company'),
                    sc('wsswb-12', 'fa-file-signature', '合同网签', 'orange', 'company'),
                    sc('wsswb-11', 'fa-list-check', '选房认购', 'purple', 'company'),
                    sc('wsswb-23', 'fa-award', '住房品质信息', 'red', 'company'),
                    sc('wsmh-21', 'fa-building-user', '企业入网备案', 'blue', 'company'),
                    sc('wsztxy-02', 'fa-building-user', '从业企业管理', 'green', 'company'),
                ],
            },
            'agency': {
                'welcome': '经纪机构工作台 · XXXX市安居房地产经纪有限公司',
                'heroStats': [{'v': '36', 'l': '备案经纪人'}, {'v': '14', 'l': '待核验房源'}, {'v': '62', 'l': '本月成交'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-users', 'l': '备案经纪人', 'v': '36', 't': '本月新增 3 人'},
                    {'c': 'orange', 'i': 'fa-house-circle-check', 'l': '待核验房源', 'v': '14', 't': '超 3 天未核验 2 套'},
                    {'c': 'green', 'i': 'fa-handshake', 'l': '本月成交套数', 'v': '62 套', 't': '↑ 8.7%'},
                    {'c': 'cyan', 'i': 'fa-star-half-stroke', 'l': '信用评分', 'v': '92.4', 't': 'A 级 · 红榜'},
                ],
                'todos': [
                    {'c': 'orange', 'tag': '房源核验', 'txt': '文昌路 128 号 3-2-501 房源核验待补充产权材料', 'time': '剩 8h', 'warn': 1},
                    {'c': 'blue', 'tag': '代理签约', 'txt': '4 组买卖双方存量房合同待代理签约', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '租赁备案', 'txt': '6 份租赁合同待提交备案', 'time': '剩 2天'},
                    {'c': 'red', 'tag': '实名登记', 'txt': '2 名新入职经纪人实名登记未完成', 'time': '已超期', 'warn': 1},
                    {'c': 'blue', 'tag': '带押过户', 'txt': '潭中东路 66 号带押过户资料待补齐', 'time': '剩 3天'},
                    {'c': 'green', 'tag': '服务评价', 'txt': '本月 12 条服务评价待回复', 'time': '剩 4天'},
                    {'c': 'blue', 'tag': '门店信息', 'txt': '桂中大道门店营业信息待更新', 'time': '剩 7天'},
                    {'c': 'blue', 'tag': '虚假房源', 'txt': '1 条房源被举报，待申诉说明', 'time': '剩 2天'},
                ],
                'shortcuts': [
                    sc('wscwb-02', 'fa-house-circle-check', '房源采集核验', 'blue', 'company'),
                    sc('wscwb-03', 'fa-file-signature', '合同签约', 'green', 'company'),
                    sc('wszwb-03', 'fa-key', '合同网签备案', 'cyan', 'company'),
                    sc('wsmh-22', 'fa-id-card', '从业人员登记', 'orange', 'company'),
                    sc('wsztxy-03', 'fa-user-group', '从业人员管理', 'purple', 'company'),
                    sc('wsmh-24', 'fa-stamp', '机构服务工作台', 'red', 'company'),
                ],
            },
            'bank': {
                'welcome': '监管银行服务工作台 · 柳州银行营业部',
                'heroStats': [{'v': '86', 'l': '监管账户'}, {'v': '1,240 万', 'l': '今日缴存'}, {'v': '7', 'l': '待复核拨付'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-building-columns', 'l': '监管账户', 'v': '86 个', 't': '预售 62 · 维修 24'},
                    {'c': 'green', 'i': 'fa-arrow-down-to-arc', 'l': '今日缴存额', 'v': '1,240 万元', 't': '笔数 168'},
                    {'c': 'orange', 'i': 'fa-money-check-dollar', 'l': '待复核拨付', 'v': '7 笔', 't': '合计 3,620 万元'},
                    {'c': 'red', 'i': 'fa-not-equal', 'l': '对账差错', 'v': '2 笔', 't': '需当日处理', 'td': 'text-danger'},
                ],
                'todos': [
                    {'c': 'red', 'tag': '对账差错', 'txt': '7 月 30 日日终对账 2 笔金额不一致待处理', 'time': '剩 2h', 'warn': 1},
                    {'c': 'orange', 'tag': '拨付复核', 'txt': '保利central park 拨付 860 万元待复核', 'time': '剩 6h', 'warn': 1},
                    {'c': 'blue', 'tag': '账户备案', 'txt': '龙光玖珑湖二期监管账户开立待回传', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '放款通知', 'txt': '12 笔按揭放款到账通知待推送', 'time': '剩 1天'},
                    {'c': 'green', 'tag': '解付通知', 'txt': '存量房 8 笔资金解付待确认', 'time': '剩 2天'},
                    {'c': 'blue', 'tag': '缴存回传', 'txt': '昨日 168 笔缴存明细待回传核对', 'time': '剩 4h'},
                    {'c': 'blue', 'tag': '接入维护', 'txt': '银行直联接口证书 9 月到期', 'time': '剩 45天'},
                    {'c': 'blue', 'tag': '维修资金', 'txt': '3 个专户行分户账数据待上传', 'time': '剩 3天'},
                ],
                'shortcuts': [
                    sc('wssvc-11', 'fa-building-columns', '银行服务工作台', 'blue', 'company'),
                    sc('wsszjjg-08', 'fa-file-invoice-dollar', '资金归集管理', 'green', 'company'),
                    sc('wsszjjg-09', 'fa-money-check-dollar', '资金使用管理', 'orange', 'company'),
                    sc('wsswb-06', 'fa-hand-holding-dollar', '项目融资登记', 'cyan', 'company'),
                    sc('wsdwb-02', 'fa-scale-unbalanced', '抵押合同备案', 'red', 'company'),
                    sc('wssvc-13', 'fa-vault', '其他机构端', 'purple', 'company'),
                ],
            },
        }

    if end == 'portal':
        p = 'portal'
        return {
            'citizen': {
                'welcome': '统一服务门户 · 个人办事空间',
                'heroStats': [{'v': '2', 'l': '我的房产'}, {'v': '1', 'l': '在办事项'}, {'v': '3', 'l': '待我签署'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-house-user', 'l': '我的房产', 'v': '2 套', 't': '含 1 套在售'},
                    {'c': 'orange', 'i': 'fa-file-signature', 'l': '待我签署', 'v': '3 份', 't': '合同签署剩 2 天', 'td': 'text-danger'},
                    {'c': 'green', 'i': 'fa-list-check', 'l': '在办事项', 'v': '1 件', 't': '存量房过户 · 已受理'},
                    {'c': 'cyan', 'i': 'fa-heart', 'l': '收藏房源', 'v': '12 套', 't': '新房 5 · 二手房 7'},
                ],
                'todos': [
                    {'c': 'orange', 'tag': '合同签署', 'txt': '荣和公园大道 3 栋 1802 买卖合同待签署', 'time': '剩 2天', 'warn': 1},
                    {'c': 'red', 'tag': '材料补正', 'txt': '存量房过户申请需补交身份证明', 'time': '已超期', 'warn': 1},
                    {'c': 'blue', 'tag': '预约签到', 'txt': '城中区交易大厅 今日 14:00 预约取号 A032', 'time': '剩 3h'},
                    {'c': 'green', 'tag': '证明出证', 'txt': '无房证明已出具，可在线下载', 'time': '剩 6天'},
                    {'c': 'blue', 'tag': '资金监管', 'txt': '存量房交易资金已入监管账户，待解付', 'time': '剩 4天'},
                    {'c': 'blue', 'tag': '房源核验', 'txt': '委托挂牌的潭中东路 66 号房源核验通过', 'time': '剩 9天'},
                ],
                'shortcuts': [
                    sc('wsmh-07', 'fa-magnifying-glass', '找房服务', 'blue', p),
                    sc('wsmh-16', 'fa-house-chimney', '二手房自助办理', 'green', p),
                    sc('wsmh-17', 'fa-truck-fast', '二手房进度查询', 'cyan', p),
                    sc('wsmh-26', 'fa-magnifying-glass-chart', '信息查询', 'orange', p),
                    sc('wsmh-27', 'fa-stamp', '证明打印出证', 'purple', p),
                    sc('wsmh-30', 'fa-user', '个人中心', 'red', p),
                ],
            },
            'tenant': {
                'welcome': '统一服务门户 · 住房租赁服务',
                'heroStats': [{'v': '1', 'l': '在租合同'}, {'v': '1', 'l': '待办备案'}, {'v': '8', 'l': '收藏房源'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-key', 'l': '在租合同', 'v': '1 份', 't': '2026-12-31 到期'},
                    {'c': 'orange', 'i': 'fa-file-circle-check', 'l': '待办备案', 'v': '1 件', 't': '租赁合同待提交备案'},
                    {'c': 'green', 'i': 'fa-coins', 'l': '本月租金', 'v': '1,800 元', 't': '低于同小区参考价'},
                    {'c': 'cyan', 'i': 'fa-heart', 'l': '收藏房源', 'v': '8 套', 't': '整租 5 · 合租 3'},
                ],
                'todos': [
                    {'c': 'orange', 'tag': '租赁备案', 'txt': '阳光100城市广场 2-1-702 租赁合同待提交备案', 'time': '剩 1天', 'warn': 1},
                    {'c': 'blue', 'tag': '在线签约', 'txt': '房东已发起续租合同，待承租人签署', 'time': '剩 3天'},
                    {'c': 'green', 'tag': '备案证明', 'txt': '租赁备案证明已生成，可用于落户与入学', 'time': '剩 7天'},
                    {'c': 'blue', 'tag': '政策提示', 'txt': '保障性租赁住房申请指南已更新', 'time': '剩 12天'},
                ],
                'shortcuts': [
                    sc('wsmh-10', 'fa-key', '租房专区', 'blue', p),
                    sc('wsmh-18', 'fa-file-signature', '租房签约备案', 'green', p),
                    sc('wsmh-20', 'fa-circle-info', '租房公共服务', 'cyan', p),
                    sc('wsmh-26', 'fa-magnifying-glass-chart', '信息查询', 'orange', p),
                    sc('wsmh-30', 'fa-user', '个人中心', 'purple', p),
                    sc('wsmh-31', 'fa-headset', '智能客服', 'red', p),
                ],
            },
            'admin': {
                'welcome': '统一服务门户 · 栏目与渠道运营',
                'heroStats': [{'v': '36', 'l': '门户菜单'}, {'v': '24', 'l': '一件事事项'}, {'v': '6', 'l': '待处理咨询'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-globe', 'l': '门户菜单', 'v': '36', 't': '8 个一级栏目'},
                    {'c': 'green', 'i': 'fa-clipboard-list', 'l': '一件事事项', 'v': '24', 't': '已接入一网通办 18'},
                    {'c': 'orange', 'i': 'fa-comments', 'l': '待处理咨询', 'v': '6', 't': '投诉 2 件', 'td': 'text-danger'},
                    {'c': 'cyan', 'i': 'fa-eye', 'l': '昨日访问量', 'v': '1.6 万', 't': '移动端占 62%'},
                ],
                'todos': [
                    {'c': 'orange', 'tag': '栏目发布', 'txt': '好房子专区首页推荐位待更新', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '公示核对', 'txt': '本周预售许可公示数据待核对发布', 'time': '剩 2天'},
                    {'c': 'red', 'tag': '投诉处置', 'txt': '2 件在线咨询投诉超时未回复', 'time': '已超期', 'warn': 1},
                    {'c': 'blue', 'tag': '对接维护', 'txt': '一网通办事项映射新增 3 项待报送', 'time': '剩 3天'},
                    {'c': 'green', 'tag': '站点管理', 'txt': '门户无障碍与适老化改造复检', 'time': '剩 6天'},
                ],
                'shortcuts': [
                    sc('wsmh-02', 'fa-compass', '办事导航', 'blue', p),
                    sc('wsmh-21', 'fa-building-user', '企业入网备案', 'green', p),
                    sc('wsmh-34', 'fa-sliders', '门户框架配置', 'cyan', p),
                    sc('wsmh-35', 'fa-globe', '门户站点管理', 'orange', p),
                    sc('wsmh-36', 'fa-right-left', '一网通办对接', 'purple', p),
                    sc('wsmh-29', 'fa-user-lock', '查询授权留痕', 'red', p),
                ],
            },
        }

    if end == 'datacenter':
        return {
            # KPI、待办、资产表与图表全部由 dc_body 出（PRD 6.1.1）
            'admin': {
                'welcome': '数据中心 · 数据资源总览',
                'heroStats': [{'v': '386', 'l': '纳管数据表'}, {'v': '28.62 亿', 'l': '结构化数据行数'}, {'v': '55.2 TB', 'l': '占用总容量'}],
                'kpis': [],
                'body': dc_body(),
            },
            'ops': {
                'welcome': '数据中心 · 任务与接口监控',
                'heroStats': [{'v': '186', 'l': '调度任务'}, {'v': '4', 'l': '失败任务'}, {'v': '99.2%', 'l': '接口成功率'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-list-check', 'l': '调度任务', 'v': '186', 't': '运行中 12'},
                    {'c': 'red', 'i': 'fa-circle-xmark', 'l': '失败任务', 'v': '4', 't': '需重跑', 'td': 'text-danger'},
                    {'c': 'cyan', 'i': 'fa-plug', 'l': '接口成功率', 'v': '99.2%', 't': '失败重推 14 次'},
                    {'c': 'orange', 'i': 'fa-hard-drive', 'l': '影像存储使用率', 'v': '82%', 't': '建议扩容'},
                ],
                'todos': [
                    {'c': 'red', 'tag': '接口告警', 'txt': '税务局共享接口 10 分钟内连续超时 6 次', 'time': '剩 1h', 'warn': 1},
                    {'c': 'orange', 'tag': '接口告警', 'txt': '住房保障中心对端不可达已 146 分钟', 'time': '剩 4h', 'warn': 1},
                    {'c': 'blue', 'tag': '容量巡检', 'txt': '非结构化存储集群扩容方案待评审', 'time': '剩 3天'},
                    {'c': 'blue', 'tag': '重推处理', 'txt': '14 笔失败报文待重推核对', 'time': '剩 1天'},
                    {'c': 'green', 'tag': '备份校验', 'txt': '贴源库全量备份恢复演练待执行', 'time': '剩 4天'},
                    {'c': 'orange', 'tag': '报送监控', 'txt': '住建部日报 7 月 31 日批次逾期未报', 'time': '剩 8h', 'warn': 1},
                ],
                'shortcuts': [
                    sc('wsdata-11', 'fa-plug', '接口运行监控', 'red', 'datacenter'),
                    sc('wsdata-10', 'fa-right-left', '数据交换服务', 'blue', 'datacenter'),
                    sc('wsdata-05', 'fa-images', '非结构化数据资源', 'orange', 'datacenter'),
                    sc('wsdata-14', 'fa-paper-plane', '报送监控', 'purple', 'datacenter'),
                ],
            },
            'leader': {
                'welcome': '数据资源家底与运行态势（只读）',
                'heroStats': [{'v': '386', 'l': '纳管数据表'}, {'v': '98.6%', 'l': '质量合格率'}, {'v': '326 万', 'l': '接口调用量'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-database', 'l': '纳管数据表', 'v': '386', 't': '贴源 268 · 主题专题 76'},
                    {'c': 'green', 'i': 'fa-circle-check', 'l': '质量合格率', 'v': '98.6%', 't': '↑ 1.2%'},
                    {'c': 'cyan', 'i': 'fa-right-left', 'l': '接口调用量', 'v': '326 万次', 't': '成功率 99.2%'},
                    {'c': 'orange', 'i': 'fa-paper-plane', 'l': '上报及时率', 'v': '96.8%', 't': '住建部 · 住建厅'},
                ],
                'body': leader_body('datacenter'),
            },
        }

    if end == 'ai':
        return {
            'admin': {
                'welcome': '数智大脑 · 模型与知识库管理',
                'heroStats': [{'v': '12', 'l': '在用模型'}, {'v': '8.6 万', 'l': '日调用量'}, {'v': '91.4%', 'l': '智能审核通过率'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-microchip', 'l': '在用模型', 'v': '12', 't': '本地化部署'},
                    {'c': 'cyan', 'i': 'fa-bolt', 'l': '日调用量', 'v': '8.6 万次', 't': '↑ 6.8%'},
                    {'c': 'green', 'i': 'fa-circle-check', 'l': '智能审核通过率', 'v': '91.4%', 't': '误报率 2.6%'},
                    {'c': 'orange', 'i': 'fa-percent', 'l': '平均置信度', 'v': '88.2%', 't': '低于阈值转人工'},
                ],
                'todos': [
                    {'c': 'orange', 'tag': '模型评测', 'txt': '企业信用风险模型 v3 灰度评测待复核', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '提示词管理', 'txt': '智能导办提示词模板待评审', 'time': '剩 2天'},
                    {'c': 'blue', 'tag': '知识库', 'txt': '2026 年新政 12 篇待入库并建索引', 'time': '剩 3天'},
                    {'c': 'red', 'tag': '输出护栏', 'txt': '1 条 AI 答复被投诉，需回溯留痕', 'time': '剩 4h', 'warn': 1},
                    {'c': 'green', 'tag': '样本回流', 'txt': '智能核验误报样本 86 条待回流调优', 'time': '剩 5天'},
                    {'c': 'blue', 'tag': '知识图谱', 'txt': '项目—账户—企业风险传导路径待扩边', 'time': '剩 6天'},
                ],
                'shortcuts': [
                    sc('wsai-02', 'fa-microchip', '模型管理', 'blue', 'ai'),
                    sc('wsai-04', 'fa-book-open', '知识库与图谱', 'green', 'ai'),
                    sc('wsai-03', 'fa-shield-halved', 'AI 输出治理', 'cyan', 'ai'),
                    sc('wsai-05', 'fa-headset', '智能办事助手', 'orange', 'ai'),
                    sc('wsai-10', 'fa-brain', '智能风险研判', 'purple', 'ai'),
                ],
            },
            'reviewer': {
                'welcome': 'AI 辅助审核 · 疑点复核工作台',
                'heroStats': [{'v': '126', 'l': '今日智能审核'}, {'v': '18', 'l': '待人工复核'}, {'v': '88.2%', 'l': '平均置信度'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-file-circle-check', 'l': '今日智能审核', 'v': '126 件', 't': '自动通过 108 件'},
                    {'c': 'orange', 'i': 'fa-user-check', 'l': '待人工复核', 'v': '18 件', 't': '置信度低于阈值'},
                    {'c': 'cyan', 'i': 'fa-percent', 'l': '平均置信度', 'v': '88.2%', 't': 'AI 出结论 人工做决策'},
                    {'c': 'green', 'i': 'fa-id-card', 'l': '证照识别回填', 'v': '862 次', 't': '准确率 96.4%'},
                ],
                'todos': [
                    {'c': 'red', 'tag': '疑点复核', 'txt': '荣和公园大道 3 份合同价格异常疑点待复核', 'time': '剩 3h', 'warn': 1},
                    {'c': 'orange', 'tag': '房源核验', 'txt': '2 套存量房房源真实性智能核验存疑', 'time': '剩 6h', 'warn': 1},
                    {'c': 'blue', 'tag': '材料审核', 'txt': '8 份备案材料智能审核疑点待确认', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '档案编目', 'txt': '126 页档案影像智能编目结果待抽检', 'time': '剩 2天'},
                    {'c': 'green', 'tag': '证照回填', 'txt': '3 条证照识别结果与原件不一致', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '品质核验', 'txt': '好房子申报材料智能核验待复核', 'time': '剩 3天'},
                ],
                'shortcuts': [
                    sc('wsai-06', 'fa-magnifying-glass-plus', '智能审核', 'blue', 'ai'),
                    sc('wsai-07', 'fa-id-card', '智能核验', 'green', 'ai'),
                    sc('wsai-08', 'fa-user-check', '智能审核治理', 'cyan', 'ai'),
                    sc('wsai-03', 'fa-shield-halved', 'AI 输出治理', 'orange', 'ai'),
                ],
            },
            'manager': {
                'welcome': 'AI 智能分析与风险研判',
                'heroStats': [{'v': '24', 'l': '本月智能报告'}, {'v': '38', 'l': '风险线索'}, {'v': '12', 'l': '已确认线索'}],
                'kpis': [
                    {'c': 'blue', 'i': 'fa-chart-pie', 'l': '本月智能报告', 'v': '24 份', 't': '月报 · 专题分析'},
                    {'c': 'orange', 'i': 'fa-brain', 'l': '风险线索', 'v': '38 条', 't': '待人工确认 26 条'},
                    {'c': 'green', 'i': 'fa-check-double', 'l': '已确认线索', 'v': '12 条', 't': '已回流预警督办'},
                    {'c': 'cyan', 'i': 'fa-comments', 'l': '舆情监测', 'v': '6 条', 't': '负面 2 条'},
                ],
                'todos': [
                    {'c': 'orange', 'tag': '线索确认', 'txt': '万达华府资金异动线索待人工确认', 'time': '剩 5h', 'warn': 1},
                    {'c': 'blue', 'tag': '智能问数', 'txt': '上半年各县区成交结构分析待生成', 'time': '剩 1天'},
                    {'c': 'blue', 'tag': '报告审签', 'txt': '7 月市场运行分析报告待审签', 'time': '剩 2天'},
                    {'c': 'red', 'tag': '舆情处置', 'txt': '2 条负面舆情待核实并回应', 'time': '剩 4h', 'warn': 1},
                    {'c': 'green', 'tag': '权重试算', 'txt': '项目风险因子权重模型待试算对比', 'time': '剩 4天'},
                    {'c': 'blue', 'tag': '企业画像', 'txt': '重点开发企业风险画像待复核', 'time': '剩 3天'},
                ],
                'shortcuts': [
                    sc('wsai-09', 'fa-chart-pie', '智能分析报告', 'blue', 'ai'),
                    sc('wsai-10', 'fa-brain', '智能风险研判', 'orange', 'ai'),
                    sc('wsai-04', 'fa-book-open', '知识库与图谱', 'green', 'ai'),
                ],
            },
            'leader': {
                'welcome': 'AI 风险研判与分析报告（只读）',
                'heroStats': [{'v': '38', 'l': '风险线索'}, {'v': '24', 'l': '智能报告'}, {'v': '88.2%', 'l': '平均置信度'}],
                'kpis': [
                    {'c': 'red', 'i': 'fa-brain', 'l': '高风险企业', 'v': '6 家', 't': '模型研判 人工确认', 'td': 'text-danger'},
                    {'c': 'orange', 'i': 'fa-diagram-project', 'l': '高风险项目', 'v': '9 个', 't': '含保交楼 3 个'},
                    {'c': 'blue', 'i': 'fa-chart-pie', 'l': '本月智能报告', 'v': '24 份', 't': '口径与统计报表一致'},
                    {'c': 'cyan', 'i': 'fa-percent', 'l': '平均置信度', 'v': '88.2%', 't': '结论均附依据说明'},
                ],
                'body': leader_body('ai'),
            },
        }

    # mobile：单页式 H5，不走 PC 外壳，配置只用于兜底
    rows = menu_outline('wsyd', subs, menus)
    l2 = sum(r[1] for r in rows)
    pts = sum(r[2] for r in rows)
    base = {'heroStats': [{'v': str(len(rows)), 'l': '一级菜单'},
                          {'v': str(l2), 'l': '二级菜单'}, {'v': str(pts), 'l': '功能点'}],
            'kpis': [], 'body': pending_body('移动端 %d 个一级菜单建设清单' % len(rows), rows)}
    return {'citizen': dict(base, welcome='移动端 · 公众服务（本期只搭外壳）'),
            'tenant': dict(base, welcome='移动端 · 住房租赁（本期只搭外壳）')}


# 顶栏品牌区固定写平台名，端的区分交给品牌名后缀与当前子系统胶囊
PLATFORM_NAME = '华信数智房产交易一体化平台'
END_NAME = {
    'government': '业务办理端',
    'company': '单位机构端',
    'portal': '统一服务门户',
    'datacenter': '数据中心',
    'ai': '数智大脑',
    'mobile': '移动端',
}
END_ICON = {
    'government': 'fa-briefcase', 'company': 'fa-building-user', 'portal': 'fa-globe',
    'datacenter': 'fa-database', 'ai': 'fa-brain', 'mobile': 'fa-mobile-screen-button',
}
# 各端默认进入的业务子系统
DEFAULT_SYSTEM = {'government': 'wsbiz', 'company': 'wsmh', 'portal': 'wsmh',
                  'datacenter': 'wsdata', 'ai': 'wsai'}
DEFAULT_ROLE = {'government': 'reviewer', 'company': 'developer', 'portal': 'citizen',
                'datacenter': 'admin', 'ai': 'admin', 'mobile': 'citizen'}


# ---------------------------------------------------------------------------
# 六之一、样式扩展
# 顶栏三处外观（品牌区、当前子系统胶囊、切换系统弹层）逐条对齐参考工程
# zhfcxm_web/packages/admin/src/layout/components/HxTopbar.vue 的 .hx-topbar--platform 皮肤。
# 其中 --topbar-h 与 .app-topbar 底色是对规范第 10.1 节令牌与组件规则的有意覆盖，
# 不是笔误：参考的顶栏是 64px 深蓝渐变，60px 纯色底放不下 51px logo 与 28px 标题。
# ---------------------------------------------------------------------------
def svg_css_url(name):
    """把 assets/img 下的 svg 读成 CSS 可直接用的 data URI，保持可读的百分号转义而非 base64。"""
    with open(os.path.join(ROOT, 'assets', 'img', name), encoding='utf-8') as f:
        svg = re.sub(r'\s+', ' ', f.read()).strip().replace('"', "'")
    return 'url("data:image/svg+xml,%s")' % quote(svg, safe="/:=;,.()-+*'?!@$&[]{}|~^<> ")


CSS_EXT = '''
/* ==========================================================================
   原型扩展：顶栏品牌区与业务子系统切换（由 tools/gen_config.py 追加）
   视觉基准：zhfcxm_web 的 .hx-topbar--platform 皮肤与 /images/login 下四张装饰图
   ========================================================================== */

/* ---------- 顶栏本体：64px 深蓝渐变 ---------- */
:root { --topbar-h: 64px; }
.app-topbar {
  padding: 0 24px; gap: 12px;
  background: linear-gradient(90deg, #17386f 0%, #2656bb 52%, #1a4a8f 100%);
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  box-shadow: 0 4px 16px rgba(23, 56, 111, .22);
}

/* ---------- 品牌区：51px 裸 logo + 28px 渐变标题 ---------- */
.app-topbar .brand { gap: 10px; padding-right: 0; }
.app-topbar .brand .logo {
  width: auto; height: auto; border-radius: 0; background: none; box-shadow: none; overflow: visible;
}
.app-topbar .brand .logo img { display: block; width: 51px; height: 51px; object-fit: contain; }
.app-topbar .brand .name {
  font-size: 28px; font-weight: 700; letter-spacing: .6px;
  background: linear-gradient(180deg, #fff 0%, #a6c3ff 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}

/* ---------- 当前子系统胶囊：txs.png 底图，右侧 112px 是图里烤好的「切换系统」 ---------- */
.app-topbar .sys-capsule {
  position: relative; display: inline-flex; align-items: stretch; flex-shrink: 0;
  height: 37px; min-width: 280px; padding-right: 112px; margin-left: 50px;
  background: url('../img/txs.png') no-repeat center / 100% 100%;
}
.app-topbar .sys-cur {
  display: inline-flex; align-items: center; height: 37px; min-width: 0; max-width: 30vw;
  padding: 0 45px 0 20px; border: none; background: none;
  color: #fff; font-size: 14px; font-weight: 600; white-space: nowrap;
}
.app-topbar .sys-cur span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.app-topbar .sys-switch-btn {
  position: absolute; top: 0; right: 0; width: 112px; height: 100%;
  padding: 0; border: none; border-radius: 0; background: transparent; cursor: pointer;
}
.app-topbar .sys-switch-btn:hover, .app-topbar .sys-switch-btn.open { background: rgba(255, 255, 255, .08); }

/* ---------- 切换系统弹层：tc.png 城市剪影底 + 白底卡片 ---------- */
.sys-mask {
  position: fixed; inset: 0; z-index: 400; display: none;
  align-items: flex-start; justify-content: center; padding: 64px 24px 24px;
  background: rgba(8, 28, 68, .52); backdrop-filter: blur(2px);
}
.sys-mask.open { display: flex; }
.sys-panel {
  position: relative; box-sizing: border-box; display: flex; flex-direction: column;
  width: min(1120px, calc(100vw - 48px)); max-width: calc(100vw - 48px);
  /* 参考只有三四张卡片所以整块不滚；这里最多 38 张，改成头部固定、网格区内滚 */
  max-height: calc(100vh - 88px);
  padding: 28px 32px 0; border-radius: 16px; color: #fff;
  background: url('../img/tc.png') center bottom / cover no-repeat;
}
.sys-panel-head {
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; margin-bottom: 24px;
}
.sys-panel-title { display: flex; align-items: center; gap: 14px; flex-wrap: nowrap; white-space: nowrap; }
.sys-panel-title h3 { font-size: 28px; font-weight: 700; line-height: 1.2; letter-spacing: 1px; }
.sys-panel-tag {
  display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px;
  background: rgba(255, 255, 255, .14); border: 1px solid rgba(255, 255, 255, .22);
  font-size: 11px; font-weight: 600; letter-spacing: .8px; color: rgba(255, 255, 255, .92);
}
.sys-panel-close {
  width: 32px; height: 32px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
  border: none; border-radius: 50%; background: rgba(255, 255, 255, .12); color: #fff;
  cursor: pointer; transition: background .18s;
}
.sys-panel-close:hover { background: rgba(255, 255, 255, .22); }
.sys-panel-close i { font-size: 16px; pointer-events: none; }
.sys-panel-body { flex: 1; min-height: 0; overflow: auto; padding-bottom: 22px; }
.sys-panel-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, .38); }
.sys-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; justify-content: center; }
.sys-card {
  position: relative; display: block; box-sizing: border-box; width: 100%; min-height: 72px;
  padding: 14px 16px; font: inherit; text-align: left; overflow: hidden; cursor: pointer;
  border: 1px solid rgba(255, 255, 255, .65); border-radius: 8px; background: #fff;
  box-shadow: 0 4px 14px rgba(8, 28, 68, .08);
  transition: transform .18s, box-shadow .18s, border-color .18s;
}
.sys-card:hover { transform: translateY(-2px); border-color: var(--primary); box-shadow: 0 8px 20px rgba(38, 86, 187, .18); }
.sys-card.current { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(38, 86, 187, .22); }
.sys-card-row {
  position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between;
  gap: 12px; width: 100%; min-width: 0;
}
.sys-card .sc-name {
  flex: 1; min-width: 0; font-size: 14px; font-weight: 600; line-height: 1.45; color: var(--primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* zjt.svg / jb.svg 内联成 data URI：矢量数据与参考工程逐字节相同，但不经过 HTTP，
   免得静态服务器把 .svg 的 MIME 报成 image/svg 导致浏览器拒绝渲染 */
.sys-card .sc-go {
  width: 18px; height: 18px; flex-shrink: 0; pointer-events: none;
  background: __ZJT__ no-repeat center / contain;
}
.sys-card .sc-jb {
  position: absolute; right: 0; bottom: 0; width: 40px; height: 40px; pointer-events: none;
  background: __JB__ no-repeat right bottom / contain;
}
.sys-empty { padding: 48px 0; text-align: center; color: rgba(255, 255, 255, .82); font-size: 14px; }
.sys-panel-foot {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex-shrink: 0;
  padding: 14px 0 56px; border-top: 1px solid rgba(255, 255, 255, .18);
}
.sys-panel-foot .lb { font-size: 13px; color: rgba(255, 255, 255, .72); }
.sys-panel-foot a {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 13px;
  border: 1px solid rgba(255, 255, 255, .28); border-radius: 999px;
  background: rgba(255, 255, 255, .12); color: #fff;
}
.sys-panel-foot a:hover { background: rgba(255, 255, 255, .24); border-color: rgba(255, 255, 255, .5); }
.sys-panel-foot a.cur { background: #fff; border-color: #fff; color: var(--primary); }

@media (max-width: 1400px) { .app-topbar .brand .name { font-size: 22px; } }
@media (max-width: 1200px) {
  .app-topbar { padding: 0 16px; }
  .app-topbar .sys-capsule { margin-left: 20px; }
}
@media (max-width: 1024px) {
  .app-topbar .brand .name { display: none; }
  .app-topbar .sys-capsule { margin-left: 8px; min-width: 240px; }
}
@media (max-width: 900px) {
  .sys-panel { width: calc(100vw - 48px) !important; padding: 20px 16px 0; }
  .sys-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .sys-panel-title h3 { font-size: 22px; }
}
@media (max-width: 560px) { .sys-grid { grid-template-columns: minmax(0, 1fr) !important; } }

/* ==========================================================================
   数据中心业务页扩展组件（wsdata）
   只新增 dc- 前缀 class，不改动任何既有设计令牌与组件规则。
   ========================================================================== */
/* 左树右表 / 左表右栏：与 .app-main.list-layout 下已有的 .dc-layout 定高规则配套 */
.dc-layout { display: grid; grid-template-columns: 252px minmax(0, 1fr); gap: 10px; align-items: stretch; }
.dc-layout.rev { grid-template-columns: minmax(0, 1fr) 320px; }
.dc-layout > .card { display: flex; flex-direction: column; }
.dc-layout > .card + .card { margin-top: 0; }
.tab-panel.active > .dc-layout { flex: 1 1 auto; min-height: 0; height: 100%; }
.tab-panel.active > .dc-layout > .card { min-height: 0; overflow: hidden; }

/* Tab 面板内的列表区：仅表格滚动，分页锁在底部（与 .list-body 同规则，但不吃 card-body 内边距） */
.dc-list { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }
.dc-list > .filter-bar,
.dc-list > .alert,
.dc-list > .card-head,
.dc-list > .dc-mini,
.dc-list > .wizard,
.dc-list > .stat-grid { flex-shrink: 0; }
.dc-list > .alert,
.dc-list > .dc-mini,
.dc-list > .wizard,
.dc-list > .stat-grid { margin: 10px 14px 0; }
.dc-list > .wizard { margin-bottom: 4px; }
.dc-list > .table-wrap { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; }
.dc-list > .hint { flex-shrink: 0; order: 10; padding: 0 14px 8px; }
.dc-list > .table-foot {
  flex-shrink: 0; order: 20; margin-top: auto;
  position: sticky; bottom: 0; z-index: 3; background: #fff;
}

/* 定高布局下承载非表格内容的独立滚动区（Tab 面板、说明型卡片内部用） */
.dc-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 12px 14px; }
.dc-scroll.tight { padding: 8px; }

/* 左侧对象树 */
.dc-tree { padding: 8px; font-size: 13.5px; }
.dc-tree .t-node { display: flex; align-items: center; gap: 7px; padding: 7px 10px; border-radius: var(--radius); color: var(--text-2); cursor: pointer; }
.dc-tree .t-node > i { width: 14px; text-align: center; font-size: 12.5px; color: var(--text-3); flex-shrink: 0; }
.dc-tree .t-node:hover { background: var(--bg-soft); color: var(--primary); }
.dc-tree .t-node.on { background: var(--primary-light); color: var(--primary); font-weight: 600; }
.dc-tree .t-node.on > i { color: var(--primary); }
.dc-tree .t-node .t-num { margin-left: auto; font-size: 12px; color: var(--text-3); flex-shrink: 0; }
.dc-tree .t-group > .t-node { color: var(--text-1); font-weight: 600; }
.dc-tree .t-sub > .t-node { padding-left: 30px; }
.dc-tree .t-sub .t-sub > .t-node { padding-left: 48px; }

/* 架构图 / 血缘图 / 链路图：节点 + 箭头 */
.dc-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dc-flow.col { flex-direction: column; align-items: stretch; }
.dc-node { flex: 0 0 auto; min-width: 118px; padding: 8px 12px; text-align: center; background: #fff; border: 1px solid var(--border-strong); border-radius: var(--radius); cursor: pointer; transition: border-color .15s, box-shadow .15s; }
.dc-node:hover { border-color: var(--primary); box-shadow: var(--shadow-sm); }
.dc-node .n-t { font-size: 13px; font-weight: 600; color: var(--text-1); }
.dc-node .n-s { font-size: 12px; color: var(--text-3); margin-top: 2px; }
.dc-node.on { border-color: var(--primary); background: var(--primary-light); }
.dc-node.on .n-t { color: var(--primary); }
.dc-node.plan { border-style: dashed; background: var(--bg-soft); }
.dc-node.plan .n-t { color: var(--text-3); }
.dc-arrow { flex: 0 0 auto; font-size: 13px; color: var(--text-3); }

/* 卡片内的次级统计块（比 .stat-card 紧凑，用于页签内的小结指标） */
.dc-mini { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); gap: 8px; }
.dc-mini .mi { padding: 8px 10px; background: var(--bg-soft); border: 1px solid var(--border); border-radius: var(--radius); }
.dc-mini .mi .mv { font-size: 17px; font-weight: 700; color: var(--text-1); line-height: 1.35; }
.dc-mini .mi .ml { font-size: 12px; color: var(--text-3); }
.dc-mini .mi.ok .mv { color: var(--success); }
.dc-mini .mi.warn .mv { color: #b45309; }
.dc-mini .mi.bad .mv { color: var(--danger); }

/* 状态矩阵：首列为对象名左对齐，其余单元格居中放徽章 */
.dc-matrix th, .dc-matrix td { text-align: center; }
.dc-matrix th:first-child, .dc-matrix td:first-child { text-align: left; }
.dc-matrix .badge { min-width: 64px; justify-content: center; }

/* 页面级说明小字：与 .form-item .hint 同一风格，不影响表单内的既有用法 */
p.hint { font-size: 12.5px; color: var(--text-3); line-height: 1.6; margin-bottom: 0; }
p.hint > i { margin-right: 4px; }

/* 横向条形：排名 / 多维得分等类目型数据，与纵向 .bar-chart 互补 */
.dc-bars { display: flex; flex-direction: column; gap: 9px; }
.dc-bars .b-item { display: grid; grid-template-columns: 88px minmax(0, 1fr) 58px; align-items: center; gap: 10px; }
.dc-bars.wide .b-item { grid-template-columns: 136px minmax(0, 1fr) 70px; }
.dc-bars .b-label { font-size: 12.5px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dc-bars .b-track { height: 10px; border-radius: 5px; background: var(--bg-soft); overflow: hidden; }
.dc-bars .b-fill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, var(--primary) 0%, #60a5fa 100%); transition: width .4s; }
.dc-bars .b-fill.warn { background: linear-gradient(90deg, var(--warning) 0%, #fbbf24 100%); }
.dc-bars .b-fill.bad { background: linear-gradient(90deg, var(--danger) 0%, #f87171 100%); }
.dc-bars .b-val { font-size: 12.5px; font-weight: 600; color: var(--text-1); text-align: right; font-variant-numeric: tabular-nums; }

/* 容量水位补 red 档：与已有的 .progress.green / .progress.orange 组成 70/85/95 三档 */
.progress.red > span { background: var(--danger); }

/* 字段名 / 编码等标识符的行内样式 */
code { font-family: Consolas, Monaco, "Courier New", monospace; font-size: 12.5px; color: var(--text-2); background: var(--bg-soft); padding: 1px 5px; border-radius: 3px; }

/* 报文 / 脚本等大段等宽文本块 */
.dc-code {
  margin: 0; padding: 10px 12px; max-height: 320px; overflow: auto;
  background: var(--bg-soft); border: 1px solid var(--border); border-radius: var(--radius);
  font-family: Consolas, Monaco, "Courier New", monospace; font-size: 12.5px; line-height: 1.7;
  color: var(--text-1); white-space: pre-wrap; word-break: break-all;
}
.dc-code code { background: none; padding: 0; font-size: inherit; color: inherit; }

/* 内部视角切换：与 .tabs 区分，避免与全局 tab 脚本冲突 */
.dc-seg { display: inline-flex; border: 1px solid var(--border-strong); border-radius: var(--radius); overflow: hidden; }
.dc-seg > button {
  height: 30px; padding: 0 14px; border: 0; border-right: 1px solid var(--border);
  background: #fff; color: var(--text-2); font-size: 13px; cursor: pointer;
}
.dc-seg > button:last-child { border-right: 0; }
.dc-seg > button:hover { background: var(--bg-soft); color: var(--primary); }
.dc-seg > button.on { background: var(--primary); color: #fff; font-weight: 600; }

/* 首页工具条：子系统视角切换 + 刷新时间 */
.dc-hb { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.dc-hb .hb-time { margin-left: auto; font-size: 12.5px; color: var(--text-3); }

/* 归零即恢复常态的告警型统计卡：数值非零时整卡置红（如「逾期未报数」） */
.stat-card.dc-alarm { border-color: var(--danger); background: var(--danger-light); }
.stat-card.dc-alarm .s-value, .stat-card.dc-alarm .s-label { color: var(--danger); }
'''


# ---------------------------------------------------------------------------
# 六、运行时补丁
# ---------------------------------------------------------------------------
PATCH_HELPERS = '''
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
    return src.replace(/assets\\/js\\/app\\.js.*$/, 'assets/');
  })();
  var ROOT_BASE = ASSET_BASE.replace(/assets\\/$/, '');

  function sysModulesFor(sys, role) {
    var allow = ROLE_MENU[role];
    return ((sys && sys.menu) || []).filter(function (m) { return !allow || allow.indexOf(m.key) >= 0; });
  }
  function systemsFor(role) {
    return SYSTEMS.filter(function (s) { return sysModulesFor(s, role).length > 0; });
  }
  function sysOfKey(key) {
    var code = String(key || '').replace(/-\\d+$/, '');
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
      var c = APP_CONFIGS[e];
      var r = c.roles[CUR_ROLE] ? CUR_ROLE : c.defaultRole;
      var href = ROOT_BASE + e + '/' + (e === 'mobile' ? 'home.html' : 'shell.html') + '?role=' + r;
      return '<a href="' + href + '"' + (e === END ? ' class="cur"' : '') + '>' +
        '<i class="fa-solid ' + c.endIcon + '"></i>' + c.endName + '</a>';
    }).join('');
    return '<div class="sys-panel">' +
        '<div class="sys-panel-head">' +
          '<div class="sys-panel-title"><h3>切换系统</h3>' +
            '<span class="sys-panel-tag">SWITCH THE SYSTEM</span></div>' +
          '<button type="button" class="sys-panel-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="sys-panel-body">' + body + '</div>' +
        '<div class="sys-panel-foot"><span class="lb">切换应用端</span>' + foot + '</div>' +
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

'''

PATCH_TOPBAR_OLD = """    return '<div class="brand">' +
        '<i class="sidebar-toggle fa-solid fa-bars"></i>' +
        '<div class="logo"><i class="fa-solid fa-city"></i></div>' +
        '<div class="name">' + SYS_NAME + '</div>' +
      '</div>' +"""

PATCH_TOPBAR_NEW = """    /* 补丁 H：品牌区换成上传的市局 logo + 平台名，右接当前子系统胶囊 */
    return '<div class="brand">' +
        '<i class="sidebar-toggle fa-solid fa-bars"></i>' +
        '<div class="logo"><img src="' + ASSET_BASE + 'img/logo.png" alt="XXXX市住房和城乡建设局"></div>' +
        '<div class="name">' + SYS_NAME + '</div>' +
      '</div>' + sysCapsuleHTML() +"""

PATCH_FRAME_OLD = """    frame.addEventListener('load', function () {
      var file = '';
      try { file = (frame.contentWindow.location.pathname.split('/').pop() || '').split('?')[0]; } catch (e) {}
      if (file) {
        highlightMenu(sidebar, file);
        try { history.replaceState(null, '', 'shell.html?role=' + role + '&page=' + file); } catch (e) {}
      }
    });"""

PATCH_FRAME_NEW = """    frame.addEventListener('load', function () {
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
        var page = rel.replace(/([?&])role=[^&]*/, '$1').replace(/[?&]+$/, '').replace(/\\?&/, '?');
        var url = 'shell.html?role=' + role + (CUR_SYS ? '&sys=' + CUR_SYS : '') + '&page=' + encodeURIComponent(page);
        try { history.replaceState(null, '', url); } catch (e) {}
      }
    });"""


def patch_runtime(rt):
    def sub(old, new, label):
        if old not in rt_box[0]:
            sys.exit('补丁落点未命中：' + label)
        rt_box[0] = rt_box[0].replace(old, new, 1)

    rt_box = [rt]

    # 插入三个辅助函数
    sub('  /* ------- 侧边栏菜单 HTML', PATCH_HELPERS.lstrip('\n') + '  /* ------- 侧边栏菜单 HTML', '辅助函数插入点')
    # 二级项：data-key + withRole
    sub("""          html += '<a href="' + c.href + q + '" class="' + (isOn(c) ? 'active' : '') + '">' + c.label + '</a>';""",
        """          html += '<a href="' + withRole(c.href, role) + '" data-key="' + (c.key || '') + '" class="' + (isOn(c) ? 'active' : '') + '">' + c.label + '</a>';""",
        '二级菜单项')
    # 一级单项：data-key + withRole
    sub("""        html += '<a href="' + it.href + q + '" class="menu-single' + (isOn(it) ? ' active' : '') + '"><i class="m-icon fa-solid ' + it.icon + '"></i><span>' + it.label + '</span></a>';""",
        """        html += '<a href="' + withRole(it.href, role) + '" data-key="' + (it.key || '') + '" class="menu-single' + (isOn(it) ? ' active' : '') + '"><i class="m-icon fa-solid ' + it.icon + '"></i><span>' + it.label + '</span></a>';""",
        '一级单项')
    # 补丁 A 接管了角色参数拼接，原 q 变量不再使用
    sub("    var q = role ? ('?role=' + role) : '';\n", '', '角色参数变量')
    # 补丁 G：角色定下来后立刻定当前子系统
    sub("    try { sessionStorage.setItem('app-role', role); } catch (e) {}\n    return role;",
        "    try { sessionStorage.setItem('app-role', role); } catch (e) {}\n"
        "    /* 补丁 G：角色决定可进入哪些业务子系统，先定角色再定当前子系统 */\n"
        "    CUR_ROLE = role;\n"
        "    CUR_SYS = resolveSystem(role);\n"
        "    return role;", '角色解析后定子系统')
    # 补丁 G：侧栏菜单改由当前子系统供给
    sub('    MENU.forEach(function (it) {',
        '    menuOf(CUR_SYS).forEach(function (it) {', '侧栏菜单取当前子系统')
    # 补丁 H：顶栏品牌区与子系统胶囊
    sub(PATCH_TOPBAR_OLD, PATCH_TOPBAR_NEW, '顶栏品牌区')
    # 补丁 I：独立页与外壳分别接上切换系统弹层
    sub("      initMenuSearch(sidebar);\n      ensureSingleActive(sidebar, file);",
        "      initMenuSearch(sidebar);\n      ensureSingleActive(sidebar, file);\n"
        "      /* 补丁 I：独立打开的页面，切换子系统直接跳到该子系统的第一个功能模块 */\n"
        "      initSysSwitch(topbar, function (code) {\n"
        "        var m = firstModuleOf(code);\n"
        "        if (m) { location.href = withRole(m.href, role); return; }\n"
        "        applySystem(code, sidebar);\n"
        "      });", '独立页切换系统')
    sub("    initMenuSearch(sidebar);\n\n    frame.addEventListener('load'",
        "    initMenuSearch(sidebar);\n"
        "    /* 补丁 I：外壳内切换子系统只换侧栏与右侧内容，不整页刷新 */\n"
        "    initSysSwitch(topbar, function (code) {\n"
        "      var m = firstModuleOf(code);\n"
        "      applySystem(code, sidebar);\n"
        "      loadPage(withRole(m ? m.href : 'dashboard.html', role));\n"
        "    });\n\n    frame.addEventListener('load'", '外壳切换系统')
    # iframe load 高亮
    sub(PATCH_FRAME_OLD, PATCH_FRAME_NEW, 'iframe load 高亮')
    # 补丁 J：首页 KPI 交给 body 自行渲染时，不再输出空的统计卡容器
    sub('    html += statCards(cfg.kpis);\n',
        '    /* 补丁 J：KPI 由首页 body 自渲染（数据中心总览）时不输出空的统计卡容器 */\n'
        '    if (cfg.kpis && cfg.kpis.length) html += statCards(cfg.kpis);\n', '首页统计卡')
    return rt_box[0]


# ---------------------------------------------------------------------------
# 七、主流程
# ---------------------------------------------------------------------------
HEADER = '''/* ==========================================================================
   华信数智房产交易一体化平台 · 原型布局与组件引擎 (app.js)
   基线：《前端原型设计规范-政务蓝基线v1.0.md》第 11.3 节
   本文件由 tools/gen_config.py 生成，请勿手工修改；改配置请改生成器后重跑。

   相对基线的改动只有两类，均为「业务页面分目录 + 模块级菜单共用占位页」所必需：
     一、配置区改为多端配置表 APP_CONFIGS，按 URL 的 e 参数 / 目录名 / 角色反查选取；
     二、运行时七处补丁 A~D 与 G~I，见各处行内注释，其余部分与基线逐字一致。
   ========================================================================== */
'''


def main():
    with open(SPEC, encoding='utf-8') as f:
        md = f.read()

    os.makedirs(os.path.join(ROOT, 'assets', 'css'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'assets', 'js'), exist_ok=True)

    # 1. 样式表原样落盘
    css_ext = CSS_EXT.replace('__ZJT__', svg_css_url('zjt.svg')).replace('__JB__', svg_css_url('jb.svg'))
    for heading, out, ext in [('### 10.1 assets/css/app.css', 'assets/css/app.css', css_ext),
                              ('### 10.2 assets/css/mobile.css', 'assets/css/mobile.css', '')]:
        code = extract_block(md, heading) + ext
        with open(os.path.join(ROOT, out), 'w', encoding='utf-8', newline='\n') as f:
            f.write(code)
        print('%-28s %6d 字符' % (out, len(code)))

    # 2. 运行时
    appjs = extract_block(md, '### 11.3 assets/js/app.js 全文')
    marker = '  /* ==========================================================================\n     二、运行时'
    runtime = patch_runtime(appjs[appjs.index(marker):].rstrip())

    # 3. 目录数据
    subs, menus = load_catalog()
    ends = ['government', 'company', 'portal', 'datacenter', 'ai', 'mobile']
    configs = {}
    for end in ends:
        # 移动端不走 PC 外壳，首页是 home.html
        home_page = 'home.html' if end == 'mobile' else 'dashboard.html'
        cfg = {
            'sysName': PLATFORM_NAME,
            'endName': END_NAME[end],
            'endIcon': END_ICON[end],
            'portalHref': '../index.html',
            'defaultRole': DEFAULT_ROLE[end],
            'roles': ROLES[end],
            # 侧栏菜单全部来自当前业务子系统，其第一项「我的工作台」即本端首页
            'menu': [],
        }
        if end in END_ROLES:
            vis = visible_roles(end, subs, menus)
            cfg['systems'] = build_systems(end, subs, menus, vis)
            cfg['defaultSystem'] = DEFAULT_SYSTEM[end]
            cfg['roleMenu'] = build_role_menu(end, cfg['systems'], vis)
        else:
            # 移动端没有 PC 侧栏，留一个首页项兜底
            cfg['menu'] = [{'key': 'dashboard', 'label': '首页', 'icon': 'fa-house', 'href': home_page}]
            cfg['systems'] = []
            cfg['defaultSystem'] = ''
            cfg['roleMenu'] = {r: None for r in ROLES[end]}
        cfg['dict'] = DICT
        cfg['home'] = homes(end, subs, menus)
        configs[end] = cfg
    nav = [build_nav(end, configs[end], subs, menus) for end in ends]

    config_src = (
        "(function () {\n  'use strict';\n\n"
        "  /* ==========================================================================\n"
        "     一、配置区 —— 六端各一份配置，按当前 URL 选取\n"
        "     ========================================================================== */\n"
        "  var APP_CONFIGS = " + js(configs, 1) + ";\n\n"
        "  /* 角色主端反查：业务页面在 modules/ 下，路径里没有端目录名时靠它定端 */\n"
        "  var ROLE_END = " + js(ROLE_END, 1) + ";\n\n"
        "  /* 端的判定：URL 的 e 参数优先，其次目录名，再次角色反查 */\n"
        "  var END = (function () {\n"
        "    var qs = null;\n"
        "    try { qs = new URLSearchParams(location.search); } catch (e) {}\n"
        "    var e0 = qs && qs.get('e');\n"
        "    if (e0 && APP_CONFIGS[e0]) return e0;\n"
        "    var segs = location.pathname.split('/');\n"
        "    for (var i = segs.length - 2; i >= 0; i--) { if (APP_CONFIGS[segs[i]]) return segs[i]; }\n"
        "    /* 业务页面在 modules/<子系统代号>/ 下，目录名就能定端，比按角色反查准 */\n"
        "    var dir = segs[segs.length - 2];\n"
        "    if (dir) {\n"
        "      for (var k in APP_CONFIGS) {\n"
        "        var sys = APP_CONFIGS[k].systems || [];\n"
        "        for (var j = 0; j < sys.length; j++) { if (sys[j].key === dir) return k; }\n"
        "      }\n"
        "    }\n"
        "    var r = (qs && qs.get('role')) || null;\n"
        "    try { r = r || sessionStorage.getItem('app-role'); } catch (e) {}\n"
        "    if (r && ROLE_END[r]) return ROLE_END[r];\n"
        "    return 'government';\n"
        "  })();\n\n"
        "  var APP_CONFIG = APP_CONFIGS[END];\n"
        "  APP_CONFIG.end = END;\n"
        "  window.APP_CONFIG = APP_CONFIG;\n"
        "  window.APP_CONFIGS = APP_CONFIGS;\n\n"
    )

    out = os.path.join(ROOT, 'assets', 'js', 'app.js')
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(HEADER + '\n' + config_src + runtime + '\n')
    print('%-28s %6d 字符' % ('assets/js/app.js', len(HEADER) + len(config_src) + len(runtime)))

    # 4. catalog.js
    cat = {'subs': subs, 'menus': menus, 'nav': nav}
    cat_src = ('/* 业务子系统 / 一级菜单 / 二级菜单 / 二级功能点目录数据\n'
               '   由 tools/gen_config.py 从 tools/menu_spec.py（《菜单梳理v1.0.xlsx》口径）\n'
               '   与《功能板块梳理v1.9.xlsx》生成。menus 供 modules/_pending.html 回填，\n'
               '   nav 供 index.html 渲染各端的业务子系统入口。 */\n'
               'window.CATALOG = ' + js(cat, 0) + ';\n')
    out = os.path.join(ROOT, 'assets', 'js', 'catalog.js')
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cat_src)
    print('%-28s %6d 字符' % ('assets/js/catalog.js', len(cat_src)))

    # 5. modules/ 下按子系统代号建目录，清掉上一版留下的空目录
    mroot = os.path.join(ROOT, 'modules')
    for code in subs:
        os.makedirs(os.path.join(mroot, code), exist_ok=True)
    dropped = []
    for name in sorted(os.listdir(mroot)):
        path = os.path.join(mroot, name)
        if os.path.isdir(path) and name not in subs and not os.listdir(path):
            os.rmdir(path)
            dropped.append(name)
    print('%-28s %6d 个子系统目录' % ('modules/', len(subs)))
    if dropped:
        print('%-28s %6d 个空目录：%s' % ('已清理', len(dropped), '、'.join(dropped)))

    # 6. 统计核对
    print('-' * 78)
    print('%-14s %10s %8s %8s %8s' % ('端', '业务子系统', '一级菜单', '二级菜单', '功能点'))
    for end in ends:
        systems = configs[end]['systems']
        l1 = sum(len(s['menu']) for s in systems)
        l2 = sum(len(it['children']) for s in systems for it in s['menu'] if it.get('children'))
        keys = [leaf['key'] for s in systems for it in s['menu']
                for leaf in (it['children'] if it.get('children') else [it])]
        pts = sum(len(menus[k]['points']) for k in keys)
        print('%-14s %10d %8d %8d %8d' % (end, len(systems), l1, l2, pts))
    print('%-14s %10d %8s %8d %8d'
          % ('菜单主数据', len(subs), '', len(menus), sum(len(m['points']) for m in menus.values())))
    for end in ends:
        rm = configs[end]['roleMenu']
        print('%-14s roleMenu ' % end
              + '  '.join('%s:%s' % (r, '全部' if v is None else len(v)) for r, v in rm.items()))


if __name__ == '__main__':
    main()
