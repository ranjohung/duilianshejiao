# -*- coding: utf-8 -*-
"""
批量提取原始资料（PPT/PPTX/PDF）为纯文本 Markdown，按分类输出到 knowledge_base/markdown/
用法: python tools/bulk_extract.py
"""
import os, sys, re, json, time, traceback
from pathlib import Path
from datetime import datetime

# ============ 配置 ============
SRC_ROOT = r"G:\BaiduNetdiskDownload\高情商话术"
DST_ROOT = r"f:\开发软件项目文件\对练社交\knowledge_base\markdown"

# 分类映射：源路径关键字 → 目标目录
CATEGORY_MAP = [
    # 版块12 - 礼仪相关
    ("版块12", "礼仪规范"),
    ("赠送3", "礼仪规范"),
    ("金正昆", "礼仪规范"),
    ("模块11", "礼仪规范"),
    ("茶礼仪", "礼仪规范"),
    # B.精选好书合集
    ("两性情感", "亲密关系"),
    ("人性密学", "人性权谋"),
    ("做局权谋", "人性权谋"),
    ("思维认知", "思维认知"),
    ("职场社交", "职场社交"),
    # 20e利他销售
    ("20e利他", "销售成交"),
    # 顶层酒桌话术
    ("酒桌话术", "职场社交"),
]

# 已在 extra_course_cards.js 中提取过的，跳过
ALREADY_EXTRACTED = {
    "人性买单99招", "变现金句1000条", "让顾客舒服的聊天秘籍",
}

LOG_FILE = os.path.join(os.path.dirname(__file__), "extract_log.json")

def get_category(src_path: str) -> str:
    """根据源路径确定分类目录"""
    for kw, cat in CATEGORY_MAP:
        if kw in src_path:
            return cat
    return "其他资料"

def sanitize_filename(name: str) -> str:
    """清理文件名中的非法字符"""
    name = re.sub(r'[\\/:*?"<>|\r\n\t]+', '_', name)
    name = name.strip().strip('.')
    return name[:120] if len(name) > 120 else name

def extract_with_markitdown(filepath: str) -> str:
    """用 markitdown 提取文本"""
    try:
        from markitdown import MarkItDown
        md = MarkItDown()
        result = md.convert(filepath)
        text = getattr(result, 'text_content', str(result))
        # 清理：去掉 markitdown 的 XML 样式残留
        text = re.sub(r'<[^>]+>', '', text)
        text = text.replace('\x00', '')
        # 合并多余空行
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()
    except Exception as e:
        print(f"  markitdown 失败: {e}")
        return ""

def extract_pdf_fallback(filepath: str) -> str:
    """PyPDF2 备用"""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(filepath)
        pages = []
        for i, page in enumerate(reader.pages):
            try:
                pages.append(page.extract_text() or "")
            except:
                pass
        text = "\n\n--- 第%d页 ---\n\n" % (i+1) + "\n".join(pages)
        text = re.sub(r'\x00', '', text)
        text = re.sub(r'\n{3,}', '\n\n', text).strip()
        return text
    except Exception as e:
        print(f"  PyPDF2 也失败: {e}")
        return ""

def extract_ppt_fallback(filepath: str) -> str:
    """python-pptx 备用（仅 .pptx）"""
    try:
        from pptx import Presentation
        prs = Presentation(filepath)
        lines = []
        for i, slide in enumerate(prs.slides):
            slide_lines = []
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    slide_lines.append(shape.text.strip())
            if slide_lines:
                lines.append(f"## 第{i+1}页\n\n" + "\n\n".join(slide_lines))
        return "\n\n".join(lines).strip()
    except Exception as e:
        print(f"  python-pptx 也失败: {e}")
        return ""

