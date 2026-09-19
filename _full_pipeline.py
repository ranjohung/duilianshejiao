# -*- coding: utf-8 -*-
import os, sys, json, re, math, shutil, time
from collections import Counter, defaultdict
sys.stdout.reconfigure(encoding='utf-8')

PROJ = r"f:\开发软件项目文件\对练社交"
FT = os.path.join(PROJ, "knowledge_base", "full_text")
CLASS_DIR = os.path.join(PROJ, "knowledge_base", "分类全文")
CARDS_DIR = os.path.join(PROJ, "knowledge_base")

SUBDIR_TO_CAT = {
    "赚钱营销提升": "销售赚钱营销",
    "做局权谋18": "人性权谋厚黑",
    "思维认知提升": "思维认知成长",
    "人性认知提升": "人性权谋厚黑",
    "职场社交提升": "职场社交领导",
    "两性情感提升": "两性情感关系",
    "说话的艺术": "演讲表达口才",
    "女性成长智慧": "两性情感关系",
    "赚钱营销51": "销售赚钱营销",
    "做局权谋67": "人性权谋厚黑",
    "人性密学66": "人性权谋厚黑",
    "两性情感53": "两性情感关系",
    "职场社交55": "职场社交领导",
    "思维认知54": "思维认知成长",
    "580好好接话电子版": "高情商话术（接话/回话）",
    "20e利他销售": "销售赚钱营销",
    "版块12--礼仪培训": "礼仪规范接待",
    "送礼话术技巧": "送礼人情关系",
    "CBT电子书籍分享": "心理情绪CBT",
}

KEYWORD_CAT = [
    ('销售赚钱营销', ['销售', '赚钱', '成交', '买单', '营销', '变现', '现金风暴', '赚', '销售技巧']),
    ('人性权谋厚黑', ['人性', '权谋', '厚黑', '做局', '驭人', '心计', '谋略', '道德经', '鬼谷子']),
    ('两性情感关系', ['恋爱', '约会', '相亲', '表白', '情侣', '伴侣', '女人', '男人', '绿茶', '情感', '婚姻', '夫妻']),
    ('职场社交领导', ['职场', '领导', '汇报', '同事', '加薪', '面试', '老板', '上司', '下属']),
    ('思维认知成长', ['思维', '认知', '一年顶', '底层逻辑', '成长', '顶尖思维']),
    ('高情商话术（接话/回话）', ['高情商', '好好接话', '回话', '接话']),
    ('演讲表达口才', ['演讲', '表达', '口才', '说话的艺术', '聊天战术']),
    ('酒桌饭局', ['酒桌', '饭局', '敬酒', '祝酒']),
    ('礼仪规范接待', ['礼仪', '礼节', '金正昆', '仪态', '座次', '涉外']),
    ('送礼人情关系', ['送礼', '礼物', '人情', '走动']),
    ('心理情绪CBT', ['情绪', 'CBT', '认知行为', '焦虑', '抑郁', '心理学']),
]

CAT_TO_FOLDER = {
    '销售赚钱营销': '01_销售赚钱营销',
    '人性权谋厚黑': '02_人性权谋厚黑',
    '两性情感关系': '03_两性情感关系',
    '职场社交领导': '04_职场社交领导',
    '思维认知成长': '05_思维认知成长',
    '高情商话术（接话/回话）': '06_高情商话术接话回话',
    '演讲表达口才': '07_演讲表达口才',
    '酒桌饭局': '08_酒桌饭局',
    '礼仪规范接待': '09_礼仪规范接待',
    '送礼人情关系': '10_送礼人情关系',
    '心理情绪CBT': '11_心理情绪CBT',
    '其他': '99_其他',
}

FOLDER_TO_BUNDLE = {
    '01_销售赚钱营销': 'sales',
    '02_人性权谋厚黑': 'human',
    '03_两性情感关系': 'relationship',
    '04_职场社交领导': 'workplace',
    '05_思维认知成长': 'growth',
    '06_高情商话术接话回话': '情商话术',
    '07_演讲表达口才': 'speech',
    '08_酒桌饭局': 'social',
    '09_礼仪规范接待': 'etiquette',
    '10_送礼人情关系': 'gift',
    '11_心理情绪CBT': 'psychology',
    '99_其他': 'general',
}

def classify(src):
    for kw, cat in SUBDIR_TO_CAT.items():
        if kw in src: return cat
    for cat, kws in KEYWORD_CAT:
        for kw in kws:
            if kw in src: return cat
    return '其他'

def extract_title(src):
    name = os.path.basename(src.replace('/', os.sep))
    for ext in ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.wps', '.htm', '.html']:
        name = name.replace(ext, '')
    name = re.sub(r'^\d+[\.、\s]', '', name)
    name = re.sub(r'^\(\d+\)[\.\s]?', '', name)
    name = re.sub(r'^《', '', name)
    name = re.sub(r'》$', '', name)
    name = re.sub(r'\(\d+\)$', '', name)
    for s in ['(1)', '（1）', '2.0', '_1', '_2', '新版']:
        name = name.replace(s, '')
    return name.strip()[:80] or os.path.basename(src)[:80]

