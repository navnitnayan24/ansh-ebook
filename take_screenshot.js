const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Try Vite default port
    await page.goto('http://localhost:5173/ebooks', { waitUntil: 'networkidle2', timeout: 10000 });
  } catch (e) {
    console.log("Port 5173 failed, trying 5000 (production server)...");
    try {
        await page.goto('http://localhost:5000/ebooks', { waitUntil: 'networkidle2', timeout: 10000 });
    } catch (e2) {
        console.log("Port 5000 failed, trying 3000...");
        await page.goto('http://localhost:3000/ebooks', { waitUntil: 'networkidle2', timeout: 10000 });
    }
  }

  // Set viewport to desktop size
  await page.setViewport({ width: 1280, height: 800 });
  
  // Take screenshot
  await page.screenshot({ path: 'local_screenshot.png', fullPage: true });
  console.log("Screenshot successfully saved as local_screenshot.png!!!");

  await browser.close();
})();
