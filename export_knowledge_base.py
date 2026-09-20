"""
最终导出：去重 → 分类 → 包装 Markdown → 输出到 knowledge_base/{分类}/
每个 .md 文件:
  - 文档头（标题 + 来源）
  - 自动生成目录（如果原文件没目录）
  - 原始正文（完全保留，禁止修改）
"""
import os
import re
import shutil
from collections import defaultdict

RAW = r"F:\开发软件项目文件\对练社交\extracted_raw"
OUT = r"F:\开发软件项目文件\对练社交\knowledge_base"

# ============ 去重 ============
unique = {}
for fn in os.listdir(RAW):
    if not fn.endswith('.txt'):
        continue
    path = os.path.join(RAW, fn)
    sz = os.path.getsize(path)
    if sz < 200:
        continue
    clean = re.sub(r'\s*\(\d+\)\s*', '', fn)
    if clean not in unique or sz > unique[clean][0]:
        unique[clean] = (sz, path, fn)

print(f"去重后: {len(unique)} 个文件")

# ============ 分类 ============
CATEGORIES = [
    ("01-沟通聊天", ["好好接话", "聊天", "接话", "搭讪", "开场白", "让顾客舒服", 
        "新鲜有趣", "高情商的打招呼", "找聊天话题", "万能聊天", "话术技巧"]),
    ("02-销售话术-保险", ["保险"]),
    ("03-销售话术-房产", ["房产", "中介", "售楼"]),
    ("04-销售话术-汽车", ["汽车", "车行", "4s"]),
    ("05-销售话术-教育培训", ["早教"]),
    ("06-销售话术-金融投资", ["金融", "投资", "贵金属", "理财", "银行", "证券", "p2p"]),
    ("07-销售话术-电商", ["淘宝", "电商", "网店", "微商", "直播", "抖音", "天猫"]),
    ("08-销售话术-门店导购", ["导购", "家具", "家居", "建材", "门窗", "鞋店", 
        "服装", "美业", "美发", "化妆品", "钻石", "家电", "灯饰", "食品"]),
    ("09-销售话术-通用", ["销售", "推销", "成交", "签单", "绝对成交", "一线销售",
        "电话销售", "400电话", "电销", "外呼"]),
    ("10-说话艺术", ["问话", "提问", "问话的技术", "问话艺术", "表达", "沟通话术", 
        "直销沟通", "课程顾问", "猎头", "家装谈单", "家装谈单"]),
    ("11-职场处事", ["职场", "职场处事", "职场谋生", "辞职", "上司", "领导", 
        "汇报", "三国职场", "大领导手段", "同事", "高层交往"]),
    ("12-送礼话术", ["送礼", "礼物"]),
    ("13-饭局酒桌", ["酒桌", "饭局", "劝酒", "敬酒", "祝酒", "拒酒", "酒辞", 
        "应酬语", "场面话", "聚会劝酒"]),
    ("14-相亲婚恋", ["相亲", "婚恋", "恋爱", "约会", "提亲"]),
    ("15-人性心理", ["人性", "心理", "驭心", "隐性思维", "认知", "开窍", 
        "洞察人性", "人性赚钱", "人性探索", "超认知", "颠覆认知", "算命",
        "老子", "易经"]),
    ("16-权谋做局", ["做局", "权谋", "谋略", "伪装", "手段", "生存谋略", 
        "韩非子", "厚黑", "绿茶男", "绿茶女", "红尘破局", "强势文化"]),
    ("17-赚钱营销", ["赚钱", "营销", "营销锦囊", "消费", "花钱", "经济学", 
        "小老板", "穷人的底层", "消费心理", "大领导"]),
    ("18-女性智慧", ["女性", "两性", "高级女人", "红颜", "女性人情", 
        "女性开悟", "上层人", "洞悉社会", "男欢女爱", "约会", "白天约会"]),
    ("99-其他", []),
]

def classify(filename):
    for cat_dir, keywords in CATEGORIES:
        for kw in keywords:
            if kw in filename:
                return cat_dir
    return "99-其他"

# ============ 辅助函数 ============
def is_toc(text):
    """检测是否已有目录"""
    first_2k = text[:2000]
    toc_markers = ['目录', '目　录', 'Contents', '目　录', '前言Preface', '前言']
    if any(m in first_2k for m in toc_markers):
        return True
    # 或者有大量 "第X章" / "第X节" 模式在开头
    chapter_matches = re.findall(r'第[一二三四五六七八九十百\d]+[章章节篇]', first_2k)
    if len(chapter_matches) >= 3:
        return True
    return False

