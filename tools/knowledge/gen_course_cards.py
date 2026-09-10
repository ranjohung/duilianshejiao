# -*- coding: utf-8 -*-
"""从 asset_index.json 生成 extra_course_cards.js —— 把资料库全部课程目录纳入学习卡片。
不删减任何条目：每个课时 / 每份文档 / 每本书都生成一张可学习卡片。
"""
import os, json, re, io

BASE = r"F:\开发软件项目文件\对练社交\knowledge_base"
SRC = os.path.join(BASE, "asset_index.json")
OUT = os.path.join(BASE, "extra_course_cards.js")

# ---------- 音视频课程：目录 → (章节名, 场景, 媒体类型, 图标) ----------
COURSE_DEFS = [
    ("沟通高手利他聊天术课程", "沟通高手·利他聊天术", "沟通与人际", "audio"),
    ("销冠高情商成交话术视频", "销冠·高情商成交话术", "销售成交", "video"),
    ("赠送：读心术课程视频", "微表情读心术", "读懂人心", "video"),
    ("中国式送礼指南", "中国式送礼指南", "送礼社交", "video"),
    ("礼尚往来实用指南", "礼尚往来实用指南", "送礼社交", "video"),
]

# ---------- 文档话术包：目录 → (章节名, 场景) ----------
DOC_GROUPS = [
    ("各行业销售话术300套", "各行业销售话术 300 套", "销售成交"),
    ("高情商接话聊天话术", "高情商接话聊天话术", "日常聊天"),
    ("送礼秘籍（电子书）", "送礼话术·秘籍", "送礼社交"),
    ("送礼话术（电子书）", "送礼话术·实战", "送礼社交"),
]

# ---------- 电子书合集：二级目录关键字 → (章节名, 场景) ----------
BOOK_GROUPS = [
    ("职场社交", "职场社交精选精读", "职场与事业"),
    ("做局权谋", "做局权谋精选精读", "谋略智慧"),
    ("人性密学", "人性洞察精选精读", "人性认知"),
    ("人性认知", "人性洞察精选精读", "人性认知"),
    ("思维认知", "思维认知精选精读", "思维认知"),
    ("赚钱营销", "赚钱营销精选精读", "商业营销"),
    ("两性情感", "两性情感精选精读", "亲密关系"),
    ("女性成长", "女性成长精选精读", "自我成长"),
    ("说话的艺术", "说话的艺术精选精读", "表达技巧"),
]

# ---------- 原则推导：标题关键词 → 沟通原则 / 要点 ----------
PRINCIPLE_RULES = [
    (["操控", "操纵", "洗脑", "PUA", "精神控制"], "这些技巧只能用来识别，不能用来施加；沟通的前提是对方知情自愿。"),
    (["声音", "亲和力", "语调"], "先调整自己的状态与语气，让对方先感到舒服，再谈内容。"),
    (["一见如故", "破冰", "初次"], "从对方身上的具体细节切入，比通用寒暄更容易拉近距离。"),
    (["信任", "信赖", "靠谱"], "信任来自稳定兑现的小事，而不是漂亮承诺。"),
    (["接受", "说服", "接受度"], "把请求包装成对方获益的选择，而不是你的需要。"),
    (["情感勒索", "边界", "绑架"], "识别并温和设立边界，是对关系长期负责。"),
    (["紧张", "怯场", "焦虑"], "注意力从「我表现如何」转向「对方需要什么」，紧张自然下降。"),
    (["负面反馈", "批评", "差评"], "先接住情绪与事实，再讨论改进，不急于辩解。"),
    (["自信"], "自信来自充分准备与可复述的成果，而不是音量。"),
    (["自我介绍", "介绍自己"], "自我介绍要给对方留下一个「下一步」的接口。"),
    (["亮相", "第一次", "首次"], "第一次出场重在场合适配：先判断场合，再决定表现强度。"),
    (["眼力见", "察言观色", "读懂", "微表情", "读心", "识人"], "先观察对方的动作、节奏与情绪，再决定说什么；观察用于理解，不用于评判。"),
    (["饭局", "场面话", "劝酒", "祝酒", "敬酒", "挡酒", "酒桌", "酒局"], "场面话的核心是让对方舒服；量力而行，不逼人也不逼己。"),
    (["演讲", "发言", "致辞", "汇报"], "结构化表达：结论先行、要点分层、例子收尾。"),
    (["聊得来", "话题", "聊天", "唠嗑"], "话题不是找出来的，是从对方说过的内容里接出来的。"),
    (["感同身受", "共情", "理解"], "先确认对方是被倾听、要建议，还是要实际帮助。"),
    (["幽默", "风趣", "玩笑"], "幽默是共情的副产品，不是攻击的包装。"),
    (["聚会", "广交", "人脉", "社交圈", "关系网"], "在群体场合先做连接者：把别人的话接给第三个人。"),
    (["心思", "琢磨", "动机"], "不臆测动机，用提问确认推断。"),
    (["成交", "签单", "销售", "逼单", "客户", "报价", "谈判", "议价", "成交话术", "销冠"], "成交是需求匹配的结果；先确认需求，再谈价格。"),
    (["投诉", "维权", "售后", "退货", "索赔"], "说明规则、证据与正规升级渠道，不威胁、不羞辱。"),
    (["拒绝"], "拒绝的是这件事，不是这个人；先肯定关系，再给出边界。"),
    (["道歉", "认错"], "道歉要对齐事实、影响与补救，不掺解释。"),
    (["送礼", "送什么", "礼物", "人情", "礼尚往来"], "礼物的价值在于「被看见的需求」，而不是价格；人情要允许对方回绝。"),
    (["领导", "上司", "汇报", "请假", "晋升", "加薪", "职场", "下级", "同事"], "对上沟通先给结论与选项，再给过程；对下沟通先给信任再给要求。"),
    (["团队", "协作", "分工"], "把分歧落到任务与人身上，避免变成对人的评判。"),
    (["家人", "父母", "亲戚", "孩子"], "亲密关系里先处理情绪，再处理事情。"),
    (["表白", "约会", "恋爱", "相亲", "婚恋", "情感", "两性"], "关系推进要允许对方拒绝，节奏以对方舒适为准。"),
    (["人性", "人心"], "理解人性是为了更尊重他人，而不是拿来算计。"),
    (["权谋", "谋略", "做局", "厚黑", "算计"], "谋略的价值在于减少对抗、促成合作，不用于损害他人。"),
    (["开窍", "开悟", "认知", "思维", "心智"], "认知升级的关键，是把抽象概念落到日常可执行的动作上。"),
    (["财富", "赚钱", "营销", "商业", "创业", "副业"], "商业表达以真实价值为前提，不夸大、不诱导。"),
    (["成长", "自我", "女性"], "自我成长先接纳现状，再谈改变；不靠否定自己驱动。"),
    (["话术", "回话", "问话", "接话", "表达", "口才", "说话"], "话术是结构不是台词：先判断情境，再组织语言。"),
]

