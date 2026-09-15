# -*- coding: utf-8 -*-
"""从「真实提取的正文」重建学习卡片。

与旧版的根本区别：
  旧版只用文件名生成占位文案（"本节视频课主题是…"），所以卡片里没有知识。
  新版读取 knowledge_base/extracted/ 与 knowledge_base/transcripts/ 的真实正文，
  把课程内容原样放回卡片，并拆成「节」供逐节翻页阅读。

产物：
  knowledge_base/extra_course_cards.js       轻量索引（全量课程，不遗漏）
  knowledge_base/course_content/cc_*.js      正文内容包（按章节分卷，按需加载）
"""
import os, json, re, io, hashlib, math

BASE = r"F:\开发软件项目文件\对练社交\knowledge_base"
EXTRACT_MANIFEST = os.path.join(BASE, "extracted", "_manifest.json")
TRANS_MANIFEST = os.path.join(BASE, "transcripts", "_manifest.json")
EXTRACT_DIR = os.path.join(BASE, "extracted")
TRANS_DIR = os.path.join(BASE, "transcripts")
ASSET_INDEX = os.path.join(BASE, "asset_index.json")
OUT_CARDS = os.path.join(BASE, "extra_course_cards.js")
OUT_CONTENT_DIR = os.path.join(BASE, "course_content")

ROOT = r"G:\BaiduNetdiskDownload\高情商话术"

MAX_CARD_CHARS = 200000     # 单卡正文上限（覆盖任何单本课程；超出才提示"完整文件见原始资料"）

# ---------------------------------------------------------------- 章节映射
# (路径关键字, 章节名, 章节图标, 媒体类型)
COLLECTIONS = [
    (r"20e利他销售资料合集\沟通高手利他聊天术课程", "沟通高手·利他聊天术", "💬", "audio"),
    (r"20e利他销售资料合集\销冠高情商成交话术视频", "销冠·高情商成交话术", "🎯", "video"),
    (r"20e利他销售资料合集", "利他销售资料", "🤝", "doc"),
    (r"送礼话术技巧全攻略\送礼指南（视频）\中国式送礼指南", "中国式送礼指南", "🎁", "video"),
    (r"送礼话术技巧全攻略\送礼指南（视频）\礼尚往来实用指南", "礼尚往来实用指南", "🎀", "video"),
    (r"送礼话术技巧全攻略\送礼秘籍（电子书）", "送礼秘籍", "📕", "book"),
    (r"送礼话术技巧全攻略\送礼话术（电子书）", "送礼话术实战", "🎁", "doc"),
    (r"高情商话术\580好好接话电子版\各行业销售话术300套", "各行业销售话术 300 套", "🏆", "doc"),
    (r"高情商话术\580好好接话电子版\赠送：读心术课程视频", "微表情读心术", "👁", "video"),
    (r"高情商话术\580好好接话电子版\高情商接话聊天话术", "高情商接话聊天话术", "💬", "doc"),
    (r"高情商话术\580好好接话电子版", "好好接话", "📗", "doc"),
    (r"综合提升大合集\《女性成长智慧五本合集》", "女性成长智慧", "🌸", "book"),
    (r"综合提升大合集\两性情感提升8本合集", "两性情感", "💗", "book"),
    (r"综合提升大合集\人性认知提升15本合集", "人性认知", "🧠", "book"),
    (r"综合提升大合集\做局权谋18本合集", "做局权谋", "♟", "book"),
    (r"综合提升大合集\思维认知提升16本合集", "思维认知", "🔭", "book"),
    (r"综合提升大合集\职场社交提升14本合集", "职场社交", "💼", "book"),
    (r"综合提升大合集\说话的艺术6本合集", "说话的艺术", "🗣", "book"),
    (r"综合提升大合集\赚钱营销提升27本合集", "赚钱营销", "💰", "book"),
    (r"B.精选好书合集\两性情感53本大合集", "两性情感精选", "💗", "book"),
    (r"B.精选好书合集\人性密学66本合集", "人性密学", "🧠", "book"),
    (r"B.精选好书合集\做局权谋67本合集", "做局权谋精选", "♟", "book"),
    (r"B.精选好书合集\思维认知54本合集", "思维认知精选", "🔭", "book"),
    (r"B.精选好书合集\职场社交55本合集", "职场社交精选", "💼", "book"),
    (r"B.精选好书合集\赚钱营销51本合集", "赚钱营销精选", "💰", "book"),
    (r"版块12--礼仪培训大全集 共11个模块 （182套）\赠送3：礼仪全集-视频配套PPT", "礼仪培训大全·视频配套讲义", "🙇", "doc"),
    (r"版块12--礼仪培训大全集 共11个模块 （182套）\模块11：赠送 金正昆课程全集 23套", "礼仪培训大全·金正昆课程", "🎓", "doc"),
    (r"版块12--礼仪培训大全集 共11个模块 （182套）", "礼仪培训大全", "🙇", "doc"),
    (r"8.《酒桌话术》.pdf", "酒桌话术", "🍶", "book"),
]
DEFAULT_COLLECTION = ("其他资料", "📄", "doc")

