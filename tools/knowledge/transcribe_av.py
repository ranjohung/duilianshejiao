# -*- coding: utf-8 -*-
"""把 G:\\BaiduNetdiskDownload\\高情商话术 的音视频课程转成文字稿。

流程：ffmpeg 抽 16kHz 单声道 float32（内存管道，不落盘）
      -> faster-whisper BatchedInferencePipeline(GPU) -> 带时间轴的逐段文字

性能（RTX 5080 / large-v3 / float16，实测 14.2 分钟音频）：
  旧：ffmpeg->wav + 逐段解码 beam5   ≈ 200s   （4x 实时）
  新：内存管道 + batched16 beam1     ≈  15s   （56x 实时）→ 快 13 倍

产出：
  knowledge_base/transcripts/tr_XXXX.txt   逐段文字（HH:MM:SS|正文）
  knowledge_base/transcripts/_manifest.json

用法：
  python transcribe_av.py                     # 全量（断点续跑）
  python transcribe_av.py --limit 2           # 试跑
  python transcribe_av.py --resume            # 只跑未成功的
  python transcribe_av.py --plain             # 回退逐段模式（调试用）
"""
import os, sys, json, re, subprocess, hashlib, argparse, time

# ---- 在 import faster_whisper / ctranslate2 之前挂上 nvidia dll ----
# Windows 上 ctranslate2 不遵守 sys.path，靠 PATH 环境变量找 cublas64_12.dll
_NVIDIA_BASE = r"C:\Users\Administrator\.workbuddy\binaries\python\envs\default\Lib\site-packages\nvidia"
_EXTRA_BINS = []
for _sub in ("cublas", "cudnn", "cuda_nvrtc"):
    _bp = os.path.join(_NVIDIA_BASE, _sub, "bin")
    if os.path.exists(_bp):
        _EXTRA_BINS.append(_bp)
        try:
            os.add_dll_directory(_bp)
        except Exception:
            pass
if _EXTRA_BINS:
    os.environ["PATH"] = ";".join(_EXTRA_BINS) + ";" + os.environ.get("PATH", "")

ROOT = r"G:\BaiduNetdiskDownload\高情商话术"
OUTDIR = r"F:\开发软件项目文件\对练社交\knowledge_base\transcripts"
MANIFEST = os.path.join(OUTDIR, "_manifest.json")
AV_EXT = (".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".mp3", ".wav", ".m4a", ".aac")

# 本地模型缓存路径（避免 hf_hub 重新下载/校验）
LOCAL_MODEL = r"C:\Users\Administrator\.cache\whisper-models\faster-whisper-large-v3"


def collect(root):
    out = []
    for dp, dn, fn in os.walk(root):
        dn.sort()
        for f in sorted(fn):
            if f.lower().endswith(AV_EXT) and not f.lower().endswith(".downloading"):
                out.append(os.path.join(dp, f))
    return out


def media_duration(path):
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=nw=1:nk=1", path], capture_output=True, text=True, timeout=120)
        return float(r.stdout.strip())
    except Exception:
        return 0.0


def load_audio(path):
    """ffmpeg 解码为内存 float32 单声道 16k，避免临时 wav 的磁盘 IO。"""
    import numpy as np
    cmd = ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
           "-i", path, "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1"]
    p = subprocess.run(cmd, capture_output=True, timeout=7200)
    if p.returncode != 0:
        raise RuntimeError("ffmpeg failed: " + p.stderr.decode("utf-8", "ignore")[:300])
    return np.frombuffer(p.stdout, dtype=np.float32)