DEFAULT_PRINCIPLE = "先回应当下情境，再推进话题；表达可改写，不能脱离真实信息。"

TAG_STOP = set(["如何", "怎么", "怎样", "什么", "哪些", "一下", "一个", "我们", "你们",
                "的", "了", "吗", "呢", "和", "与", "让", "把", "会", "能", "要", "就",
                "是", "在", "有", "对", "为", "从", "到", "被", "这", "那", "他", "她"])

SAFETY = "这是参考表达，不是固定答案；请替换为真实信息，不编造、不施压，并允许对方拒绝。"


def clean_title(name):
    """去掉序号前缀、课次前缀与扩展名。"""
    t = os.path.splitext(name)[0]
    t = t.replace('《', '').replace('》', '')
    # 第00先导课 / 第01讲 / 第3课 / 第十节
    t = re.sub(r'^第\s*[\d零一二三四五六七八九十百]+\s*(?:先导课|答疑课|彩蛋课|课|讲|节|集)\s*[、.．:：\-—]?\s*', '', t)
    # 01-10 / 01_ / 1、 / 1. / 10： / (1)
    t = re.sub(r'^\d+\s*[-－~—]\s*\d+\s*[、.．:：\-—]?\s*', '', t)
    t = re.sub(r'^\d+\s*[、.．:：\-—_]\s*', '', t)
    # 数字+量词：48种销售话术 → 销售话术；10个经典成交话术 → 经典成交话术
    t = re.sub(r'^\d+\s*(?:个|套|则|条|款|招|种|天|步|问|大|本|讲|集|篇|例)\s*', '', t)
    t = re.sub(r'^\d+\s+', '', t)
    t = re.sub(r'^\d{1,3}(?=[\u4e00-\u9fa5])', '', t)   # 纯数字直接接中文
    t = t.strip(' .、-—_')
    return t or os.path.splitext(name)[0]


def keywords_of(title, limit=4):
    """按标点把标题切成短语当标签（不做机械切字，避免产生碎片）。"""
    chunks = [c.strip() for c in re.split(r'[，,。、；;：:！!？?（）()\[\]【】「」\s\-—~～/\\|]+', title)]
    out = []
    for c in chunks:
        if not c:
            continue
        c = re.sub(r'^(如何|怎么|怎样|什么|为何|为啥)', '', c).strip()
        if not c:
            continue
        if len(c) > 10:
            c = c[:10]
        if c not in TAG_STOP and c not in out:
            out.append(c)
        if len(out) >= limit:
            break
    return out or [title[:8]]


