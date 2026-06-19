import { verify, type UUID } from "node:crypto";
import { lookupForProjects } from "@fixentropy-io/package-installer";
import {
  HtmlReportBuilder,
  JsonReportBuilder,
  MarkdownReportBuilder,
} from "@fixentropy-io/report-generator";
import {
  type Asserter,
  type Report,
  RuleSeverity,
  asserterHandler,
} from "@fixentropy-io/type/asserter";
import { config } from "../cli.config.ts";
import { lookupForDragees } from "../dragee-lookup.ts";
import { lookupForNamespaces } from "../namespace-lookup.ts";
import {
  getIfOptinChoiceHasBeenMade,
  subscribeToNewsletterHandler,
} from "./newsletter-subscription.handler.ts";

// ── Types ──────────────────────────────────────────────────────────────

type Options = {
  fromDir: string;
  toDir: string;
  publish: boolean;
};

type ScanCreditResponse = {
  scanCreditId: UUID;
};

type ScanReportStats = {
  numberOfAsserterRules: number;
  numberOfValidatedDependencies: number;
  numberOfRejectedDependencies: number;
};

type ScanReportIssue = {
  ruleName: string;
  drageeName: string;
  message: string;
};

type ScanReport = {
  namespace: string;
  issues: ScanReportIssue[];
  stats: ScanReportStats;
};

type PublishContext = {
  backendUrl: string;
  scanCreditId: UUID;
};

class ScanCreditError extends Error {
  constructor() {
    super("Failed to credit the scan");
  }
}

class ScanPublishError extends Error {
  constructor() {
    super("Failed to publish reports to backend");
  }
}

// ── Backend API ────────────────────────────────────────────────────────

const getBackendUrl = (): string | undefined => process.env.BACKEND_URL;

const creditScan = async (
  backendUrl: string,
  oidcToken: string,
): Promise<UUID> => {
  const response = await fetch(`${backendUrl}/scans/credit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oidcToken }),
  });

  if (!response.ok) {
    throw new ScanCreditError();
  }

  const scanCreditResponse =
    (await response.json()) as Promise<ScanCreditResponse>;
  const scanCreditId = (await scanCreditResponse).scanCreditId;
  console.log(`Scan credited successfully with ID: ${scanCreditId}`);
  return scanCreditId;
};

export const publishReports = async (
  backendUrl: string,
  scanCreditId: UUID,
  reports: Report[],
  severityByRuleId: Map<string, RuleSeverity>,
): Promise<void> => {
  const scanReports: ScanReport[] = reports.map(
    (report): ScanReport => ({
      namespace: report.namespace,
      issues: report.errors.map((error) => ({
        ruleName: error.ruleId || "",
        drageeName: error.drageeName,
        message: error.message,
      })),
      stats: {
        numberOfAsserterRules: report.stats.rulesCount,
        numberOfValidatedDependencies: report.stats.passCount,
        numberOfRejectedDependencies: report.stats.errorsCount,
      },
    }),
  );

  const passRate = calculatePassRate(reports, severityByRuleId);

  const response = await fetch(`${backendUrl}/scans/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scanCreditId, scanReports, score: passRate }),
  });

  if (!response.ok) {
    throw new ScanPublishError();
  }

  console.log("Reports published successfully");
};

// ── Calculating Pass Rate ──────────────────────────────────────────────

const SEVERITY_WEIGHTS: Record<RuleSeverity, number> = {
  [RuleSeverity.INFO]: 1,
  [RuleSeverity.WARN]: 5,
  [RuleSeverity.ERROR]: 20,
};

export const buildSeverityByRuleId = (
  asserters: Asserter[],
): Map<string, RuleSeverity> =>
  new Map(
    asserters.flatMap((asserter) =>
      asserter.rules.map((rule) => [rule.id, rule.severity] as const),
    ),
  );

export const calculatePassRate = (
  reports: Report[],
  severityByRuleId: Map<string, RuleSeverity>,
): number | null => {
  const totalEvaluations = reports.reduce(
    (acc, report) => acc + report.stats.passCount + report.stats.errorsCount,
    0,
  );
  if (totalEvaluations === 0) {
    return null;
  }

  const passCount = reports.reduce(
    (acc, report) => acc + report.stats.passCount,
    0,
  );
  const weightedFailureCount = reports.reduce(
    (acc, report) =>
      acc +
      report.errors.reduce((sum, error) => {
        const severity = severityByRuleId.get(error.ruleId ?? "");
        return sum + (severity ? SEVERITY_WEIGHTS[severity] : 0);
      }, 0),
    0,
  );
  return passCount / (passCount + weightedFailureCount);
};

// ── Report building ────────────────────────────────────────────────────

export const buildReports = (reports: Report[], filePath: string) => {
  JsonReportBuilder.buildReports(reports, filePath);
  HtmlReportBuilder.buildReports(reports, filePath);
  MarkdownReportBuilder.buildReports(reports, filePath);
};

// ── Main handler ───────────────────────────────────────────────────────

export const reportCommandhandler = async ({
  fromDir,
  toDir,
  publish,
}: Options) => {
  try {
    let scanCreditId: UUID | null = null;
    const oidcToken = process.env.OIDC_TOKEN;
    const backendUrl = getBackendUrl();
    if (publish) {
      if (!oidcToken) {
        console.warn(
          "--publish: OIDC_TOKEN is not set, skipping backend publish.",
        );
        return null;
      }

      if (!backendUrl) {
        console.warn(
          "--publish: BACKEND_URL is not set, skipping backend publish.",
        );
        return null;
      }
      console.log("Crediting scan...");
      scanCreditId = publish ? await creditScan(backendUrl, oidcToken) : null;
    }

    const dragees = await lookupForDragees(fromDir);
    const namespaces = await lookupForNamespaces(dragees);
    const asserters: Asserter[] = await lookupForProjects(
      config.projectsRegistryUrl,
      config.localRegistryPath,
      namespaces.map((n) => `${n}-asserter`),
    );

    const reports: Report[] = [];
    for (const asserter of asserters) {
      console.log(`Running asserter for namespace ${asserter.namespace}`);
      reports.push(asserterHandler(asserter, dragees));
    }

    buildReports(reports, `${toDir}/result`);

    // Optionally publish to backend
    if (publish && scanCreditId) {
      console.log(`Publishing ${reports.length} report(s)...`);
      await publishReports(
        backendUrl ?? "",
        scanCreditId,
        reports,
        buildSeverityByRuleId(asserters),
      );
    }

    askForUpdatesByEmail();
  } catch (error) {
    if (error instanceof ScanCreditError || error instanceof ScanPublishError) {
      console.error(error.message);
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unexpected error occurred");
    }
    process.exitCode = 1;
  }
};

// ── Newsletter ─────────────────────────────────────────────────────────

const askForUpdatesByEmail = () => {
  if (!getIfOptinChoiceHasBeenMade()) {
    subscribeToNewsletterHandler();
  }
};
