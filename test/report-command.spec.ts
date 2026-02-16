import {
    HtmlReportBuilder,
    JsonReportBuilder,
    MarkdownReportBuilder
} from '@dragee-io/report-generator';
import type { Report } from '@fixentropy-io/type/asserter';
import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { existsSync, unlinkSync } from 'node:fs';
import * as newsletterSubscriptionHandler from '../src/commands/newsletter-subscription.handler.ts';
import * as reportCommanderHandler from '../src/commands/report-command.handler.ts';
import * as reportCommandhandler from '../src/commands/report-command.handler.ts';
import { buildReports } from '../src/commands/report-command.handler.ts';

const testResultFile = 'test/result';

afterEach(() => {
    if (existsSync(testResultFile)) {
        // Delete test files
        unlinkSync(`${testResultFile}.json`);
        unlinkSync(`${testResultFile}.html`);
        unlinkSync(`${testResultFile}.md`);
    }
});

describe('Should display correct reporting format', () => {
    test('Format with one report', async () => {
        const jsonReportBuilderMock = spyOn(JsonReportBuilder, 'buildReports');
        const htmlReportBuilderMock = spyOn(HtmlReportBuilder, 'buildReports');
        const markdownReportBuilderMock = spyOn(MarkdownReportBuilder, 'buildReports');

        const reports: Report[] = [
            {
                errors: [
                    {
                        drageeName: 'io.dragee.rules.relation.DrageeOne',
                        message: 'This aggregate must at least contain a "ddd/entity" type dragee',
                        ruleId: 'ddd/aggregates-allowed-dependencies'
                    },
                    {
                        drageeName: 'io.dragee.rules.relation.DrageeTwo',
                        message: 'This aggregate must at least contain a "ddd/entity" type dragee',
                        ruleId: 'ddd/aggregates-allowed-dependencies'
                    }
                ],
                namespace: 'ddd',
                pass: true,
                stats: {
                    rulesCount: 7,
                    errorsCount: 2,
                    passCount: 5
                }
            },
            {
                errors: [
                    {
                        drageeName: 'DrageeTestError',
                        message: 'Test error',
                        ruleId: 'test-error'
                    }
                ],
                namespace: 'test',
                pass: true,
                stats: {
                    rulesCount: 5,
                    errorsCount: 1,
                    passCount: 4
                }
            }
        ];
        buildReports(reports, testResultFile);

        expect(jsonReportBuilderMock).toBeCalled();
        expect(jsonReportBuilderMock).toBeCalledWith(reports, testResultFile);
        expect(htmlReportBuilderMock).toBeCalled();
        expect(htmlReportBuilderMock).toBeCalledWith(reports, testResultFile);
        expect(markdownReportBuilderMock).toBeCalled();
        expect(markdownReportBuilderMock).toBeCalledWith(reports, testResultFile);
    });
});

describe('Given a user running the command for the first time', () => {
    test("it should ask him to get project's updates", async () => {
        const getUpdatesByEmailHandlerMock = spyOn(
            newsletterSubscriptionHandler,
            'getIfOptinChoiceHasBeenMade'
        ).mockReturnValueOnce(false);
        const askForEmailMock = spyOn(
            newsletterSubscriptionHandler,
            'subscribeToNewsletterHandler'
        );

        const reportCommanderHandlerMock = spyOn(
            reportCommanderHandler,
            'buildReports'
        ).mockImplementation(() => {});

        await reportCommandhandler.reportCommandhandler({ fromDir: '', toDir: '' });

        expect(askForEmailMock).toHaveBeenCalledTimes(1);

        getUpdatesByEmailHandlerMock.mockClear();
        reportCommanderHandlerMock.mockClear();
        askForEmailMock.mockClear();
    });
});

describe('Given a user not running the command for the first time', () => {
    beforeEach(() => {
        newsletterSubscriptionHandler.checkConfigFile();
    });

    test("it should not ask him to get project's updates", async () => {
        const getUpdatesByEmailHandlerMock = spyOn(
            newsletterSubscriptionHandler,
            'getIfOptinChoiceHasBeenMade'
        ).mockReturnValueOnce(true);
        const reportCommanderHandlerMock = spyOn(
            reportCommanderHandler,
            'buildReports'
        ).mockImplementation(() => {});
        const askForEmailMock = spyOn(
            newsletterSubscriptionHandler,
            'subscribeToNewsletterHandler'
        );

        await reportCommandhandler.reportCommandhandler({ fromDir: '', toDir: '' });
        expect(askForEmailMock).not.toHaveBeenCalled();

        getUpdatesByEmailHandlerMock.mockClear();
        askForEmailMock.mockClear();
        reportCommanderHandlerMock.mockClear();
    });
});
