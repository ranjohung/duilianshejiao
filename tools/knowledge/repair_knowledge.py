# -*- coding: utf-8 -*-
"""修复"有目录没内容"的卡片数据源（快赢部分，OCR 走 ocr_scanned.py）。

1. 零填充损坏 PDF / 扫描版 PDF：若其他目录存在同标题的 ok 文档 → 直接复用其正文。
2. 5 个完好的 OLE 文档（doc/wps/ppt，此前提取失败）→ 重试 COM 提取。
3. 《酒桌话术》173MB 大 PDF（此前无 manifest 条目）→ pymupdf 提取。

更新 knowledge_base/extracted/_manifest.json，正文写 doc_<idx>.txt。
"""
import os, sys, json, re, collections, hashlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract_docs as ed

ROOT = ed.ROOT
OUTDIR = ed.OUTDIR
MANIFEST = ed.MANIFEST


def title_of(fn):
    t = os.path.splitext(fn)[0]
    t = re.sub(r"\(\d+\)$", "", t)
    t = re.sub(r"[\s\d ().（）\-—_、《》]", "", t)
    return t


def load_manifest():
    return json.load(open(MANIFEST, encoding="utf-8"))


def save_manifest(m):
    json.dump(m, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def reuse_duplicates():
    m = load_manifest()
    ok_by_title = collections.defaultdict(list)
    for rel, e in m.items():
        if e.get("status") == "ok" and e.get("chars", 0) > 0:
            ok_by_title[title_of(os.path.basename(rel))].append(rel)

    fixed = 0
    for rel, e in list(m.items()):
        if e.get("status") not in ("error", "empty"):
            continue
        if not rel.lower().endswith(".pdf"):
            continue
        p = os.path.join(ROOT, *rel.split("/"))
        try:
            head = open(p, "rb").read(8)
        except OSError:
            continue
        zero = head == b"\x00" * 8
        scanned_like = e.get("status") == "empty"
        if not (zero or scanned_like):
            continue
        t = title_of(os.path.basename(rel))
        cands = [c for c in ok_by_title.get(t, []) if c != rel]
        if not cands:
            continue
        src = m[cands[0]]
        src_txt = os.path.join(OUTDIR, "doc_%s.txt" % src["idx"])
        if not os.path.exists(src_txt):
            continue
        idx = e.get("idx") or hashlib.md5(rel.encode("utf-8")).hexdigest()[:10]
        with open(src_txt, encoding="utf-8") as f:
            text = f.read()
        with open(os.path.join(OUTDIR, "doc_%s.txt" % idx), "w", encoding="utf-8") as f:
            f.write(text)
        m[rel] = {
            "idx": idx, "path": rel, "ext": ".pdf", "chars": len(text),
            "status": "ok",
            "meta": {"via": "duplicate-copy", "source": cands[0],
                     "reason": "zero-filled" if zero else "scanned"},
        }
        fixed += 1
        print("  复用:", rel.split("/")[-1][:44], "<-", cands[0].split("/")[-1][:36])
    save_manifest(m)
    print("副本复用完成:", fixed)


def retry_ole():
    """重试此前失败的 doc/wps/ppt（文件头完好的 OLE）。"""
    m = load_manifest()
    word = ppt = None
    fixed = 0
    try:
        for rel, e in list(m.items()):
            if e.get("status") != "error":
                continue
            ext = os.path.splitext(rel)[1].lower()
            if ext not in (".doc", ".wps", ".ppt"):
                continue
            p = os.path.join(ROOT, *rel.split("/"))
            idx = e.get("idx") or hashlib.md5(rel.encode("utf-8")).hexdigest()[:10]
            try:
                if ext == ".ppt":
                    if ppt is None:
                        ppt = ed.PptConv()
                    text = ed.norm_text(ppt.text_of(p))
                    via = "powerpoint"
                else:
                    if word is None:
                        word = ed.WordConv()
                    text = ed.norm_text(word.text_of(p))
                    via = "word"
                with open(os.path.join(OUTDIR, "doc_%s.txt" % idx), "w", encoding="utf-8") as f:
                    f.write(text)
                status = "ok" if text.strip() else "empty"
                m[rel] = {"idx": idx, "path": rel, "ext": ext, "chars": len(text),
                          "status": status, "meta": {"via": via, "retry": True}}
                print("  重试成功(%d字):" % len(text), rel.split("/")[-1][:44])
                fixed += 1
            except Exception as ex:
                print("  重试失败:", rel.split("/")[-1][:44], type(ex).__name__, str(ex)[:80])
    finally:
        if word: word.quit()
        if ppt: ppt.quit()
    save_manifest(m)
    print("OLE 重试完成:", fixed)


def extract_missing():
    """提取 manifest 里没有条目的文档（如 173MB 的酒桌话术.pdf）。"""
    m = load_manifest()
    files = ed.collect(ROOT)
    todo = [p for p in files if os.path.relpath(p, ROOT) not in m]
    print("无条目文档:", len(todo))
    for path in todo:
        rel = os.path.relpath(path, ROOT)
        ext = os.path.splitext(path)[1].lower()
        idx = hashlib.md5(rel.encode("utf-8")).hexdigest()[:10]
        outp = os.path.join(OUTDIR, "doc_%s.txt" % idx)
        try:
            if ext in ed.PDF_EXT:
                text, meta = ed.ext_pdf(path)
            elif ext in ed.TXT_EXT:
                text, meta = ed.ext_txt(path)
            elif ext in ed.XLS_EXT:
                text, meta = ed.ext_xls(path)
            else:
                print("  跳过(暂不支持):", rel)
                continue
            with open(outp, "w", encoding="utf-8") as f:
                f.write(text)
            status = "ok" if text.strip() else "empty"
            m[rel] = {"idx": idx, "path": rel, "ext": ext, "chars": len(text),
                      "status": status, "meta": meta}
            print("  提取(%d字,%s):" % (len(text), status), rel.split("/")[-1][:44])
        except Exception as ex:
            m[rel] = {"idx": idx, "path": rel, "ext": ext, "chars": 0,
                      "status": "error", "error": "%s: %s" % (type(ex).__name__, ex)}
            print("  提取失败:", rel.split("/")[-1][:44], type(ex).__name__, str(ex)[:80])
    save_manifest(m)


def ole_text_rescue():
    """Office COM 拒开的 OLE 文档：直接从二进制流抽取中文文本（兜底）。"""
    import olefile
    m = load_manifest()
    fixed = 0
    for rel, e in list(m.items()):
        if e.get("status") != "error":
            continue
        ext = os.path.splitext(rel)[1].lower()
        if ext not in (".doc", ".wps", ".ppt", ".xls"):
            continue
        p = os.path.join(ROOT, *rel.split("/"))
        try:
            ole = olefile.OleFileIO(p)
            names = {"/".join(x) for x in ole.listdir()}
            data = b""
            for stream in ("WordDocument", "PowerPoint Document", "Workbook"):
                if stream in names:
                    data += ole.openstream(stream).read()
            ole.close()
            if not data:
                continue

            def cjk_ok(s):
                return bool(s) and sum(1 for ch in s if "\u4e00" <= ch <= "\u9fff") / len(s) >= 0.3

            out = []
            for enc in ("utf-16-le", "gb18030"):
                txt = data.decode(enc, errors="ignore")
                for ln in re.split(r"[\x00-\x08\x0b\x0c\x0e-\x1f\r\n\x07]+", txt):
                    ln = re.sub(r"[^\u4e00-\u9fff，。！？、；：“”‘’（）《》\w\s%\-]", "", ln)
                    ln = ln.strip()
                    # 过滤乱码碎片与网址水印
                    if len(ln) >= 6 and cjk_ok(ln) and "www" not in ln.lower() and ln not in out:
                        out.append(ln)
            text = "\n".join(out)
            if len(text) < 100:
                print("  抢救文本过少(%d字):" % len(text), rel.split("/")[-1][:40])
                continue
            idx = e.get("idx") or hashlib.md5(rel.encode("utf-8")).hexdigest()[:10]
            with open(os.path.join(OUTDIR, "doc_%s.txt" % idx), "w", encoding="utf-8") as f:
                f.write(text)
            m[rel] = {"idx": idx, "path": rel, "ext": ext, "chars": len(text),
                      "status": "ok", "meta": {"via": "ole-scavenger"}}
            print("  OLE 抢救成功(%d字):" % len(text), rel.split("/")[-1][:40])
            fixed += 1
        except Exception as ex:
            print("  OLE 抢救失败:", rel.split("/")[-1][:40], type(ex).__name__, str(ex)[:60])
    save_manifest(m)
    print("OLE 抢救完成:", fixed)


if __name__ == "__main__":
    print("== 1/3 同名副本复用 ==");   reuse_duplicates()
    print("== 2/3 OLE 文档重试 ==");   retry_ole()
    print("== 3/3 补提缺失条目 ==");   extract_missing()
