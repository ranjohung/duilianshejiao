"""
扫描 extracted_raw 目录，按关键词聚类分析内容类型
"""
import os
import re
from collections import Counter, defaultdict

OUT = r"F:\开发软件项目文件\对练社交\extracted_raw"

# 读取所有文件名
files = []
for fn in sorted(os.listdir(OUT)):
    if fn.endswith('.txt'):
        sz = os.path.getsize(os.path.join(OUT, fn))
        # 跳过太小的（安装说明类）
        if sz < 200:
            continue
        files.append((fn, sz))

print(f"=== 总文件数（>200B）: {len(files)} ===\n")

# 关键词分类
categories = {
    '销售话术': ['销售', '推销', '成交', '销售话术', '推销话术', '签单', '导购', '门店', '销售技巧'],
    '保险话术': ['保险'],
    '聊天/接话': ['聊天', '接话', '搭讪', '开场白', '好好接话', '让顾客舒服', '新鲜有趣'],
    '送礼话术': ['送礼', '礼物'],
    '饭局/酒桌': ['酒桌', '饭局', '劝酒', '敬酒', '祝酒'],
    '职场': ['职场', '职场处事', '职场谋生', '辞职', '同事', '上司', '领导', '汇报'],
    '说话艺术': ['说话', '问话', '提问', '沟通', '话术技巧', '表达', '高情商'],
    '人性/心理': ['人性', '心理', '驭心', '操控', '隐性思维', '认知', '开窍'],
    '权谋/做局': ['做局', '权谋', '谋略', '伪装', '手段', '生存谋略'],
    '赚钱/营销': ['赚钱', '营销', '营销锦囊', '消费', '花钱', '经济学', '小老板'],
    '女性/两性': ['女性', '两性', '高情商女人', '高级女人', '红颜', '情感'],
    '礼仪': ['礼仪', '礼节', '客套', '礼貌'],
    '抖音/短视频': ['抖音', '短视频', '直播', '带货'],
    '电话/电销': ['电话', '电销', '400电话', '外呼'],
    '相亲/婚恋': ['相亲', '婚恋', '恋爱', '约会', '提亲'],
    '医疗/健康': ['口腔', '医美', '体检', '医药'],
    '房产': ['房产', '中介', '售楼'],
    '汽车': ['汽车', '车行', '4s'],
    '教育培训': ['培训', '教育', '早教', '母婴'],
    '网络/电商': ['淘宝', '电商', '网店', '微商'],
    '法律/合同': ['合同', '法律'],
}

# 分类统计
cat_counts = Counter()
cat_files = defaultdict(list)
unmatched = []

for fn, sz in files:
    matched = False
    for cat, keywords in categories.items():
        for kw in keywords:
            if kw in fn:
                cat_counts[cat] += 1
                cat_files[cat].append((fn, sz))
                matched = True
                break
        if matched:
            break
    if not matched:
        unmatched.append((fn, sz))

# 输出分类结果
print("=== 内容分类统计 ===")
for cat, count in cat_counts.most_common():
    total = sum(sz for _, sz in cat_files[cat])
    print(f"  {cat}: {count} 个文件, {total/1024:.1f} KB")

print(f"\n未匹配: {len(unmatched)} 个")
for fn, sz in unmatched[:20]:
    print(f"  {fn} ({sz/1024:.1f}KB)")

print(f"\n=== 各分类文件列表 ===")
for cat in ['聊天/接话', '销售话术', '说话艺术', '送礼话术', '饭局/酒桌', '职场', '人性/心理']:
    if cat in cat_files:
        print(f"\n--- {cat} ---")
        for fn, sz in sorted(cat_files[cat], key=lambda x: -x[1])[:10]:
            print(f"  {sz/1024:7.1f} KB | {fn}")
