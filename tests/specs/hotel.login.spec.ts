import HotelLoginPage from '../pageobjects/hotel.login.page.js';

describe('ホテルサイト ログイン', () => {
it('正しい認証情報でログインするとマイページに遷移する', async () => {
        await HotelLoginPage.open();
        await HotelLoginPage.login({ email: 'ichiro@example.com', password: 'password' });
        await expect(browser).toHaveUrl(expect.stringContaining('mypage.html'));
    });

    it('メールアドレスが空のままログインするとエラーが表示される', async () => {
        await HotelLoginPage.open();
        await HotelLoginPage.login({ email: '', password: 'password' });
        await expect(HotelLoginPage.emailError).toBeDisplayed();
    });

    it('パスワードが空のままログインするとエラーが表示される', async () => {
        await HotelLoginPage.open();
        await HotelLoginPage.login({ email: 'ichiro@example.com', password: '' });
        await expect(HotelLoginPage.passwordError).toBeDisplayed();
    });
});
