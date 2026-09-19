import json, sys
sys.stdout.reconfigure(encoding='utf-8')

# 读取分片
f = open(r"f:\开发软件项目文件\对练社交\knowledge_base\extra_course_cards_01.js", "r", encoding="utf-8")
content = f.read()
f.close()

# 去掉 "window.extraCourseCards_01 = " 前缀
prefix = "window.extraCourseCards_01 = "
json_str = content[len(prefix):]

print(f"去前缀后长度: {len(json_str)}")

# 尝试 JSON.parse
try:
    arr = json.loads(json_str)
    print(f"✅ JSON 解析成功！{len(arr)} 张卡片")
except json.JSONDecodeError as e:
    print(f"❌ JSON 解析失败: {e}")
    print(f"   位置: line {e.lineno}, col {e.colno}, pos {e.pos}")
    
    # 显示错误位置附近
    start = max(0, e.pos - 50)
    end = min(len(json_str), e.pos + 50)
    context = json_str[start:end]
    print(f"\n错误附近内容 (pos {start}-{end}):")
    print(repr(context))
    
    # 逐字符检查那一行
    lines = json_str[:e.pos].split('\n')
    error_line = len(lines)
    error_col = len(lines[-1]) if lines else 0
    print(f"\n错误在第 {error_line} 行, 第 {error_col} 列")
    
    # 显示那一行的前后
    all_lines = json_str.split('\n')
    for i in range(max(0, error_line-2), min(len(all_lines), error_line+2)):
        marker = " >>>" if i == error_line - 1 else "    "
        print(f"{marker} {i+1}: {all_lines[i][:120]}")