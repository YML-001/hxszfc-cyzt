# -*- coding: utf-8 -*-
"""原型自检：把「页面能不能打开、点了会不会 404、外壳能不能认出这一页」这几件事跑一遍。

检查项
  1. 页面骨架：data-role / data-active 齐全，data-active 与文件名（菜单代号）一致；
     引入的 app.css / app.js 路径按目录层级正确，能在磁盘上找到。
  2. 死链：页面内 href 指向的本地文件必须存在（# / javascript: / http(s) 除外）。
  3. 菜单：app.js 里所有菜单 href 与首页快捷入口链接，落到磁盘上必须存在。
  4. 表格增强：.table-wrap 内的 table 必须是 .data-table，且有 thead + tbody，
     否则 app.js 的分页 / 空态增强会挂空。

用法：python tools/check_pages.py   （在 prototype 目录下跑，退出码非 0 表示有问题）
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rel(path):
    return os.path.relpath(path, ROOT).replace('\\', '/')


def html_files():
    for base, _dirs, files in os.walk(ROOT):
        if os.sep + 'tools' in base:
            continue
        for f in sorted(files):
            if f.endswith('.html'):
                yield os.path.join(base, f)


def local_targets(text):
    """页面里指向本地文件的链接。只认标签上的 href / src：data-src 等自定义属性放数据、
    脚本里拼出来的字符串放变量，都不是链接，避免误报。"""
    for m in re.finditer(r'(?<![-\w])(?:href|src)="([^"]+)"', text):
        url = m.group(1).strip()
        if not url or url.startswith(('#', 'javascript:', 'mailto:', 'http://', 'https://', 'data:')):
            continue
        if "'" in url or '+' in url or '${' in url:  # 脚本拼接出来的地址，静态查不了
            continue
        yield url.split('#')[0].split('?')[0]


def check_page(path, errors):
    with open(path, encoding='utf-8') as f:
        text = f.read()
    name = os.path.splitext(os.path.basename(path))[0]
    here = os.path.dirname(path)
    is_module = os.sep + 'modules' + os.sep in path
    # 统一服务门户是自带 portal.css 与状态引擎的独立站点，不套平台外壳、不吃 app.js 的
    # 列表增强，骨架与表格增强两项都不按平台口径校验，只留死链检查
    is_portal_site = os.path.join('modules', 'wsmh') + os.sep in path
    if is_portal_site:
        is_module = False

    # 1. 页面骨架
    if is_module and name != '_pending':
        if not re.search(r'<body[^>]*data-role=', text):
            errors.append('%s：缺 data-role' % rel(path))
        m = re.search(r'<body[^>]*data-active="([^"]*)"', text)
        if not m:
            errors.append('%s：缺 data-active' % rel(path))
        elif not name.startswith(m.group(1)):
            # 详情 / 子页（wsztxy-02-detail 之类）挂在其菜单代号上高亮父级，属正常
            errors.append('%s：data-active=%s 与文件名不一致' % (rel(path), m.group(1)))
        for asset in ('assets/css/app.css', 'assets/js/app.js'):
            if asset not in text:
                errors.append('%s：未引入 %s' % (rel(path), asset))

    # 2. 死链
    for url in local_targets(text):
        if not os.path.exists(os.path.normpath(os.path.join(here, url))):
            errors.append('%s：死链 %s' % (rel(path), url))

    # 3. 表格增强前提：直接包着表格的 .table-wrap 才是分页增强的落点，
    #    包着整块面板当滚动容器的那种不算
    for attrs, block in (() if is_portal_site else
                         re.findall(r'<div class="table-wrap"[^>]*>\s*<table([^>]*)>(.*?)</table>', text, re.S)):
        if 'data-table' not in attrs:
            errors.append('%s：.table-wrap 内的表格未用 .data-table' % rel(path))
        if '<thead' not in block or '<tbody' not in block:
            errors.append('%s：.table-wrap 内的表格缺 thead 或 tbody' % rel(path))


JS_KEYWORDS = {
    'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'new', 'do',
    'else', 'try', 'delete', 'void', 'in', 'of', 'this',
}
JS_BUILTINS = {
    'alert', 'confirm', 'prompt', 'setTimeout', 'setInterval', 'clearTimeout', 'parseInt',
    'parseFloat', 'isNaN', 'Number', 'String', 'Boolean', 'Array', 'Object', 'JSON', 'Date',
    'Math', 'RegExp', 'encodeURIComponent', 'decodeURIComponent', 'require',
}


def check_inline_handlers(path, errors, stat):
    """on* 属性里调用的函数必须在本页定义，否则点下去就是一条控制台报错。"""
    with open(path, encoding='utf-8') as f:
        text = f.read()
    scripts = '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', text, re.S))
    defined = set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(', scripts))
    defined |= set(re.findall(r'(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*function', scripts))
    defined |= set(re.findall(r'window\.([A-Za-z_$][\w$]*)\s*=', scripts))
    for handler in re.findall(r'\son[a-z]+="([^"]*)"', text):
        stat[0] += 1
        for fn in re.findall(r'(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(', handler):
            if fn in JS_KEYWORDS or fn in JS_BUILTINS or fn in defined or fn == 'PMS':
                continue
            errors.append('%s：on 事件调用了未定义的 %s()' % (rel(path), fn))


def check_appjs(errors):
    js = os.path.join(ROOT, 'assets', 'js', 'app.js')
    with open(js, encoding='utf-8') as f:
        text = f.read()
    # 菜单与快捷入口的相对路径都以业务端目录（datacenter / government ...）为基准
    ends = [d for d in os.listdir(ROOT)
            if os.path.isdir(os.path.join(ROOT, d)) and d not in ('assets', 'modules', 'tools')]
    for m in re.finditer(r'(?:href|h):\s*"([^"]+)"', text):
        url = m.group(1).split('#')[0].split('?')[0]
        if not url or url.startswith(('http', '#', 'javascript:')):
            continue
        if not any(os.path.exists(os.path.normpath(os.path.join(ROOT, e, url))) for e in ends):
            errors.append('assets/js/app.js：菜单链接找不到文件 %s' % url)


def main():
    errors, pages, stat = [], 0, [0]
    for path in html_files():
        pages += 1
        check_page(path, errors)
        check_inline_handlers(path, errors, stat)
    check_appjs(errors)

    print('自检页面数：%d，交互事件数：%d' % (pages, stat[0]))
    if errors:
        for e in sorted(set(errors)):
            print('  ✗ ' + e)
        print('共 %d 处问题' % len(set(errors)))
        return 1
    print('  ✓ 骨架、死链、菜单链接、表格增强前提全部通过')
    return 0


if __name__ == '__main__':
    sys.exit(main())
