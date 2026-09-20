"""
batch_extract_docs.py — 批量提取高情商话术全库文本文件 → Markdown 分类归档

技术栈:
  PDF:   pymupdf (fitz) — 保留段落/标题结构
  DOCX:  python-docx — 保留标题/列表/段落
  DOC:   Word COM → 先转 docx 再提取
  PPTX:  python-pptx — 每页标题+正文
  PPT:   PowerPoint COM → 先转 pptx 再提取
  TXT:   直接读 + UTF-8/GBK/GB18030 智能检测

归档分类（按来源自动映射）:
  knowledge_base/01-高情商接话话术/   ← 580好好接话电子版/ (DOCX/PDF/TXT)
  knowledge_base/02-销售话术300套/   ← 580好好接话电子版/各行业销售话术300套
  knowledge_base/03-送礼话术全攻略/   ← 送礼话术技巧全攻略/
  knowledge_base/04-职场社交提升/     ← 综合提升大合集/职场社交提升14本合集 + B.精选好书/职场社交55本
  knowledge_base/05-礼仪培训/         ← 版块12--礼仪培训大全集/ (PPT+PPTX+TXT)
  knowledge_base/06-人性认知思维/     ← 综合提升大合集/说话的艺术6本 + B.精选好书/人性密学66 + 思维认知54
  knowledge_base/07-赚钱营销提升/     ← 综合提升大合集/赚钱营销提升27本 + 20e利他销售资料合集(PDF)
  knowledge_base/08-两性情感/         ← B.精选好书/两性情感53本大合集
  knowledge_base/09-权谋思维/         ← B.精选好书/做局权谋67本合集
  knowledge_base/10-利他销售音频课/   ← 20e利他销售资料合集/ (MP3 先不处理，PDF 归类到 07)
  knowledge_base/19-礼仪培训PPT/      ← 版块12 PPT/PPTX（已由 extract_ppt.py 处理）
  knowledge_base/20-礼仪培训视频转写/  ← 版块12 视频（已由 transcribe_videos.py 处理）

进度持久化: knowledge_base/_extract_done.json → 中断可续跑
"""
import os, sys, json, time, re, traceback
from pathlib import Path
from collections import defaultdict

# --- CUDA DLL (不影响本文本提取，但有备无患) ---
_NVIDIA_BIN = Path(r"C:\Python314\Lib\site-packages\nvidia")
for _sub in ('cublas/bin', 'cudnn/bin', 'cuda_nvrtc/bin'):
    _p = _NVIDIA_BIN / _sub
    if _p.exists():
        os.environ['PATH'] = str(_p) + ';' + os.environ.get('PATH', '')

# ============ 路径配置 ============
SRC = Path(r"G:\BaiduNetdiskDownload\高情商话术")
OUT_ROOT = Path(r"f:\开发软件项目文件\对练社交\knowledge_base")
OUT_ROOT.mkdir(parents=True, exist_ok=True)
CACHE_PATH = OUT_ROOT / "_extract_done.json"

# ============ 分类映射 ============
# 返回 (分类目录, 原始来源描述)
def classify(src_path: Path):
    rel = str(src_path.relative_to(SRC))
    cats = {
        ('送礼话术技巧全攻略',):       '03-送礼话术全攻略',
        ('版块12--礼仪培训大全集',):   '05-礼仪培训',
        ('20e利他销售资料合集',):      '07-赚钱营销提升',  # 这里的 PDF 是销售类
        ('B.精选好书合集', '两性情感'):  '08-两性情感',
        ('B.精选好书合集', '人性密学'):  '06-人性认知思维',
        ('B.精选好书合集', '做局权谋'):  '09-权谋思维',
        ('B.精选好书合集', '思维认知'):  '06-人性认知思维',
        ('B.精选好书合集', '职场社交'):  '04-职场社交提升',
        ('综合提升大合集', '职场社交'):  '04-职场社交提升',
        ('综合提升大合集', '说话的艺术'):'06-人性认知思维',
        ('综合提升大合集', '赚钱营销'):  '07-赚钱营销提升',
    }
    parts = src_path.parts
    for pat, cat in cats.items():
        if all(p in rel for p in pat):
            return cat, rel
    # 兜底：高情商话术/580好好接话电子版/
    if '580好好接话电子版' in rel:
        if '各行业销售话术300套' in rel:
            return '02-销售话术300套', rel
        return '01-高情商接话话术', rel
    # 综合提升大合集 兜底
    if '综合提升大合集' in rel:
        return '06-人性认知思维', rel
    # B.精选好书合集 兜底
    if 'B.精选好书合集' in rel:
        return '06-人性认知思维', rel
    return '99-其他', rel

