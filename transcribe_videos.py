"""
transcribe_videos.py — 批量转写礼仪培训视频（完整版）

流程: ffmpeg 抽音频(wav 16kHz mono) → faster_whisper small CPU → OpenCC 繁转简 → Markdown
输入: G:\BaiduNetdiskDownload\版块12 下所有 .rmvb/.rm/.avi/.flv/.wmv
输出: knowledge_base/20-礼仪培训视频转写/*.md

已跳过: .mp4 (普遍损坏) | .vip (DRM加密) | .downloading (未下完)
已完成进度持久化到 _done.json，中断可续跑

预估: ~273 个视频 ≈ 总视频时长 30-50 小时 × 9.3x 速度 ≈ 3-6 小时 CPU 时间
"""
import subprocess, time, os, sys, re, json
from pathlib import Path
from faster_whisper import WhisperModel

try:
    from opencc import OpenCC
    cc = OpenCC('t2s')  # 繁体→简体
except ImportError:
    cc = None

SRC_ROOT = r"G:\BaiduNetdiskDownload\高情商话术\版块12--礼仪培训大全集 共11个模块 （182套）"
OUT_DIR = Path(r"f:\开发软件项目文件\对练社交\knowledge_base\20-礼仪培训视频转写")
OUT_DIR.mkdir(parents=True, exist_ok=True)
CACHE_PATH = OUT_DIR / "_done.json"

VIDEO_EXTS = {'.rmvb', '.rm', '.avi', '.flv', '.wmv'}  # mp4 多损坏，暂跳过
SKIP_DIRS = {'##网络播放器'}
MIN_WAV_SIZE = 2000  # 小于 2KB 视为失败

# ============ helpers ============

def load_cache():
    if CACHE_PATH.exists():
        try: return json.loads(CACHE_PATH.read_text(encoding='utf-8'))
        except: return {}
    return {}

def save_cache(cache):
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')

def find_videos():
    videos = []
    for ext in VIDEO_EXTS:
        videos += list(Path(SRC_ROOT).rglob(f'*{ext}'))
    videos = [v for v in videos
              if all(d not in str(v) for d in SKIP_DIRS)
              and not v.name.endswith('.downloading')]
    return videos

def ffmpeg_ok(video_path):
    """快速检测 ffmpeg 能否打开（避免把坏文件送 whisper）"""
    try:
        r = subprocess.run(
            ['ffmpeg', '-v', 'error', '-i', str(video_path), '-f', 'null', 'NUL'],
            capture_output=True, timeout=60
        )
        return r.returncode == 0
    except:
        return False

def extract_audio(video_path, out_wav):
    try:
        r = subprocess.run([
            'ffmpeg', '-y', '-i', str(video_path),
            '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le',
            str(out_wav)
        ], capture_output=True, timeout=600)
        return (r.returncode == 0
                and out_wav.exists()
                and out_wav.stat().st_size > MIN_WAV_SIZE)
    except Exception as e:
        return False

def zh_norm(text):
    if cc:
        try: return cc.convert(text)
        except: return text
    return text

# ============ main ============

