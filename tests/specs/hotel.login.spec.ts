import HotelLoginPage from '../pageobjects/hotel.login.page.js';
import { loginAs, logout, PREMIUM_USER } from '../helpers/hotel.auth.js';
import { step } from '../helpers/step.js';

describe('ホテルサイト ログイン', () => {
    it('正しい認証情報でログインするとマイページに遷移する', async () => {
        await step('ログインする', async () => {
            await loginAs(PREMIUM_USER);
            await HotelLoginPage.takeScreenshot('1_マイページ');
        });

        await step('ログアウトする', async () => {
            await logout();
            await HotelLoginPage.takeScreenshot('2_トップページ（ログアウト後）');
        });
    });

    it('メールアドレスが空のままログインするとエラーが表示される', async () => {
        await step('ログインページを開く', async () => {
            await HotelLoginPage.open();
            await HotelLoginPage.takeScreenshot('1_ログインページ');
        });

        await step('メールアドレスを空にしてログインを試みる', async () => {
            await HotelLoginPage.login({ email: '', password: PREMIUM_USER.password });
            await HotelLoginPage.takeScreenshot('2_エラー表示');
        });

        await step('メールアドレスのエラーメッセージを確認する', async () => {
            await expect(HotelLoginPage.emailError).toBeDisplayed();
        });
    });

    it('パスワードが空のままログインするとエラーが表示される', async () => {
        await step('ログインページを開く', async () => {
            await HotelLoginPage.open();
            await HotelLoginPage.takeScreenshot('1_ログインページ');
        });

        await step('パスワードを空にしてログインを試みる', async () => {
            await HotelLoginPage.login({ email: PREMIUM_USER.email, password: '' });
            await HotelLoginPage.takeScreenshot('2_エラー表示');
        });

        await step('パスワードのエラーメッセージを確認する', async () => {
            await expect(HotelLoginPage.passwordError).toBeDisplayed();
        });
    });
});
