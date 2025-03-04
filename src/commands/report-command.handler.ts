import { lookupForProjects } from '@dragee-io/package-installer';
import {
    HtmlReportBuilder,
    JsonReportBuilder,
    MarkdownReportBuilder
} from '@dragee-io/report-generator';
import { type Asserter, type Report, asserterHandler } from '@dragee-io/type/asserter';
import { config } from '../cli.config.ts';
import { lookupForDragees } from '../dragee-lookup.ts';
import { lookupForNamespaces } from '../namespace-lookup.ts';
import {
    getIfOptinChoiceHasBeenMade,
    getUpdatesByEmailHandler
} from './get-updates-by-email.handler.ts';

type Options = {
    fromDir: string;
    toDir: string;
};

export const reportCommandhandler = async ({ fromDir, toDir }: Options) => {
    const dragees = await lookupForDragees(fromDir);
    const namespaces = await lookupForNamespaces(dragees);
    const asserters: Asserter[] = await lookupForProjects(
        config.projectsRegistryUrl,
        config.localRegistryPath,
        namespaces.map(n => `${n}-asserter`)
    );
    const reports: Report[] = [];

    for (const asserter of asserters) {
        console.log(`Running asserter for namespace ${asserter.namespace}`);
        reports.push(asserterHandler(asserter, dragees));
    }

    buildReports(reports, `${toDir}/result`);
    askForUpdatesByEmail();
};

const askForUpdatesByEmail = () => {
    const optinChoiceHasAlreadyBeenMade = getIfOptinChoiceHasBeenMade();

    if (!optinChoiceHasAlreadyBeenMade) {
        getUpdatesByEmailHandler();
    }
};

export const buildReports = (reports: Report[], filePath: string) => {
    JsonReportBuilder.buildReports(reports, filePath);
    HtmlReportBuilder.buildReports(reports, filePath);
    MarkdownReportBuilder.buildReports(reports, filePath);
};
