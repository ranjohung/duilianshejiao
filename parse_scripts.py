import pdfplumber
import os
import json
import re

def parse_pdf_to_markdown(pdf_path, output_path):
    """解析PDF文件并保存为Markdown"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            content = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    content.append(text)
            
            markdown_content = "\n\n---\n\n".join(content)
            
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            print(f"✅ 解析完成: {pdf_path}")
            return markdown_content
    except Exception as e:
        print(f"❌ 解析失败: {pdf_path} - {str(e)}")
        return None

def parse_all_pdfs(input_dir, output_dir):
    """批量解析目录下的所有PDF文件"""
    pdf_files = []
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
    
    print(f"找到 {len(pdf_files)} 个PDF文件")
    
    for pdf_path in pdf_files:
        relative_path = os.path.relpath(pdf_path, input_dir)
        output_path = os.path.join(output_dir, relative_path.replace('.pdf', '.md'))
        parse_pdf_to_markdown(pdf_path, output_path)

def extract_scripts_from_markdown(md_content, scene_name, scene_id):
    """从Markdown内容中提取话术"""
    scripts = []
    lines = md_content.split('\n')
    
    current_script = None
    script_count = 0
    
    for line in lines:
        line = line.strip()
        
        if re.match(r'^\d+[\.、]\s*', line):
            if current_script and current_script.get('text'):
                scripts.append(current_script)
            
            script_count += 1
            current_script = {
                "id": f"{scene_id}_{str(script_count).zfill(3)}",
                "round": 1,
                "purpose": "通用话术",
                "user_emotion": ["平静", "紧张"],
                "coach_style": ["鼓励型", "支持型", "分析型"],
                "level": "安全型",
                "text": line,
                "tags": [],
                "usage_count": 0,
                "rating": 0
            }
        elif current_script:
            if line:
                current_script["text"] += "\n" + line
    
    if current_script and current_script.get('text'):
        scripts.append(current_script)
    
    return scripts

def save_scene_scripts(scene_name, scene_id, scripts, output_dir):
    """保存场景话术到JSON文件"""
    data = {
        "scene_id": scene_id,
        "scene_name": scene_name,
        "version": "1.0",
        "scripts": scripts
    }
    
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{scene_id}.json")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 保存成功: {output_path} ({len(scripts)}条话术)")

if __name__ == "__main__":
    input_dir = r"G:\BaiduNetdiskDownload\高情商话术"
    output_dir = r"F:\开发软件项目文件\对练社交\parsed_output"
    knowledge_base_dir = r"F:\开发软件项目文件\对练社交\knowledge_base"
    
    parse_all_pdfs(input_dir, output_dir)
    
    print("\n" + "="*50)
    print("开始整理话术知识库...")
    
    scenes = {
        "相亲模拟": "相亲模拟",
        "模拟面试": "模拟面试",
        "加薪谈判": "加薪谈判",
        "共情沟通训练": "共情沟通训练",
        "被误解_NVC": "被误解_NVC",
        "兴趣社群自我介绍": "兴趣社群自我介绍"
    }
    
    for scene_name, scene_id in scenes.items():
        md_files = []
        for root, dirs, files in os.walk(output_dir):
            for file in files:
                if file.endswith('.md'):
                    md_path = os.path.join(root, file)
                    with open(md_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if scene_name in content or scene_id in content:
                            md_files.append(content)
        
        all_scripts = []
        for md_content in md_files:
            scripts = extract_scripts_from_markdown(md_content, scene_name, scene_id)
            all_scripts.extend(scripts)
        
        if all_scripts:
            save_scene_scripts(scene_name, scene_id, all_scripts, os.path.join(knowledge_base_dir, 'scenes'))
        else:
            print(f"⚠️ 未找到 {scene_name} 相关话术")
    
    print("\n✅ 话术知识库整理完成！")