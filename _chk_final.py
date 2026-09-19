import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"f:\开发软件项目文件\对练社交\knowledge_base\extra_course_cards_all.js", "r", encoding="utf-8") as f:
    content = f.read()

prefix = "window.extraCourseCards = "
arr = json.loads(content[len(prefix):].rstrip().rstrip(";"))

# 找"穷人的底层逻辑"
targets = [c for c in arr if "穷人" in c.get("title","")]
print(f"包含'穷人'的卡片: {len(targets)}")
for c in targets[:3]:
    print()
    print(f"title: {c['title']}")
    print(f"source: {c['source']}")
    print(f"chars: {c['chars']}")
    print(f"summary: {c['summary'][:200]}")
    print(f"content前150: {c['content'][:150]}")

# 再找有好内容的卡片
print()
print("=== 检查有干净摘要的卡片 ===")
good = [c for c in arr if "朋友圈" not in c.get("summary","") and "sm99878" not in c.get("summary","") and len(c.get("summary","")) > 100]
print(f"干净摘要卡片: {len(good)}/{len(arr)}")
for c in good[:2]:
    print(f"  {c['title']}: {c['summary'][:80]}...")