import AllureReporter from '@wdio/allure-reporter';
import sharp from 'sharp';
import Page from './page.js';

class HotelLoginPage extends Page {
    // ログインフォーム
    get email () { return $('#email'); }
    get password () { return $('#password'); }
    get loginButton () { return $('//button[text()="ログイン"]'); }
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
            await driver.hideKeyboard();
        }
        await this.loginButton.click();
    }

    async takeScreenshot (name: string) {
        const screenshot = await browser.takeScreenshot();
        const original = Buffer.from(screenshot, 'base64');
        const { width, height } = await sharp(original).metadata();
        const resized = await sharp(original)
            .resize(Math.round(width! / 2), Math.round(height! / 2))
            .toBuffer();
        AllureReporter.addAttachment(name, resized, 'image/png');
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
