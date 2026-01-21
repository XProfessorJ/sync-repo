// generate-thymeleaf-template.mjs
import fs from 'fs';
import path from 'path';

// 1. 定义路径
// 注意：import.meta.url 是 ESM 中获取当前文件路径的方式
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

// 3. 定义正则表达式 (适配 Vite 的短 Hash 格式)
const REG_CSS = /href="([^"]+\.css)"/;
const REG_JS = /src="([^"]+\.js)"/;

// 4. 提取文件名
const cssMatch = htmlContent.match(REG_CSS);
const jsMatch = htmlContent.match(REG_JS);

let cssFileName = 'resource.css'; // 默认值
let jsFileName = 'main.js';      // 默认值

if (cssMatch) {
  cssFileName = path.basename(cssMatch[1]);
}
if (jsMatch) {
  jsFileName = path.basename(jsMatch[1]);
}

console.log(`🔍 检测到 JS: ${jsFileName}`);
console.log(`🔍 检测到 CSS: ${cssFileName}`);

// 5. 构建 Thymeleaf 模板字符串
const THYMELEAF_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>React App</title>
    <link th:href="@{/${cssFileName}}" rel="stylesheet" />
</head>
<body>
    <div id="root"></div>
    <script th:src="@{/${jsFileName}}"></script>
</body>
</html>`;

// 6. 核心逻辑：自动创建多级目录并写入文件
function ensureDirAndWrite(file, content) {
  try {
    const dir = path.dirname(file);

    // 检查目录是否存在
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