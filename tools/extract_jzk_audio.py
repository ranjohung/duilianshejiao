# -*- coding: utf-8 -*-
"""
金正昆视频：先用 ffmpeg 提取音频 → 再用 faster-whisper 转写
用法: python tools/extract_jzk_audio.py [--skip-audio] [--whisper-model small]
"""
import os, sys, subprocess, json, time, argparse
from pathlib import Path
from datetime import datetime

SRC_ROOT = r"G:\BaiduNetdiskDownload\高情商话术\版块12--礼仪培训大全集 共11个模块 （182套）"
DST_ROOT = r"f:\开发软件项目文件\对练社交\knowledge_base\markdown\礼仪规范"
AUDIO_DIR = r"f:\开发软件项目文件\对练社交\tools\_audio_cache"

def find_jzk_videos():
    """找出所有金正昆的视频（排除重复的 .rmvb，优先用 .mp4）"""
    videos = []
    for root, dirs, files in os.walk(SRC_ROOT):
        dirs[:] = [d for d in dirs if '播放器' not in d and '##' not in d]
        for fn in files:
            if '.baiduyun' in fn or '.downloading' in fn:
                continue
            ext = os.path.splitext(fn)[1].lower()
            if ext not in ('.mp4', '.rmvb', '.flv', '.avi'):
                continue
            fpath = os.path.join(root, fn)
            # 只处理金正昆相关的
            if '金正昆' not in fpath and '模块11' not in fpath:
                continue
            videos.append(fpath)

    # 去重：同一集有 .rmvb 和 .mp4 的，优先用 .mp4
    by_name = {}
    for v in videos:
        base = os.path.splitext(os.path.basename(v))[0]
        ext = os.path.splitext(v)[1].lower()
        if base not in by_name:
            by_name[base] = v
        else:
            # .mp4 优先
            cur_ext = os.path.splitext(by_name[base])[1].lower()
            if ext == '.mp4' and cur_ext != '.mp4':
                by_name[base] = v

    return list(by_name.values())

def extract_audio(video_path: str, out_dir: str) -> str:
    """ffmpeg 提取音频为 16kHz mono wav"""
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(video_path))[0]
    safe_base = base.replace('[', '').replace(']', '').replace('{', '').replace('}', '')
    wav_path = os.path.join(out_dir, safe_base + '.wav')

    if os.path.exists(wav_path) and os.path.getsize(wav_path) > 1000:
        return wav_path  # 已提取

    cmd = [
        'ffmpeg', '-y', '-i', video_path,
        '-vn', '-acodec', 'pcm_s16le',
        '-ar', '16000', '-ac', '1',
        wav_path
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, timeout=600)
        if result.returncode != 0:
            print(f"  ffmpeg 失败: {result.stderr.decode('gbk', errors='ignore')[:200]}")
            return ""
        return wav_path
    except Exception as e:
        print(f"  ffmpeg 异常: {e}")
        return ""

def transcribe(wav_path: str, model_size: str = "small") -> str:
    """faster-whisper 转写"""
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel(model_size, device="auto", compute_type="auto")
        segments, info = model.transcribe(wav_path, language="zh", vad_filter=True)
        text = "".join(seg.text for seg in segments).strip()
        return text
    except Exception as e:
        print(f"  whisper 失败: {e}")
        return ""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--skip-audio', action='store_true', help='跳过音频提取')
    parser.add_argument('--whisper-model', default='small', help='faster-whisper 模型大小')
    parser.add_argument('--skip-whisper', action='store_true', help='只提取音频不转写')
    args = parser.parse_args()

    videos = find_jzk_videos()
    print(f"找到 {len(videos)} 个金正昆视频（去重后）")

    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(DST_ROOT, exist_ok=True)

    results = []
    for i, vpath in enumerate(videos):
        fname = os.path.basename(vpath)
        print(f"\n[{i+1}/{len(videos)}] {fname}")

        # 1. 提取音频（只要不 skip_audio 就做）
        wav_path = ""
        if not args.skip_audio:
            print("  提取音频...")
            wav_path = extract_audio(vpath, AUDIO_DIR)
            if not wav_path:
                results.append({"video": vpath, "status": "fail_audio"})
                continue
        else:
            # 找已有的 wav
            base = os.path.splitext(os.path.basename(vpath))[0].replace('[', '').replace(']', '').replace('{', '').replace('}', '')
            wav_path = os.path.join(AUDIO_DIR, base + '.wav')
            if not os.path.exists(wav_path):
                print(f"  没有对应 wav，跳过")
                continue

        # 2. ASR 转写
        if not args.skip_whisper and wav_path:
            print(f"  ASR 转写 (model={args.whisper_model})...")
            start = time.time()
            text = transcribe(wav_path, args.whisper_model)
            elapsed = time.time() - start

            if text and len(text) > 50:
                # 写 Markdown
                base = os.path.splitext(os.path.basename(vpath))[0]
                safe_title = base.replace('[', '').replace(']', '').replace('{', '').replace('}', '')
                md_path = os.path.join(DST_ROOT, f"金正昆_{safe_title}.md")
                with open(md_path, 'w', encoding='utf-8') as f:
                    f.write(f"# 金正昆 - {safe_title}\n\n")
                    f.write(f"> 原始视频：{vpath}\n")
                    f.write(f"> 转写时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
                    f.write(f"> 音频时长转写耗时：{elapsed:.1f}秒\n\n")
                    f.write("---\n\n")
                    f.write(text)
                print(f"  ✅ 成功 ({len(text)}字, {elapsed:.1f}秒) → {md_path}")
                results.append({"video": vpath, "status": "ok", "chars": len(text), "dst": md_path})
            else:
                print(f"  ❌ ASR 结果为空")
                results.append({"video": vpath, "status": "empty"})
        elif args.skip_whisper:
            print(f"  ⏭️  只提取音频，跳过转写")
            results.append({"video": vpath, "status": "audio_only", "wav": wav_path})

    # 保存结果
    result_path = os.path.join(os.path.dirname(__file__), "jzk_asr_result.json")
    with open(result_path, 'w', encoding='utf-8') as f:
        json.dump({
            "time": datetime.now().isoformat(),
            "summary": {
                "ok": sum(1 for r in results if r["status"] == "ok"),
                "fail_audio": sum(1 for r in results if r["status"] == "fail_audio"),
                "empty": sum(1 for r in results if r["status"] == "empty"),
                "audio_only": sum(1 for r in results if r["status"] == "audio_only"),
                "total": len(results),
            },
            "details": results,
        }, f, ensure_ascii=False, indent=2)
    print(f"\n结果已保存: {result_path}")

if __name__ == "__main__":
    main()
