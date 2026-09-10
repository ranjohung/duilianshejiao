# -*- coding: utf-8 -*-
"""扫描 G:\\BaiduNetdiskDownload\\高情商话术，产出真实课程目录清单。"""
import os, json, re, sys

ROOT = r"G:\BaiduNetdiskDownload\高情商话术"
OUT_JSON = r"F:\开发软件项目文件\对练社交\knowledge_base\asset_index.json"
OUT_MD = r"F:\开发软件项目文件\对练社交\knowledge_base\markdown\原始资料清单.md"

VIDEO_EXT = {'.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv'}
AUDIO_EXT = {'.mp3', '.wav', '.m4a', '.aac', '.flac'}
DOC_EXT = {'.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx', '.wps', '.epub'}

def walk_all(root):
    items = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames.sort()
        for fn in sorted(filenames):
            full = os.path.join(dirpath, fn)
            try:
                size = os.path.getsize(full)
            except OSError:
                size = 0
            ext = os.path.splitext(fn)[1].lower()
            items.append({
                'dir': os.path.relpath(dirpath, root),
                'name': fn,
                'ext': ext,
                'size': size,
            })
    return items

def main():
    items = walk_all(ROOT)
    by_top = {}
    for it in items:
        top = it['dir'].split(os.sep)[0]
        by_top.setdefault(top, []).append(it)

    summary = {}
    for top, lst in by_top.items():
        kinds = {}
        for it in lst:
            k = ('video' if it['ext'] in VIDEO_EXT else
                 'audio' if it['ext'] in AUDIO_EXT else
                 'doc' if it['ext'] in DOC_EXT else 'other')
            kinds[k] = kinds.get(k, 0) + 1
        summary[top] = {'files': len(lst), 'kinds': kinds}

    # 课程级：含音视频的目录 → 课时列表
    courses = {}
    for it in items:
        if it['ext'] in VIDEO_EXT or it['ext'] in AUDIO_EXT:
            courses.setdefault(it['dir'], []).append(it['name'])

    # 文档类：按完整目录分组（覆盖全部资料，不遗漏任何子目录）
    books = {}
    for it in items:
        if it['ext'] in DOC_EXT:
            books.setdefault(it['dir'], []).append(it['name'])

    out = {
        'root': ROOT,
        'total_files': len(items),
        'by_top': summary,
        'courses': {k: sorted(v) for k, v in sorted(courses.items())},
        'books': {k: sorted(v) for k, v in sorted(books.items())},
    }
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    # markdown 清单
    lines = ['# 原始资料清单（真实扫描，2026-09-10 重建）', '',
             '> 根目录：`%s`。共 %d 个文件。' % (ROOT, len(items)), '',
             '## 顶层分组', '', '| 分组 | 文件数 | 构成 |', '|---|---|---|']
    for top, s in summary.items():
        comp = ' / '.join('%s %d' % (k, v) for k, v in s['kinds'].items())
        lines.append('| %s | %d | %s |' % (top, s['files'], comp))
    lines += ['', '## 音视频课程（按课时）', '']
    for d, fs in sorted(courses.items()):
        lines.append('### %s （%d 课时）' % (d, len(fs)))
        for i, fn in enumerate(fs, 1):
            lines.append('%d. %s' % (i, fn))
        lines.append('')
    lines += ['## 电子书合集', '']
    for d, fs in sorted(books.items()):
        lines.append('### %s （%d 本）' % (d, len(fs)))
        for i, fn in enumerate(fs, 1):
            lines.append('%d. %s' % (i, fn))
        lines.append('')
    with open(OUT_MD, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(json.dumps(summary, ensure_ascii=False, indent=1))
    print('courses dirs:', len(courses), 'books groups:', len(books))

if __name__ == '__main__':
    main()
