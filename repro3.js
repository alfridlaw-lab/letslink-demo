const { webkit } = require('playwright');
(async () => {
  const browser = await webkit.launch();
  // Simulate geolocation DENIED — most likely real-device state
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    // no geolocation permission granted -> getCurrentPosition error callback fires
  });
  const page = await ctx.newPage();
  page.on('console', m => console.log('CONSOLE:', m.type(), m.text().slice(0,300)));
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  page.on('requestfailed', r => console.log('REQFAILED:', r.url(), r.failure()&&r.failure().errorText));

  const target = process.argv[2] || 'https://getletslink.com/';
  await page.goto(target, { waitUntil:'load', timeout:30000 }).catch(e=>console.log('GOTO:',e.message));
  await page.waitForTimeout(3000);
  // Did the diag red box appear? check #view content
  const viewHtml = await page.$eval('#view', el=>el.innerHTML.slice(0,400)).catch(()=>'(no #view)');
  console.log('=== #view after boot:', viewHtml.replace(/\s+/g,' ').slice(0,300));
  // Now navigate to the MAP tab to force Leaflet
  try {
    await page.evaluate(()=>{ if(window.go){} });
    // click nav items
    const navTexts = await page.$$eval('.nav *, [data-act]', els=>els.map(e=>(e.getAttribute&&e.getAttribute('data-act'))||'').filter(Boolean).slice(0,20));
    console.log('=== nav data-acts:', JSON.stringify(navTexts));
  } catch(e){ console.log('nav err', e.message); }
  await browser.close();
})();
