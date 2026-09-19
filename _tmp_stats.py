import json, re, os
import pymupdf
s = open(r'knowledge_base/extra_course_cards.js', encoding='utf-8').read()
st = s.index('[', s.index('=')); en = s.rindex(']')
cards = json.loads(re.sub(r',\s*\]', ']', s[st:en+1]))
scanned = [c for c in cards if c.get('status') == 'scanned']
ROOT = r'G:\BaiduNetdiskDownload\高情商话术'

for c in scanned:
    p = os.path.join(ROOT, c['source'])
    if not p.lower().endswith('.pdf'):
        print('非PDF:', c['source'][-60:], '存在' if os.path.exists(p) else '不存在')
        continue
    try:
        d = pymupdf.open(p)
        rendered = 0
        for i in [0, 5, 20]:
            if i >= len(d):
                continue
            try:
                pm = d[i].get_pixmap(dpi=60)
                if pm.width > 0 and pm.height > 0:
                    rendered += 1
            except Exception as e:
                print('  渲染失败 p%d:' % i, str(e)[:50])
        d.close()
        print('%-50s 渲染探测 %d/3 成功' % (c['source'].split('\\')[-1][:50], rendered))
    except Exception as e:
        print(c['source'][-50:], 'ERR', str(e)[:60])

# mp4 检查
import glob
mp4s = [c for c in scanned if c['source'].lower().endswith('.mp4')]
for c in mp4s:
    p = os.path.join(ROOT, c['source'])
    print('mp4 存在:', os.path.exists(p), '|', c['source'][-70:])
    d = os.path.dirname(p)
    if os.path.isdir(d):
        print('  同目录文件:', [f for f in os.listdir(d) if '13' in f or '商场' in f][:5])
