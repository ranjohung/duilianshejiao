# -*- coding: utf-8 -*-
"""
清理批量提取生成的 Markdown 中的本地路径引用
以及其他用户不想要的痕迹
"""
import os, re, json
from pathlib import Path

DST_ROOT = r"f:\开发软件项目文件\对练社交\knowledge_base\markdown"

# 要清理的模式
CLEAN_PATTERNS = [
    # 删除 "来源：G:\..." 的行
    (r'^\s*>\s*来源[：:]\s*G:\\.*$', '', re.MULTILINE),
    (r'^\s*来源[：:]\s*G:\\.*$', '', re.MULTILINE),
    (r'^\s*>\s*来源[：:].*$', '', re.MULTILINE),
    # 删除 "提取时间：..." 行
    (r'^\s*>\s*提取时间[：:].*$', '', re.MULTILINE),
    # 删除包含 G:\BaiduNetdiskDownload 的任何行
    (r'^.*G:\\BaiduNetdiskDownload.*$', '', re.MULTILINE),
    # 清理开头多余的 > 
    (r'^\s*>\s*\n', '', re.MULTILINE),
    # 合并多余空行
    (r'\n{3,}', '\n\n', 0),
]

def clean_file(path: str) -> int:
    """清理单个文件，返回修改次数"""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    for pattern, replacement, flags in CLEAN_PATTERNS:
        content = re.sub(pattern, replacement, content, flags=flags)

    content = content.strip() + '\n'

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return 1
    return 0

def main():
    count = 0
    total = 0
    for root, dirs, files in os.walk(DST_ROOT):
        for fn in files:
            if fn.endswith('.md'):
                fpath = os.path.join(root, fn)
                total += 1
                try:
                    count += clean_file(fpath)
                except Exception as e:
                    print(f"  错误 {fpath}: {e}")

    print(f"扫描 {total} 个文件，修改 {count} 个")

if __name__ == "__main__":
    main()
