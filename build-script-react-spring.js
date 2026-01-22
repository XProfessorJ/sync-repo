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
const REG_ASSET = /<(link|script)[^>]+(href|src)="([^"]+)"[^>]*>/g;

// 4. 提取所有资源
const cssFiles = [];
const jsFiles = {
  sync: [],   // 同步脚本
  async: []   // 异步脚本
};

// 执行匹配
let match;
while ((match = REG_ASSET.exec(htmlContent)) !== null) {
  const tag = match[1];
  const attr = match[2];
  const filePath = match[3];
  const fileName = path.basename(filePath);
  const fullTag = match[0]; // 完整的标签文本

  // 处理 CSS
  if (fileName.endsWith('.css')) {
    cssFiles.push(fileName);
  } 
  // 处理 JS
  else if (fileName.endsWith('.js')) {
    // 修复点1: 修正了 full\Tag 的拼写错误
    // 修复点2: 在 async/defer 前加空格，确保匹配的是属性而不是文件名
    if (fullTag.includes('type="module"') || 
        fullTag.includes(' async') || 
        fullTag.includes(' defer')) {
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
let cssImports = '';
if (cssFiles.length === 0) {
  console.warn('⚠️ 未检测到 CSS 文件，将使用默认 resource.css');
  cssImports = '    <link th:href="@{/resource.css}" rel="stylesheet" />\n';
} else {
  cssFiles.forEach(file => {
    cssImports += `    <link th:href="@{/${file}}" rel="stylesheet" />\n`;
  });
}

let jsImports = '';

// 引入同步 JS (如果有)
jsFiles.sync.forEach(file => {
  jsImports += `    <script th:src="@{/${file}}"></script>\n`;
});

// 引入异步 JS (Vite Chunk)
jsFiles.async.forEach(file => {
  // 根据你的 Vite 构建模式选择:
  // 方案A (推荐): 现代模式 - 使用 type="module"
  jsImports += `    <script th:src="@{/${file}}" type="module"></script>\n`;
  
  // 方案B: 传统模式 - 使用 async
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