def process_file(filepath: str) -> dict:
    """处理单个文件，返回结果字典"""
    ext = os.path.splitext(filepath)[1].lower()
    filename = os.path.basename(filepath)
    title = os.path.splitext(filename)[0]

    # 跳过已提取的
    for skip_name in ALREADY_EXTRACTED:
        if skip_name in title:
            return {"status": "skip", "reason": f"已在extra_course_cards中: {skip_name}"}

    content = ""

    # 尝试 markitdown
    content = extract_with_markitdown(filepath)

    # 如果为空，尝试备用方案
    if not content:
        if ext == '.pdf':
            content = extract_pdf_fallback(filepath)
        elif ext in ('.pptx',):
            content = extract_ppt_fallback(filepath)
        elif ext == '.ppt':
            # 旧版 .ppt 需要转换，跳过
            return {"status": "skip", "reason": "旧版.ppt格式，需LibreOffice转换"}

    if not content:
        return {"status": "fail", "reason": "提取结果为空"}

    if len(content) < 50:
        return {"status": "fail", "reason": "内容过短，可能是扫描版无文字"}

    return {
        "status": "ok",
        "title": title,
        "content": content,
        "chars": len(content),
    }

def write_markdown(dst_dir: str, title: str, content: str, src_path: str):
    """写入 Markdown 文件"""
    os.makedirs(dst_dir, exist_ok=True)
    safe_title = sanitize_filename(title)
    dst_path = os.path.join(dst_dir, f"{safe_title}.md")

    # 如果已存在同名文件且较大，跳过
    if os.path.exists(dst_path):
        existing = os.path.getsize(dst_path)
        if existing > 1000:
            return None

    # 构造 Markdown 头部
    header = f"# {title}\n\n"
    header += f"> 来源：{src_path}\n"
    header += f"> 提取时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    header += "---\n\n"

    with open(dst_path, 'w', encoding='utf-8') as f:
        f.write(header + content)

    return dst_path

def main():
    print("=" * 60)
    print("批量提取原始资料 PPT/PDF → Markdown")
    print(f"源: {SRC_ROOT}")
    print(f"目标: {DST_ROOT}")
    print("=" * 60)

    # 收集所有文件
    targets = []
    for root, dirs, files in os.walk(SRC_ROOT):
        # 跳过播放器、下载中等
        dirs[:] = [d for d in dirs if '播放器' not in d and '##' not in d]
        for fn in files:
            ext = os.path.splitext(fn)[1].lower()
            if ext in ('.pdf', '.pptx', '.ppt'):
                # 跳过 baiduyun 下载中
                if '.baiduyun' in fn or '.downloading' in fn:
                    continue
                targets.append(os.path.join(root, fn))

    print(f"\n找到 {len(targets)} 个目标文件\n")

    results = {"ok": [], "skip": [], "fail": []}
    start = time.time()

    for i, fpath in enumerate(targets):
        fname = os.path.basename(fpath)
        print(f"[{i+1}/{len(targets)}] {fname}")

        result = process_file(fpath)
        result["src_path"] = fpath

        if result["status"] == "ok":
            cat = get_category(fpath)
            dst_dir = os.path.join(DST_ROOT, cat)
            written = write_markdown(dst_dir, result["title"], result["content"], fpath)
            if written:
                result["dst_path"] = written
                print(f"  ✅ 成功 → {cat} ({result['chars']}字)")
            else:
                result["status"] = "skip"
                result["reason"] = "目标文件已存在且非空"
                print(f"  ⏭️  跳过（已存在）")
            results["ok"].append(result)
        elif result["status"] == "skip":
            print(f"  ⏭️  跳过: {result.get('reason', '')}")
            results["skip"].append(result)
        else:
            print(f"  ❌ 失败: {result.get('reason', '')}")
            results["fail"].append(result)

    elapsed = time.time() - start
    print(f"\n{'='*60}")
    print(f"完成！耗时 {elapsed:.1f}秒")
    print(f"  ✅ 成功: {len(results['ok'])}")
    print(f"  ⏭️  跳过: {len(results['skip'])}")
    print(f"  ❌ 失败: {len(results['fail'])}")
    print(f"{'='*60}")

    # 保存日志
    with open(LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            "time": datetime.now().isoformat(),
            "elapsed_sec": elapsed,
            "summary": {k: len(v) for k, v in results.items()},
            "ok_details": [{"title": r.get("title"), "chars": r.get("chars"), "dst": r.get("dst_path")} for r in results["ok"]],
            "skip_details": [{"src": r.get("src_path"), "reason": r.get("reason")} for r in results["skip"]],
            "fail_details": [{"src": r.get("src_path"), "reason": r.get("reason")} for r in results["fail"]],
        }, f, ensure_ascii=False, indent=2)
    print(f"\n日志已保存: {LOG_FILE}")

if __name__ == "__main__":
    main()