def principle_of(text):
    for keys, p in PRINCIPLE_RULES:
        for k in keys:
            if k in text:
                return p
    return DEFAULT_PRINCIPLE


def make_card(cid, title, category, scene, medium, source, kind_label, extra_tags=None):
    tags = keywords_of(title)
    if extra_tags:
        for t in extra_tags:
            if t not in tags:
                tags.append(t)
        tags = tags[:5]
    if medium == "audio":
        kind_txt = "音频课"
        content = ('本节音频课主题是「%s」。课程以口播方式拆解这一沟通场景的做法，'
                   '可结合平台对练反复体会语气与节奏。' % title)
    elif medium == "video":
        kind_txt = "视频课"
        content = ('本节视频课主题是「%s」。课程用示范与讲解结合的方式呈现这一场景的处理方法，'
                   '可配合平台场景对练模仿练习。' % title)
    elif medium == "book":
        kind_txt = "电子书"
        content = ('《%s》是本专题的精选读物，提供体系化的方法与案例。'
                   '适合作为该方向的延伸精读材料，读后可到对应场景对练检验。' % title)
    else:
        kind_txt = "话术资料"
        content = ('这份材料围绕「%s」给出可直接参考的表达范例。'
                   '请根据自己的真实处境改写后再使用。' % title)
    return {
        "id": cid,
        "title": title,
        "scene": scene,
        "category": category,
        "content": content,
        "principle": principle_of(title),
        "tips": tags,
        "practicePrompt": "围绕「%s」，在「%s」场景中用自己的话完成一次表达。" % (title, scene),
        "safetyNote": SAFETY,
        "tags": tags,
        "medium": medium,
        "kind": kind_label,
        "source": source,
        "level": "参考",
        "round": 1,
        "userEmotion": ["平静"],
        "coachStyle": ["分析型"],
    }


def main():
    with open(SRC, encoding="utf-8") as f:
        idx = json.load(f)

    cards = []
    seen_titles = set()

    def add(cid, title, category, scene, medium, source, kind_label, extra_tags=None):
        key = (category, title)
        if key in seen_titles:
            return False
        seen_titles.add(key)
        cards.append(make_card(cid, title, category, scene, medium, source, kind_label, extra_tags))
        return True

    # 1) 音视频课程
    for dir_key, chapter, scene, medium in COURSE_DEFS:
        seq = 0
        for d, files in idx["courses"].items():
            if dir_key not in d:
                continue
            for fn in files:
                seq += 1
                title = clean_title(fn)
                add("x_%s_%03d" % (re.sub(r'\W+', '', chapter)[:10], seq),
                    title, chapter, scene, medium,
                    d + "\\" + fn, "音频课" if medium == "audio" else "视频课")

    # 2) 文档话术包
    for dir_key, chapter, scene in DOC_GROUPS:
        seq = 0
        for d, files in idx["books"].items():
            if dir_key not in d:
                continue
            for fn in files:
                seq += 1
                add("x_%s_%03d" % (re.sub(r'\W+', '', chapter)[:10], seq),
                    clean_title(fn), chapter, scene, "doc", d + "\\" + fn, "话术资料")

    # 3) 电子书合集
    for key_sub, chapter, scene in BOOK_GROUPS:
        seq = 0
        for d, files in idx["books"].items():
            if key_sub not in d:
                continue
            for fn in files:
                # 跳过重复副本 (1)
                if re.search(r'\(\d+\)$', os.path.splitext(fn)[0]):
                    continue
                seq += 1
                add("x_%s_%03d" % (re.sub(r'\W+', '', chapter)[:10], seq),
                    clean_title(fn), chapter, scene, "book", d + "\\" + fn, "电子书")

    # 4) 顶层酒桌话术 PDF
    for it in []:
        pass
    add("x_jiuzhuo_001", "酒桌话术（全场合适用）", "酒桌话术", "酒桌社交", "book",
        "8.《酒桌话术》.pdf", "电子书", ["酒桌", "敬酒"])

    # 输出
    buf = io.StringIO()
    buf.write("// 由 tools 生成：资料库课程目录全量纳入（2026-09-10）\n")
    buf.write("// 每一条对应资料库中的一个课时 / 一份资料 / 一本书，不做删减。\n")
    buf.write("window.extraCourseCards = [\n")
    for c in cards:
        buf.write(json.dumps(c, ensure_ascii=False) + ",\n")
    buf.write("];\n")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(buf.getvalue())

    # 统计
    stat = {}
    for c in cards:
        stat[c["category"]] = stat.get(c["category"], 0) + 1
    print("total cards:", len(cards))
    for k, v in sorted(stat.items(), key=lambda x: -x[1]):
        print("  %-24s %d" % (k, v))


if __name__ == "__main__":
    main()
