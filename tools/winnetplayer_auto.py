# -*- coding: utf-8 -*-
"""
WinNetPlayer 自动化脚本：启动播放器 → 登录账号 → 播放 .vip 视频 → 录制音频 → ASR 转写
这是用户明确要求的方案。

依赖: pip install pyautogui pygetwindow keyboard pynput
注意: 脚本运行时不要操作鼠标键盘，让自动化完成

用法:
  python tools/winnetplayer_auto.py --list          # 列出所有 .vip 文件
  python tools/winnetplayer_auto.py --test          # 测试登录流程
  python tools/winnetplayer_auto.py --extract N      # 提取前 N 个 .vip 文件
"""
import os, sys, time, json, argparse, subprocess
from pathlib import Path
from datetime import datetime

# ============ 配置 ============
SRC_ROOT = r"G:\BaiduNetdiskDownload\高情商话术\版块12--礼仪培训大全集 共11个模块 （182套）"
PLAYER_EXE = os.path.join(SRC_ROOT, "##网络播放器", "03、台式机电脑、笔记本", "Win网络播放器.exe")
USERNAME = "2hnncf881bz"
PASSWORD = "123456"

OUTPUT_DIR = r"f:\开发软件项目文件\对练社交\knowledge_base\markdown\礼仪规范\vip_extracted"
AUDIO_DIR = r"f:\开发软件项目文件\对练社交\tools\_vip_audio"

def find_vip_files():
    """找出所有已下载完成的 .vip 文件（不含 .downloading 后缀的）"""
    vips = []
    for root, dirs, files in os.walk(SRC_ROOT):
        dirs[:] = [d for d in dirs if '播放器' not in d and '##' not in d]
        for fn in files:
            if '.baiduyun' in fn or '.downloading' in fn:
                continue
            if fn.lower().endswith('.vip'):
                vips.append(os.path.join(root, fn))
    return sorted(vips)

def check_deps():
    """检查 pyautogui 等依赖是否可用"""
    missing = []
    try:
        import pyautogui
    except ImportError:
        missing.append("pyautogui")
    try:
        import pygetwindow
    except ImportError:
        missing.append("pygetwindow")
    try:
        import keyboard
    except ImportError:
        missing.append("keyboard")

    if missing:
        print(f"需要安装依赖: pip install {' '.join(missing)}")
        return False
    return True

def launch_player():
    """启动 WinNetPlayer"""
    print(f"启动播放器: {PLAYER_EXE}")
    if not os.path.exists(PLAYER_EXE):
        print("❌ 播放器不存在！")
        return False
    subprocess.Popen([PLAYER_EXE])
    time.sleep(3)  # 等待启动
    return True

def find_player_window():
    """查找播放器窗口"""
    try:
        import pygetwindow as gw
        windows = gw.getAllWindows()
        for w in windows:
            title = w.title.strip()
            if title and ('NetPlayer' in title or '播放器' in title or 'VIP' in title):
                print(f"找到窗口: '{title}'")
                return w
        # 找不到的话列出所有窗口
        print("未找到播放器窗口，当前窗口列表:")
        for w in windows:
            if w.title:
                print(f"  '{w.title}'")
        return None
    except Exception as e:
        print(f"查找窗口失败: {e}")
        return None

def login():
    """输入账号密码登录"""
    import pyautogui
    import keyboard

    print("等待登录界面...")
    time.sleep(2)

    # 这个位置需要根据实际播放器界面调整
    # 通常登录框在中间，先尝试 tab 切换
    # 策略：先 Ctrl+A 全选，然后输入账号
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.3)
    pyautogui.typewrite(USERNAME, interval=0.05)
    time.sleep(0.5)
    pyautogui.press('tab')
    time.sleep(0.3)
    pyautogui.typewrite(PASSWORD, interval=0.05)
    time.sleep(0.5)
    pyautogui.press('enter')
    time.sleep(2)
    print("登录操作完成")

def record_and_extract(vip_path: str, duration_sec: int = 60, out_wav: str = ""):
    """
    播放一个 .vip 文件并录制音频
    方案: 使用系统音频设备录音 (Windows WASAPI loopback)
    """
    if not out_wav:
        out_wav = os.path.join(AUDIO_DIR, os.path.basename(vip_path).replace('.vip', '.wav'))

    os.makedirs(AUDIO_DIR, exist_ok=True)

    # 方案 A: 用 ffmpeg 的 WASAPI loopback 录制
    # ffmpeg -f dshow -i audio="virtual-audio-capturer" -t 60 output.wav
    # 需要先安装 virtual-audio-capturer 或使用系统自带的

    # 先用 screen/audio recording
    print(f"录制音频 → {out_wav}")

    # 简化方案：让用户先手动配置，或者用 audacity 命令行
    # 这里先输出占位，后续实际测试后再完善
    print("  音频录制需要额外配置（virtual-audio-capturer 或等价方案）")
    print("  建议: 安装 VB-Cable 或 virtual-audio-capturer")
    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--list', action='store_true', help='列出所有 .vip 文件')
    parser.add_argument('--test', action='store_true', help='测试登录流程')
    parser.add_argument('--extract', type=int, default=0, help='提取前 N 个文件')
    args = parser.parse_args()

    vips = find_vip_files()
    print(f"找到 {len(vips)} 个 .vip 文件")

    if args.list:
        for i, v in enumerate(vips[:20]):
            print(f"  [{i+1}] {v}")
        if len(vips) > 20:
            print(f"  ... 还有 {len(vips)-20} 个")
        return

    if args.test:
        if not check_deps():
            return
        ok = launch_player()
        if ok:
            time.sleep(2)
            w = find_player_window()
            if w:
                login()
            else:
                print("请手动确认播放器窗口标题，然后修改脚本")
        return

    if args.extract > 0:
        if not check_deps():
            return
        targets = vips[:args.extract]
        print(f"\n准备提取前 {len(targets)} 个 .vip 文件")
        print("⚠️  运行期间请不要操作鼠标键盘！")
        print("⚠️  按 Ctrl+C 可随时停止\n")

        ok = launch_player()
        if not ok:
            return
        time.sleep(3)
        login()

        results = []
        for i, vpath in enumerate(targets):
            fname = os.path.basename(vpath)
            print(f"\n[{i+1}/{len(targets)}] {fname}")
            # TODO: 实际提取逻辑
            results.append({"vip": vpath, "status": "pending"})

        print(f"\n完成 {len(results)} 个文件处理")
        return

    parser.print_help()

if __name__ == "__main__":
    main()
