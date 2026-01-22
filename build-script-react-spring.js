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
// 匹配 link[rel=stylesheet] 和 script 标签
// 这个正则会捕获: [完整标签, 资源类型(css|js), 属性值(href|src), 文件路径]
const REG_ASSET = /<(link|script)[^>]+(href|src)="([^"]+)"[^>]*>/g;
const REG_REL = /\srel="([^"]+)"/; // 辅助正则，用于检测 link 的 rel 属性

// 4. 提取所有资源
const cssFiles = [];
const jsFiles = {
  sync: [],   // 同步脚本 (没有 async/defer 的)
  async: []   // 异步脚本 (包含 async, module, 或者被标记为 chunk 的)
};

// 执行匹配
let match;
while ((match = REG_ASSET.exec(htmlContent)) !== null) {
  const tag = match[1]; // 'link' 或 'script'
  const attr = match[2]; // 'href' 或 'src'
  const filePath = match[3]; // '/assets/main.js', '/assets/style.css' 等
  const fileName = path.basename(filePath);
  const fullTag = match[0]; // 完整的标签字符串，用于分析属性

  // 过滤掉非 js/css 的资源 (比如 favicon)
  if (fileName.endsWith('.css')) {
    cssFiles.push(fileName);
  } else if (fileName.endsWith('.js')) {
    // 判断是否为异步/模块脚本
    // Vite 生成的异步 Chunk 通常包含 module, async 属性，或者文件名包含 hash
    if (fullTag.includes('type="module"') || full\Tag.includes('async') || fullTag.includes('defer')) {
      jsFiles.async.push(fileName);
    } else {
      jsFiles.sync.push(fileName);
    }
  }
}

console.log(`🔍 检测到 CSS:`, cssFiles.length > 0 ? cssFiles : '无');
console.log(`🔍 检测到 同步 JS:`, jsFiles.sync.length > 0 ? jsFiles.sync : '无');
console.log(`🔍 检测到 异步 JS:`, jsFiles.async.length > 0 ? jsFiles.async : '无');

// 5. 构建 Thymeleaf 模板字符串
// 策略：
// 1. CSS 全部引入 (Thymeleaf 会自动处理路径)
// 2. JS 分开引入：
//    - 同步 JS 放在 body 底部 (如果有)
//    - 异步 JS 使用 th:src 并加上 async 或 defer 属性

let cssImports = '';
cssFiles.forEach(file => {
  cssImports += `    <link th:href="@{/${file}}" rel="stylesheet" />\n`;
});

let jsImports = '';
// 引入同步 JS (通常只有一个入口文件)
jsFiles.sync.forEach(file => {
  jsImports += `    <script th:src="@{/${file}}"></script>\n`;
});

// 引入异步 JS (Vite 的 Chunk)
jsFiles.async.forEach(file => {
  // Vite 的模块通常需要 type="module"，如果是 legacy 模式可能是 async
  // 这里根据你的实际需求调整，如果是现代浏览器，建议保留 module
  jsImports += `    <script th:src="@{/${file}}" type="module"></script>\n`;
  // 如果是传统模式，使用下面这行：
  // jsImports += `    <script th:src="@{/${file}}" async></script>\n`;
});

const THYMELEAF_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>React App</title>
${cssImports}\
</head>
<body>
    <div id="root"></div>
${jsImports}\
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