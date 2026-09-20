"""
extract_ppt.py — 提取礼仪培训 PPT + 生成 VIP 加密视频目录索引

源: G:\BaiduNetdiskDownload\高情商话术\版块12--礼仪培训大全集 共11个模块 （182套）
输出: knowledge_base/19-礼仪培训PPT/ (Markdown)
      knowledge_base/19-礼仪培训PPT/_VIP目录索引.md
"""
import os, re, sys, json, glob
from pathlib import Path

SRC = r"G:\BaiduNetdiskDownload\高情商话术\版块12--礼仪培训大全集 共11个模块 （182套）"
DST = Path(r"f:\开发软件项目文件\对练社交\knowledge_base\19-礼仪培训PPT")
DST.mkdir(parents=True, exist_ok=True)

# ===== Step 0: 把 .ppt 旧格式转成 .pptx =====
ppt_files = list(Path(SRC).rglob("*.ppt"))
ppt_files = [p for p in ppt_files if not str(p).endswith(".pptx")]  # 排除已转的
print(f"\n[0] 发现 {len(ppt_files)} 个 .ppt 旧格式文件")

if ppt_files:
    try:
        import win32com.client
        ppt_app = win32com.client.Dispatch("PowerPoint.Application")
        ppt_app.Visible = 1
        for ppt in ppt_files:
            ppax = ppt.with_suffix(".pptx")
            if ppax.exists():
                print(f"  已有同名 pptx，跳过: {ppt.name}")
                continue
            print(f"  转 pptx: {ppt.name}")
            pres = ppt_app.Presentations.Open(str(ppt), WithWindow=False)
            pres.SaveAs(str(ppax), 24)  # 24 = pptx
            pres.Close()
        ppt_app.Quit()
    except Exception as e:
        print(f"  PowerPoint COM 失败: {e}")
        print("  将跳过 .ppt 文件，只处理 .pptx")

# ===== Step 1: 提取所有 .pptx =====
import pptx

pptx_files = list(Path(SRC).rglob("*.pptx"))
print(f"\n[1] 待提取 .pptx: {len(pptx_files)}")

all_cards = []

for i, pptx_path in enumerate(pptx_files):
    try:
        pres = pptx.Presentation(str(pptx_path))
    except Exception as e:
        print(f"  [{i+1}] FAIL {pptx_path.name}: {e}")
        continue

    # 从文件名推断所属模块
    rel = pptx_path.relative_to(SRC)
    parts = rel.parts
    module_name = parts[0] if len(parts) > 1 else "未知"
    file_stem = pptx_path.stem

    # 收集文字
    slides_text = []
    for j, slide in enumerate(pres.slides):
        slide_lines = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    txt = "".join(run.text for run in para.runs).strip()
                    if txt:
                        slide_lines.append(txt)
            # 表格里的文字
            if shape.has_table:
                tbl = shape.table
                for row in tbl.rows:
                    cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if cells:
                        slide_lines.append(" | ".join(cells))
        if slide_lines:
            slides_text.append(f"### Slide {j+1}\n" + "\n".join(slide_lines))

    if not slides_text:
        print(f"  [{i+1}] SKIP {file_stem} (empty)")
        continue

    # 生成 Markdown
    md_parts = []
    md_parts.append(f"# {file_stem}")
    md_parts.append("")
    md_parts.append(f"- 来源: `{rel.as_posix()}`")
    md_parts.append(f"- 所属模块: {module_name}")
    md_parts.append(f"- 幻灯片数: {len(slides_text)}")
    md_parts.append("")
    md_parts.append("---")
    md_parts.append("")
    md_parts.extend(slides_text)

    md_content = "\n".join(md_parts) + "\n"

    # 安全文件名
    safe_name = re.sub(r'[\\/:*?"<>|]', '_', file_stem)
    out = DST / f"{safe_name}.md"
    out.write_text(md_content, encoding="utf-8")
    all_cards.append({
        "title": file_stem,
        "module": module_name,
        "slides": len(slides_text),
        "out": str(out.relative_to(DST))
    })
    print(f"  [{i+1}] OK {file_stem} ({len(slides_text)} slides)")

print(f"\n✅ 提取完成: {len(all_cards)} 个 PPT → {DST}")

# ===== Step 2: 提取 .txt 文件（排除网络播放器目录）=====
txt_files = []
for p in Path(SRC).rglob("*.txt"):
    if "##网络播放器" in str(p):
        continue
    txt_files.append(p)

print(f"\n[2] .txt 文件（排除播放器目录）: {len(txt_files)}")
for p in txt_files:
    safe = re.sub(r'[\\/:*?"<>|]', '_', p.stem)
    out = DST / f"_文本-{safe}.md"
    try:
        content = p.read_text(encoding="utf-8", errors="ignore")
    except:
        content = p.read_text(encoding="gbk", errors="ignore")
    out.write_text(f"# {p.stem}\n\n- 来源: `{p.relative_to(SRC).as_posix()}`\n\n---\n\n{content}\n", encoding="utf-8")
    print(f"  OK {p.name} ({len(content)} chars)")

# ===== Step 3: 生成 VIP 加密视频目录索引 =====
print(f"\n[3] 生成 .vip 加密视频目录索引...")

# 按目录分组收集 .vip 文件名
vip_index = {}  # dir_name -> list of vip filenames
all_vip = []
for p in Path(SRC).rglob("*.vip"):
    parent = p.parent.name
    vip_index.setdefault(parent, []).append(p.stem)
    all_vip.append(str(p.relative_to(SRC)))

# 目录索引 Markdown
idx_md = ["# VIP 加密课程目录索引", "",
          f"> 共 **{len(all_vip)}** 个加密视频（.vip 格式），需用 WinNetPlayer 登录播放",
          "> 账号: `2hnncf881bz`  密码: `123456`",
          "> 目录: `##网络播放器/03、台式机电脑、笔记本/Win网络播放器.exe`", "",
          "## 各模块清单", ""]

for dir_name in sorted(vip_index.keys()):
    items = sorted(vip_index[dir_name])
    idx_md.append(f"### {dir_name}（{len(items)} 套）")
    idx_md.append("")
    for stem in items:
        idx_md.append(f"- {stem}")
    idx_md.append("")

idx_md.extend(["## 说明",
               "",
               ".vip 是金软金盾 DRM 加密的独家视频课程，无法自动提取文字内容。",
               "如需学习这些课程，必须用 WinNetPlayer 登录后观看。",
               "可提取的配套资料在本目录其他 .md 文件中。"])

idx_path = DST / "_VIP加密课程目录索引.md"
idx_path.write_text("\n".join(idx_md), encoding="utf-8")
print(f"✅ VIP 索引已生成: {idx_path}")

# ===== Step 4: 主目录列表（方便前端遍历）=====
index_json = {
    "total_ppt_cards": len(all_cards),
    "ppt_cards": all_cards,
    "vip_index": "_VIP加密课程目录索引.md",
    "source_root": SRC
}
(DST / "_index.json").write_text(json.dumps(index_json, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"\n🎉 全部完成！输出目录: {DST}")
print(f"   - Markdown 学习卡片: {len(all_cards) + len(txt_files)} 个")
print(f"   - VIP 目录索引: {idx_path.name}")
