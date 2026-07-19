import re

input_file = r"f:\开发软件项目文件\对练社交\docs\prd_new.md"
output_file = r"f:\开发软件项目文件\对练社交\docs\prd_new2.md"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '│  ☕ 咖啡厅破冰           │\n│  ⭐ 简单  ·  约10分钟    │',
    '│  💑 相亲模拟           │\n│  ⭐⭐ 中等  ·  约12分钟    │'
)

old_popup = '弹出提示框："这个回答不太理想（-8分），要使用时空穿梭券重新回答吗？"'
new_popup = '弹出提示框："这个回答不太理想（-8分），要使用时空穿梭券重新回答吗？重新回答后可能得到更高或更低的分数，请谨慎使用。"'
content = content.replace(old_popup, new_popup)

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("PRD issues fixed successfully!")
