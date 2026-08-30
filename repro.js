const { webkit } = require('playwright');

(async () => {
  const browser = await webkit.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    geolocation: undefined,
    permissions: [],
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { console.log('CONSOLE:', m.type(), m.text()); });
  page.on('pageerror', e => { errors.push(e); console.log('PAGEERROR:', e.message, '\n', e.stack); });

  const target = process.argv[2] || 'https://getletslink.com/';
  console.log('=== LOADING', target, '===');
  try {
    await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) { console.log('GOTO ERR:', e.message); }

  // Try to reach create-account / share flow
  await page.waitForTimeout(2000);
  console.log('=== TITLE:', await page.title());
  // Look for buttons that start create/share flow
  const btns = await page.$$eval('button, a, [role=button], [onclick], [data-act]', els =>
    els.slice(0,60).map(e => (e.textContent||'').trim().slice(0,40)).filter(Boolean));
  console.log('=== BUTTONS/LINKS:', JSON.stringify(btns.slice(0,40)));

  console.log('=== TOTAL PAGEERRORS:', errors.length);
  await browser.close();
})();
