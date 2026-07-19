import os
import shutil

src = r"F:\开发软件项目文件\对练社交\index_new.html"
dst = r"F:\开发软件项目文件\对练社交\index.html"

with open(src, 'r', encoding='utf-8') as f:
    content = f.read()

try:
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced index.html")
except PermissionError:
    print("File is locked, trying copy method...")
    shutil.copy2(src, dst + '.tmp')
    os.replace(src, dst)
    print("Successfully replaced using copy method")

os.remove(src)
print("Temporary file removed")
