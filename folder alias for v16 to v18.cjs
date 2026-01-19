// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

// 🔍 自动读取 src/ 下的所有一级子目录，作为别名
function getSrcAliases() {
  const srcDir = path.resolve(__dirname, 'src');
  if (!fs.existsSync(srcDir)) {
    console.warn('⚠️ src/ directory not found, no aliases created.');
    return {};
  }

  const items = fs.readdirSync(srcDir);
  const aliases = {};

  for (const item of items) {
    const fullPath = path.join(srcDir, item);
    const stat = fs.statSync(fullPath);
    // 只处理目录（跳过文件如 main.jsx）
    if (stat.isDirectory()) {
      aliases[item] = fullPath;
    }
  }

  return aliases;
}

export default defineConfig({
  plugins: [react()],

  resolve: {
    // 支持 .jsx 扩展名（关键！）
    extensions: ['.js', '.jsx', '.json'],

    // 自动生成所有 src/ 下的目录为别名
    alias: {
      ...getSrcAliases(),
      // 👇 如果你以后想加特殊别名，可以放这里（会覆盖自动生成的）
      // '@': path.resolve(__dirname, 'src') // 例如：@/app
    }
  },

  server: {
    port: 3000,
    open: true
  }
});