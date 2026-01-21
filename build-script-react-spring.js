const fs = require('fs');
const path = require('path');

// 假设这是读取 Vite 打包后的 index.html
const buildHtmlPath = 'dist/index.html'; 
const htmlContent = fs.readFileSync(buildHtmlPath, 'utf-8');

// 1. 提取 JS 文件名 (匹配 <script type="module" src="xxx">)
// 这会匹配到类似 "/assets/main.DDd1seyc.js" 或 "main.DDd1seyc.js"
const jsMatch = htmlContent.match(/<script[^>]+src="([^"]+)"/);
// 2. 提取 CSS 文件名 (匹配 <link rel="stylesheet" href="xxx">)
const cssMatch = htmlContent.match(/<link[^>]+href="([^"]+\.css)"/);

let jsPath = '';
let cssPath = '';

if (jsMatch) {
    // 去掉路径前缀，只保留文件名（或者保留相对路径）
    jsPath = jsMatch[1].split('/').pop(); // 结果: main.DDd1seyc.js
}
if (cssMatch) {
    cssPath = cssMatch[1].split('/').pop(); // 结果: resource.css (或者 index.BFt78liM.css 如果 CSS 是 JS 生成的)
}

// 特殊处理：如果 CSS 没匹配到，但你确定有 resource.css，可以手动指定
// if (!cssPath) {
//     cssPath = 'resource.css';
// }

// 构建 Thymeleaf 模板
const THYMELEAF_TEMPLATE = `
<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>React App</title>
    <!-- 动态注入 CSS -->
    <link th:href="@{/${cssPath}}" rel="stylesheet" />
</head>
<body>
    <div id="root"></div>
    <!-- 动态注入 JS -->
    <script th:src="@{/${jsPath}}"></script>
</body>
</html>
`;

// 写入 react.html
fs.writeFileSync('dist/react.html', THYMELEAF_TEMPLATE);
console.log('Thymeleaf template generated!');