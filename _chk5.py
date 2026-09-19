import urllib.request, re, sys
sys.stdout.reconfigure(encoding='utf-8')
idx = urllib.request.urlopen("http://127.0.0.1:8765/index.html").read().decode('utf-8')
scripts = re.findall(r'<script[^>]+src=["\']([^"\']*knowledge_base[^"\']*)["\']', idx)
print("=== knowledge_base script 顺序 ===")
for i, s in enumerate(scripts, 1):
    mark = " ← 主文件" if "extra_course_cards.js" == s.split("/")[-1] and "0" not in s.split("/")[-1].replace(".js","").split("_")[-1] else ""
    print(f"  {i:2d}. {s}{mark}")