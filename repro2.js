const { webkit } = require('playwright');

(async () => {
  const browser = await webkit.launch();

  // Scenario A: returning user with SAVED state, loaded over HTTP (True's real condition)
  async function run(label, url, seedState) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.stack || e.message)));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });

    // Seed localStorage BEFORE the app scripts run
    if (seedState) {
      await page.addInitScript(s => {
        try { localStorage.setItem('ll_state_v1', s.state); } catch (e) {}
        try { localStorage.setItem('ll_myloc', s.loc); } catch (e) {}
      }, seedState);
    }

    await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(e => errors.push('GOTO: ' + e.message));
    await page.waitForTimeout(1500);

    const ver = await page.evaluate(() => (document.body.innerText.match(/v\d+/) || [''])[0]).catch(() => '?');
    const errBox = await page.evaluate(() => {
      const v = document.getElementById('view'); const t = v ? v.innerText : '';
      return t.includes('Render error') ? t.slice(0, 300) : null;
    }).catch(() => null);

    // Try the Share/relaunch simulation: dispatch visibilitychange + pagehide + re-run boot
    await page.evaluate(() => {
      try { document.dispatchEvent(new Event('visibilitychange')); } catch (e) {}
      try { window.dispatchEvent(new Event('pagehide')); } catch (e) {}
      try { window.dispatchEvent(new Event('blur')); } catch (e) {}
      try { window.dispatchEvent(new Event('focus')); } catch (e) {}
    }).catch(() => {});
    await page.waitForTimeout(500);

    console.log(`\n===== ${label} =====`);
    console.log('version:', ver, '| render-error box:', errBox || 'none');
    console.log('errors:', errors.length ? '\n' + errors.join('\n---\n') : 'NONE');
    await ctx.close();
  }

  const httpsUrl = 'https://alfridlaw-lab.github.io/letslink-demo/index.html?cb=' + Date.now();
  const customHttp = 'http://getletslink.com/?cb=' + Date.now();
  const customHttps = 'https://getletslink.com/?cb=' + Date.now();

  // A messy old-format saved state (simulating an account made in an earlier version)
  const oldState = JSON.stringify({ me: 'user_old', tab: 'explore' }); // 'me' set but users[me] missing => must self-heal
  const seed = { state: oldState, loc: '[30.26,-97.74]' };

  await run('A: returning user + saved state over HTTPS (gh-pages)', httpsUrl, seed);
  await run('B: custom domain over HTTP + saved state', customHttp, seed);
  await run('C: custom domain over HTTPS + saved state', customHttps, seed);
  await run('D: custom domain HTTP, fresh (no state)', 'http://getletslink.com/?cb=' + (Date.now()+1), null);

  await browser.close();
})();
