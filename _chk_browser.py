import urllib.request, json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

# 1. 检查 index.html 里 extraCourseCards 的加载代码
idx = urllib.request.urlopen("http://127.0.0.1:8765/index.html").read().decode('utf-8')

# 找所有引用 extra_course_cards 的 script 标签
scripts = re.findall(r'<script[^>]+src=["\']([^"\']*extra_course[^"\']*)["\']', idx)
print(f"=== index.html 引用的 extra_course scripts: {len(scripts)} 个 ===")
for s in scripts: print(f"  {s}")

# 找过滤条件
filter_match = re.search(r'extraCourseCards\.filter\([^)]+\)', idx)
if filter_match:
    print(f"\n=== 过滤条件 ===")
    print(f"  {filter_match.group()}")

# 找 learningCards 的合并
merge_match = re.search(r'learningCards\s*=\s*\[(.*?)\]', idx)
if merge_match:
    print(f"\n=== learningCards 合并 ===")
    print(f"  learningCards = [{merge_match.group(1).strip()[:200]}...]")

# 2. 检查每个分片 JS
print(f"\n=== 分片内容检查 ===")
ok = 0
bad = 0
for i in range(1, 11):
    url = f"http://127.0.0.1:8765/knowledge_base/extra_course_cards_{i:02d}.js"
    try:
        c = urllib.request.urlopen(url).read().decode('utf-8')
        # 提取数组
        arr_match = re.search(r'\[.*\]', c, re.DOTALL)
        if arr_match:
            arr = json.loads(arr_match.group())
            has_bundle = sum(1 for x in arr if x.get('bundle'))
            has_chars = sum(1 for x in arr if x.get('chars',0) > 0)
            has_source = sum(1 for x in arr if x.get('source'))
            print(f"  shard_{i:02d}: {len(arr)}张  bundle={has_bundle} chars>0={has_chars} source={has_source}")
            ok += 1
        else:
            print(f"  shard_{i:02d}: 无法解析数组")
            bad += 1
    except Exception as e:
        print(f"  shard_{i:02d}: ❌ {e}")
        bad += 1

print(f"\n总计: ok={ok} bad={bad}")