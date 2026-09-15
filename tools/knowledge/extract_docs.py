# -*- coding: utf-8 -*-
"""提取 G:\\BaiduNetdiskDownload\\高情商话术 全部文档类资料的真实正文。

支持：.pdf(pymupdf) / .docx(python-docx) / .pptx(python-pptx) / .txt
      .doc / .ppt / .wps（Word / PowerPoint COM 转换）

产出：
  knowledge_base/extracted/doc_XXXX.txt   每份资料的完整正文
  knowledge_base/extracted/_manifest.json  路径 -> {idx, chars, status, title}

用法：
  python extract_docs.py            # 全量
  python extract_docs.py --limit 5  # 试跑
"""
import os, sys, json, re, io, hashlib, argparse, traceback

# PYTHONPATH 直跑（venv python.exe 缺失）时补齐 pywin32 的路径：
# win32\lib 提供 pywintypes.py；win32 提供 _win32sysloader.pyd；pywin32_system32 提供 DLL。
_SP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
_SP = None
for _p in (os.environ.get("PYTHONPATH") or "").split(os.pathsep):
    if _p and os.path.exists(os.path.join(_p, "pywin32_system32")):
        _SP = _p
        break
if _SP:
    for _sub in ("win32", os.path.join("win32", "lib"), "pywin32_system32"):
        _d = os.path.join(_SP, _sub)
        if os.path.isdir(_d) and _d not in sys.path:
            sys.path.insert(0, _d)
    try:
        os.add_dll_directory(os.path.join(_SP, "pywin32_system32"))
    except Exception:
        pass

ROOT = r"G:\BaiduNetdiskDownload\高情商话术"
OUTDIR = r"F:\开发软件项目文件\对练社交\knowledge_base\extracted"
MANIFEST = os.path.join(OUTDIR, "_manifest.json")

PDF_EXT = {".pdf"}
DOCX_EXT = {".docx"}
DOC_EXT = {".doc", ".wps"}          # 走 Word COM
PPTX_EXT = {".pptx"}
PPT_EXT = {".ppt"}                  # 走 PowerPoint COM
TXT_EXT = {".txt"}
XLS_EXT = {".xls", ".xlsx"}         # 表格：提取单元格文本

ALL_EXT = PDF_EXT | DOCX_EXT | DOC_EXT | PPTX_EXT | PPT_EXT | TXT_EXT | XLS_EXT


def collect(root):
    items = []
    for dp, dn, fn in os.walk(root):
        dn.sort()
        for f in sorted(fn):
            ext = os.path.splitext(f)[1].lower()
            if ext in ALL_EXT:
                items.append(os.path.join(dp, f))
    return items


def norm_text(t):
    """统一换行、去掉不可见字符、压掉过多空行。"""
    if not t:
        return ""
    t = t.replace("\r\n", "\n").replace("\r", "\n")
    t = t.replace("\u3000", " ").replace("\xa0", " ")
    t = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", t)
    lines = [ln.rstrip() for ln in t.split("\n")]
    out = []
    blank = 0
    for ln in lines:
        if ln.strip():
            out.append(ln)
            blank = 0
        else:
            blank += 1
            if blank <= 1:
                out.append("")
    return "\n".join(out).strip()


# ---------------- PDF ----------------
def ext_pdf(path):
    import fitz
    doc = fitz.open(path)
    parts = []
    pages_text = 0
    for i, page in enumerate(doc):
        t = page.get_text("text")
        if t and t.strip():
            pages_text += 1
        parts.append(t or "")
    doc.close()
    text = norm_text("\n".join(parts))
    # 扫描版 PDF 判定：文字量极少
    scanned = len(text) < 40 * max(1, len(parts))
    return text, {"pages": len(parts), "pages_with_text": pages_text, "scanned": scanned}


# ---------------- DOCX ----------------
def ext_docx(path):
    import docx
    d = docx.Document(path)
    parts = [p.text for p in d.paragraphs]
    for tb in d.tables:
        for row in tb.rows:
            cells = [c.text.strip() for c in row.cells]
            line = " | ".join([c for c in cells if c])
            if line:
                parts.append(line)
    return norm_text("\n".join(parts)), {}


