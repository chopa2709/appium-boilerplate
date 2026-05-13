import https from 'node:https';
import { readFileSync } from 'node:fs';

interface RtkDevice {
    deviceId: string;
    productName: string;
    os: 'IOS' | 'ANDROID';
    osVersion: string;
    isAvailable: boolean;
}

export interface RtkDeviceServiceOptions {
    username: string;
    accessToken: string;
    baseUrl: string;
    os: 'IOS' | 'ANDROID';
    priorityFile: string;
}

export class RtkDeviceService {
    private username: string;
    private accessToken: string;
    private baseUrl: string;
    private os: 'IOS' | 'ANDROID';
    private priorityList: string[];
    private rentedDeviceId: string | null = null;

    constructor (options: RtkDeviceServiceOptions) {
        this.username = options.username;
        this.accessToken = options.accessToken;
        this.baseUrl = options.baseUrl;
        this.os = options.os;
        this.priorityList = JSON.parse(readFileSync(options.priorityFile, 'utf8'));
    }

    private apiRequest (path: string, method = 'GET'): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const auth = Buffer.from(`${this.username}:${this.accessToken}`).toString('base64');
            const url = new URL(path, this.baseUrl);
            const req = https.request({
                hostname: url.hostname,
                path: url.pathname,
                method,
                headers: { Authorization: `Basic ${auth}` },
                rejectUnauthorized: false,
            }, (res) => {
                let data = '';
                res.on('data', (chunk: string) => data += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch { resolve(data); }
                });
            });
            req.on('error', reject);
            req.end();
        });
    }

    async onPrepare (_config: WebdriverIO.Config, capabilities: WebdriverIO.Capabilities[]) {
        const devices = await this.apiRequest('/devices') as RtkDevice[];
        const available = devices.filter(d => d.os === this.os && d.isAvailable);

        let target: RtkDevice | undefined;
        for (const name of this.priorityList) {
            target = available.find(d => d.productName === name);
            if (target) break;
        }

        if (!target) {
            const names = this.priorityList.join(', ');
            throw new Error(`[RTK] 利用可能な ${this.os} 端末が見つかりません。優先リスト: ${names}`);
        }

        await this.apiRequest(`/devices/${target.deviceId}/rental`, 'POST');
        this.rentedDeviceId = target.deviceId;
        console.log(`[RTK] レンタル: ${target.productName} iOS ${target.osVersion} (${target.deviceId})`);

        for (const cap of capabilities) {
            (cap as Record<string, unknown>)['appium:deviceName'] = target.productName;
            (cap as Record<string, unknown>)['appium:platformVersion'] = target.osVersion;
            (cap as Record<string, unknown>)['appium:udid'] = target.deviceId;
        }
    }

    async onComplete () {
        if (this.rentedDeviceId) {
            await this.apiRequest(`/devices/${this.rentedDeviceId}/rental`, 'DELETE');
            console.log(`[RTK] 返却: ${this.rentedDeviceId}`);
            this.rentedDeviceId = null;
        }
    }
}