def fmt_ts(sec):
    sec = int(sec)
    return "%02d:%02d:%02d" % (sec // 3600, (sec % 3600) // 60, sec % 60)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=LOCAL_MODEL)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="")
    ap.add_argument("--device", default="cuda")
    ap.add_argument("--compute", default="float16")
    ap.add_argument("--batch", type=int, default=16, help="批处理窗口数；越大越快，显存占用越高")
    ap.add_argument("--beam", type=int, default=1, help="beam size；1 最快，5 略准")
    ap.add_argument("--plain", action="store_true", help="回退逐段模式（不用批处理）")
    ap.add_argument("--resume", action="store_true", help="跳过 manifest 中已成功的文件")
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
    print("待转录: %d 个文件  (batch=%d beam=%d plain=%s)" %
          (len(files), args.batch, args.beam, args.plain), flush=True)

    from faster_whisper import WhisperModel, BatchedInferencePipeline
    t0 = time.time()

    print("加载模型 %s (%s/%s) ..." % (args.model, args.device, args.compute), flush=True)
    try:
        model = WhisperModel(args.model, device=args.device, compute_type=args.compute,
                             download_root=os.path.join(os.environ.get("USERPROFILE", "."), ".cache", "whisper"))
    except Exception as e:
        print("GPU 初始化失败，回退 CPU int8:", e, flush=True)
        model = WhisperModel(args.model, device="cpu", compute_type="int8",
                             download_root=os.path.join(os.environ.get("USERPROFILE", "."), ".cache", "whisper"))
    pipe = None
    if not args.plain:
        pipe = BatchedInferencePipeline(model=model)
    print("模型就绪，耗时 %.1fs" % (time.time() - t0), flush=True)

    ok = err = skipped = 0
    total_audio = 0.0
    t_start = time.time()
    for n, path in enumerate(files, 1):
        rel = os.path.relpath(path, ROOT)
        rec = manifest.get(rel)
        if rec and rec.get("status") == "ok" and rec.get("chars", 0) > 0:
            skipped += 1
            continue
        idx = (rec or {}).get("idx") or hashlib.md5(rel.encode("utf-8")).hexdigest()[:10]
        outp = os.path.join(OUTDIR, "tr_%s.txt" % idx)
        st = time.time()
        try:
            dur = media_duration(path)
            audio = load_audio(path)
            if args.plain or pipe is None:
                segs, info = model.transcribe(audio, language="zh", beam_size=args.beam,
                                              vad_filter=True,
                                              vad_parameters=dict(min_silence_duration_ms=500),
                                              condition_on_previous_text=False)
            else:
                segs, info = pipe.transcribe(audio, language="zh", batch_size=args.batch,
                                             beam_size=args.beam, vad_filter=True,
                                             vad_parameters=dict(min_silence_duration_ms=500))
            lines, texts = [], []
            for s in segs:
                txt = (s.text or "").strip()
                if not txt:
                    continue
                lines.append("%s|%s" % (fmt_ts(s.start), txt))
                texts.append(txt)
            full = "\n".join(lines)
            with open(outp, "w", encoding="utf-8") as f:
                f.write(full)
            status = "ok" if len(full.strip()) > 20 else "empty"
            manifest[rel] = {
                "idx": idx, "path": rel, "chars": len(full), "status": status,
                "duration_sec": round(dur), "elapsed_sec": round(time.time() - st),
                "lang": getattr(info, "language", "zh"),
                "plain": re.sub(r"^\d\d:\d\d:\d\d\|", "", "\n".join(texts))[:400],
            }
            ok += 1 if status == "ok" else 0
            total_audio += dur
            speed = (total_audio / max(time.time() - t_start, .1))
            print("[%d/%d] %s  dur=%.0fm  took=%.0fs  chars=%d  %s  (累计 %.0fx)" %
                  (n, len(files), rel, dur / 60, time.time() - st, len(full), status, speed), flush=True)
        except Exception as e:
            err += 1
            manifest[rel] = {"idx": idx, "path": rel, "chars": 0, "status": "error",
                             "error": "%s: %s" % (type(e).__name__, e)}
            print("[%d/%d] ERR %s -> %s %s" % (n, len(files), rel, type(e).__name__, str(e)[:150]), flush=True)
        finally:
            json.dump(manifest, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    json.dump(manifest, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("完成: ok=%d err=%d skipped=%d  总音频 %.1f 分钟" %
          (ok, err, skipped, total_audio / 60), flush=True)


if __name__ == "__main__":
    main()
