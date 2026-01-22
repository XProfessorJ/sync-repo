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

// --- 修改开始 ---
// 3. 定义正则表达式 (添加全局标志 'g')
// 我们用一个正则同时匹配 link 和 script
const REG_ASSETS = /<(?:link|script)[^>]+(?:href|src)="([^"]+\.(?:css|js))"[^>]*>/g;

// 4. 提取所有文件名
let cssFileName = 'resource.css'; // 默认值
let jsFileNames = ['main.js'];    // 默认值 (注意这里变成了数组)

const matchedFiles = [...htmlContent.matchAll(REG_ASSETS)];

matchedFiles.forEach(match => {
  const filePath = match[1]; // 捕获组 1 是文件路径
  const fileName = path.basename(filePath);
  
  if (fileName.endsWith('.css')) {
    cssFileName = fileName;
  } else if (fileName.endsWith('.js')) {
    // 这里我们把所有 JS 文件都加进去
    // 如果你想区分入口和 chunk，可以用逻辑判断，或者直接全部引入
    jsFileNames.push(fileName);
  }
});

// 去重并过滤掉可能的重复项 (比如 main.js 已经在默认值里了)
jsFileNames = [...new Set(jsFileNames)];

console.log(`🔍 检测到 CSS: ${cssFileName}`);
console.log(`🔍 检测到 JS:`, jsFileNames);
// --- 修改结束 ---

// 5. 构建 Thymeleaf 模板字符串
// 注意：这里需要循环生成 script 标签
let scriptTags = '';
jsFileNames.forEach(file => {
  scriptTags += `    <script th:src="@{/${file}}"></script>\n`;
});

const THYMELEAF_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>React App</title>
    <link th:href="@{/${cssFileName}}" rel="stylesheet" />
</head>
<body>
    <div id="root"></div>
${scriptTags}\
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