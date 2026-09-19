import json
f = open(r"f:\开发软件项目文件\对练社交\knowledge_base\extra_course_cards_01.js","r",encoding="utf-8").read()
arr = json.loads(f[f.index("["):f.rindex("]")+1])
print(f"shard01: {len(arr)} cards")
for c in arr[:2]:
    print()
    print(f"  title: {c['title'][:50]}")
    print(f"  bundle: {c['bundle']}, chars: {c['chars']}")
    print(f"  source: {c['source']}")
    print(f"  endswith .md? {c['source'].endswith('.md')}")