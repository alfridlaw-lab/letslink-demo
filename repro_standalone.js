const { webkit } = require('playwright');
(async () => {
  const browser = await webkit.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0,220)));
  page.on('pageerror', e => { errs.push(e); console.log('PAGEERROR:', e.message, '\n', (e.stack||'').split('\n').slice(0,5).join('\n')); });

  // Force standalone display mode + navigator.standalone=true (iOS PWA signal) BEFORE any script runs
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { get: () => true, configurable: true });
    const mm = window.matchMedia;
    window.matchMedia = (q) => {
      if (/display-mode\s*:\s*standalone/.test(q)) return { matches:true, media:q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, onchange:null };
      return mm ? mm.call(window, q) : { matches:false, media:q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} };
    };
  });

  const url = process.argv[2] || 'https://getletslink.com/';
  console.log('=== LOADING (standalone mode):', url);
  await page.goto(url, { waitUntil:'load' }).catch(e=>console.log('GOTO',e.message));
  await page.waitForTimeout(2500);
  const view = await page.$eval('#view', el=>el.innerHTML.slice(0,220)).catch(()=>'(none)');
  console.log('=== #view:', view.replace(/\s+/g,' '));
  console.log('=== crash box shown?', /error|crash|failed/i.test(view));
  console.log('=== TOTAL PAGEERRORS:', errs.length);
  await browser.close();
})();