# ============ 提取函数 ============

def extract_pdf(pdf_path: Path) -> str:
    """pymupdf 提取 PDF → Markdown，保留段落标题"""
    import pymupdf
    doc = pymupdf.open(pdf_path)
    blocks = []
    for page_num, page in enumerate(doc, 1):
        blocks.append(f"\n\n---\n\n## 第 {page_num} 页\n")
        text = page.get_text("text")
        blocks.append(text.strip())
    doc.close()
    return "\n".join(blocks).strip()

def extract_docx(docx_path: Path) -> str:
    """python-docx 提取 → Markdown，保留标题层级"""
    import docx
    d = docx.Document(docx_path)
    out = []
    for p in d.paragraphs:
        if not p.text.strip():
            out.append("")
            continue
        style = (p.style.name or '').lower() if p.style else ''
        txt = p.text.strip()
        if style.startswith('heading 1'):  out.append(f"# {txt}")
        elif style.startswith('heading 2'): out.append(f"## {txt}")
        elif style.startswith('heading 3'): out.append(f"### {txt}")
        elif style.startswith('heading 4'): out.append(f"#### {txt}")
        elif 'title' in style:   out.append(f"# {txt}")
        elif 'list' in style or 'bullet' in style or style.startswith('•'):
            out.append(f"- {txt}")
        elif 'number' in style or style.startswith('1.'):
            out.append(f"1. {txt}")
        else:
            out.append(txt)
    # 表格
    for tbl in d.tables:
        out.append("")
        for row in tbl.rows:
            cells = [c.text.strip().replace('\n', ' | ') for c in row.cells]
            out.append(" | ".join(cells))
        out.append("")
    return "\n".join(out).strip()

def extract_ppt(ppt_path: Path) -> str:
    """python-pptx 提取 → Markdown"""
    import pptx
    p = pptx.Presentation(ppt_path)
    out = []
    for i, slide in enumerate(p.slides, 1):
        out.append(f"\n---\n\n## Slide {i}\n")
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    if not para.text.strip(): continue
                    txt = para.text.strip()
                    if shape == slide.shapes.title or (hasattr(shape, 'placeholder') and shape.placeholder is not None and 'Title' in str(shape.placeholder)):
                        out.append(f"### {txt}")
                    else:
                        out.append(txt)
            if shape.has_table:
                tbl = shape.table
                for row in tbl.rows:
                    cells = [c.text.strip() for c in row.cells]
                    out.append(" | ".join(cells))
                out.append("")
    return "\n".join(out).strip()

def extract_txt(txt_path: Path) -> str:
    """智能编码读 TXT"""
    raw = txt_path.read_bytes()
    for enc in ['utf-8', 'utf-8-sig', 'gbk', 'gb18030', 'utf-16', 'latin1']:
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode('utf-8', errors='replace')

def doc_to_docx(src: Path, out_dir: Path) -> Path:
    """Word COM: .doc → .docx"""
    import pythoncom, win32com.client
    pythoncom.CoInitialize()
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        doc = word.Documents.Open(str(src))
        target = out_dir / (src.stem + ".docx")
        doc.SaveAs2(str(target), 16)  # 16 = docx
        doc.Close()
        return target
    finally:
        word.Quit()
        pythoncom.CoUninitialize()

def ppt_to_pptx(src: Path, out_dir: Path) -> Path:
    """PowerPoint COM: .ppt → .pptx"""
    import pythoncom, win32com.client
    pythoncom.CoInitialize()
    ppt = win32com.client.Dispatch("PowerPoint.Application")
    try:
        pres = ppt.Presentations.Open(str(src), WithWindow=False)
        target = out_dir / (src.stem + ".pptx")
        pres.SaveAs(str(target), 24)  # 24 = pptx
        pres.Close()
        return target
    finally:
        ppt.Quit()
        pythoncom.CoUninitialize()

def _safe_name(name: str) -> str:
    return re.sub(r'[\\/:*?"<>|]+', '_', name).strip()[:120] or 'untitled'

# ============ 主流程 ============

def load_cache():
    if CACHE_PATH.exists():
        try: return json.loads(CACHE_PATH.read_text(encoding='utf-8'))
        except: return {}
    return {}

def save_cache(cache):
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')

