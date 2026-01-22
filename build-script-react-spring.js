// generate-thymeleaf-template.mjs
import fs from 'fs';
import path from 'path';

// 1. 定义路径
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const VITE_INDEX_HTML = path.resolve(__dirname, 'dist/index.html');
const OUTPUT_DIR = path.resolve(__dirname, 'dist/templates/html');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'react.html');

// 2. 读取 Vite 生成的 index.html
let htmlContent;
try {
  htmlContent = fs.readFileSync(VITE_INDEX_HTML, 'utf-8');
  console.log('✅ 成功读取 dist/index.html');
} catch (err) {
  console.error('❌ 错误：找不到 dist/index.html，请先运行 vite build');
  process.exit(1);
}

// 3. 定义正则表达式 (全局匹配 g)
// 匹配 <link> 或 <script> 标签，捕获: [完整标签, 标签名, 属性名(href|src), 文件路径]
const REG_ASSET = /<(link|script)([^>]*)?(href|src)="([^"]+)"([^>]*)?>/.source;
const REG_GLOBAL = new RegExp(REG_ASSET, 'g');

// 4. 提取并转换资源
const assetLines = [];

let match;
while ((match = REG_GLOBAL.exec(htmlContent)) !== null) {
  const fullTag = match[0];
  const tagType = match[1]; // 'link' 或 'script'
  const beforeHref = match[2] || ''; // 属性前的部分 (包含空格)
  const attrType = match[3]; // 'href' 或 'src'
  const filePath = match[4];
  const afterPath = match[5] || ''; // 属性后的部分
  const fileName = path.basename(filePath);

  let thymeleafTag = '';

  // 核心逻辑：保持原来的标签类型不变
  if (tagType === 'link') {
    // 如果原来是 <link>，生成 <link th:href>
    // 这样能正确处理 rel="stylesheet" 和 rel="modulepreload"
    thymeleafTag = `    <link${beforeHref} th:href="@{/${fileName}}"${afterPath}>`;
  } else if (tagType === 'script') {
    // 如果原来是 <script>，生成 <script th:src>
    thymeleafTag = `    <script${beforeHref} th:src="@{/${fileName}}"${afterPath}></script>`;
  }

  if (thymeleafTag) {
    assetLines.push(thymeleafTag);
    console.log(`🔍 转换: ${fullTag} -> ${thymeleafTag}`);
  }
}

// 5. 构建 Thymeleaf 模板字符串
// 直接将转换后的标签插入
const ASSETS_HTML = assetLines.join('\n');

const THYMELEAF_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>React App</title>
${ASSETS_HTML}\
</head>
<body>
    <div id="root"></div>
</body>
</html>`;

// 6. 核心逻辑：自动创建多级目录并写入文件
function ensureDirAndWrite(file, content) {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    }
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✅ 成功生成: ${file}`);
  } catch (err) {
    console.error('❌ 文件操作失败:', err);
    process.exit(1);
  }
}

// 执行写入
ensureDirAndWrite(OUTPUT_FILE, THYMELEAF_TEMPLATE);