def find_body_start(text):
    lines = text.split('\n')
    wm_pats = [
        r'更多.{0,10}电子书.{0,5}微信.{0,10}',
        r'朋友圈.{0,10}电子版.{0,10}微信',
        r'kc58567|sm99878|tushu959',
        r'课程网址.{0,20}https?://',
    ]
    max_run = 0
    max_end = -1
    cur_run = 0
    for i, l in enumerate(lines):
        st = l.strip()
        if not st: continue
        is_wm = any(re.search(p, st) for p in wm_pats)
        if is_wm:
            cur_run += 1
            if cur_run > max_run:
                max_run = cur_run
                max_end = i
        else:
            cur_run = 0
    skip = max_end + 1 if max_run > 3 else 0
    body = skip
    for i in range(skip, min(skip + 50, len(lines))):
        st = lines[i].strip()
        if len(st) >= 8 and not st.isdigit() and st.count('...') + st.count('…') < 3:
            body = i
            break
    return body

print("=== STEP 1: 读取 md ===")
mds = []
for fn in os.listdir(FT):
    if not fn.endswith('.md') or fn.startswith('_'): continue
    fp = os.path.join(FT, fn)
    try:
        with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
    except: continue
    m = re.search(r'# 原始文件:\s*(.+)', text)
    src = m.group(1) if m else fn
    mds.append({'fn': fn, 'fp': fp, 'src': src, 'chars': len(text), 'text': text})
print(f"  {len(mds)} md, {sum(m['chars'] for m in mds)/10000:.1f}万 字")

print("\n=== STEP 2: 分类+标题+跳过水印 ===")
for md in mds:
    md['cat'] = classify(md['src'])
    md['title'] = extract_title(md['src'])
    body_start = find_body_start(md['text'])
    lines = md['text'].split('\n')
    body_lines = [l.strip() for l in lines[body_start:] if l.strip() and len(l.strip()) >= 8 and not l.strip().isdigit()]
    sum_lines = []
    for l in body_lines[:30]:
        sum_lines.append(l)
        if sum(len(s) for s in sum_lines) > 400: break
    md['summary'] = '\n'.join(sum_lines)[:500]

by_cat = defaultdict(list)
for md in mds: by_cat[md['cat']].append(md)
for cat in sorted(by_cat.keys()):
    fis = by_cat[cat]
    print(f"  {cat}: {len(fis)} 个, {sum(m['chars'] for m in fis)/10000:.1f}万")

print("\n=== STEP 3: 物理分类 ===")
if os.path.exists(CLASS_DIR):
    shutil.rmtree(CLASS_DIR)
os.makedirs(CLASS_DIR, exist_ok=True)
moved = 0
for cat, fis in by_cat.items():
    folder = CAT_TO_FOLDER.get(cat, f"99_{cat}")
    d = os.path.join(CLASS_DIR, folder)
    os.makedirs(d, exist_ok=True)
    for md in fis:
        shutil.copy2(md['fp'], os.path.join(d, md['fn']))
        moved += 1
# 删 full_text 里的原始 md
for md in mds:
    try: os.remove(md['fp'])
    except: pass
print(f"  复制: {moved}, full_text 剩余: {len([f for f in os.listdir(FT) if f.endswith('.md') and not f.startswith('_')])}")

print("\n=== STEP 4: 生成卡片 ===")
cards = []
for i, md in enumerate(mds):
    folder = CAT_TO_FOLDER.get(md['cat'], f"99_{md['cat']}")
    bundle = FOLDER_TO_BUNDLE.get(folder, 'general')
    cards.append({
        'id': f'extra_{i:06d}',
        'title': md['title'],
        'bundle': bundle,
        'cat': md['cat'],
        'chars': md['chars'],
        'summary': md['summary'],
        'content': md['summary'],
        'source': f'knowledge_base/分类全文/{folder}/{md["fn"]}',
        'status': 'ok',
    })
print(f"  {len(cards)} 张卡片")

cards_sorted = sorted(cards, key=lambda c: (c['bundle'], -c['chars']))
shards = [[] for _ in range(10)]
for i, c in enumerate(cards_sorted):
    shards[i % 10].append(c)

for i, shard in enumerate(shards, 1):
    sid = f"{i:02d}"
    ds = json.dumps(shard, ensure_ascii=False)
    with open(os.path.join(CARDS_DIR, f'extra_course_cards_{sid}.js'), 'w', encoding='utf-8') as f:
        f.write(f'window.extraCourseCards_{sid} = {ds};\\n')

main_lines = ['// extra_course_cards main - merge 10 shards']
for i in range(1, 11):
    main_lines.append(f'var _c{i:02d} = window.extraCourseCards_{i:02d} || [];')
main_lines.append('window.extraCourseCards = [].concat(' + ', '.join(f'_c{i:02d}' for i in range(1,11)) + ');')
with open(os.path.join(CARDS_DIR, 'extra_course_cards.js'), 'w', encoding='utf-8') as f:
    f.write('\\n'.join(main_lines) + '\\n')

print(f"  ✅ 分片 + 主文件 已生成")

cnt = Counter(c['bundle'] for c in cards)
for b, c in sorted(cnt.items(), key=lambda x:-x[1]): print(f"    {b}: {c}")

# manifest
with open(os.path.join(CARDS_DIR, '_cards_manifest.json'), 'w', encoding='utf-8') as f:
    json.dump({'total_cards': len(cards), 'total_chars': sum(c['chars'] for c in cards), 'by_cat': {k: len(v) for k, v in by_cat.items()}, 'by_bundle': dict(cnt)}, f, ensure_ascii=False, indent=2)

print(f"\\n✅ 全部完成!")