# 非学习内容：播放器安装说明等，不生成学习卡片
EXCLUDE_RULES = ["##网络播放器"]

MEDIUM_LABEL = {"audio": "音频课", "video": "视频课", "book": "电子书", "doc": "话术资料"}

# ---------------------------------------------------------------- 子分组（长目录）
SUBGROUP_RULES = [
    (["保险", "寿险", "平安", "太平"], "保险金融"),
    (["银行", "理财", "基金", "p2p", "信贷", "贷款", "信用卡"], "银行理财"),
    (["电话", "约访", "邀约"], "电话销售"),
    (["房产", "地产", "楼盘", "售楼"], "房产销售"),
    (["汽车", "4S", "车展", "4s"], "汽车销售"),
    (["美容", "美发", "化妆品", "整形"], "美业销售"),
    (["医疗", "医药", "口腔", "医院"], "医疗健康"),
    (["教育", "培训", "课程", "招生"], "教育培训"),
    (["网络", "SEO", "网站", "电商", "微信", "微商"], "网络电商"),
    (["建材", "家装", "家具", "瓷砖"], "家居家装"),
    (["服装", "鞋", "珠宝", "手表"], "零售百货"),
    (["餐饮", "酒店", "旅游"], "餐饮酒店"),
    (["IT", "软件", "系统", "设备", "工业"], "工业与IT"),
    (["FAB", "SPIN", "话术", "成交", "反对", "异议", "谈判", "逼单"], "话术方法"),
]


def sub_group_of(name):
    for keys, g in SUBGROUP_RULES:
        for k in keys:
            if k.lower() in name.lower():
                return g
    return "通用话术"


# ---------------------------------------------------------------- 文本处理
def clean_title(name):
    t = os.path.splitext(name)[0]
    t = t.replace("《", "").replace("》", "")
    t = re.sub(r"^第\s*[\d零一二三四五六七八九十百]+\s*(?:先导课|答疑课|彩蛋课|课|讲|节|集)\s*[、.．:：\-—]?\s*", "", t)
    t = re.sub(r"^\d+\s*[-－~—]\s*\d+\s*[、.．:：\-—]?\s*", "", t)
    t = re.sub(r"^\d+\s*[、.．:：\-—_]\s*", "", t)
    t = re.sub(r"^\d+\s*(?:个|套|则|条|款|招|种|天|步|问|大|本|讲|集|篇|例|节)\s*", "", t)
    t = re.sub(r"^\(\d+\)\s*", "", t)
    t = re.sub(r"\(\d+\)$", "", t)
    t = re.sub(r"^\d+\s+", "", t)
    t = re.sub(r"^\d{1,3}(?=[\u4e00-\u9fa5])", "", t)
    t = t.strip(" .、-—_")
    return t or os.path.splitext(name)[0]


NUM_ITEM = re.compile(r"^\s*(?:第\s*[\d零一二三四五六七八九十百]+\s*[条则招式问句讲节]|[\d]{1,3}\s*[、.．)）:：]|【[^】]{2,20}】)\s*\S")

