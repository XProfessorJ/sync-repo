// rename-by-render.cjs
const fs = require('fs');
const path = require('path');

function containsRender(content) {
 // 不区分大小写，匹配 "render" 单词（避免 match "renderer", "rendering" 等）
 return /\brender\b/i.test(content);
}

function processDir(dir) {
 const items = fs.readdirSync(dir);
 for (const item of items) {
   const fullPath = path.join(dir, item);
   const stat = fs.statSync(fullPath);

   if (stat.isDirectory()) {
     processDir(fullPath); // 递归子目录
   } else if (stat.isFile() && fullPath.endsWith('.js')) {
     const content = fs.readFileSync(fullPath, 'utf8');
     if (containsRender(content)) {
       const newFullPath = fullPath.replace(/\.js$/, '.jsx');
       console.log(`✅ ${fullPath} → ${newFullPath}`);
       fs.renameSync(fullPath, newFullPath);
     }
   }
 }
}

console.log('🔍 Scanning src/ for files containing "render"...');
if (fs.existsSync('src')) {
 processDir('src');
 console.log('\n✨ Done!');
} else {
 console.error('❌ src/ directory not found!');
}
// console