# ---------------- PPTX ----------------
def ext_pptx(path):
    from pptx import Presentation
    prs = Presentation(path)
    parts = []
    for i, slide in enumerate(prs.slides, 1):
        parts.append("【第 %d 页】" % i)
        for shape in slide.shapes:
            try:
                if shape.has_text_frame:
                    for para in shape.text_frame.paragraphs:
                        s = "".join(r.text for r in para.runs).strip()
                        if s:
                            parts.append(s)
                if shape.has_table:
                    for row in shape.table.rows:
                        cells = [c.text.strip() for c in row.cells]
                        line = " | ".join([c for c in cells if c])
                        if line:
                            parts.append(line)
            except Exception:
                pass
        try:
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                nt = slide.notes_slide.notes_text_frame.text.strip()
                if nt:
                    parts.append("[备注] " + nt)
        except Exception:
            pass
    return norm_text("\n".join(parts)), {"slides": len(prs.slides.__iter__.__self__._sldIdLst) if False else 0}


# ---------------- TXT ----------------
def ext_txt(path):
    for enc in ("utf-8", "utf-8-sig", "gb18030", "gbk", "big5", "utf-16"):
        try:
            with open(path, "r", encoding=enc, errors="strict") as f:
                return norm_text(f.read()), {"encoding": enc}
        except (UnicodeDecodeError, UnicodeError):
            continue
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return norm_text(f.read()), {"encoding": "utf-8-ignore"}


