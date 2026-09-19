import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r"f:\开发软件项目文件\对练社交\knowledge_base\extra_course_cards_all.js", "r", encoding="utf-8") as f:
    content = f.read()

# 找到 JSON 数组开始
idx = content.find('[')
arr = json.loads(content[idx:content.rfind(']')+1])

print(f"总共: {len(arr)} 张")

# 检查有干净摘要 vs 水印摘要
wm_count = 0
for c in arr:
    if "朋友圈" in c.get("summary","") or "sm99878" in c.get("summary","") or "电子版书籍" in c.get("summary",""):
        wm_count += 1

print(f"水印摘要: {wm_count}")
print(f"干净摘要: {len(arr) - wm_count}")

# 找"穷人"
for c in arr:
    if "穷人" in c.get("title",""):
        print()
        print(f"=== {c['title']} ===")
        print(f"  chars: {c['chars']}")
        print(f"  source: {c['source']}")
        print(f"  summary前200: {c['summary'][:200]}")
        print(f"  content前200: {c['content'][:200]}")
        
        # 读原始 md 看开头
        import os
        md_path = os.path.join(r"f:\开发软件项目文件\对练社交", c['source'])
        if os.path.exists(md_path):
            with open(md_path, "r", encoding="utf-8", errors="ignore") as mf:
                md_text = mf.read()
            # 找第一个有意义的正文
            body = md_text
            idx2 = body.find('---')
            if idx2 > 0: body = body[idx2+3:]
            body = body.strip()
            lines = body.split('\n')
            meaningful = []
            wm_pats = [r"更多.{0,10}电子书", r"朋友圈.{0,10}电子版", r"sm99878|tushu959|kc58567"]
            for l in lines[:80]:
                st = l.strip()
                if not st or len(st) < 8 or st.isdigit(): continue
                if any(re.search(p, st) for p in wm_pats): continue
                if st.count('...') + st.count('…') >= 3: continue
                if not re.search(r"[\u4e00-\u9fff]", st): continue
                meaningful.append(st)
                if sum(len(s) for s in meaningful) > 300: break
            print(f"  md 实际正文前300: {chr(10).join(meaningful)[:300]}")
        break