def main():
    cache = load_cache()

    # 扫描
    print("📂 扫描源目录...")
    TARGET_EXTS = {'.pdf', '.docx', '.txt'}  # .doc/.ppt 稍后处理
    all_files = list(SRC.rglob('*'))
    text_files = [p for p in all_files
                  if p.is_file() and p.suffix.lower() in TARGET_EXTS
                  and not p.name.endswith('.downloading')]
    doc_files = [p for p in all_files
                 if p.is_file() and p.suffix.lower() == '.doc' and '~$' not in p.name]
    ppt_files = [p for p in all_files
                 if p.is_file() and p.suffix.lower() in ('.ppt', '.pptx')]

    print(f"  PDF+DOCX+TXT: {len(text_files)}")
    print(f"  DOC (需转): {len(doc_files)}")
    print(f"  PPT/PPTX: {len(ppt_files)}")

    todo = []
    for f in text_files + doc_files + ppt_files:
        key = str(f)
        if key not in cache:
            todo.append(f)
    print(f"\n📝 待处理: {len(todo)}  (已完成: {len(cache)})")

    # 临时目录用于 doc/ppt 转换
    TMP = OUT_ROOT / "_tmp_convert"
    TMP.mkdir(exist_ok=True)

    ok, fail, skip = 0, 0, 0
    t_start = time.time()

    for i, f in enumerate(todo):
        key = str(f)
        cat, rel_path = classify(f)
        out_dir = OUT_ROOT / cat
        out_dir.mkdir(parents=True, exist_ok=True)

        ext = f.suffix.lower()
        safe_name = _safe_name(f.stem) + '.md'
        out_path = out_dir / safe_name

        pct = (i+1) / len(todo) * 100
        print(f"\n[{i+1}/{len(todo)}] ({pct:.0f}%) [{cat}] {f.name}")

        try:
            if ext == '.pdf':
                text = extract_pdf(f)
            elif ext == '.docx':
                text = extract_docx(f)
            elif ext == '.txt':
                text = extract_txt(f)
            elif ext == '.doc':
                print(f"  → Word COM 转换 doc → docx ...")
                docx = doc_to_docx(f, TMP)
                text = extract_docx(docx)
                docx.unlink(missing_ok=True)
            elif ext in ('.ppt', '.pptx'):
                ppath = f
                if ext == '.ppt':
                    print(f"  → PowerPoint COM 转换 ppt → pptx ...")
                    ppath = ppt_to_pptx(f, TMP)
                text = extract_ppt(ppath)
                if ext == '.ppt':
                    ppath.unlink(missing_ok=True)
            else:
                skip += 1; cache[key] = {'ok': False, 'error': f'unsupported {ext}'}; save_cache(cache); continue

            if not text or not text.strip():
                print(f"  ⚠️ 空内容 → 跳过")
                skip += 1; cache[key] = {'ok': False, 'error': 'empty'}; save_cache(cache); continue

            # 写 Markdown：头部元信息 + 正文
            meta = [
                f"# {f.stem}",
                "",
                f"> 源文件: `{rel_path}`",
                f"> 所属分类: {cat}",
                f"> 原始格式: {ext}",
                f"> 提取时间: {time.strftime('%Y-%m-%d %H:%M')}",
                "", "---", "",
            ]
            full = "\n".join(meta) + text.strip() + "\n"
            out_path.write_text(full, encoding='utf-8')

            size_kb = out_path.stat().st_size / 1024
            print(f"  ✅ → {cat}/{safe_name} ({size_kb:.0f}KB)")
            cache[key] = {'ok': True, 'cat': cat, 'out': safe_name, 'kb': round(size_kb,1)}
            save_cache(cache)
            ok += 1

        except Exception as e:
            print(f"  ❌ 失败: {e}")
            traceback.print_exc()
            cache[key] = {'ok': False, 'error': str(e)[:200]}
            save_cache(cache)
            fail += 1

    total = time.time() - t_start
    print(f"\n{'='*60}")
    print(f"🎉 本轮完成!")
    print(f"  ✅ 成功: {ok}  |  ❌ 失败: {fail}  |  ⚠️ 跳过: {skip}")
    print(f"  耗时: {total/60:.1f}min")
    print(f"  输出根目录: {OUT_ROOT}")

    # 分类汇总
    cats = defaultdict(lambda: {'ok': 0, 'kb': 0})
    for v in cache.values():
        if v.get('ok'):
            c = v.get('cat', 'unknown')
            cats[c]['ok'] += 1
            cats[c]['kb'] += v.get('kb', 0)
    print(f"\n📊 分类汇总:")
    for c in sorted(cats.keys()):
        print(f"  {c}: {cats[c]['ok']} 份, 共 {cats[c]['kb']:.0f}KB")

if __name__ == '__main__':
    main()
