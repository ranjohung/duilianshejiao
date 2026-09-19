import urllib.request, re, sys
sys.stdout.reconfigure(encoding='utf-8')

idx = urllib.request.urlopen("http://127.0.0.1:8766/index.html").read().decode('utf-8')

# 找所有 <script src=...> 标签位置
scripts = list(re.finditer(r'<script[^>]+src=["\']([^"\']+)["\']', idx))
print(f"=== Script 标签顺序（共 {len(scripts)} 个）===")
for m in scripts:
    src = m.group(1)
    if "extra_course" in src or "learning_cards" in src or "raw_course" in src:
        print(f"  位置 {m.start()}: {src}")

# 找 const extraCourseCards 定义位置
m = re.search(r'const extraCourseCards\s*=', idx)
if m:
    print(f"\n=== const extraCourseCards 定义位置: {m.start()} ===")
    
    # 找到它前面最近的一个 script src
    last_script_before = None
    for sm in scripts:
        if sm.start() < m.start():
            last_script_before = sm
        else:
            break
    if last_script_before:
        print(f"它之前的最后一个 script: 位置 {last_script_before.start()} - {last_script_before.group(1)}")
    else:
        print("⚠️ 它之前没有 script 标签！")
    
    # 找它之后第一个 script src
    first_script_after = None
    for sm in scripts:
        if sm.start() > m.start():
            first_script_after = sm
            break
    if first_script_after:
        print(f"它之后的第一个 script: 位置 {first_script_after.start()} - {first_script_after.group(1)}")
    
    print(f"\n⚠️⚠️⚠️ extra_course_cards.js 主文件在 const 定义 {'之前' if any(sm.start() < m.start() and 'extra_course_cards.js' in sm.group(1) and '0' not in sm.group(1).split('/')[-1].replace('.js','').split('_')[-1]) else '之后'}？")