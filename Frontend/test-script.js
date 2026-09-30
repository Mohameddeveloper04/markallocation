import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Listen to console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    page.on('requestfailed', request => {
        console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    page.on('response', response => {
        if (!response.ok()) {
            console.log('BAD RESPONSE:', response.url(), response.status());
        }
    });

    await page.goto('http://localhost:5173');

    // Switch to Mark Allocation
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Mark Allocation')) {
            await btn.click();
            break;
        }
    }

    // Wait for inputs
    await page.waitForTimeout(1000);

    // Type in Round 1
    const inputs = await page.$$('.mark-allocation__input');
    if (inputs.length >= 2) {
        await inputs[0].type('Round 1');
        await inputs[1].type('50');
    }

    // Click Add Round
    const addBtn = await page.$('.mark-allocation__btn');
    if (addBtn) {
        await addBtn.click();
    }

    // Wait a bit
    await page.waitForTimeout(2000);

    await browser.close();
})();
