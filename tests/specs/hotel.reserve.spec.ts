import { loginAs, logout, PREMIUM_USER } from '../helpers/hotel.auth.js';
import { step } from '../helpers/step.js';
import HotelReservePage, { type ReserveInput } from '../pageobjects/hotel.reserve.page.js';

const b = (v: boolean) => v ? 'あり' : 'なし';
const makeName = (tc: ReserveInput) =>
    `連絡:${tc.contact} / 朝食:${b(tc.breakfast)} / 昼IN:${b(tc.lateCheckIn)} / 観光:${b(tc.sightseeing)} / ${tc.nights}泊 / ${tc.guests}名 / 要望:${b(!!tc.note)}`;

const TEST_CASES: ReserveInput[] = [
    // TC1: 希望しない / 朝食:なし / 昼IN:なし / 観光:なし / 1泊 / 1名 / 要望:なし
    { contact: '希望しない',      breakfast: false, lateCheckIn: false, sightseeing: false, nights: 1, guests: 1, note: '' },
    // TC2: 希望しない / 朝食:あり / 昼IN:あり / 観光:あり / 3泊 / 3名 / 要望:あり
    { contact: '希望しない',      breakfast: true,  lateCheckIn: true,  sightseeing: true,  nights: 3, guests: 3, note: 'テスト要望' },
    // TC3: メール / 朝食:あり / 昼IN:なし / 観光:なし / 3泊 / 1名 / 要望:あり
    { contact: 'メールでのご連絡', breakfast: true,  lateCheckIn: false, sightseeing: false, nights: 3, guests: 1, note: 'テスト要望' },
    // TC4: メール / 朝食:なし / 昼IN:あり / 観光:あり / 1泊 / 3名 / 要望:なし
    { contact: 'メールでのご連絡', breakfast: false, lateCheckIn: true,  sightseeing: true,  nights: 1, guests: 3, note: '' },
    // TC5: 電話 / 朝食:あり / 昼IN:あり / 観光:なし / 1泊 / 1名 / 要望:あり
    { contact: '電話でのご連絡',   breakfast: true,  lateCheckIn: true,  sightseeing: false, nights: 1, guests: 1, note: 'テスト要望' },
    // TC6: 電話 / 朝食:なし / 昼IN:なし / 観光:あり / 3泊 / 3名 / 要望:なし
    { contact: '電話でのご連絡',   breakfast: false, lateCheckIn: false, sightseeing: true,  nights: 3, guests: 3, note: '' },
    // TC7: 希望しない / 朝食:なし / 昼IN:あり / 観光:あり / 3泊 / 1名 / 要望:なし
    { contact: '希望しない',      breakfast: false, lateCheckIn: true,  sightseeing: true,  nights: 3, guests: 1, note: '' },
    // TC8: メール / 朝食:あり / 昼IN:あり / 観光:なし / 3泊 / 3名 / 要望:なし
    { contact: 'メールでのご連絡', breakfast: true,  lateCheckIn: true,  sightseeing: false, nights: 3, guests: 3, note: '' },
    // TC9: 電話 / 朝食:なし / 昼IN:あり / 観光:あり / 1泊 / 3名 / 要望:あり
    { contact: '電話でのご連絡',   breakfast: false, lateCheckIn: true,  sightseeing: true,  nights: 1, guests: 3, note: 'テスト要望' },
];

describe('宿泊予約 プレミアムログイン', () => {
    before(async () => {
        await loginAs(PREMIUM_USER);
        await HotelReservePage.navigateToPlans();
        await HotelReservePage.takeScreenshot('宿泊予約ページ');
    });

    after(async () => {
        await logout();
    });

    for (const tc of TEST_CASES) {
        it(makeName(tc), async () => {
            await step('予約フォームを開く', async () => {
                await HotelReservePage.openReserveForm();
                await HotelReservePage.takeScreenshot('1_予約フォーム');
            });

            await step('フォームを入力する', async () => {
                await HotelReservePage.fillForm(tc);
                await HotelReservePage.takeScreenshot('2_入力後');
            });

            await step('予約を確定する', async () => {
                await HotelReservePage.confirmReservation();
                await HotelReservePage.takeScreenshot('3_確認画面');
            });

            await step('完了モーダルを閉じる', async () => {
                await HotelReservePage.closeModal();
                await HotelReservePage.takeScreenshot('4_宿泊予約ページ（完了後）');
            });
        });
    }
});
