import AllureReporter from '@wdio/allure-reporter';
import Page from './page.js';

class HotelLoginPage extends Page {
    // ログインフォーム
    get email () { return $('#email'); }
    get password () { return $('#password'); }
    get loginButton () { return $('#login-button'); }
    get emailError () { return $('#email-message'); }
    get passwordError () { return $('#password-message'); }

    // ナビゲーション
    get navMenuButton () { return $('/html/body/nav/button'); }
    get loginLink () { return $('//*[@id="login-holder"]/a'); }
    get logoutButton () { return $('//*[@id="logout-form"]/button'); }

    async login ({ email, password }: { email: string; password: string }) {
        await this.email.setValue(email);
        await this.password.setValue(password);
        if (driver.isMobile) {
            await $('h2').click();
        }
        await this.loginButton.click();
    }

    async takeScreenshot (name: string) {
        const screenshot = await browser.takeScreenshot();
        AllureReporter.addAttachment(name, Buffer.from(screenshot, 'base64'), 'image/png');
    }

    private async clearSession () {
        await browser.execute(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    }

    async openTopPage (): Promise<string> {
        await super.open('index.html');
        await this.clearSession();
        await super.open('index.html');
        await this.navMenuButton.waitForDisplayed({ timeout: 10000 });
        return browser.getUrl();
    }

    async open (): Promise<string> {
        await super.open('index.html');
        await this.clearSession();
        await super.open('login.html');
        await this.email.waitForDisplayed({ timeout: 15000 });
        return browser.getUrl();
    }
}

export default new HotelLoginPage();
