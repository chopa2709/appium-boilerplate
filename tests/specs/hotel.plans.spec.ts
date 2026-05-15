import AllureReporter from '@wdio/allure-reporter';
import sharp from 'sharp';
import { loginAs, PREMIUM_USER } from '../helpers/hotel.auth.js';
import { step } from '../helpers/step.js';

const PLANS = [
    { planId: 0, name: 'お得な特典付きプラン' },
    { planId: 1, name: 'プレミアムプラン' },
    { planId: 2, name: 'ディナー付きプラン' },
    { planId: 3, name: 'お得なプラン' },
    { planId: 4, name: '素泊まり' },
    { planId: 5, name: '出張ビジネスプラン' },
    { planId: 6, name: 'エステ・マッサージプラン' },
    { planId: 7, name: '貸し切り露天風呂プラン' },
    { planId: 8, name: 'カップル限定プラン' },
    { planId: 9, name: 'テーマパーク優待プラン' },
];

async function takeScreenshot(name: string): Promise<void> {
    const screenshot = await browser.takeScreenshot();
    const original = Buffer.from(screenshot, 'base64');
    const { width, height } = await sharp(original).metadata();
    const resized = await sharp(original)
        .resize(Math.round(width! / 2), Math.round(height! / 2))
        .toBuffer();
    AllureReporter.addAttachment(name, resized, 'image/png');
}

describe('宿泊予約 プラン遷移確認', () => {
    before(async () => {
        await loginAs(PREMIUM_USER);
        await $('/html/body/nav/button').click();
        const reserveLink = $('//*[@id="navbarNav"]/ul/li[2]/a');
        await reserveLink.waitForDisplayed({ timeout: 5000 });
        await reserveLink.click();
        await $('a[href*="reserve"]').waitForDisplayed({ timeout: 10000 });
        await takeScreenshot('宿泊予約ページ');
    });

    for (const plan of PLANS) {
        it(`plan-id=${plan.planId} ${plan.name}`, async () => {
            await step('予約ボタンをクリックして新タブへ遷移する', async () => {
                const planLinks = await $$('a[href*="reserve"]');
                const beforeHandles = await browser.getWindowHandles();
                await planLinks[plan.planId].click();
                await browser.waitUntil(
                    async () => (await browser.getWindowHandles()).length > beforeHandles.length,
                    { timeout: 10000 },
                );
                const newHandle = (await browser.getWindowHandles()).find(h => !beforeHandles.includes(h))!;
                await browser.switchToWindow(newHandle);
                await $('#term').waitForDisplayed({ timeout: 10000 });
            });

            await step('予約フォームのスクリーンショットを撮る', async () => {
                const url = await browser.getUrl();
                await expect(url).toContain(`plan-id=${plan.planId}`);
                await takeScreenshot(`予約フォーム plan-id=${plan.planId} ${plan.name}`);
            });

            await step('タブを閉じてプラン一覧に戻る', async () => {
                await browser.closeWindow();
                await browser.switchToWindow((await browser.getWindowHandles())[0]);
                await $('a[href*="reserve"]').waitForDisplayed({ timeout: 10000 });
            });
        });
    }
});
