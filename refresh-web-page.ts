import { Builder, WebDriver } from 'selenium-webdriver/index.js';
import * as chrome from 'selenium-webdriver/chrome.js';

let driver: WebDriver | null = null;
let refreshInterval: NodeJS.Timeout | null = null;

async function main(): Promise<void> {
  try {
    // 启动 Chrome 浏览器
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments(
      '--no-sandbox',
      '--disable-dev-shm-usage'
      // 如需无头模式，取消注释下一行：
      // '--headless=new'
    );
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    // 设置目标 URL
    const url = 'https://example.com'; // ← 替换为你想刷新的网址
    console.log(`正在打开页面: ${url}`);
    await driver.get(url);

    console.log('✅ 页面加载完成。每30秒自动刷新一次...（按 Ctrl+C 退出）');

    // 定义刷新函数
    const refreshPage = async (): Promise<void> => {
      if (!driver) return;
      try {
        console.log('🔄 正在刷新页面...');
        await driver.navigate().refresh();
      } catch (err) {
        console.error('⚠️ 刷新时出错:', (err as Error).message);
      }
    };

    // 启动定时刷新（每30秒）
    refreshInterval = setInterval(refreshPage, 30 * 1000);

    // 监听 Ctrl+C 退出信号
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    // 保持脚本运行
    await new Promise<never>(() => {}); // 永久挂起

  } catch (error) {
    console.error('💥 主程序发生错误:', (error as Error).message);
    await gracefulShutdown();
  }
}

async function gracefulShutdown(): Promise<void> {
  console.log('\n🛑 收到退出信号，正在关闭浏览器...');
  
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  if (driver) {
    try {
      await driver.quit();
    } catch (err) {
      console.error('❌ 关闭浏览器时出错:', (err as Error).message);
    }
  }

  process.exit(0);
}

// 启动主程序
main().catch(console.error);