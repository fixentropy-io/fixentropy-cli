import { afterEach, describe, expect, spyOn, test, mock, jest, beforeEach } from 'bun:test';
import { unlinkSync } from 'node:fs';
import fs from 'node:fs';
import * as getUpdatesByEmailHandler from '../src/commands/get-updates-by-email.handler';
import promptly from 'promptly';
import { config } from '../src/cli.config';

const EMAIL_OPTIN_CONFIG_FILE_PATH = config.emailOptinConfigFile;

const originalConsole = console;

beforeEach(() => {
    // @ts-expect-error for test purpose
    // biome-ignore lint/suspicious/noGlobalAssign: for test purpose
    console = {
        log: jest.fn(),
        error: console.error
    };
});

afterEach(() => {
    if (fs.existsSync(EMAIL_OPTIN_CONFIG_FILE_PATH)) {
        // Delete email optin config file
        unlinkSync(EMAIL_OPTIN_CONFIG_FILE_PATH);
        // biome-ignore lint/suspicious/noGlobalAssign: for test purpose
        console = originalConsole;
    }
});

const TEST_EMAIL = 'test@email.test';

describe('Given the user opted in to updates by email, it should', () => {
    test('store user inputs', async () => {
        spyOn(promptly, 'choose').mockResolvedValueOnce('yes');
        spyOn(promptly, 'prompt').mockResolvedValueOnce(TEST_EMAIL);
        spyOn(getUpdatesByEmailHandler, 'storeEmailRemotely').mockResolvedValueOnce({
            ok: true
        } as unknown as Awaited<ReturnType<typeof getUpdatesByEmailHandler.storeEmailRemotely>>);

        await getUpdatesByEmailHandler.getUpdatesByEmailHandler();
        const emailOptinConfig = await Bun.file(EMAIL_OPTIN_CONFIG_FILE_PATH).json();

        expect(emailOptinConfig.email).toBe(TEST_EMAIL);
        expect(emailOptinConfig.choiceHasBeenMade).toBeTrue();
        expect(emailOptinConfig.optinChoice).toBeTrue();
    });

    test('store user email in remote service', async () => {
        spyOn(promptly, 'choose').mockResolvedValueOnce('yes');
        spyOn(promptly, 'prompt').mockResolvedValueOnce(TEST_EMAIL);

        const storeEmailRemotelyMock = jest.fn().mockResolvedValue({ ok: true });
        spyOn(getUpdatesByEmailHandler, 'storeEmailRemotely').mockImplementation(
            storeEmailRemotelyMock
        );

        await getUpdatesByEmailHandler.getUpdatesByEmailHandler();

        expect(storeEmailRemotelyMock).toHaveBeenNthCalledWith(1, TEST_EMAIL);
    });
});

describe('Given the user opted out to updates by email, it should', () => {
    test('store user inputs', async () => {
        spyOn(promptly, 'choose').mockResolvedValueOnce('no');
        spyOn(getUpdatesByEmailHandler, 'storeEmailRemotely').mockResolvedValueOnce({
            ok: true
        } as unknown as Awaited<ReturnType<typeof getUpdatesByEmailHandler.storeEmailRemotely>>);

        await getUpdatesByEmailHandler.getUpdatesByEmailHandler();
        const emailOptinConfig = await Bun.file(EMAIL_OPTIN_CONFIG_FILE_PATH).json();

        expect(emailOptinConfig.email).toBe('');
        expect(emailOptinConfig.choiceHasBeenMade).toBeTrue();
        expect(emailOptinConfig.optinChoice).toBeFalse();
    });

    test('not store user email in remote service', async () => {
        spyOn(promptly, 'choose').mockResolvedValueOnce('no');

        const storeEmailRemotelyMock = jest.fn();
        spyOn(getUpdatesByEmailHandler, 'storeEmailRemotely').mockImplementation(
            storeEmailRemotelyMock
        );

        await getUpdatesByEmailHandler.getUpdatesByEmailHandler();

        expect(storeEmailRemotelyMock).not.toHaveBeenCalled();
    });
});
