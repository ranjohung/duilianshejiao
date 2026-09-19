import urllib.request, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

# 拉主文件
main = urllib.request.urlopen("http://127.0.0.1:8766/knowledge_base/extra_course_cards.js").read().decode('utf-8')

print("=== 主文件完整内容 ===")
for i, line in enumerate(main.split('\n'), 1):
    print(f"  {i:2d}: {line}")

print()
print(f"总行数: {len(main.split(chr(10)))}")
print(f"真 LF 字符数: {main.count(chr(10))}")

# 检查 JS 语法（用 Node.js 如果有装）
try:
    result = subprocess.run(['node', '--check', '-e', main], capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        print("\n✅ Node.js 语法检查通过！")
    else:
        print(f"\n❌ Node.js 语法错误: {result.stderr}")
except Exception as e:
    print(f"\n⚠️ 无法运行 node: {e}")