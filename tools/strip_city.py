# -*- coding: utf-8 -*-
"""一次性脚本：清理原型内"柳州市"文字。

三类处理规则（详见 plan）：
  1. 标题类（系统/平台/网站/大屏/终端/公众号）-> 删除"柳州市"
       其中平台名 "柳州市数智房产交易一体化平台" -> "华信数智房产交易一体化平台"
  2. 名称类（机构/企业/法院）-> "柳州市" 改为 "XXXX市"
  3. 区域/地图/地址/证号/政策文件类 -> 保持"柳州市"不动

用法：在 prototype/ 下执行  python tools/strip_city.py         （实际改写）
                        python tools/strip_city.py --dry     （仅预览统计）
"""

import os
import re
import sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)

CITY = '柳州市'

# 处理的文本扩展名
EXTS = {'.html', '.htm', '.js', '.css', '.py', '.md'}

# 整文件跳过（地图/地理数据、纯文件名引用脚本、脚本自身）
SKIP_RELATIVE = {
    os.path.normpath('assets/geo/liuzhou-geo.js'),
    os.path.normpath('assets/js/jc-map-data.js'),
    os.path.normpath('tools/gen_menu.py'),      # 4 处均为 xlsx 文件名引用
    os.path.normpath('tools/strip_city.py'),
}

# --- 规则 1：标题精确映射（最先执行，含"华信"特例） ---
TITLE_EXACT = [
    ('柳州市数智房产交易一体化平台', '华信数智房产交易一体化平台'),
    ('柳州市房地产市场监管监测系统', '房地产市场监管监测系统'),
    ('柳州市房地产市场综合监测大屏', '房地产市场综合监测大屏'),
    ('柳州市房产交易自助服务终端', '房产交易自助服务终端'),
    ('柳州市<em>房产交易</em>管理网', '<em>房产交易</em>管理网'),
    ('柳州市房产交易管理网', '房产交易管理网'),
]

# 名称特例（含空格，回调无法凭后一字符判断）
NAME_EXACT = [
    ('柳州市 CA', 'XXXX市 CA'),
]

# --- 规则 1：标题后缀（去"柳州市"，保留主体名） ---
TITLE_SUFFIX_RE = re.compile(
    r'柳州市([\u4e00-\u9fa5]{1,20}?(?:信息系统|系统|平台|大屏|终端|微信公众号|管理网))'
)

# --- 规则 3：地域/地址/证号/政策 判定用词表 ---
DISTRICTS = ['城中区', '鱼峰区', '柳南区', '柳北区', '柳江区',
             '柳城县', '鹿寨县', '融安县', '融水苗族自治县', '三江侗族自治县']
COURT_RE = re.compile(
    r'^(?:' + '|'.join(DISTRICTS) + r'|中级)?人民法院'
)
GEO_PREFIX = ['本级', '全市', '市区', '行政', '范围', '默认', '地区', '县区', '域', '区', '县']
ADDR_SUFFIX = ('大道', '路', '街', '道', '巷')
# 政策/文件/报表类关键词：token 内含即保留
DOC_KEYWORDS = ['规则', '政策', '细则', '办法', '报表', '统计表', '日报', '月报',
                '标准', '门槛', '参数', '措施', '通知', '公告', '意见', '方案', '十条']

CJK_RE = re.compile(r'^[\u4e00-\u9fa5]+')


def decide(after: str) -> str:
    """给定 '柳州市' 之后的文本，返回替换结果（'柳州市' 保留 / 'XXXX市' 改写）。"""
    # 法院：优先于地址（避免 "柳州市城中区人民法院" 被当成地址）
    if COURT_RE.match(after):
        return 'XXXX市'
    # 后一字符非中文（空格 / 标点 / < / 引号 / 结尾）-> 独立地名，保留
    m = CJK_RE.match(after)
    if not m:
        return CITY
    token = m.group()
    # 证号：不动产权第 / 不动产证明第
    if token.startswith('不动产权') or token.startswith('不动产证明'):
        return CITY
    # 政策/报表/文件名关键词
    if any(k in token for k in DOC_KEYWORDS):
        return CITY
    # 行政区划 / 区域范围词
    for p in GEO_PREFIX:
        if token.startswith(p):
            return CITY
    for d in DISTRICTS:
        if token.startswith(d):
            return CITY
    # 地址（道路名结尾）
    if token.endswith(ADDR_SUFFIX):
        return CITY
    # 默认：机构 / 企业 名称
    return 'XXXX市'


def mask_titles(text):
    """遮蔽 《...》 中含"柳州市"的书名号引用（政策/文件/表册名），整体保留。"""
    store = {}

    def _m(mo):
        s = mo.group(0)
        if CITY in s:
            key = '\x00MASK%d\x00' % len(store)
            store[key] = s
            return key
        return s

    text = re.sub(r'《[^》]*》', _m, text)
    return text, store


def unmask(text, store):
    for k, v in store.items():
        text = text.replace(k, v)
    return text


def transform(text):
    text, store = mask_titles(text)
    for src, dst in TITLE_EXACT:
        text = text.replace(src, dst)
    for src, dst in NAME_EXACT:
        text = text.replace(src, dst)
    text = TITLE_SUFFIX_RE.sub(lambda mo: mo.group(1), text)
    text = re.sub(CITY, lambda mo: decide(text[mo.end():mo.end() + 12]), text)
    text = unmask(text, store)
    return text


def main():
    dry = '--dry' in sys.argv
    changed_files = 0
    total_before = 0
    total_after = 0
    for dirpath, _dirs, files in os.walk(ROOT):
        for fn in files:
            ext = os.path.splitext(fn)[1].lower()
            if ext not in EXTS:
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.normpath(os.path.relpath(full, ROOT))
            if rel in SKIP_RELATIVE:
                continue
            with open(full, 'r', encoding='utf-8') as f:
                src = f.read()
            if CITY not in src:
                continue
            before = src.count(CITY)
            out = transform(src)
            after = out.count(CITY)
            total_before += before
            total_after += after
            if out != src:
                changed_files += 1
                if not dry:
                    with open(full, 'w', encoding='utf-8', newline='') as f:
                        f.write(out)
                print('[%s] %s  柳州市 %d -> %d' %
                      ('DRY' if dry else 'FIX', rel, before, after))
    print('-' * 60)
    print('文件改动：%d 个；柳州市 总数 %d -> %d（保留 %d 处为地域/地址/证号/政策）'
          % (changed_files, total_before, total_after, total_after))


if __name__ == '__main__':
    main()
