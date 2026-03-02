import { lookupForProjects } from '@fixentropy-io/package-installer';
import {
    HtmlReportBuilder,
    JsonReportBuilder,
    MarkdownReportBuilder
} from '@fixentropy-io/report-generator';
import { type Asserter, type Report, asserterHandler } from '@fixentropy-io/type/asserter';
import { config } from '../cli.config.ts';
import { lookupForDragees } from '../dragee-lookup.ts';
import { lookupForNamespaces } from '../namespace-lookup.ts';
import {
    getIfOptinChoiceHasBeenMade,
    subscribeToNewsletterHandler
} from './newsletter-subscription.handler.ts';

// ── Types ──────────────────────────────────────────────────────────────

type Options = {
    fromDir: string;
    toDir: string;
    publish: boolean;
};

type StartScanResponse = {
    scanId: string;
    token: string;
    projectId: string;
    branchName: string;
    repo: string;
    commitSha: string | null;
    expiresAt: string;
};

type ProcessScanReportResponse = {
    scanId: string;
};

// ── Backend API ────────────────────────────────────────────────────────

const getBackendUrl = (): string | undefined => process.env.BACKEND_URL;

const startScan = async (backendUrl: string, oidcToken: string): Promise<StartScanResponse> => {
    const response = await fetch(`${backendUrl}/scan/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oidcToken })
    });

    if (!response.ok) {
        throw new Error(`Failed to start scan: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<StartScanResponse>;
};

const publishReports = async (
    backendUrl: string,
    scanCreditId: string,
    reports: Report[]
): Promise<ProcessScanReportResponse> => {
    const response = await fetch(`${backendUrl}/scan/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanCreditId, reports })
    });

    if (!response.ok) {
        throw new Error(`Failed to publish reports: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<ProcessScanReportResponse>;
};

// ── Publish orchestration ──────────────────────────────────────────────

const tryPublishReports = async (reports: Report[]): Promise<void> => {
    const oidcToken = process.env.OIDC_TOKEN;
    const backendUrl = getBackendUrl();

    if (!oidcToken) {
        console.warn('--publish: OIDC_TOKEN is not set, skipping backend publish.');
        return;
    }

    if (!backendUrl) {
        console.warn('--publish: BACKEND_URL is not set, skipping backend publish.');
        return;
    }

    try {
        console.log('Starting scan session...');
        const scan = await startScan(backendUrl, oidcToken);

        console.log(`Scan started (id: ${scan.scanId}), publishing ${reports.length} report(s)...`);
        const result = await publishReports(backendUrl, scan.token, reports);

        console.log(`Reports published successfully (scan: ${result.scanId})`);
    } catch (error) {
        console.error('Failed to publish reports to backend:', error);
    }
};

// ── Report building ────────────────────────────────────────────────────

export const buildReports = (reports: Report[], filePath: string) => {
    JsonReportBuilder.buildReports(reports, filePath);
    HtmlReportBuilder.buildReports(reports, filePath);
    MarkdownReportBuilder.buildReports(reports, filePath);
};

// ── Main handler ───────────────────────────────────────────────────────

export const reportCommandhandler = async ({ fromDir, toDir, publish }: Options) => {
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

    // Always generate local reports
    buildReports(reports, `${toDir}/result`);

    // Optionally publish to backend
    if (publish) {
        await tryPublishReports(reports);
    }

    askForUpdatesByEmail();
};

// ── Newsletter ─────────────────────────────────────────────────────────

const askForUpdatesByEmail = () => {
    if (!getIfOptinChoiceHasBeenMade()) {
        subscribeToNewsletterHandler();
    }
};
