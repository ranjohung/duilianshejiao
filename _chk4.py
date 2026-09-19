import json, sys
sys.stdout.reconfigure(encoding='utf-8')
f = open(r"f:\开发软件项目文件\对练社交\knowledge_base\extra_course_cards_01.js","r",encoding="utf-8").read()
arr = json.loads(f[f.index("["):f.rindex("]")+1])
print("前2张卡片所有keys:")
for c in arr[:2]:
    print(f"  {list(c.keys())}")
    print(f"  status = {repr(c.get('status', '<无>'))}")
print()
has_status = sum(1 for c in arr if c.get('status') == 'ok')
print(f"status='ok': {has_status}/{len(arr)}")
no_status = sum(1 for c in arr if 'status' not in c)
print(f"无 status 字段: {no_status}/{len(arr)}")