# -*- coding: utf-8 -*-
"""批量抓取央视百家讲坛金正昆礼仪讲稿 (cctv.com / cntv.cn)
直接用 requests + BeautifulSoup 解析，比 ASR 快得多也准得多。
"""
import re
import json
import time
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urlparse

OUTPUT_DIR = Path(r"f:\开发软件项目文件\对练社交\knowledge_base\markdown\礼仪规范")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

# 已知的 URL 列表（原始 2005 版全文优先）
URLS = [
    # 原始 2005 百家讲坛版本（有完整全文）
    ("礼仪就在你身边", "https://www.cntv.cn/program/bjjt/20050509/101121.shtml"),
    ("节庆礼仪", "https://www.cctv.com/education/20050509/101736.shtml"),
    ("座次礼仪", "http://news.cctv.com/program/bjjt/20050704/100702.shtml"),
    ("握手礼仪", "http://news.cctv.com/program/bjjt/20050704/100635.shtml"),
    ("涉外礼仪", "https://www.cntv.cn/lm/131/61/85913.html"),
    ("西餐礼仪", "https://www.cntv.cn/program/bjjt/20050704/100743.shtml"),
    ("服饰礼仪", "https://www.cctv.com/education/20050509/101756.shtml"),
    ("介绍礼仪", "http://ent.cctv.com/program/bjjt/20050613/100463.shtml"),
    # 2004 年"身边的礼仪"系列
    ("身边的礼仪一", "http://big5.cctv.com/gate/big5/www.cctv.cn/program/bjjt/20040625/101454.shtml"),
]


def extract_text(html: str) -> str:
    """从央视页面提取正文（（全文）标记之后的内容）"""
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator="\n", strip=False)

    # 找到"（全文）"或"(全文)"标记
    for marker in ["（全文）", "(全文)", "（正文）"]:
        if marker in text:
            idx = text.index(marker)
            text = text[idx + len(marker):]
            break

    # 清理多余空行和空白
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def fetch_one(title: str, url: str) -> dict:
    """抓取单个 URL"""
    result = {"title": title, "url": url, "ok": False, "chars": 0, "error": None}
    try:
        print(f"  抓取: {title} ...", end=" ", flush=True)
        r = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        r.encoding = r.apparent_encoding or "utf-8"
        if r.status_code != 200:
            result["error"] = f"HTTP {r.status_code}"
            print(f"失败 ({r.status_code})")
            return result

        text = extract_text(r.text)
        if len(text) < 200:
            result["error"] = "正文太短"
            print(f"正文太短 ({len(text)}字)")
            return result

        # 清理标题中的特殊字符
        safe_title = re.sub(r'[\\/:*?"<>|]', "_", title)
        out_path = OUTPUT_DIR / f"金正昆_{safe_title}.md"
        content = f"# 金正昆谈礼仪 — {title}\n\n{text}\n"
        out_path.write_text(content, encoding="utf-8")

        result["ok"] = True
        result["chars"] = len(text)
        result["file"] = str(out_path)
        print(f"成功 ({len(text)}字)")
    except Exception as e:
        result["error"] = str(e)
        print(f"异常 ({e})")
    return result


def main():
    print(f"输出目录: {OUTPUT_DIR}")
    print(f"待抓取 {len(URLS)} 篇\n")

    results = []
    for title, url in URLS:
        r = fetch_one(title, url)
        results.append(r)
        time.sleep(1)  # 礼貌延迟

    # 汇总
    ok = [r for r in results if r["ok"]]
    fail = [r for r in results if not r["ok"]]
    print(f"\n完成！成功 {len(ok)}/{len(URLS)}，总字数 {sum(r['chars'] for r in ok)}")
    if fail:
        print("失败的：")
        for r in fail:
            print(f"  - {r['title']}: {r['error']}")

    summary = {
        "total": len(URLS),
        "ok": len(ok),
        "fail": len(fail),
        "total_chars": sum(r["chars"] for r in ok),
        "ok_list": [{"title": r["title"], "chars": r["chars"], "file": r["file"]} for r in ok],
        "fail_list": [{"title": r["title"], "error": r["error"]} for r in fail],
    }
    summary_path = OUTPUT_DIR / "_金正昆抓取结果.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n详细结果已保存: {summary_path}")


if __name__ == "__main__":
    main()
