const { webkit } = require('playwright');

(async () => {
  const browser = await webkit.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });

  const url = 'https://alfridlaw-lab.github.io/letslink-demo/index.html?cb=' + Date.now();
  console.log('Loading', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => errors.push('GOTO: ' + e.message));
  await page.waitForTimeout(1500);

  // Report version + whether the error box is showing
  const ver = await page.evaluate(() => (document.body.innerText.match(/v\d+/) || [''])[0]).catch(() => '?');
  console.log('version on page:', ver);

  // Is the onboarding welcome showing?
  const hasWelcome = await page.evaluate(() => document.body.innerText.includes('Create your account')).catch(() => false);
  console.log('welcome screen showing:', hasWelcome);

  // Click "Create your account" -> form
  if (hasWelcome) {
    await page.click('text=Create your account').catch(e => errors.push('click create: ' + e.message));
    await page.waitForTimeout(800);
    // fill the form
    await page.fill('#ob_name', 'Keith True').catch(()=>{});
    await page.fill('#ob_handle', '@true').catch(()=>{});
    await page.waitForTimeout(300);
    // submit "Create account & enter"
    await page.click('text=Create account & enter').catch(e => errors.push('click submit: ' + e.message));
    await page.waitForTimeout(1200);
  }

  // Check for the app's own render-error box
  const errBox = await page.evaluate(() => {
    const v = document.getElementById('view');
    const t = v ? v.innerText : '';
    return t.includes('Render error') ? t.slice(0, 400) : null;
  }).catch(() => null);

  console.log('\n===== RESULT =====');
  console.log('render-error box:', errBox || 'none');
  console.log('captured errors:', errors.length ? '\n' + errors.join('\n---\n') : 'NONE');

  await browser.close();
})();
