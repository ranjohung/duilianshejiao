"""
编码检测 + 统一转 UTF-8
"""
import os
import chardet

OUT_DIR = r"F:\开发软件项目文件\对练社交\extracted_raw"

for fn in os.listdir(OUT_DIR):
    if not fn.endswith('.txt'):
        continue
    path = os.path.join(OUT_DIR, fn)
    
    with open(path, 'rb') as f:
        raw = f.read()
    
    result = chardet.detect(raw)
    enc = result['encoding']
    conf = result['confidence']
    
    if enc and enc.lower() not in ('utf-8', 'ascii', 'utf-8-sig'):
        try:
            text = raw.decode(enc, errors='replace')
            # 写回 UTF-8
            with open(path, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"CONVERTED: {fn} ({enc} -> utf-8, conf={conf:.2f})")
        except Exception as e:
            print(f"FAIL: {fn} ({enc}): {e}")
    else:
        # 确认是有效 UTF-8
        try:
            raw.decode('utf-8')
        except:
            # 可能是 utf-16 或其他
            print(f"NEED CHECK: {fn} (detected {enc}, but decode failed)")

print("\n=== 编码处理完成 ===")
