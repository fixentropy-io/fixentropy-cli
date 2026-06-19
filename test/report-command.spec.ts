import {
	HtmlReportBuilder,
	JsonReportBuilder,
	MarkdownReportBuilder,
} from "@fixentropy-io/report-generator";
import type { Report, ReportStats } from "@fixentropy-io/type/asserter";
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { existsSync, unlinkSync } from "node:fs";
import * as newsletterSubscriptionHandler from "../src/commands/newsletter-subscription.handler.ts";
import * as reportCommandhandler from "../src/commands/report-command.handler.ts";
import {
	buildReports,
	calculatePassRate,
	publishReports,
} from "../src/commands/report-command.handler.ts";

const testResultFile = "test/result";

afterEach(() => {
	if (existsSync(testResultFile)) {
		// Delete test files
		unlinkSync(`${testResultFile}.json`);
		unlinkSync(`${testResultFile}.html`);
		unlinkSync(`${testResultFile}.md`);
	}
});

describe("Should display correct reporting format", () => {
	test("Format with one report", async () => {
		const jsonReportBuilderMock = spyOn(JsonReportBuilder, "buildReports");
		const htmlReportBuilderMock = spyOn(HtmlReportBuilder, "buildReports");
		const markdownReportBuilderMock = spyOn(
			MarkdownReportBuilder,
			"buildReports",
		);

		const reports: Report[] = [
			{
				errors: [
					{
						drageeName: "io.dragee.rules.relation.DrageeOne",
						message:
							'This aggregate must at least contain a "ddd/entity" type dragee',
						ruleId: "ddd/aggregates-allowed-dependencies",
					},
					{
						drageeName: "io.dragee.rules.relation.DrageeTwo",
						message:
							'This aggregate must at least contain a "ddd/entity" type dragee',
						ruleId: "ddd/aggregates-allowed-dependencies",
					},
				],
				namespace: "ddd",
				pass: true,
				stats: {
					rulesCount: 7,
					errorsCount: 2,
					passCount: 5,
				},
			},
			{
				errors: [
					{
						drageeName: "DrageeTestError",
						message: "Test error",
						ruleId: "test-error",
					},
				],
				namespace: "test",
				pass: true,
				stats: {
					rulesCount: 5,
					errorsCount: 1,
					passCount: 4,
				},
			},
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

describe("calculatePassRate", () => {
	test("returns the passes over total evaluations across reports", () => {
		const stats: ReportStats[] = [
			{ rulesCount: 7, errorsCount: 2, passCount: 5 },
			{ rulesCount: 5, errorsCount: 1, passCount: 4 },
		];

		expect(calculatePassRate(stats)).toBe(9 / 12);
	});

	test("returns 1 when every evaluation passes", () => {
		const stats: ReportStats[] = [
			{ rulesCount: 4, errorsCount: 0, passCount: 4 },
		];

		expect(calculatePassRate(stats)).toBe(1);
	});

	test("returns 0 when every evaluation fails", () => {
		const stats: ReportStats[] = [
			{ rulesCount: 4, errorsCount: 4, passCount: 0 },
		];

		expect(calculatePassRate(stats)).toBe(0);
	});

	test("returns null when there are no evaluations", () => {
		expect(calculatePassRate([])).toBeNull();
		expect(
			calculatePassRate([{ rulesCount: 3, errorsCount: 0, passCount: 0 }]),
		).toBeNull();
	});
});

describe("publishReports", () => {
	const reports: Report[] = [
		{
			errors: [{ drageeName: "DrageeOne", message: "boom", ruleId: "rule-a" }],
			namespace: "ddd",
			pass: false,
			stats: { rulesCount: 7, errorsCount: 2, passCount: 5 },
		},
		{
			errors: [{ drageeName: "DrageeTwo", message: "boom", ruleId: "rule-b" }],
			namespace: "test",
			pass: false,
			stats: { rulesCount: 5, errorsCount: 1, passCount: 4 },
		},
	];

	test("sends the pass rate under the score key in the request body", async () => {
		const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(null, { status: 200 }),
		);

		await publishReports("https://backend.test", randomUUID(), reports);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe("https://backend.test/scans/report");

		const body = JSON.parse(options?.body as string);
		expect(body.score).toBe(9 / 12);

		fetchMock.mockRestore();
	});

	test("sends score as null when there are no evaluations", async () => {
		const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(null, { status: 200 }),
		);

		await publishReports("https://backend.test", randomUUID(), [
			{
				errors: [],
				namespace: "empty",
				pass: true,
				stats: { rulesCount: 0, errorsCount: 0, passCount: 0 },
			},
		]);

		const [, options] = fetchMock.mock.calls[0];
		const body = JSON.parse(options?.body as string);
		expect(body.score).toBeNull();

		fetchMock.mockRestore();
	});
});

describe("Given a user running the command for the first time", () => {
	test("it should ask him to get project's updates", async () => {
		const getUpdatesByEmailHandlerMock = spyOn(
			newsletterSubscriptionHandler,
			"getIfOptinChoiceHasBeenMade",
		).mockReturnValueOnce(false);
		const askForEmailMock = spyOn(
			newsletterSubscriptionHandler,
			"subscribeToNewsletterHandler",
		);

		const reportCommanderHandlerMock = spyOn(
			reportCommandhandler,
			"buildReports",
		).mockImplementation(() => {});

		await reportCommandhandler.reportCommandhandler({ fromDir: "", toDir: "", publish: false });

		expect(askForEmailMock).toHaveBeenCalledTimes(1);

		getUpdatesByEmailHandlerMock.mockClear();
		reportCommanderHandlerMock.mockClear();
		askForEmailMock.mockClear();
	});
});

describe("Given a user not running the command for the first time", () => {
	beforeEach(() => {
		newsletterSubscriptionHandler.checkConfigFile();
	});

	test("it should not ask him to get project's updates", async () => {
		const getUpdatesByEmailHandlerMock = spyOn(
			newsletterSubscriptionHandler,
			"getIfOptinChoiceHasBeenMade",
		).mockReturnValueOnce(true);
		const reportCommanderHandlerMock = spyOn(
			reportCommandhandler,
			"buildReports",
		).mockImplementation(() => {});
		const askForEmailMock = spyOn(
			newsletterSubscriptionHandler,
			"subscribeToNewsletterHandler",
		);

		await reportCommandhandler.reportCommandhandler({ fromDir: "", toDir: "", publish: false });
		expect(askForEmailMock).not.toHaveBeenCalled();

		getUpdatesByEmailHandlerMock.mockClear();
		askForEmailMock.mockClear();
		reportCommanderHandlerMock.mockClear();
	});
});
