# -*- coding: utf-8 -*-
"""把 knowledge_base/markdown/ 下的 Markdown 文件追加到 extra_course_cards.js
正确处理 trailing comma，保留原有 bundle 引用。
"""
import re
import json
import hashlib
from pathlib import Path

ROOT = Path(r"f:\开发软件项目文件\对练社交")
MD_DIR = ROOT / "knowledge_base" / "markdown"
OUT_JS = ROOT / "knowledge_base" / "extra_course_cards.js"

# 分类 → icon 和 kind 映射（使用中文名，和现有风格一致）
CATEGORY_META = {
    "礼仪规范": ("🎩", "礼仪教程"),
    "亲密关系": ("💕", "两性情感"),
    "亲密关系与约会": ("💕", "两性情感"),
    "人性权谋": ("🎭", "人性洞察"),
    "思维认知": ("🧠", "认知提升"),
    "职场社交": ("💼", "职场礼仪"),
    "职场与事业": ("💼", "职场发展"),
    "销售成交": ("💰", "销售话术"),
    "社交场合与人际交往": ("👥", "社交技巧"),
    "家庭与亲友": ("👨‍👩‍👧", "家庭关系"),
    "数字社交": ("💬", "线上社交"),
    "突发与冲突": ("⚡", "冲突应对"),
    "公共服务与办事": ("🏛️", "办事指南"),
    "日常生活消费": ("🛒", "消费技巧"),
    "原始文本": ("📄", "原始资料"),
    "原始课程": ("📄", "原始资料"),
    "其他资料": ("📚", "学习资料"),
    "好好接话": ("💬", "接话技巧"),
}

def fix_trailing_commas(text: str) -> str:
    """去掉 JSON 数组/对象里最后一个元素后面的逗号"""
    return re.sub(r',(\s*[}\]])', r'\1', text)


def load_existing() -> list:
    """加载现有 extra_course_cards.js"""
    if not OUT_JS.exists():
        return []
    content = OUT_JS.read_text(encoding="utf-8")
    m = re.search(r'window\.extraCourseCards\s*=\s*(\[.+?\])\s*;?\s*$', content, re.DOTALL)
    if not m:
        print("⚠️ 找不到数组")
        return []
    fixed = fix_trailing_commas(m.group(1))
    return json.loads(fixed)


def md_to_card(md_path: Path) -> dict:
    """把单个 Markdown 文件转换成课程卡片"""
    text = md_path.read_text(encoding="utf-8")
    
    # 提取标题
    title = md_path.stem
    title_match = re.search(r'^#\s+(.+?)\s*$', text, re.MULTILINE)
    if title_match:
        title = title_match.group(1).strip()
    
    # 清理正文
    body = re.sub(r'^#.*$', '', text, flags=re.MULTILINE).strip()
    body = re.sub(r'\n{3,}', '\n\n', body)
    
    # 生成唯一 ID（用 md5 避免和现有 x_ 开头的冲突）
    file_hash = hashlib.md5(str(md_path).encode()).hexdigest()[:10]
    
    # 摘要（前 300 字）
    summary = re.sub(r'\s+', ' ', body[:500]).strip()
    
    # 章节数
    sections = re.findall(r'^#{1,3}\s+', text, re.MULTILINE)
    
    # 从父目录推断分类
    parent_name = md_path.parent.name
    category = parent_name if parent_name not in ("markdown", "") else "其他资料"
    
    icon, kind = CATEGORY_META.get(category, ("📚", "学习资料"))
    
    card = {
        "id": f"md_{file_hash}",
        "title": title,
        "scene": category,
        "category": category,
        "icon": icon,
        "kind": kind,
        "medium": "doc",
        "source": f"knowledge_base/markdown/{md_path.relative_to(ROOT).as_posix()}",
        "sourceKind": "整理文本",
        "status": "ok",
        "chars": len(body),
        "sectionsCount": max(1, len(sections)),
        "group": "",
        "content": summary,
        "fullContent": body,  # 完整正文内嵌
        "principle": title,
        "tips": [category, kind],
        "safetyNote": "这是学习参考，不是固定台词；请结合实际场景灵活运用。",
        "tags": [category, kind],
        "practicePrompt": f"围绕「{title}」，用自己的话在对应场景里练习一遍。",
        "level": "参考",
        "round": 1,
        "userEmotion": ["平静"],
        "coachStyle": ["分析型"],
        "truncated": False,
        "bundle": "",
    }
    return card


