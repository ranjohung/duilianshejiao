import urllib.request, re, sys
sys.stdout.reconfigure(encoding='utf-8')

# 检查主文件
try:
    main = urllib.request.urlopen("http://127.0.0.1:8765/knowledge_base/extra_course_cards.js").read().decode('utf-8')
    print(f"=== extra_course_cards.js 主文件 ===")
    print(f"  长度: {len(main)} chars")
    print(f"  前300字: {main[:300]}")
    print()
except Exception as e:
    print(f"主文件加载失败: {e}")

# 检查 index.html 里 extraCourseCards 合并逻辑
idx = urllib.request.urlopen("http://127.0.0.1:8765/index.html").read().decode('utf-8')

# 找 extraCourseCards 赋值和合并
for pat in [r'extraCourseCards\s*=', r'window\.extraCourseCards\s*=', r'.filter\(function\(card\).*?\}\s*\)', r'let learningCards\s*=', r'var learningCards\s*=']:
    m = re.search(pat, idx, re.DOTALL)
    if m:
        snippet = idx[max(0,m.start()-20):min(len(idx),m.end()+200)]
        print(f"=== Pattern: {pat[:50]} ===")
        print(snippet[:300])
        print()