import pymupdf, os, json, re

root = r"G:\BaiduNetdiskDownload\高情商话术"
md_root = r"f:\开发软件项目文件\对练社交\knowledge_base\markdown"

# 读 manifest
with open(r"f:\开发软件项目文件\对练社交\pdf_manifest.json","r",encoding="utf-8") as fp:
    manifest = json.load(fp)

# 分类映射：从原始路径推断目标子目录
def infer_category(rel_path):
    if "20e利他销售" in rel_path:
        return "销售技巧"
    if "送礼话术" in rel_path:
        return "送礼话术"
    if "高情商话术" in rel_path or "好好接话" in rel_path:
        return "高情商话术原书"
    if "综合提升大合集" in rel_path:
        # 子分类
        if "两性情感" in rel_path: return "亲密关系与约会"
        if "人性认知" in rel_path or "做局权谋" in rel_path or "思维认知" in rel_path: return "人性权谋"
        if "职场社交" in rel_path: return "职场与事业"
        if "赚钱营销" in rel_path: return "销售技巧"
        if "女性成长" in rel_path or "两性情感" in rel_path: return "亲密关系与约会"
        return "综合提升"
    if "B.精选好书合集" in rel_path:
        if "两性情感" in rel_path: return "亲密关系与约会"
        if "人性密学" in rel_path or "做局权谋" in rel_path: return "人性权谋"
        if "职场社交" in rel_path: return "职场与事业"
        if "思维认知" in rel_path: return "思维认知"
        if "赚钱营销" in rel_path: return "销售技巧"
        return "精选好书"
    return "其他"

def clean_filename(name):
    name = re.sub(r"[\\/:*?\"<>|]", "_", name)
    name = name.strip()
    if len(name) > 80: name = name[:80]
    return name

success = 0
skip_exist = 0
fail = 0

print(f"Need to extract: {len(manifest['text'])} text PDFs")

for item in manifest["text"]:
    path = item["path"]
    rel = item["rel"]
    fname = os.path.basename(path)
    md_fname = fname.replace(".pdf", ".md")
    
    cat = infer_category(rel)
    out_dir = os.path.join(md_root, cat)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, clean_filename(md_fname))
    
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        skip_exist += 1
        continue
    
    try:
        doc = pymupdf.open(path)
        parts = []
        for i in range(doc.page_count):
            text = doc[i].get_text().strip()
            if text:
                parts.append(f"## 第{i+1}页\n\n{text}")
        doc.close()
        
        if not parts:
            continue
        
        header = f"# {fname}\n\n> 原始来源: {rel}\n> 页数: {item['pages']}\n> 本文件由 PyMuPDF 自动提取，内容未做任何修改。\n\n---\n\n"
        content = header + "\n\n".join(parts)
        
        with open(out_path, "w", encoding="utf-8") as fp:
            fp.write(content)
        success += 1
        print(f"  OK {success}: {cat}/{md_fname} ({len(content)} chars)")
    except Exception as e:
        fail += 1
        print(f"  FAIL: {fname}: {e}")

print(f"\nDone: success={success} skip={skip_exist} fail={fail}")
