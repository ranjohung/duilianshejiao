# -*- coding: utf-8 -*-
"""对扫描版 PDF（manifest status=empty）做 OCR，产正文回填 manifest。

策略：
  - 按标题归一化分组，同组只 OCR 一份（选最大的文件），结果共享给全组；
  - 多进程并行（默认 6 worker × 4 线程）；
  - 按页数升序处理，小的先完成；
  - 每完成一本即写 doc_<idx>.txt，父进程合并 manifest（断点续跑：status=ok 的跳过）。

用法：
  python ocr_scanned.py            # 全量
  python ocr_scanned.py --limit 3  # 试跑
"""
import os, sys, json, re, argparse, time, threading
# Windows 沙箱下 multiprocessing 受限（DuplicateHandle 拒绝访问），改用线程池：
# OCR 重活在 onnxruntime C++ 内部执行并释放 GIL，线程并行有效。
from concurrent.futures import ThreadPoolExecutor

BASE = r"F:\开发软件项目文件\对练社交\knowledge_base"
ROOT = r"G:\BaiduNetdiskDownload\高情商话术"
MANIFEST = os.path.join(BASE, "extracted", "_manifest.json")
OUTDIR = os.path.join(BASE, "extracted")
DPI = 118
WORKERS = 8
THREADS_PER_WORKER = 3


def _limit_ort_threads():
    """RapidOCR 未暴露线程参数，默认每实例用满全部核 → 多实例互相踩踏。
    猴子补丁 SessionOptions：每实例限 4 线程，WORKERS×4 ≈ 物理核数。"""
    import onnxruntime as _ort
    import rapidocr_onnxruntime.utils as _u
    _Orig = _u.SessionOptions

    def _patched():
        o = _Orig()
        o.intra_op_num_threads = THREADS_PER_WORKER
        o.inter_op_num_threads = 1
        o.execution_mode = _ort.ExecutionMode.ORT_SEQUENTIAL
        return o

    _u.SessionOptions = _patched


def norm_title(fn):
    t = os.path.splitext(fn)[0]
    t = re.sub(r"\(\d+\)$", "", t)
    t = re.sub(r"^\d{1,3}[..、、\-]\s*", "", t)
    t = re.sub(r"[\s《》（）().\-—_、·]", "", t)
    return t


def page_count(path):
    try:
        import pymupdf
        with pymupdf.open(path) as doc:
            return len(doc)
    except Exception:
        return 10 ** 6


def ocr_book(rel, _local=threading.local()):
    """OCR 一本书，返回 (rel, text, pages, err)。每线程一个 RapidOCR 实例。"""
    import pymupdf
    import numpy as np
    import cv2
    ocr = getattr(_local, "ocr", None)
    if ocr is None:
        from rapidocr_onnxruntime import RapidOCR
        _limit_ort_threads()
        ocr = RapidOCR()
        _local.ocr = ocr
    p = os.path.join(ROOT, *rel.split("/"))
    parts, pages = [], 0
    err = ""
    try:
        doc = pymupdf.open(p)
        for i, page in enumerate(doc):
            try:
                pix = page.get_pixmap(dpi=DPI)
                arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
                if pix.n == 4:
                    arr = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
                else:
                    arr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
                res, _ = ocr(arr)
                if res:
                    res.sort(key=lambda r: (r[0][0][1] // 20, r[0][0][0]))  # 按行聚合
                    parts.append("\n".join(x[1] for x in res))
                else:
                    parts.append("")
                pages += 1
            except Exception as ex:
                parts.append("")
                err = "%s:p%d %s" % (type(ex).__name__, i, str(ex)[:60])
        doc.close()
    except Exception as ex:
        err = "open: %s" % ex
    text = "\n".join(parts).strip()
    # 页码噪声行（纯数字行）去掉
    text = "\n".join(ln for ln in text.split("\n") if not re.fullmatch(r"\d{1,4}", ln.strip()))
    return rel, text, pages, err


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=WORKERS)
    args = ap.parse_args()

    m = json.load(open(MANIFEST, encoding="utf-8"))
    # 已有正文的标题（跳过整组）
    ok_titles = {norm_title(os.path.basename(r)) for r, e in m.items()
                 if e.get("status") == "ok" and e.get("chars", 0) > 0}
    scanned = [r for r, e in m.items() if e.get("status") == "empty"
               and r.lower().endswith(".pdf")]
    groups = {}
    for r in scanned:
        t = norm_title(os.path.basename(r))
        if t in ok_titles:
            continue
        groups.setdefault(t, []).append(r)

    # 每组选代表（文件最大的那个），按页数升序
    jobs = []
    for t, rs in groups.items():
        rs.sort(key=lambda r: os.path.getsize(os.path.join(ROOT, *r.split("/"))), reverse=True)
        rep = rs[0]
        jobs.append((rep, rs, page_count(os.path.join(ROOT, *rep.split("/")))))
    jobs.sort(key=lambda j: j[2])
    if args.limit:
        jobs = jobs[:args.limit]

    tot_pages = sum(j[2] for j in jobs if j[2] < 10 ** 6)
    print("待 OCR 组数: %d  代表页数: %d  workers=%d" % (len(jobs), tot_pages, args.workers), flush=True)

    t0 = time.time()
    done_pages = 0
    n_ok = n_fail = 0
    job_map = {j[0]: j[1] for j in jobs}
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futs = [pool.submit(ocr_book, j[0]) for j in jobs]
        for fut in futs:
            rel, text, pages, err = fut.result()
            grp = job_map[rel]
            # 写前重读磁盘 manifest，避免整快照回写覆盖期间其他工具的修复
            m = json.load(open(MANIFEST, encoding="utf-8"))
            if len(text) > 60:
                for r in grp:
                    e = m.get(r) or {}
                    idx = e.get("idx") or rel.encode("utf-8").hex()[:10]
                    with open(os.path.join(OUTDIR, "doc_%s.txt" % idx), "w", encoding="utf-8") as f:
                        f.write(text)
                    m[r] = {"idx": idx, "path": r, "ext": ".pdf", "chars": len(text),
                            "status": "ok", "meta": {"via": "ocr", "pages": pages,
                                                     "representative": rel}}
                n_ok += 1
            else:
                n_fail += 1
                for r in grp:
                    e = m.get(r) or {}
                    if pages == 0:
                        # 0 页：结构损坏（线性化 PDF 尾部被零填充），永久标记，不再重试
                        m[r] = {"idx": e.get("idx"), "path": r, "ext": ".pdf", "chars": 0,
                                "status": "error", "error": "PDF 结构损坏（0 页，疑似截断/零填充尾部）",
                                "meta": {"via": "ocr-broken"}}
                    else:
                        e["meta"] = dict(e.get("meta") or {}, ocr_attempt=len(text), ocr_err=err)
                        m[r] = e
                print("  低质量/失败(%d字): %s %s" % (len(text), rel.split("/")[-1][:40], err), flush=True)
            done_pages += pages if pages < 10 ** 6 else 0
            json.dump(m, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            el = time.time() - t0
            print("[%s] %d字 %d页 | 进度 %d/%d 组, %.0f 页 done, 剩余约 %.1f h" % (
                rel.split("/")[-1][:32], len(text), pages,
                n_ok + n_fail, len(jobs), done_pages,
                max(0.0, (tot_pages - done_pages) * (el / max(done_pages, 1)) / 3600)), flush=True)
    json.dump(m, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("OCR 完成: ok=%d fail=%d 用时 %.1f h" % (n_ok, n_fail, (time.time() - t0) / 3600), flush=True)


if __name__ == "__main__":
    main()