# 句末标点：出现这些说明这一行是完整句子，可以断开
SENT_END = re.compile(r"[。！？；…”』」)）】》]\s*$")
# 章节标题特征
CHAPTER_HEAD = re.compile(r"^\s*(?:第\s*[\d零一二三四五六七八九十百千]+\s*[章节讲部课]|Chapter\s*\d+)", re.I)
# 目录行特征：连续点线引导页码，如 "一、前言 ..................... 2"（点之间可能夹空格）
TOC_LINE = re.compile(r"(?:[.．·]\s*){3,}|…{2,}|^\s*目\s*录\s*$|^\s*[|｜]\s*\d+\s*$|^\s*[（(]?[一二三四五六七八九十百\d]+[）)]?\s*[、.．]\s*[^。！？]{0,30}[.．·\s]{3,}\s*\d*\s*$")
# 广告/水印行（资料库常见"更多资源加微信"）
AD_LINE = re.compile(r"(加微信|微信号?[:：]\s*\w|扫码关注|公众号[:：]|QQ群|领取资料|全网最全|低价|盗版|购买联系)")


def drop_noise(text):
    """去掉目录页、页码行、广告水印行。"""
    out = []
    for ln in (text or "").split("\n"):
        s = ln.strip()
        if not s:
            out.append("")
            continue
        if TOC_LINE.search(s):
            continue
        if AD_LINE.search(s):
            continue
        out.append(ln.rstrip())
    return "\n".join(out)


def reflow(text):
    """把 PDF/OCR 的硬换行合并回自然段。

    PDF 提取出来的文本通常按版面宽度断行（一行十几到二十几个字），
    直接展示会变成"每行几个字"的竖条，无法阅读。
    规则：上一行未以句末标点结尾且当前行不是新段落开头 → 合并为一段。
    """
    if not text:
        return ""
    text = drop_noise(text)
    lines = text.split("\n")
    out, buf = [], ""

    def flush():
        nonlocal buf
        if buf:
            out.append(buf)
            buf = ""

    for raw in lines:
        s = raw.strip()
        if not s:
            flush()
            out.append("")
            continue
        # 独立成行的标题：编号条目 / 中文章节名 / 很短的独立行
        if NUM_ITEM.match(s) or CHAPTER_HEAD.match(s):
            flush()
            out.append(s)
            continue
        if not buf:
            buf = s
        elif len(buf.rstrip()) >= 6 and SENT_END.search(buf.rstrip()):
            flush()
            buf = s
        else:
            # 上一行是"断行"（无句末标点），与当前行接续
            buf = buf.rstrip() + s
        if len(buf) >= 400:      # 单段过长时主动断开
            flush()
    flush()

    # 压缩超过 2 个的连续空行
    res, blank = [], 0
    for ln in out:
        if ln.strip():
            blank = 0
            res.append(ln)
        else:
            blank += 1
            if blank <= 1:
                res.append("")
    return "\n".join(res).strip()


def split_sections(text, max_chars=1300):
    """把长正文切成「节」。优先按编号条目/章节标题切，否则按段落聚合。"""
    if not text:
        return []
    text = reflow(text)
    lines = [ln.rstrip() for ln in text.split("\n")]
    # 找编号条目 / 章节标题的位置
    marks = [i for i, ln in enumerate(lines) if NUM_ITEM.match(ln) or CHAPTER_HEAD.match(ln)]
    segs = []
    if len(marks) >= 4:
        # 若顶部有前言，作为第 0 节
        if marks[0] > 0 and any(l.strip() for l in lines[:marks[0]]):
            segs.append(lines[:marks[0]])
        for j, pos in enumerate(marks):
            end = marks[j + 1] if j + 1 < len(marks) else len(lines)
            segs.append(lines[pos:end])
    else:
        # 按空行段落聚合
        paras, cur = [], []
        for ln in lines:
            if not ln.strip():
                if cur:
                    paras.append("\n".join(cur))
                    cur = []
                continue
            cur.append(ln)
        if cur:
            paras.append("\n".join(cur))
        # 把短段落合并到 max_chars
        buf = ""
        for p in paras:
            if len(buf) + len(p) + 1 <= max_chars:
                buf = (buf + "\n" + p) if buf else p
            else:
                if buf:
                    segs.append(buf.split("\n"))
                buf = p
        if buf:
            segs.append(buf.split("\n"))

    # 超过 max_chars 的节再按段落细切，保证「一条条看」
    fine = []
    for s in segs:
        body = "\n".join([x for x in s if x.strip()]).strip()
        if not body:
            continue
        if len(body) <= max_chars * 1.6:
            fine.append(body)
            continue
        part, cur = [], 0
        for para in body.split("\n"):
            if cur + len(para) > max_chars and part:
                fine.append("\n".join(part))
                part, cur = [], 0
            part.append(para)
            cur += len(para)
        if part:
            fine.append("\n".join(part))

    out = []
    for body in fine:
        body = body.strip()
        if not body or len(body) < 12:
            continue
        first = body.split("\n")[0].strip()
        # 标题取首句（到第一个句读），避免把整段搬上来当标题
        m = re.match(r"^(.{2,26}?)[。！？!?；;，,、]", first)
        if m and len(m.group(1)) >= 2:
            title = m.group(1)
        else:
            title = first[:24] + ("…" if len(first) > 24 else "")
        out.append({"t": title, "x": body})

    # 合并过小的节（< 420 字），避免出现"翻一页只有两行"的碎片
    merged = []
    for s in out:
        if merged and len(s["x"]) < 420 and len(merged[-1]["x"]) + len(s["x"]) <= max_chars * 1.6:
            merged[-1]["x"] = merged[-1]["x"].rstrip() + "\n" + s["x"]
        else:
            merged.append(s)
    return merged


