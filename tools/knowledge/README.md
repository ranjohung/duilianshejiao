# 知识库构建工具

在仓库根目录运行：

```text
node tools/knowledge/build_raw_course_markdown.js
node tools/knowledge/build_raw_course_cards.js
```

两个脚本读取 `G:\BaiduNetdiskDownload\高情商话术\高情商话术\580好好接话电子版\好好接话txt版.txt`，分别生成课程 Markdown、`knowledge_base/markdown/原始文本/README.md` 和 `knowledge_base/raw_course_cards.js`。脚本会先清理自己管理的输出目录，再按正文边界重建；不会修改 G 盘源文件。若原始资料路径或版式变更，应先更新脚本中的来源与边界规则并重新执行校验。