# ---------------- XLS ----------------
def ext_xls(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".xls":
        try:
            import xlrd
            wb = xlrd.open_workbook(path)
            parts = []
            for ws in wb.sheets():
                parts.append("【%s】" % ws.name)
                for r in range(ws.nrows):
                    vals = []
                    for c in range(ws.ncols):
                        v = ws.cell_value(r, c)
                        s = str(v).strip()
                        if s and s != "0.0":
                            vals.append(s)
                    if vals:
                        parts.append(" | ".join(vals))
            return norm_text("\n".join(parts)), {"via": "xlrd"}
        except Exception as e:
            return "", {"error": str(e)}
    try:
        import openpyxl
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        parts = []
        for ws in wb.worksheets:
            parts.append("【%s】" % ws.title)
            for row in ws.iter_rows(values_only=True):
                vals = [str(v).strip() for v in row if v is not None and str(v).strip()]
                if vals:
                    parts.append(" | ".join(vals))
        wb.close()
        return norm_text("\n".join(parts)), {}
    except Exception as e:
        return "", {"error": str(e)}


# ---------------- Word COM (doc/wps) ----------------
class WordConv:
    def __init__(self):
        import win32com.client
        self.word = win32com.client.DispatchEx("Word.Application")
        self.word.Visible = False
        self.word.DisplayAlerts = 0
        try:
            self.word.Options.ConfirmConversions = False
            self.word.Options.CheckGrammarAsYouType = False
            self.word.Options.CheckSpellingAsYouType = False
        except Exception:
            pass

    def text_of(self, path):
        doc = None
        try:
            doc = self.word.Documents.Open(path, ReadOnly=True, AddToRecentFiles=False,
                                           Revert=False, Visible=False)
            t = doc.Content.Text
            # 表格文本
            try:
                for i in range(1, doc.Tables.Count + 1):
                    tb = doc.Tables(i)
                    for r in range(1, tb.Rows.Count + 1):
                        cells = []
                        for c in range(1, tb.Columns.Count + 1):
                            try:
                                cells.append(tb.Cell(r, c).Range.Text.replace("\r\x07", "").strip())
                            except Exception:
                                pass
                        line = " | ".join([x for x in cells if x])
                        if line:
                            t += "\n" + line
            except Exception:
                pass
            return t
        finally:
            if doc is not None:
                try:
                    doc.Close(False)
                except Exception:
                    pass

    def quit(self):
        try:
            self.word.Quit()
        except Exception:
            pass


# ---------------- PowerPoint COM (ppt) ----------------
class PptConv:
    def __init__(self):
        import win32com.client
        self.pp = win32com.client.DispatchEx("PowerPoint.Application")

    def text_of(self, path):
        pres = None
        try:
            pres = self.pp.Presentations.Open(path, ReadOnly=True, WithWindow=False)
            parts = []
            for i in range(1, pres.Slides.Count + 1):
                sl = pres.Slides(i)
                parts.append("【第 %d 页】" % i)
                for j in range(1, sl.Shapes.Count + 1):
                    sh = sl.Shapes(j)
                    try:
                        if sh.HasTextFrame and sh.TextFrame.HasText:
                            parts.append(sh.TextFrame.TextRange.Text.replace("\r", "\n"))
                    except Exception:
                        pass
                    try:
                        if sh.HasTable:
                            for r in range(1, sh.Table.Rows.Count + 1):
                                cells = []
                                for c in range(1, sh.Table.Columns.Count + 1):
                                    try:
                                        cells.append(sh.Table.Cell(r, c).Shape.TextFrame.TextRange.Text.replace("\r", " ").strip())
                                    except Exception:
                                        pass
                                line = " | ".join([x for x in cells if x])
                                if line:
                                    parts.append(line)
                    except Exception:
                        pass
                try:
                    if sl.HasNotesPage and sl.NotesPage.Shapes.Count:
                        for k in range(1, sl.NotesPage.Shapes.Count + 1):
                            sh = sl.NotesPage.Shapes(k)
                            if sh.HasTextFrame and sh.TextFrame.HasText:
                                parts.append("[备注] " + sh.TextFrame.TextRange.Text.replace("\r", "\n"))
                except Exception:
                    pass
            return "\n".join(parts)
        finally:
            if pres is not None:
                try:
                    pres.Close()
                except Exception:
                    pass

    def quit(self):
        try:
            self.pp.Quit()
        except Exception:
            pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="")
    args = ap.parse_args()

    os.makedirs(OUTDIR, exist_ok=True)
    manifest = {}
    if os.path.exists(MANIFEST):
        try:
            manifest = json.load(open(MANIFEST, encoding="utf-8"))
        except Exception:
            manifest = {}

    files = collect(ROOT)
    if args.only:
        files = [f for f in files if args.only.lower() in f.lower()]
    if args.limit:
        files = files[:args.limit]
    print("待处理:", len(files))

    word = ppt = None
    ok = empty = err = skipped = 0

    for n, path in enumerate(files, 1):
        rel = os.path.relpath(path, ROOT)
        rec = manifest.get(rel)
        if rec and rec.get("status") == "ok" and rec.get("chars", 0) > 0:
            skipped += 1
            continue
        ext = os.path.splitext(path)[1].lower()
        idx = rec.get("idx") if rec else None
        if idx is None:
            idx = hashlib.md5(rel.encode("utf-8")).hexdigest()[:10]
        outp = os.path.join(OUTDIR, "doc_%s.txt" % idx)
        try:
            meta = {}
            if ext in PDF_EXT:
                text, meta = ext_pdf(path)
            elif ext in DOCX_EXT:
                text, meta = ext_docx(path)
            elif ext in PPTX_EXT:
                text, meta = ext_pptx(path)
            elif ext in TXT_EXT:
                text, meta = ext_txt(path)
            elif ext in XLS_EXT:
                text, meta = ext_xls(path)
            elif ext in DOC_EXT:
                if word is None:
                    word = WordConv()
                text, meta = norm_text(word.text_of(path)), {"via": "word"}
            elif ext in PPT_EXT:
                if ppt is None:
                    ppt = PptConv()
                text, meta = norm_text(ppt.text_of(path)), {"via": "powerpoint"}
            else:
                text, meta = "", {"error": "unsupported"}

            with open(outp, "w", encoding="utf-8") as f:
                f.write(text)
            status = "ok" if text.strip() else "empty"
            manifest[rel] = {
                "idx": idx, "path": rel, "ext": ext,
                "chars": len(text), "status": status, "meta": meta,
            }
            if status == "ok":
                ok += 1
            else:
                empty += 1
        except Exception as e:
            err += 1
            manifest[rel] = {
                "idx": idx, "path": rel, "ext": ext, "chars": 0,
                "status": "error", "error": "%s: %s" % (type(e).__name__, e),
            }
            if err <= 8:
                print("  ERR", rel, "->", type(e).__name__, str(e)[:120])

        if n % 25 == 0:
            print("进度 %d/%d  ok=%d empty=%d err=%d skip=%d" % (n, len(files), ok, empty, err, skipped))
            json.dump(manifest, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    if word:
        word.quit()
    if ppt:
        ppt.quit()
    json.dump(manifest, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print("完成: ok=%d empty=%d err=%d skipped=%d total=%d" % (ok, empty, err, skipped, len(manifest)))
    # 汇总
    tot = sum(r.get("chars", 0) for r in manifest.values())
    print("总字符数: %d (%.1f MB)" % (tot, tot / 1024 / 1024))


if __name__ == "__main__":
    main()
