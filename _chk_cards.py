import json
f = open(r'f:\开发软件项目文件\对练社交\knowledge_base\extra_course_cards_01.js', 'r', encoding='utf-8').read()
arr = json.loads(f[f.index('['):f.rindex(']')+1])
print('=== 分片01 样本 ===')
for c in arr[:3]:
    t = c.get('title','')
    b = c.get('bundle','')
    ca = c.get('cat','')
    ch = c.get('chars',0)
    s = c.get('source','')
    su = c.get('summary','')[:150]
    print()
    print(f'Title: {t}')
    print(f'Bundle={b}, Cat={ca}, Chars={ch}')
    print(f'Source: {s}')
    print(f'Summary: {su}')