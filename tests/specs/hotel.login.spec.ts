import HotelLoginPage from '../pageobjects/hotel.login.page.js';

describe('ホテルサイト ログイン', () => {
    it('正しい認証情報でログインするとマイページに遷移する', async () => {
        // 1. トップページにアクセス
        await HotelLoginPage.openTopPage();

        // 2. スクリーンショット
        await HotelLoginPage.takeScreenshot('1_トップページ');

        // 3. ヘッダーのナビメニューを開く
        await HotelLoginPage.navMenuButton.click();

        // 4. ログインリンクを押下
        await HotelLoginPage.loginLink.waitForDisplayed({ timeout: 5000 });
        await HotelLoginPage.loginLink.click();

        // ログインフォームが表示されるまで待機
        await HotelLoginPage.email.waitForDisplayed({ timeout: 10000 });

        // 5. スクリーンショット
        await HotelLoginPage.takeScreenshot('2_ログインページ');

        // 6-8. メールアドレス・パスワードを入力してログイン
        await HotelLoginPage.login({ email: 'jun@example.com', password: 'pa55w0rd!' });

        // マイページへの遷移を待機
        await browser.waitUntil(
            async () => (await browser.getUrl()).includes('mypage.html'),
            { timeout: 10000 }
        );

        // 9. スクリーンショット
        await HotelLoginPage.takeScreenshot('3_マイページ');

        // 10. ヘッダーのナビメニューを開く
        await HotelLoginPage.navMenuButton.click();

        // 11. ログアウトボタンを押下
        await HotelLoginPage.logoutButton.waitForDisplayed({ timeout: 5000 });
        await HotelLoginPage.logoutButton.click();

        // トップページへの遷移を待機
        await browser.waitUntil(
            async () => (await browser.getUrl()).includes('index.html'),
            { timeout: 10000 }
        );

        // 12. スクリーンショット
        await HotelLoginPage.takeScreenshot('4_トップページ（ログアウト後）');
    });

    it('メールアドレスが空のままログインするとエラーが表示される', async () => {
        // 1. トップページにアクセス
        await HotelLoginPage.openTopPage();

        // 2. スクリーンショット
        await HotelLoginPage.takeScreenshot('1_トップページ');

        // 3. ヘッダーのナビメニューを開く
        await HotelLoginPage.navMenuButton.click();

        // 4. ログインリンクを押下
        await HotelLoginPage.loginLink.waitForDisplayed({ timeout: 5000 });
        await HotelLoginPage.loginLink.click();

        // ログインフォームが表示されるまで待機
        await HotelLoginPage.email.waitForDisplayed({ timeout: 10000 });

        // 5. スクリーンショット
        await HotelLoginPage.takeScreenshot('2_ログインページ');

        // 6-7. パスワードのみ入力してログイン（メールアドレスは空）
        await HotelLoginPage.login({ email: '', password: 'pa55w0rd!' });

        // 8. スクリーンショット
        await HotelLoginPage.takeScreenshot('3_エラー表示');

        await expect(HotelLoginPage.emailError).toBeDisplayed();
    });

    it('パスワードが空のままログインするとエラーが表示される', async () => {
        await HotelLoginPage.open();
        await HotelLoginPage.login({ email: 'jun@example.com', password: '' });
        await expect(HotelLoginPage.passwordError).toBeDisplayed();
    });
});
