import json, re

def fix_trailing_commas(text: str) -> str:
    """去掉 JSON 数组/对象里最后一个元素后面的逗号"""
    # 匹配 }, 或 ], 后面跟着 } 或 ] 的情况
    fixed = re.sub(r',(\s*[}\]])', r'\1', text)
    return fixed

f = open(r'f:\开发软件项目文件\对练社交\knowledge_base\extra_course_cards.js', 'r', encoding='utf-8')
c = f.read()
f.close()

m = re.search(r'window\.extraCourseCards\s*=\s*(\[.+\])\s*;?\s*$', c, re.DOTALL)
if not m:
    print("没找到数组")
    exit()

fixed_json = fix_trailing_commas(m.group(1))
arr = json.loads(fixed_json)
print(f"原卡片数: {len(arr)}")
cats = {}
for x in arr:
    cat = x.get("category", "?")
    cats[cat] = cats.get(cat, 0) + 1
for cat, cnt in sorted(cats.items()):
    print(f"  {cat}: {cnt}")
print()
print("前3张详细:")
for x in arr[:3]:
    print(f"  id={x.get('id')} title={x.get('title','?')[:40]} chars={x.get('chars',0)}")
    print(f"    fullContent={len(x.get('fullContent','')) if 'fullContent' in x else '无'}, bundle={x.get('bundle','')[:30]}")
