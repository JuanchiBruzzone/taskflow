describe('WDIO Native Demo App - Login', () => {
    const loginTab = '~Login';
    const homeTab = '~Home';

    const emailField = '~input-email';
    const passwordField = '~input-password';
    const loginButton = '~button-LOGIN';

    const emailError =
        'android=new UiSelector().text("Please enter a valid email address")';

    const passwordError =
        'android=new UiSelector().text("Please enter at least 8 characters")';

    async function hideKeyboardIfOpen() {
        try {
            await browser.hideKeyboard();
        } catch {
            // keyboard not open
        }
    }

    async function closePopupIfShown() {
        try {
            await browser.acceptAlert();
            return;
        } catch {
            // no native alert
        }

        const okButtons = await $$(
            'android=new UiSelector().textMatches("OK|OKAY|Okay|Ok|ok")'
        );

        if (okButtons.length > 0) {
            await okButtons[0].click();
        }
    }

    async function goToLoginScreen() {
        await browser.pause(1000);

        await closePopupIfShown();

        let login = await $(loginTab);

        if (!(await login.isExisting())) {
            login = await $('android=new UiSelector().text("Login")');
        }

        await login.waitForDisplayed({ timeout: 15000 });
        await login.click();

        const email = await $(emailField);
        await email.waitForDisplayed({ timeout: 15000 });
    }

    async function clearAndType(selector: string, value: string) {
        const element = await $(selector);
        await element.waitForDisplayed({ timeout: 10000 });
        await element.click();
        await element.clearValue();
        await element.setValue(value);
        await hideKeyboardIfOpen();
    }

    async function fillLoginForm(emailValue: string, passwordValue: string) {
        await clearAndType(emailField, emailValue);
        await clearAndType(passwordField, passwordValue);
    }

    beforeEach(async () => {
        await goToLoginScreen();
    });

    it('dado formato válido, navega a la pantalla Home', async () => {
        await fillLoginForm('test@taskflow.com', 'Password123!');

        const button = await $(loginButton);
        await button.waitForDisplayed({ timeout: 10000 });
        await button.click();

        await closePopupIfShown();

        const home = await $(homeTab);
        await home.waitForDisplayed({ timeout: 10000 });

        await expect(home).toBeDisplayed();
    });

    it('dado email con formato inválido, muestra mensaje de error', async () => {
        await fillLoginForm('esto-no-es-un-email', 'Password123!');

        const button = await $(loginButton);
        await button.waitForDisplayed({ timeout: 10000 });
        await button.click();

        const errorMsg = await $(emailError);
        await errorMsg.waitForDisplayed({ timeout: 10000 });

        await expect(errorMsg).toBeDisplayed();
    });

    it('dado password menor a 8 caracteres, muestra mensaje de error', async () => {
        await fillLoginForm('test@taskflow.com', 'corta');

        const button = await $(loginButton);
        await button.waitForDisplayed({ timeout: 10000 });
        await button.click();

        const errorMsg = await $(passwordError);
        await errorMsg.waitForDisplayed({ timeout: 10000 });

        await expect(errorMsg).toBeDisplayed();
    });
});