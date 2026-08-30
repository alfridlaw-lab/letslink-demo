const { webkit } = require('playwright');
(async () => {
  const browser = await webkit.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0,200)));
  page.on('pageerror', e => { errs.push(e); console.log('PAGEERROR:', e.message); });
  page.on('requestfailed', r => console.log('REQFAIL:', (r.url()||'').slice(0,80), r.failure()&&r.failure().errorText));

  const url = process.argv[2] || 'https://getletslink.com/';
  await page.goto(url, { waitUntil:'load' }).catch(e=>console.log('GOTO',e.message));
  await page.waitForTimeout(1500);

  // Stub navigator.share to simulate iOS native share sheet (which doesn't exist in headless webkit)
  await page.evaluate(() => {
    window.__lastAct='(injected)';
    navigator.share = (d) => { console.log('navigator.share called with', JSON.stringify(d).slice(0,120)); return Promise.resolve(); };
  });

  // Walk create-account: click Create your account
  try { await page.getByText('Create your account').first().click({timeout:5000}); } catch(e){ console.log('c1',e.message); }
  await page.waitForTimeout(800);
  // fill form
  try {
    await page.fill('#ob_name','Test User').catch(()=>{});
    await page.fill('#ob_handle','@test').catch(()=>{});
    await page.getByText('Create account & enter').first().click({timeout:5000});
    console.log('=== submitted account');
  } catch(e){ console.log('submit err', e.message); }
  await page.waitForTimeout(1500);

  // Now try to open invite/share and click Share
  const acts = ['inviteFriends','doShare'];
  for (const a of acts) {
    try { await page.evaluate(act => { window.__lastAct=act; if(window.ACTIONS&&ACTIONS[act]) ACTIONS[act](); }, a); console.log('=== ran', a); }
    catch(e){ console.log('act', a, 'err', e.message); }
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(1000);
  const view = await page.$eval('#view', el=>el.innerHTML.slice(0,200)).catch(()=>'(none)');
  console.log('=== #view:', view.replace(/\s+/g,' '));
  console.log('=== TOTAL PAGEERRORS:', errs.length);
  await browser.close();
})();