def extract_toc_from_text(text):
    """如果原文件有目录部分，尝试提取"""
    # 找"目录"关键词位置
    idx = -1
    for m in ['目录', '目　录', 'Contents']:
        found = text.find(m)
        if found != -1 and (idx == -1 or found < idx):
            idx = found
    
    if idx == -1:
        return None
    
    # 取目录部分（从"目录"到下一个非目录内容的开始）
    toc_start = idx
    toc_section = text[idx:idx+3000]
    
    # 找第一章开始的位置（目录通常在正文之前）
    first_chapter = re.search(r'\n(前言|第[一二三四五六七八九十百\d]+章)', toc_section[len('目录'):])
    if first_chapter:
        toc_text = toc_section[:len('目录') + first_chapter.start()]
    else:
        toc_text = toc_section[:1500]
    
    # 清理
    toc_lines = []
    for line in toc_text.split('\n'):
        line = line.strip()
        if line and len(line) > 2 and len(line) < 80:
            toc_lines.append(line)
    
    return '\n'.join(toc_lines[:50]) if toc_lines else None

def auto_generate_toc(text):
    """扫描正文，自动生成目录"""
    # 找 "第X章" "第X节" "一、二、三、" "1. 2. 3." 等标题模式
    lines = text.split('\n')
    headings = []
    
    patterns = [
        (r'^(第[一二三四五六七八九十百\d]+[章章节篇部卷])', 1),  # 章节
        (r'^([一二三四五六七八九十]+[、.])', 2),  # 中文序号
        (r'^(\d+[.、])', 3),  # 数字序号
    ]
    
    for line in lines[:300]:  # 只扫前300行找标题
        line_stripped = line.strip()
        for pat, level in patterns:
            m = re.match(pat, line_stripped)
            if m and len(line_stripped) < 80:
                headings.append((level, line_stripped))
                break
    
    if not headings:
        return None
    
    # 生成 Markdown 目录
    toc_lines = []
    for level, text_line in headings[:40]:
        indent = '  ' * (level - 1)
        toc_lines.append(f"{indent}- {text_line}")
    
    return '\n'.join(toc_lines)

def read_text_safe(path):
    """安全读取，尝试多种编码"""
    for enc in ['utf-8', 'gbk', 'gb18030', 'utf-16']:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read(), enc
        except:
            continue
    # 最后兜底
    with open(path, 'rb') as f:
        raw = f.read()
    return raw.decode('utf-8', errors='replace'), 'utf-8-replace'

# ============ 执行导出 ============
stats = defaultdict(int)
errors = []

for clean_name, (sz, src_path, orig_name) in unique.items():
    cat_dir = classify(orig_name)
    cat_path = os.path.join(OUT, cat_dir)
    os.makedirs(cat_path, exist_ok=True)
    
    # 读取内容
    try:
        content, enc = read_text_safe(src_path)
    except Exception as e:
        errors.append(f"READ FAIL: {orig_name}: {e}")
        continue
    
    # 去掉 .txt 扩展名的标题
    base_title = os.path.splitext(clean_name)[0].strip()
    base_title = re.sub(r'^[\d一二三四五六七八九十]+[\.、\s]+', '', base_title)  # 去掉前缀编号
    base_title = base_title.strip('《》')  # 去掉书名号
    
    # 生成 Markdown
    md_lines = []
    md_lines.append(f"# {base_title}")
    md_lines.append("")
    md_lines.append(f"> 原始文件: `{orig_name}` | 来源目录: `{os.path.basename(cat_dir)}` | 编码: {enc}")
    md_lines.append("")
    
    # 目录部分
    toc = None
    if is_toc(content):
        toc = extract_toc_from_text(content)
    
    if toc:
        md_lines.append("## 📋 目录")
        md_lines.append("")
        md_lines.append(toc)
        md_lines.append("")
        md_lines.append("---")
        md_lines.append("")
        # 保留原文件中的目录 + 正文（因为原文件里目录和正文已经在一起了）
        md_lines.append(content)
    else:
        auto_toc = auto_generate_toc(content)
        if auto_toc:
            md_lines.append("## 📋 自动生成目录")
            md_lines.append("")
            md_lines.append(auto_toc)
            md_lines.append("")
            md_lines.append("---")
            md_lines.append("")
        md_lines.append(content)
    
    # 输出 .md
    md_name = os.path.splitext(clean_name)[0] + '.md'
    md_path = os.path.join(cat_path, md_name)
    
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md_lines))
    
    stats[cat_dir] += 1

# ============ 输出统计 ============
print("\n" + "="*50)
print("=== EXPORT COMPLETE ===")
print("="*50)
total = 0
for cat_dir in sorted(stats.keys()):
    count = stats[cat_dir]
    total += count
    cat_path = os.path.join(OUT, cat_dir)
    cat_mb = sum(os.path.getsize(os.path.join(cat_path, f)) 
                 for f in os.listdir(cat_path) if f.endswith('.md')) / 1024 / 1024
    print(f"  {cat_dir}: {count} 个文件 ({cat_mb:.2f} MB)")

print(f"\n总计: {total} 个 Markdown 文件")
print(f"输出目录: {OUT}")

if errors:
    print(f"\n⚠️ 错误 ({len(errors)}):")
    for e in errors[:5]:
        print(f"  {e}")
