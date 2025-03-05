import promptly from 'promptly';
import fs from 'node:fs';
import { config } from '../cli.config';

const MAX_EMAIL_RETRIES = 2;
const EMAIL_OPTIN_CONFIG_FILE_PATH = config.emailOptinConfigFile;

type OptinChoicePolicy = {
    email: string;
    optinChoice: boolean | undefined;
    choiceHasBeenMade: boolean;
};

type GetUpdatesByEmailHandlerArgs = { askAgain: boolean };

const DEFAULT_OPTIN_CHOICE: OptinChoicePolicy = {
    email: '',
    optinChoice: undefined,
    choiceHasBeenMade: false
};

const emailValidator = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(value);
    if (!isValidEmail) {
        throw new Error('invalid email');
    }

    return value;
};

const askForEmail = async (currentNumberOfTries: number): Promise<string | undefined> => {
    try {
        const email = await promptly.prompt("What's your email?", {
            validator: emailValidator,
            retry: false,
            trim: true
        });
        return email;
    } catch (err) {
        console.warn('It seems the email you entered is not valid.');
        if (currentNumberOfTries < MAX_EMAIL_RETRIES) {
            return await askForEmail(currentNumberOfTries + 1);
        }
        throw new Error('Max number of retries reached');
    }
};

export const storeEmailRemotely = async (email: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        return { ok: true, json: () => '', status: 200 };
    }
    try {
        return await fetch('https://dragee-serverless-functions.vercel.app/api/newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email
            })
        });
    } catch (error) {}
};

const storeEmailOptinChoice = async ({
    email,
    choiceHasBeenMade,
    optinChoice
}: OptinChoicePolicy) => {
    try {
        const config = JSON.parse(fs.readFileSync(EMAIL_OPTIN_CONFIG_FILE_PATH, 'utf-8'));
        if (email) {
            config.email = email;
            const res = await storeEmailRemotely(email);
            if (!res?.ok) {
                const body = await res?.json();
                throw new Error(`${res?.status}, ${body}`);
            }
        }
        config.optinChoice = optinChoice;
        config.choiceHasBeenMade = choiceHasBeenMade;
        fs.writeFileSync(EMAIL_OPTIN_CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Failed to save email to config file:', error);
    }
};

export const checkConfigFile = () => {
    if (!fs.existsSync(EMAIL_OPTIN_CONFIG_FILE_PATH)) {
        try {
            fs.writeFileSync(
                EMAIL_OPTIN_CONFIG_FILE_PATH,
                JSON.stringify(DEFAULT_OPTIN_CHOICE, null, 2)
            );
        } catch (error) {
            console.error('Failed to get optin config file', error);
        }
    }
};

export const getIfOptinChoiceHasBeenMade = (): boolean | undefined => {
    try {
        checkConfigFile();
        const config = JSON.parse(
            fs.readFileSync(EMAIL_OPTIN_CONFIG_FILE_PATH, 'utf-8')
        ) as OptinChoicePolicy;
        return config.choiceHasBeenMade;
    } catch (error) {
        console.error('Failed to read config file:', error);
        throw new Error('Failed to read config file');
    }
};

const askForUserOptinPolicy = async () => {
    const choice = await promptly.choose(
        'Would you like to be updated when new features are shipped? (y/n)',
        ['yes', 'no', 'y', 'n'],
        { default: 'n' }
    );

    if (!choice || (choice !== 'yes' && choice !== 'y')) {
        await storeEmailOptinChoice({
            choiceHasBeenMade: true,
            email: '',
            optinChoice: false
        });

        console.info('No worries! In case you change your mind, check our website');
        return;
    }
    try {
        const userEmail = await askForEmail(1);
        if (userEmail) {
            await storeEmailOptinChoice({
                choiceHasBeenMade: true,
                email: userEmail,
                optinChoice: true
            });

            console.log(
                `
                Thanks ${userEmail} 💌! We'll keep you updated on new features and updates.`
            );
        }
    } catch (error) {
        console.error('We are sorry, but we could not process your email.');
    }
};

export const subscribeToNewsletterHandler = async (args?: GetUpdatesByEmailHandlerArgs) => {
    const optinChoiceHasBeenMade = await getIfOptinChoiceHasBeenMade();

    const shouldNotAskAgainUser = optinChoiceHasBeenMade && !args?.askAgain;

    if (shouldNotAskAgainUser) {
        return;
    }

    try {
        await askForUserOptinPolicy();
    } catch (error) {
        // handle process force quit
    }
};
