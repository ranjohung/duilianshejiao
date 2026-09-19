import json
f = open(r'f:\开发软件项目文件\对练社交\knowledge_base\extra_course_cards_01.js','r',encoding='utf-8').read()
arr = json.loads(f[f.index('['):f.rindex(']')+1])
print(f'分片01: {len(arr)} 张')
for c in arr[:2]:
    print()
    print(f'  title: {c["title"][:50]}')
    print(f'  bundle: {c["bundle"]}')
    print(f'  chars: {c["chars"]}')
    print(f'  status: {c.get("status","?")}')
    print(f'  source: {c["source"]}')
    print(f'  source .md? {c["source"].endswith(".md")}')