def main():
    videos = find_videos()
    cache = load_cache()
    remaining = [v for v in videos if str(v) not in cache]

    print(f"[扫描] 发现 {len(videos)} 个视频（有效扩展名）")
    print(f"[缓存] 已完成 {len(cache)}，待处理 {len(remaining)}")
    if not remaining:
        print("全部完成！🎉")
        return

    print(f"\n加载 faster_whisper small CPU + int8 ...")
    t0 = time.time()
    model = WhisperModel("small", device="cpu", compute_type="int8")
    print(f"  model loaded in {time.time()-t0:.1f}s")

    ok, fail, skip_bad = 0, 0, 0
    total_dur_min = 0
    total_segs = 0
    t_start = time.time()

    for i, v in enumerate(remaining):
        rel = v.relative_to(SRC_ROOT)
        pct = (i+1) / len(remaining) * 100
        print(f"\n[{i+1}/{len(remaining)}] ({pct:.0f}%) {v.stem}")
        print(f"  {rel}")

        # 1) ffmpeg 快速检测
        if not ffmpeg_ok(v):
            print(f"  ⚠️  ffmpeg 打不开 → 跳过")
            cache[str(v)] = {'ok': False, 'error': 'ffmpeg fail'}
            save_cache(cache); skip_bad += 1; continue

        # 2) 抽音频
        tmp_wav = OUT_DIR / "_current.wav"
        t0 = time.time()
        if not extract_audio(v, tmp_wav):
            print(f"  ❌ 抽音频失败")
            cache[str(v)] = {'ok': False, 'error': 'extract fail'}
            save_cache(cache); fail += 1; continue
        print(f"  [ffmpeg] {time.time()-t0:.1f}s → {tmp_wav.stat().st_size/1024:.0f}KB")

        # 3) Whisper 转写
        t0 = time.time()
        try:
            segs_iter, info = model.transcribe(
                str(tmp_wav), vad_filter=True, beam_size=1, language='zh'
            )
            segs = list(segs_iter)
        except Exception as e:
            print(f"  ❌ whisper error: {e}")
            cache[str(v)] = {'ok': False, 'error': f'whisper: {e}'}
            save_cache(cache); fail += 1; tmp_wav.unlink(missing_ok=True); continue

        elapsed = time.time() - t0
        tmp_wav.unlink(missing_ok=True)

        if not segs:
            print(f"  ⚠️  无语音段（可能是无声视频）→ 跳过")
            cache[str(v)] = {'ok': False, 'error': 'no segments'}
            save_cache(cache); skip_bad += 1; continue

        # 4) 繁转简
        converted = [
            type('Seg', (), {
                'start': s.start, 'end': s.end,
                'text': zh_norm(s.text.strip())
            })() for s in segs
        ]
        info_dur = info.duration or (segs[-1].end if segs else 0)

        # 5) 保存 Markdown
        parts = rel.parts
        module = parts[0] if len(parts) > 1 else '未知'
        safe = re.sub(r'[\\/:*?"<>|]', '_', v.stem)
        out_path = OUT_DIR / f"{safe}.md"

        lines = [f"[{s.start:.1f}-{s.end:.1f}] {s.text}" for s in converted]
        md = [
            f"# {v.stem}", "",
            f"- 源文件: `{rel.as_posix()}`",
            f"- 所属模块: {module}",
            f"- 时长: {info_dur:.0f}s ({info_dur/60:.1f}min)",
            f"- 转写段数: {len(converted)}",
            "", "---", "",
            *lines
        ]
        out_path.write_text("\n".join(md), encoding='utf-8')

        # 6) 记录 + 即时存缓存
        cache[str(v)] = {
            'ok': True, 'segs': len(converted),
            'duration': info_dur, 'elapsed_s': round(elapsed, 1),
            'out': out_path.name
        }
        save_cache(cache)

        speed = info_dur / elapsed if elapsed > 0 else 0
        print(f"  ✅ {len(converted)}段 | {info_dur/60:.1f}min | {speed:.1f}x | {out_path.stat().st_size/1024:.0f}KB")
        ok += 1; total_dur_min += info_dur/60; total_segs += len(converted)

    total_elapsed = time.time() - t_start
    print(f"\n{'='*60}")
    print(f"🎉 本轮完成！")
    print(f"  ✅ 成功 {ok}  |  ❌ 失败 {fail}  |  ⚠️ 跳过 {skip_bad}")
    print(f"  总视频时长: {total_dur_min:.0f}分钟 ({total_dur_min/60:.1f}小时)")
    print(f"  总段数: {total_segs}")
    print(f"  耗时: {total_elapsed/60:.1f}分钟")
    print(f"  输出: {OUT_DIR}")

if __name__ == '__main__':
    main()
