const { webkit } = require('playwright');

(async () => {
  const browser = await webkit.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => console.log('CONSOLE:', m.type(), m.text()));
  page.on('pageerror', e => { errors.push(e); console.log('PAGEERROR:', e.message, '\n', (e.stack||'').split('\n').slice(0,6).join('\n')); });

  const target = process.argv[2] || 'http://getletslink.com/';
  console.log('=== LOADING', target, '===');
  try { await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 }); }
  catch (e) { console.log('GOTO ERR:', e.message); }
  await page.waitForTimeout(1500);
  console.log('=== FINAL URL:', page.url());

  // Click "Create your account"
  try {
    const create = await page.getByText('Create your account', { exact: false }).first();
    if (create) { await create.click({ timeout: 5000 }); console.log('=== clicked Create your account'); }
  } catch(e){ console.log('create click err:', e.message); }
  await page.waitForTimeout(1500);

  // dump visible interactive text after
  const btns = await page.$$eval('button, a, [role=button], [onclick], [data-act], input', els =>
    els.slice(0,80).map(e => ((e.textContent||e.placeholder||e.value||'').trim()).slice(0,40)).filter(Boolean));
  console.log('=== AFTER CREATE, INTERACTIVE:', JSON.stringify(btns.slice(0,50)));

  // Try to find a Share / continue / finish button and click it
  for (const label of ['Share','Continue','Next','Finish','Create','Get Started','Join','Sign up','Done']) {
    try {
      const el = page.getByText(label, { exact: false }).first();
      if (await el.count() > 0) {
        await el.click({ timeout: 3000 });
        console.log('=== clicked', label);
        await page.waitForTimeout(1200);
      }
    } catch(e) { /* ignore */ }
  }
  await page.waitForTimeout(1500);
  console.log('=== TOTAL PAGEERRORS:', errors.length);
  await browser.close();
})();
