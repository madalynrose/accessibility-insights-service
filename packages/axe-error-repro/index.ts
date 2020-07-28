const { AxePuppeteer } = require('axe-puppeteer');
const puppeteer = require('puppeteer');

const axeRuleExclusionList = [
  'image-redundant-alt',
  'checkboxgroup',
  'empty-heading',
  'p-as-heading',
  'radiogroup',
  'table-duplicate-name',
  'table-fake-caption',
  'td-has-header',
  'link-in-text-block',
  'meta-viewport-large',
  'tabindex',
  'scope-attr-valid',
  'frame-title-unique',
  'heading-order',
  'hidden-content',
  'label-title-only',
  'region',
  'skip-link',
  'landmark-main-is-top-level',
  'landmark-one-main',
  'aria-dpub-role-fallback',
  'focus-order-semantics',
  'frame-tested',
  'landmark-banner-is-top-level',
  'landmark-contentinfo-is-top-level',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'page-has-heading-one',
  'aria-allowed-role',
  'css-orientation-lock',
  'form-field-multiple-labels',
  'label-content-name-mismatch',
  'landmark-complementary-is-top-level',
  'scrollable-region-focusable',
  'landmark-unique',
  'meta-viewport',
  'accesskeys',
  'landmark-no-duplicate-main',
  'identical-links-same-purpose',
];

const timeoutMsecs = 15000;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    timeout: timeoutMsecs,
    args: ['--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setBypassCSP(true);
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
});

  await page.goto('https://developer.microsoft.com/en-us/graph/graph-explorer', { waitUntil: ['load'], timeout: 120000 });
  try {
    await page.waitForNavigation({
        waitUntil: ['networkidle0'],
        timeout: timeoutMsecs,
    });
  }
  catch {}

  //await new Promise((resolve) => setTimeout(resolve, 15 * 1000));

  const axe = await new AxePuppeteer(page).disableRules(axeRuleExclusionList);
  try {
    const results = await axe.analyze();
    console.log(results);
  }
  catch(e) {
    console.log(e);
  }

  await page.close();
  await browser.close();
})();