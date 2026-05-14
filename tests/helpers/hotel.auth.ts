import HotelLoginPage from '../pageobjects/hotel.login.page.js';

export type HotelCredentials = {
    email: string;
    password: string;
};

export const PREMIUM_USER: HotelCredentials = {
    email: 'jun@example.com',
    password: 'pa55w0rd!',
};

export async function loginAs(credentials: HotelCredentials): Promise<void> {
    await HotelLoginPage.open();
    await HotelLoginPage.login(credentials);
    await browser.waitUntil(
        async () => (await browser.getUrl()).includes('mypage.html'),
        { timeout: 10000 },
    );
}

export async function logout(): Promise<void> {
    await HotelLoginPage.navMenuButton.click();
    await HotelLoginPage.logoutButton.waitForDisplayed({ timeout: 5000 });
    await HotelLoginPage.logoutButton.click();
    await browser.waitUntil(
        async () => (await browser.getUrl()).includes('index.html'),
        { timeout: 10000 },
    );
}
