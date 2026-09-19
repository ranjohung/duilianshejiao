data = open(r"f:\开发软件项目文件\对练社交\knowledge_base\extra_course_cards_01.js","rb").read()
print(f"字节数: {len(data)}")
print(f"首 10 字节: {data[:10].hex()}")
print(f"有无 BOM (EF BB BF): {data[:3] == b'\xef\xbb\xbf'}")
print()
print("前 300 字节 repr:")
print(repr(data[:300]))
print()

# 找问题：用 Node.js 语法检查
import subprocess
result = subprocess.run(
    ['node', '-e', 'try { new Function("' + data[:500].decode('utf-8', errors='replace').replace('"','\\"') + '"); console.log("OK"); } catch(e) { console.log(e.message); }'],
    capture_output=True, text=True, timeout=5, cwd=r"f:\开发软件项目文件\对练社交"
)
print(f"Node.js 检查: {result.stdout.strip()} {result.stderr.strip()}")

# 直接用 node 跑完整文件
result2 = subprocess.run(
    ['node', '-e', data.decode('utf-8', errors='replace') + f"; console.log('shard01 执行后长度:', (typeof window !== 'undefined' ? 'N/A' : 'OK'))"],
    capture_output=True, text=True, timeout=5, cwd=r"f:\开发软件项目文件\对练社交",
    env={**__import__('os').environ, 'NODE_ENV': 'test'}
)
print(f"完整执行: stdout={result2.stdout[:200]} stderr={result2.stderr[:200]}")