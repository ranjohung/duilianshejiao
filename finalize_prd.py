import shutil

src = r"f:\开发软件项目文件\对练社交\docs\prd_new.md"
dst = r"f:\开发软件项目文件\对练社交\docs\prd.md"

with open(src, 'r', encoding='utf-8') as f:
    content = f.read()

with open(dst, 'w', encoding='utf-8') as f:
    f.write(content)

print("PRD file updated successfully!")

import os
os.remove(src)
print("Temporary file removed.")
