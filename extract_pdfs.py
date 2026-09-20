"""
批量提取 PDF 文本 — 只提取文字版 PDF（跳过扫描件）
策略：先用 pdfplumber 检测是否有可提取文字，没有则跳过
"""
import os
import sys
import re
import pdfplumber

ROOT = r"G:\BaiduNetdiskDownload\高情商话术"
OUT_DIR = r"F:\开发软件项目文件\对练社交\extracted_raw"
os.makedirs(OUT_DIR, exist_ok=True)

# 跳过的关键词（大部头书籍、重复文件）
SKIP_KEYWORDS = ['(1)', '精选好书合集', 'B.精选好书']
SKIP_EXT = {'.downloading', '.baiduyun.p.downloading'}

def sanitize(name):
    """清理文件名"""
    return re.sub(r'[\\/:*?"<>|]', '_', name)

def extract_pdf_text(pdf_path, max_chars_per_page=2000):
    """提取单个 PDF 的文字，返回 (text, is_text_pdf)"""
    text_parts = []
    total_chars = 0
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"=== 第{i+1}页 ===\n{page_text.strip()}")
                    total_chars += len(page_text)
                # 只看前3页判断是否文字版
                if i >= 2 and total_chars < 50:
                    return "", False
    except Exception as e:
        return "", False
    
    if total_chars < 100:
        return "", False
    
    return "\n\n".join(text_parts), True

# 收集待处理 PDF
pdfs = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    for fn in filenames:
        if not fn.lower().endswith('.pdf'):
            continue
        full = os.path.join(dirpath, fn)
        # 跳过重复/下载中
        if any(k in fn for k in SKIP_KEYWORDS):
            continue
        # 大文件（>20MB）跳过（基本都是扫描版大部头）
        try:
            size = os.path.getsize(full)
        except:
            continue
        if size > 20 * 1024 * 1024:
            continue
        pdfs.append((full, size))

pdfs.sort(key=lambda x: x[1])  # 小文件优先

print(f"待处理 PDF: {len(pdfs)} 个（<20MB）")
success = 0
skip_scan = 0
fail = 0

for i, (path, size) in enumerate(pdfs):
    name = sanitize(os.path.splitext(os.path.basename(path))[0]) + '.txt'
    out_path = os.path.join(OUT_DIR, name)
    
    # 跳过已存在
    if os.path.exists(out_path):
        continue
    
    text, is_text = extract_pdf_text(path)
    
    if is_text and text:
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(f"# 来源: {path}\n")
            f.write(text)
        success += 1
        if i % 20 == 0:
            print(f"[{i}/{len(pdfs)}] OK: {os.path.basename(path)} ({len(text)} chars)")
    else:
        skip_scan += 1
        if i % 50 == 0:
            print(f"[{i}/{len(pdfs)}] 跳过扫描件: {os.path.basename(path)}")

print(f"\n=== PDF 提取完成 ===")
print(f"成功提取: {success}")
print(f"跳过扫描件: {skip_scan}")
print(f"输出目录: {OUT_DIR}")

total = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in os.listdir(OUT_DIR) if f.endswith('.txt'))
print(f"已提取 TXT 总大小: {total/1024/1024:.2f} MB")
