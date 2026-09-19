import pymupdf, os, json
root = r"G:\BaiduNetdiskDownload\高情商话术"
result = {"text": [], "image": [], "error": []}
for dirpath, _, filenames in os.walk(root):
    for f in filenames:
        if not f.lower().endswith(".pdf"): continue
        path = os.path.join(dirpath, f)
        try:
            doc = pymupdf.open(path)
            if doc.page_count == 0: result["error"].append({"path":path,"reason":"empty"}); doc.close(); continue
            sample = min(doc.page_count, 10)
            total = sum(len(doc[i].get_text()) for i in range(sample))
            rel = path.replace(root + os.sep, "").replace("\\", "/")
            if total > 100: result["text"].append({"path":path,"rel":rel,"pages":doc.page_count,"chars_sample":total})
            else: result["image"].append({"path":path,"rel":rel,"pages":doc.page_count})
            doc.close()
        except Exception as e:
            result["error"].append({"path":path,"reason":str(e)[:80]})
print(f"Text={len(result['text'])} Image={len(result['image'])} Error={len(result['error'])}")
for item in sorted(result["text"], key=lambda x:-x["pages"])[:50]:
    print(f"  {item['pages']:4d}p {item['chars_sample']:7d}c {item['rel'][:70]}")
with open(r"f:\开发软件项目文件\对练社交\pdf_manifest.json","w",encoding="utf-8") as fp:
    json.dump(result, fp, ensure_ascii=False, indent=2)
print("Saved.")