def short_summary(text, n=110):
    t = re.sub(r"\s+", " ", text or "").strip()
    # 跳过目录式开头
    return t[:n] + ("…" if len(t) > n else "")


def pick_principle(text, title):
    """从真实正文里挑一句像"原则"的话。"""
    if text:
        cands = re.split(r"[\n。！？!?；;]", text)
        for c in cands:
            c = c.strip()
            if 14 <= len(c) <= 60 and not re.match(r"^[\d第（(【]", c) and "页" not in c[:3]:
                return c + "。"
    return "先看清对方的处境与需求，再决定怎么开口；表达服务于关系，不是胜负。"


def pick_tips(text, sections, limit=5):
    tips = []
    for s in sections[:limit]:
        t = s["t"].strip(" 　")
        t = re.sub(r"^[#\-*·•\d、.．)）\s]+", "", t)
        t = re.sub(r"【[^】]*】", "", t).strip()
        if t and 2 <= len(t) <= 18 and t not in tips:
            tips.append(t)
    if not tips and text:
        for c in re.split(r"[\n。]", text):
            c = c.strip()
            if 4 <= len(c) <= 16 and c not in tips:
                tips.append(c)
            if len(tips) >= limit:
                break
    return tips[:limit]


SAFETY = "这是学习参考，不是固定台词；请替换成真实信息，不编造、不施压，并允许对方拒绝。"


# ---------------------------------------------------------------- 主流程
def load_manifest(path):
    if os.path.exists(path):
        try:
            return json.load(open(path, encoding="utf-8"))
        except Exception:
            return {}
    return {}


def collection_of(rel):
    r = rel.replace("/", "\\")
    best = None
    for kw, chapter, icon, medium in COLLECTIONS:
        k = kw.replace("/", "\\")
        if k in r:
            if best is None or len(k) > len(best[0]):
                best = (k, chapter, icon, medium)
    if best:
        return best[1], best[2], best[3]
    return DEFAULT_COLLECTION[0], DEFAULT_COLLECTION[1], DEFAULT_COLLECTION[2]


