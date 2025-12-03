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
    subscribeToNewsletterHandler
} from './newsletter-subscription.handler.ts';

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
    if (!process.env.OIDC_TOKEN) {
        return console.error('OIDC_TOKEN env variable is not set');
    }
    console.log("OIDC_TOKEN: ", process.env.OIDC_TOKEN);
    const result = await startScan(process.env.OIDC_TOKEN);
    console.log("startScan: ", result);

    for (const asserter of asserters) {
        console.log(`Running asserter for namespace ${asserter.namespace}`);
        reports.push(asserterHandler(asserter, dragees));
    }

    const resultpublish = await publishReports(result.token, reports);
    console.log("publishReports: ", resultpublish);
    buildReports(reports, `${toDir}/result`);
    askForUpdatesByEmail();
};

const askForUpdatesByEmail = () => {
    const optinChoiceHasAlreadyBeenMade = getIfOptinChoiceHasBeenMade();

    if (!optinChoiceHasAlreadyBeenMade) {
        subscribeToNewsletterHandler();
    }
};

export const buildReports = (reports: Report[], filePath: string) => {
    JsonReportBuilder.buildReports(reports, filePath);
    HtmlReportBuilder.buildReports(reports, filePath);
    MarkdownReportBuilder.buildReports(reports, filePath);
};

type startScanDTO = {
    scanId: string,
    token: string,
    projectId: string,
    branchName: string,
    repo: string,
    commitSha: string,
    expiresAt: string,
}

export const publishReports = async (scanCredit: string, reports: Report[]) => {
    const result = await fetch(`${process.env.BACKEND_URL}/scan/report`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({scanCredit, reports})
    })
    return result.json();
};

export const startScan = async (oidcToken: string): Promise<startScanDTO> => {
    const result = await fetch(`${process.env.BACKEND_URL}/scan/start`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({oidcToken})
    })
    return result.json() as Promise<startScanDTO>;
}