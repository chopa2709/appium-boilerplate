import { loginAs, PREMIUM_USER } from '../helpers/hotel.auth.js';

describe('[DEBUG] 宿泊予約ページ プラン一覧調査', () => {
    it('プランボタンの数・テキスト・リンク先を調査する', async () => {
        await loginAs(PREMIUM_USER);

        // 宿泊予約ページへ遷移
        await $('/html/body/nav/button').click();
        const reserveLink = $('//*[@id="navbarNav"]/ul/li[2]/a');
        await reserveLink.waitForDisplayed({ timeout: 5000 });
        await reserveLink.click();

        // プランカードが表示されるまで待機
        await $('/html/body/div/div[2]/div//a').waitForDisplayed({ timeout: 10000 });
        await browser.pause(1000);

        // スクリーンショット
        const ss1 = await browser.takeScreenshot();
        await browser.execute((b64) => {
            const img = document.createElement('img');
            img.src = 'data:image/png;base64,' + b64;
            img.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;width:300px;opacity:0.8';
            document.body.appendChild(img);
        }, ss1);

        // プランカードの情報を全部取得
        const planInfo = await browser.execute(() => {
            const cards = Array.from(document.querySelectorAll('.card'));
            return cards.map((card, i) => {
                const title = card.querySelector('.card-title')?.textContent?.trim() ?? '';
                const price = card.querySelector('.card-text')?.textContent?.trim() ?? '';
                const link = card.querySelector('a') as HTMLAnchorElement | null;
                return {
                    index: i,
                    title,
                    price,
                    linkText: link?.textContent?.trim() ?? '',
                    href: link?.href ?? '',
                    planId: link?.href?.match(/plan-id=(\d+)/)?.[1] ?? '',
                };
            });
        });

        console.log('\n=== プラン一覧 ===');
        console.log(JSON.stringify(planInfo, null, 2));
        console.log(`\nプラン総数: ${planInfo.length}`);

        // ボタン（a タグ）を全件取得
        const allLinks = await browser.execute(() => {
            const links = Array.from(document.querySelectorAll('a[href*="reserve"]'));
            return links.map((a, i) => ({
                index: i,
                text: (a as HTMLElement).textContent?.trim(),
                href: (a as HTMLAnchorElement).href,
            }));
        });
        console.log('\n=== 予約リンク一覧 ===');
        console.log(JSON.stringify(allLinks, null, 2));
    });
});
