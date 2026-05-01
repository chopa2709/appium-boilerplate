import Page from './page.js';

class HotelLoginPage extends Page {
    get email () { return $('#email'); }
    get password () { return $('#password'); }
    get loginButton () { return $('#login-button'); }
    get emailError () { return $('#email-message'); }
    get passwordError () { return $('#password-message'); }

    async login ({ email, password }: { email: string; password: string }) {
        await this.email.setValue(email);
        await this.password.setValue(password);
        if (driver.isMobile) {
            await $('h2').click();
        }
        await this.loginButton.click();
    }

    async open (): Promise<string> {
        // ドメインに遷移してから全ストレージをクリアし、ログイン済み状態をリセット
        await super.open('index.html');
        await browser.execute(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await browser.deleteCookies();
        await super.open('login.html');
        await this.email.waitForDisplayed({ timeout: 15000 });
        return browser.getUrl();
    }
}

export default new HotelLoginPage();
