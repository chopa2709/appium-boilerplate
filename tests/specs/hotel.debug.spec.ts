import { loginAs, PREMIUM_USER } from '../helpers/hotel.auth.js';
import HotelReservePage from '../pageobjects/hotel.reserve.page.js';

describe('[DEBUG] 予約フォーム動作確認', () => {
    it('TC1相当（連絡なし・オプションなし・1泊1名）でフルフローを確認', async () => {
        await loginAs(PREMIUM_USER);
        await HotelReservePage.navigateToPlans();

        // ─── 予約フォームを開く ───────────────────────
        console.log('\n=== 予約フォームを開く ===');
        await HotelReservePage.openReserveForm();
        console.log('フォームURL:', await browser.getUrl());
        await HotelReservePage.takeScreenshot('01_フォーム');

        // ─── フォームを入力（修正済みの fillForm を使用）───
        console.log('\n=== フォーム入力 ===');
        await HotelReservePage.fillForm({
            contact: '希望しない',
            breakfast: false,
            lateCheckIn: false,
            sightseeing: false,
            nights: 1,
            guests: 1,
            note: '',
        });
        await HotelReservePage.takeScreenshot('02_入力後');

        // ─── 送信して確認ダイアログ ───────────────────
        console.log('\n=== 送信ボタン クリック ===');
        await HotelReservePage.submitButton.click();
        await browser.pause(2000);
        await HotelReservePage.takeScreenshot('03_送信後');

        // ─── 画面上の要素・ボタンを調べる ─────────────
        const info = await browser.execute(() => {
            const ids = Array.from(document.querySelectorAll('[id]'))
                .map(el => `${el.tagName}#${el.id}`);
            const btns = Array.from(document.querySelectorAll('button'))
                .map(b => `"${b.textContent?.trim()}" visible=${b.offsetParent !== null}`);
            const modals = Array.from(document.querySelectorAll('.modal, [role="dialog"]'))
                .map(m => `${m.tagName}#${(m as HTMLElement).id} display=${getComputedStyle(m).display}`);
            return { ids, btns, modals };
        });
        console.log('IDを持つ要素:', JSON.stringify(info.ids));
        console.log('ボタン:', JSON.stringify(info.btns));
        console.log('モーダル:', JSON.stringify(info.modals));

        // ─── confirmButton 確認 ───────────────────────
        console.log('\n=== confirmButton 待機（5秒）===');
        try {
            await HotelReservePage.confirmButton.waitForDisplayed({ timeout: 5000 });
            console.log('✅ confirmButton 表示 OK');
            await HotelReservePage.takeScreenshot('04_確認ダイアログ');
            await HotelReservePage.confirmButton.click();

            // ─── closeButton 確認 ─────────────────────
            console.log('\n=== closeButton 待機（5秒）===');
            await HotelReservePage.closeButton.waitForDisplayed({ timeout: 5000 });
            console.log('✅ closeButton 表示 OK');
            await HotelReservePage.takeScreenshot('05_完了モーダル');
        } catch (e) {
            console.log('❌ エラー:', (e as Error).message.split('\n')[0]);
        }
    });
});
