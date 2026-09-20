"""
ocr_scan_pdfs.py — OCR 真扫描件 PDF
  前提: knowledge_base/_scan_pdfs.json 已由 _classify_scan.py 生成

流程: pymupdf 渲染每页 → RapidOCR 识别中文 → OpenCC 繁转简 → 按页组织成 Markdown
输出: knowledge_base/{原分类}/{原名}.md + 更新 _extract_done.json

注: 本脚本只处理 _scan_pdfs.json 里的 scanned 列表（真扫描件）
    损坏 PDF (broken) 无法在这里修复 — 需要用户重新下载
"""
import os, sys, json, time, glob
from pathlib import Path

# CUDA DLL
_NVIDIA_BIN = Path(r"C:\Python314\Lib\site-packages\nvidia")
for _sub in ('cublas/bin', 'cudnn/bin', 'cuda_nvrtc/bin'):
    _p = _NVIDIA_BIN / _sub
    if _p.exists(): os.environ['PATH'] = str(_p) + ';' + os.environ.get('PATH', '')

import pymupdf
import numpy as np
from rapidocr_onnxruntime import RapidOCR

try:
    from opencc import OpenCC; cc = OpenCC('t2s')
except: cc = None

SRC_ROOT = Path(r"G:\BaiduNetdiskDownload\高情商话术")
OUT_ROOT = Path(r"f:\开发软件项目文件\对练社交\knowledge_base")
CACHE_PATH = OUT_ROOT / "_extract_done.json"
SCAN_JSON = OUT_ROOT / "_scan_pdfs.json"

def zh_norm(t): return cc.convert(t) if cc else t

def classify(src_path: Path):
    rel = str(src_path.relative_to(SRC_ROOT))
    if '580好好接话电子版' in rel: return '01-高情商接话话术'
    if '送礼话术技巧全攻略' in rel: return '03-送礼话术全攻略'
    if '职场社交提升' in rel or '职场处事' in rel: return '04-职场社交提升'
    if '版块12' in rel or '礼仪培训' in rel: return '05-礼仪培训'
    if '人性' in rel or '说话的艺术' in rel or '思维认知' in rel: return '06-人性认知思维'
    if '赚钱' in rel or '营销' in rel or '利他销售' in rel: return '07-赚钱营销提升'
    if '两性' in rel or '情感' in rel: return '08-两性情感'
    if '权谋' in rel or '做局' in rel: return '09-权谋思维'
    return '99-其他'

def ocr_pdf(pdf_path: Path, ocr):
    doc = pymupdf.open(pdf_path)
    n = len(doc)
    print(f"  📄 {n} 页")

    pages = []
    t0 = time.time()
    for i in range(n):
        sys.stdout.write(f"\r  第 {i+1}/{n} 页 ...")
        sys.stdout.flush()
        try:
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=180)
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            if pix.n == 4: img = img[:, :, :3]
            result, _ = ocr(img)
            lines = []
            if result:
                by_y = {}
                for r in result:
                    box, text, conf = r
                    cy = (box[0][1] + box[2][1]) / 2
                    ykey = round(cy / 10) * 10
                    if ykey not in by_y: by_y[ykey] = []
                    by_y[ykey].append((box[0][0], text))
                for yk in sorted(by_y.keys()):
                    row = sorted(by_y[yk], key=lambda x: x[0])
                    lines.append("".join(t for _, t in row))
            if lines:
                pages.append(f"\n## 第 {i+1} 页\n\n" + zh_norm("\n".join(lines)))
            else:
                pages.append(f"\n## 第 {i+1} 页\n\n")
        except Exception as e:
            pages.append(f"\n## 第 {i+1} 页\n\n⚠️ 本页损坏，跳过 ({str(e)[:60]})")
            continue
    doc.close()
    print(f"\n  OCR 总耗时: {time.time()-t0:.1f}s")
    return "\n".join(pages)

def main():
    if not SCAN_JSON.exists():
        print("❌ _scan_pdfs.json 不存在，先跑 _classify_scan.py")
        return

    data = json.loads(SCAN_JSON.read_text(encoding='utf-8'))
    scan_list = [Path(p) for p in data.get('scanned', [])]
    print(f"📸 真扫描件 PDF: {len(scan_list)} 个")
    print(f"⚠️  损坏 PDF: {len(data.get('broken', []))} 个（需重新下载，无法 OCR）\n")

    cache = json.loads(CACHE_PATH.read_text(encoding='utf-8')) if CACHE_PATH.exists() else {}

    if not scan_list:
        print("没真扫描件可 OCR — 请重新下载损坏的 270 个文件")
        return

    print("初始化 RapidOCR (CPU) ...")
    ocr = RapidOCR()
    print("OK\n")

    for pdf in scan_list:
        print(f"=== {pdf.name} ===")
        if str(pdf) in cache and cache[str(pdf)].get('ok'):
            print("  ✅ 已处理，跳过"); continue

        cat = classify(pdf)
        out_dir = OUT_ROOT / cat
        out_dir.mkdir(parents=True, exist_ok=True)

        try:
            text = ocr_pdf(pdf, ocr)
            if not text.strip():
                print("  ⚠️ OCR 结果为空 → 跳过")
                cache[str(pdf)] = {'ok': False, 'error': 'ocr empty', 'cat': cat}
                continue

            safe_name = pdf.stem + '.md'
            out_path = out_dir / safe_name
            meta = [
                f"# {pdf.stem}",
                "",
                f"> 源文件: `{pdf}`",
                f"> 所属分类: {cat}",
                f"> 原始格式: .pdf (扫描件)",
                f"> 提取方式: RapidOCR 中文识别",
                f"> 提取时间: {time.strftime('%Y-%m-%d %H:%M')}",
                "", "---", "",
            ]
            out_path.write_text("\n".join(meta) + text.strip() + "\n", encoding='utf-8')
            kb = out_path.stat().st_size / 1024
            print(f"  ✅ → {cat}/{safe_name} ({kb:.0f}KB)")
            cache[str(pdf)] = {'ok': True, 'cat': cat, 'out': safe_name, 'kb': round(kb,1), 'method': 'ocr'}
        except Exception as e:
            print(f"  ❌ {e}")
            cache[str(pdf)] = {'ok': False, 'error': f'ocr: {str(e)[:150]}', 'cat': cat}

        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f"\n✅ OCR 完成")
    print(f"\n⚠️  另外 {len(data.get('broken',[]))} 个损坏 PDF 无法处理")
    print(f"   位置: knowledge_base/_scan_pdfs.json → broken[]")
    print(f"   建议: 在百度网盘重新下载这些文件，然后重新跑 batch_extract_docs.py")

if __name__ == '__main__':
    main()