def main():
    em = load_manifest(EXTRACT_MANIFEST)
    tm = load_manifest(TRANS_MANIFEST)
    idx = json.load(open(ASSET_INDEX, encoding="utf-8")) if os.path.exists(ASSET_INDEX) else {}

    # 汇总所有文件（保证不遗漏）
    all_rel = {}
    for group in ("courses", "books"):
        for d, files in (idx.get(group) or {}).items():
            for fn in files:
                # normpath：去掉 asset_index 可能带的 '.\' 前缀，保证与 manifest 键一致
                rel = os.path.normpath(os.path.join(d, fn))
                all_rel[rel] = {"ext": os.path.splitext(fn)[1].lower(), "name": fn}

    cards = []
    contents = {}          # cardId -> {"full":..., "sections":[...]}
    bundles = {}           # bundleKey -> {cardId: content}
    seen = set()
    seen_text = {}         # md5(正文) -> card（同一份资料被复制多份时合并）
    stat = {}

    def add_card(rel, name, ext, medium_hint, chapter, icon):
        title = clean_title(name)
        key = (chapter, title)
        if key in seen:
            return
        seen.add(key)
        cid = "x_" + hashlib.md5((chapter + "|" + rel).encode("utf-8")).hexdigest()[:10]

        # --- 取真实正文 ---
        text, source_kind, status = "", "none", "missing"
        e = em.get(rel)
        t = tm.get(rel)
        if e and e.get("status") == "ok" and e.get("chars", 0) > 0:
            with open(os.path.join(EXTRACT_DIR, "doc_%s.txt" % e["idx"]), encoding="utf-8") as f:
                text = f.read()
            source_kind, status = "文档原文", "ok"
        elif t and t.get("status") == "ok" and t.get("chars", 0) > 0:
            with open(os.path.join(TRANS_DIR, "tr_%s.txt" % t["idx"]), encoding="utf-8") as f:
                raw = f.read()
            # 转成段落：去掉时间轴，按停顿聚合
            text = re.sub(r"^\d\d:\d\d:\d\d\|", "", raw, flags=re.M)
            source_kind, status = "视频/音频讲稿", "ok"
        elif e and e.get("status") == "empty":
            source_kind, status = "扫描件（待 OCR）", "scanned"
        elif e and e.get("status") == "error":
            source_kind, status = "原文件损坏", "corrupt"
        elif t and t.get("status") == "error":
            # 音视频源文件损坏（网盘下载不完整：mp4 缺 moov、尾部零填充）→ 如实标注
            source_kind, status = "音视频源文件损坏", "corrupt"
        elif t and t.get("status") == "empty":
            source_kind, status = "音视频无有效语音", "scanned"

        # --- 内容级去重：同一份资料在多个目录下重复存放时合并为一张卡片 ---
        if status == "ok" and text.strip():
            th = hashlib.md5(text.encode("utf-8")).hexdigest()
            prev = seen_text.get(th)
            if prev is not None:
                prev["sources"].append(rel)
                stat["__merged__"] = stat.get("__merged__", 0) + 1
                return
            seen_text[th] = None      # 占位，稍后回填卡片对象
        else:
            th = None

        full = text
        truncated = False
        if len(full) > MAX_CARD_CHARS:
            full = full[:MAX_CARD_CHARS]
            truncated = True

        sections = split_sections(full) if full else []

        medium = medium_hint
        if medium_hint == "doc":
            if ext in (".mp3", ".wav", ".m4a"):
                medium = "audio"
            elif ext in (".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv"):
                medium = "video"
            elif ext == ".pdf":
                medium = "book" if len(sections) > 12 else "doc"

        sub = sub_group_of(name) if chapter in ("各行业销售话术 300 套",) else ""

        if status == "ok":
            summary = short_summary(full)
            principle = pick_principle(full, title)
            tips = pick_tips(full, sections)
        elif status == "scanned":
            if source_kind == "音视频无有效语音":
                summary = "该音视频已转写，但没有识别到有效语音内容（可能是纯音乐/静音片段）；原文件已归档，可查看原始资料。"
                principle = "该文件没有可学习的语音内容。"
            else:
                summary = "该资料为扫描版 PDF（图片型），文字需 OCR 识别后收录。原文件已归档，可在「原始资料」中查看。"
                principle = "扫描版资料内容完整保留，待文字识别后即可逐节学习。"
            tips = ["扫描件", "待识别"]
        elif status == "corrupt":
            if source_kind == "音视频源文件损坏":
                summary = "该音视频文件在网盘下载时不完整（视频索引 moov 缺失、尾部为零填充），无法解码，因此没有讲稿正文；重新下载该文件后可补入。"
                principle = "文件不完整，无法转写；课程已登记，不遗漏。"
            else:
                summary = "该文件在网盘下载时不完整（内容为零填充），无法提取正文；重新下载该文件后可补入。"
                principle = "文件不完整，内容不可用；课程目录已登记，不遗漏。"
            tips = ["文件失败"]
        else:
            summary = "该条目的正文尚未提取完成。"
            principle = "待补充。"
            tips = ["待提取"]

        card = {
            "id": cid,
            "title": title,
            "scene": chapter,
            "category": chapter,
            "icon": icon,
            "kind": {"video": "视频课", "audio": "音频课", "book": "电子书", "doc": "话术资料"}.get(medium, "资料"),
            "medium": medium,
            "source": rel,
            "sources": [rel],
            "sourceKind": source_kind,
            "status": status,
            "chars": len(text),
            "sectionsCount": len(sections),
            "group": sub,
            "content": summary,
            "principle": principle,
            "tips": tips,
            "safetyNote": SAFETY,
            "tags": [],
            "practicePrompt": "围绕「%s」，用自己的话在对应场景里说一遍。" % title,
            "level": "参考",
            "round": 1,
            "userEmotion": ["平静"],
            "coachStyle": ["分析型"],
        }
        if status == "ok":
            card["truncated"] = truncated
            bundles.setdefault(chapter, {})[cid] = {"full": full, "sections": sections}
            if th:
                seen_text[th] = card
        cards.append(card)
        stat[chapter] = stat.get(chapter, 0) + 1

    # 遍历真实文件
    for rel, info in sorted(all_rel.items()):
        if any(x in rel for x in EXCLUDE_RULES):
            continue
        chapter, icon, medium = collection_of(rel)
        add_card(rel, info["name"], info["ext"], medium, chapter, icon)

    # ---------------- 输出轻量索引（先占位，分卷写完后回填 bundle） ----------------
    def write_cards():
        buf = io.StringIO()
        buf.write("// 由 tools/knowledge/gen_course_cards.py 生成 —— 资料库全量课程（正文真实提取）\n")
        buf.write("// 正文较大，按章节分卷存放于 knowledge_base/course_content/，打开卡片时按需加载。\n")
        buf.write("window.extraCourseCards = [\n")
        for c in cards:
            buf.write(json.dumps(c, ensure_ascii=False) + ",\n")
        buf.write("];\n")
        with open(OUT_CARDS, "w", encoding="utf-8") as f:
            f.write(buf.getvalue())

    # ---------------- 输出内容分卷（每卷 <= MAX_BUNDLE_BYTES，按需加载） ----------------
    MAX_BUNDLE_BYTES = 900_000
    os.makedirs(OUT_CONTENT_DIR, exist_ok=True)
    for old in os.listdir(OUT_CONTENT_DIR):
        if old.startswith("cc_") and old.endswith(".js"):
            os.remove(os.path.join(OUT_CONTENT_DIR, old))
    index_map = {}
    for chapter, byid in bundles.items():
        key = hashlib.md5(chapter.encode("utf-8")).hexdigest()[:8]
        part = 0
        buf = io.StringIO()
        size = 0
        opened = False

        def flush():
            nonlocal buf, size, opened, part
            if not opened:
                return
            buf.write("});\n")
            fn = "cc_%s_%02d.js" % (key, part)
            with open(os.path.join(OUT_CONTENT_DIR, fn), "w", encoding="utf-8") as f:
                f.write(buf.getvalue())
            part += 1
            buf = io.StringIO()
            size = 0
            opened = False

        for cid, cv in byid.items():
            payload = json.dumps(cid, ensure_ascii=False) + ":" + json.dumps(cv, ensure_ascii=False) + ",\n"
            if not opened:
                buf.write("// %s —— 正文内容包（第 %d 卷，按需加载）\n" % (chapter, part + 1))
                buf.write("window.CourseContent = window.CourseContent || {};\n")
                buf.write("Object.assign(window.CourseContent, {\n")
                opened = True
            buf.write(payload)
            size += len(payload.encode("utf-8"))
            index_map[cid] = "cc_%s_%02d.js" % (key, part)
            if size >= MAX_BUNDLE_BYTES:
                flush()
        flush()

    with open(os.path.join(OUT_CONTENT_DIR, "_index.json"), "w", encoding="utf-8") as f:
        json.dump(index_map, f, ensure_ascii=False, indent=1)

    # 回填 bundle 文件名后写索引
    for c in cards:
        if c["id"] in index_map:
            c["bundle"] = index_map[c["id"]]
    write_cards()

    print("cards:", len(cards), " bundles:", len(bundles), " content cards:", len(index_map))
    for k, v in sorted(stat.items(), key=lambda x: -x[1]):
        print("  %-22s %d" % (k, v))
    tot = sum(c["chars"] for c in cards)
    print("正文总字数: %d (%.1f MB)" % (tot, tot * 3 / 1024 / 1024))


if __name__ == "__main__":
    main()
