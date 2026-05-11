import AllureReporter from '@wdio/allure-reporter';
import { Status } from 'allure-js-commons';
import HotelLoginPage from '../pageobjects/hotel.login.page.js';

async function step (name: string, fn: () => Promise<void>) {
    AllureReporter.startStep(name);
    try {
        await fn();
        AllureReporter.endStep(Status.PASSED);
    } catch (e) {
        AllureReporter.endStep(Status.FAILED);
        throw e;
    }
}

describe('ホテルサイト ログイン', () => {
    it('正しい認証情報でログインするとマイページに遷移する', async () => {
        await step('トップページにアクセスする', async () => {
            await HotelLoginPage.openTopPage();
            await HotelLoginPage.takeScreenshot('1_トップページ');
        });

        await step('ナビメニューからログインページへ移動する', async () => {
            await HotelLoginPage.navMenuButton.click();
            await HotelLoginPage.loginLink.waitForDisplayed({ timeout: 5000 });
            await HotelLoginPage.loginLink.click();
            await HotelLoginPage.email.waitForDisplayed({ timeout: 10000 });
            await HotelLoginPage.takeScreenshot('2_ログインページ');
        });

        await step('ログイン情報を入力してログインする', async () => {
            await HotelLoginPage.login({ email: 'jun@example.com', password: 'pa55w0rd!' });
            await browser.waitUntil(
                async () => (await browser.getUrl()).includes('mypage.html'),
                { timeout: 10000 }
            );
            await HotelLoginPage.takeScreenshot('3_マイページ');
        });

        await step('ログアウトする', async () => {
            await HotelLoginPage.navMenuButton.click();
            await HotelLoginPage.logoutButton.waitForDisplayed({ timeout: 5000 });
            await HotelLoginPage.logoutButton.click();
            await browser.waitUntil(
                async () => (await browser.getUrl()).includes('index.html'),
                { timeout: 10000 }
            );
            await HotelLoginPage.takeScreenshot('4_トップページ（ログアウト後）');
        });
    });

    it('メールアドレスが空のままログインするとエラーが表示される', async () => {
        await step('トップページにアクセスする', async () => {
            await HotelLoginPage.openTopPage();
            await HotelLoginPage.takeScreenshot('1_トップページ');
        });

        await step('ナビメニューからログインページへ移動する', async () => {
            await HotelLoginPage.navMenuButton.click();
            await HotelLoginPage.loginLink.waitForDisplayed({ timeout: 5000 });
            await HotelLoginPage.loginLink.click();
            await HotelLoginPage.email.waitForDisplayed({ timeout: 10000 });
            await HotelLoginPage.takeScreenshot('2_ログインページ');
        });

        await step('メールアドレスを空にしてログインを試みる', async () => {
            await HotelLoginPage.login({ email: '', password: 'pa55w0rd!' });
            await HotelLoginPage.takeScreenshot('3_エラー表示');
        });

        await step('メールアドレスのエラーメッセージを確認する', async () => {
            await expect(HotelLoginPage.emailError).toBeDisplayed();
        });
    });

    it('パスワードが空のままログインするとエラーが表示される', async () => {
        await step('トップページにアクセスする', async () => {
            await HotelLoginPage.openTopPage();
            await HotelLoginPage.takeScreenshot('1_トップページ');
        });

        await step('ナビメニューからログインページへ移動する', async () => {
            await HotelLoginPage.navMenuButton.click();
            await HotelLoginPage.loginLink.waitForDisplayed({ timeout: 5000 });
            await HotelLoginPage.loginLink.click();
            await HotelLoginPage.email.waitForDisplayed({ timeout: 10000 });
            await HotelLoginPage.takeScreenshot('2_ログインページ');
        });

        await step('パスワードを空にしてログインを試みる', async () => {
            await HotelLoginPage.login({ email: 'jun@example.com', password: '' });
            await HotelLoginPage.takeScreenshot('3_エラー表示');
        });

        await step('パスワードのエラーメッセージを確認する', async () => {
            await expect(HotelLoginPage.passwordError).toBeDisplayed();
        });
    });
});
