import AllureReporter from '@wdio/allure-reporter';
import sharp from 'sharp';
import Page from './page.js';

export type ContactMethod = '希望しない' | 'メールでのご連絡' | '電話でのご連絡';

export type ReserveInput = {
    nights: number;
    guests: number;
    breakfast: boolean;
    lateCheckIn: boolean;
    sightseeing: boolean;
    contact: ContactMethod;
    note: string;
};

// 予約フォームの固定入力値
const FIXED = {
    date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}/${m}/${day}`;
    })(),
    name:  'テスト太郎',
    email: 'test@example.com',
    phone: '01234567890',
};

class HotelReservePage extends Page {
    // ナビ
    get navMenuButton ()  { return $('/html/body/nav/button'); }
    get reserveNavLink () { return $('//*[@id="navbarNav"]/ul/li[2]/a'); }

    // プラン一覧
    get firstPlanButton () { return $('/html/body/div/div[2]/div//a'); }

    // 予約フォーム（固定項目）
    get dateInput ()  { return $('#date'); }
    get nameInput ()  { return $('#username'); }
    get emailInput () { return $('#email'); }
    get phoneInput () { return $('#tel'); }

    // 予約フォーム（可変項目）
    get nightsInput ()      { return $('#term'); }
    get guestsInput ()      { return $('#head-count'); }
    get breakfastCheck ()   { return $('#breakfast'); }
    get lateCheckInCheck () { return $('#early-check-in'); }
    get sightseeingCheck () { return $('#sightseeing'); }
    get contactSelect ()    { return $('#contact'); }
    get noteTextarea ()     { return $('#comment'); }
    get submitButton ()     { return $('//*[@id="submit-button"]'); }

    // 確認・完了モーダル
    get confirmButton () { return $('//*[@id="confirm"]/div[2]/div/button'); }
    get closeButton ()   { return $('//*[@id="success-modal"]/div/div/div[3]/button'); }

    async navigateToPlans (): Promise<void> {
        await this.navMenuButton.click();
        await this.reserveNavLink.waitForDisplayed({ timeout: 5000 });
        await this.reserveNavLink.click();
        await this.firstPlanButton.waitForDisplayed({ timeout: 10000 });
    }

    async openReserveForm (): Promise<void> {
        console.log('[Reserve] firstPlanButton クリック前');
        const beforeHandles = await browser.getWindowHandles();
        await this.firstPlanButton.click();
        console.log('[Reserve] 新タブ待機中...');
        await browser.waitUntil(
            async () => (await browser.getWindowHandles()).length > beforeHandles.length,
            { timeout: 10000 },
        );
        const afterHandles = await browser.getWindowHandles();
        const newHandle = afterHandles.find(h => !beforeHandles.includes(h))!;
        console.log('[Reserve] 新タブへスイッチ:', newHandle);
        await browser.switchToWindow(newHandle);
        await this.nightsInput.waitForDisplayed({ timeout: 10000 });
        console.log('[Reserve] フォーム表示確認 OK / URL:', await browser.getUrl());
    }

    async fillForm (input: ReserveInput): Promise<void> {
        console.log('[Fill] 日付入力（JS直接セット）');
        await browser.execute((val) => {
            const el = document.querySelector('#date') as HTMLInputElement;
            if (el) {
                el.value = val;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, FIXED.date);

        console.log('[Fill] 宿泊数入力:', input.nights);
        await this.nightsInput.clearValue();
        await this.nightsInput.setValue(input.nights);

        console.log('[Fill] 人数入力:', input.guests);
        await this.guestsInput.clearValue();
        await this.guestsInput.setValue(input.guests);

        console.log('[Fill] チェックボックス設定');
        await this.setCheckbox(this.breakfastCheck, input.breakfast);
        await this.setCheckbox(this.lateCheckInCheck, input.lateCheckIn);
        await this.setCheckbox(this.sightseeingCheck, input.sightseeing);

        // 連絡方法を先に選択（email/phone の disabled 状態が変わるため）
        console.log('[Fill] 連絡方法選択:', input.contact);
        await this.contactSelect.selectByVisibleText(input.contact);

        console.log('[Fill] 氏名入力');
        await this.nameInput.setValue(FIXED.name);

        if (input.contact === 'メールでのご連絡') {
            console.log('[Fill] メール入力');
            await this.emailInput.setValue(FIXED.email);
        } else if (input.contact === '電話でのご連絡') {
            console.log('[Fill] 電話番号入力');
            await this.phoneInput.setValue(FIXED.phone);
        }

        console.log('[Fill] 要望入力');
        await this.noteTextarea.clearValue();
        if (input.note) {
            await this.noteTextarea.setValue(input.note);
        }

        if (driver.isMobile) {
            await driver.hideKeyboard();
        }
        console.log('[Fill] 入力完了');
    }

    async confirmReservation (): Promise<void> {
        console.log('[Confirm] 予約内容確認ボタン クリック');
        await this.submitButton.click();
        console.log('[Confirm] 確認ダイアログ待機中...');
        await this.confirmButton.waitForDisplayed({ timeout: 10000 });
        console.log('[Confirm] この内容で予約する クリック');
        await this.confirmButton.click();
        console.log('[Confirm] 完了モーダル待機中...');
        await this.closeButton.waitForDisplayed({ timeout: 10000 });
        console.log('[Confirm] 完了モーダル表示 OK');
    }

    async closeModal (): Promise<void> {
        console.log('[Close] 閉じるボタン クリック');
        const allHandles = await browser.getWindowHandles();
        await this.closeButton.click();

        console.log('[Close] ウィンドウ変化 or plans.html への遷移を待機中...');
        await browser.waitUntil(
            async () => {
                const handles = await browser.getWindowHandles();
                if (handles.length < allHandles.length) return true;
                const url = await browser.getUrl().catch(() => '');
                return url.includes('plans.html');
            },
            { timeout: 10000 },
        );

        const remainingHandles = await browser.getWindowHandles();
        if (remainingHandles.length >= allHandles.length) {
            console.log('[Close] リダイレクト検出 → タブを閉じて元に戻る');
            await browser.closeWindow();
            await browser.switchToWindow((await browser.getWindowHandles())[0]);
        } else {
            console.log('[Close] window.close() 検出 → 残りタブへスイッチ');
            await browser.switchToWindow(remainingHandles[0]);
        }

        await this.firstPlanButton.waitForDisplayed({ timeout: 10000 });
        console.log('[Close] プラン一覧への復帰 OK');
    }

    async takeScreenshot (name: string): Promise<void> {
        const screenshot = await browser.takeScreenshot();
        const original = Buffer.from(screenshot, 'base64');
        const { width, height } = await sharp(original).metadata();
        const resized = await sharp(original)
            .resize(Math.round(width! / 2), Math.round(height! / 2))
            .toBuffer();
        AllureReporter.addAttachment(name, resized, 'image/png');
    }

    private async setCheckbox (element: ReturnType<typeof $>, shouldBeChecked: boolean): Promise<void> {
        const isChecked = await element.isSelected();
        if (isChecked !== shouldBeChecked) {
            await element.click();
        }
    }
}

export default new HotelReservePage();