def save_cards(cards: list):
    """保存为 extra_course_cards.js"""
    # 不内嵌 fullContent 会太大，分开处理：
    # 卡片里只保留 summary，fullContent 按需存到 course_content/
    content = "// 由 tools/md_to_course_cards.py 生成 —— 原始资料提取的整理文本\n"
    content += "window.extraCourseCards = "
    content += json.dumps(cards, ensure_ascii=False, separators=(",", ":"))
    content += ";\n"
    OUT_JS.write_text(content, encoding="utf-8")


def save_full_contents(new_cards: list):
    """把新卡片的 fullContent 单独存到 course_content/"""
    cc_dir = ROOT / "knowledge_base" / "course_content"
    cc_dir.mkdir(parents=True, exist_ok=True)
    
    # 按 30 个一组分卷
    batch_size = 30
    for i in range(0, len(new_cards), batch_size):
        batch = new_cards[i:i + batch_size]
        bundle_id = f"md_cc_{hashlib.md5(str(i).encode()).hexdigest()[:8]}"
        
        # 更新卡片的 bundle 字段，去掉 fullContent
        full_contents = {}
        for card in batch:
            cid = card["id"]
            full_contents[cid] = card.pop("fullContent", "")
            card["bundle"] = f"{bundle_id}.js"
        
        # 写入分卷文件
        bundle_path = cc_dir / f"{bundle_id}.js"
        js_content = f"// Markdown 整理文本分卷 — 第 {i//batch_size + 1} 卷\n"
        js_content += "window.CourseContent = window.CourseContent || {};\n"
        js_content += "Object.assign(window.CourseContent, "
        js_content += json.dumps(full_contents, ensure_ascii=False, separators=(",", ":"))
        js_content += ");\n"
        bundle_path.write_text(js_content, encoding="utf-8")
        print(f"  分卷: {bundle_id}.js ({len(batch)} 条, {sum(len(v) for v in full_contents.values())} 字)")


def main():
    existing = load_existing()
    print(f"✅ 现有卡片: {len(existing)}")
    
    existing_ids = {c.get("id", "") for c in existing}
    existing_sources = {c.get("source", "") for c in existing}
    
    # 扫描新 Markdown
    new_cards = []
    skipped = 0
    
    for md_file in sorted(MD_DIR.rglob("*.md")):
        if md_file.name.startswith("_"):
            continue
        rel = f"knowledge_base/markdown/{md_file.relative_to(ROOT).as_posix()}"
        if rel in existing_sources:
            skipped += 1
            continue
        
        card = md_to_card(md_file)
        if card["id"] in existing_ids:
            skipped += 1
            continue
        
        new_cards.append(card)
    
    print(f"📄 新增 Markdown 卡片: {len(new_cards)}")
    print(f"⏭️  跳过（已存在）: {skipped}")
    
    if not new_cards:
        print("没有新卡片需要添加")
        return
    
    # 保存 fullContent 到分卷
    print("\n📦 保存正文分卷:")
    save_full_contents(new_cards)
    
    # 合并并保存
    all_cards = existing + new_cards
    
    # 分类统计
    from collections import Counter
    cats = Counter(c.get("category", "") for c in all_cards)
    
    save_cards(all_cards)
    
    print(f"\n✅ 总卡片: {len(all_cards)}")
    print(f"   保存到: {OUT_JS}")
    print("\n📊 分类统计 (Top 20):")
    for cat, cnt in cats.most_common(20):
        print(f"   {cat}: {cnt}")


if __name__ == "__main__":
    main()
