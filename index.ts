import { generateAsserter } from '@dragee-io/asserter-generator';
import { generateGrapher } from '@dragee-io/grapher-generator';
import { Command } from 'commander';
import { clearRegistryHandler } from './src/commands/clear-registry-command.handler.ts';
import { drawCommandhandler } from './src/commands/draw-command.handler.ts';
import { reportCommandhandler } from './src/commands/report-command.handler.ts';
import { subscribeToNewsletterHandler } from './src/commands/newsletter-subscription.handler.ts';

const report = new Command('report')
    .alias('r')
    .summary('builds asserters rules report')
    .description(
        'Builds asserters rules report.\n' +
            '- Lookups dragees in [--from-dir] directory\n' +
            '- Downloads asserters for dragees namespaces\n' +
            '- Executes rules from asserters\n' +
            '- Builds reports in [--to-dir] directory'
    )
    .option('--from, --from-dir <path-to-dir>', 'directory in where to lookup for dragees', '.')
    .option(
        '--to --to-dir <path-to-dir>',
        'directory in where to store reports',
        './dragee/reports'
    )
    .option('--publish', 'publish reports to backend')
    .action(reportCommandhandler);

const draw = new Command('draw')
    .alias('d')
    .summary('builds graphers graphs models')
    .description(
        'Builds graphers graphs models.\n' +
            '- Lookups dragees in [--from-dir] directory\n' +
            '- Downloads graphers for dragees namespaces\n' +
            '- Executes graphs from graphers\n' +
            '- Draws models in [--to-dir] directory'
    )
    .option('--from, --from-dir <path-to-dir>', 'directory in where to lookup for dragees', '.')
    .option(
        '--to --to-dir <path-to-dir>',
        'directory in where to store reports',
        './dragee/reports'
    )
    .action(drawCommandhandler);

const clearRegistry = new Command('clear-registry')
    .alias('cr')
    .summary('clears local dragee repository')
    .description(
        'Clears local dragee repository, erasing all previously downloaded asserters and graphers.'
    )
    .action(clearRegistryHandler);

const newsletterSubscription = new Command('newsletter')
    .summary('get updated by email when new features are available')
    .action(() => subscribeToNewsletterHandler({ askAgain: true }));

new Command()
    .addCommand(generateAsserter)
    .addCommand(generateGrapher)
    .addCommand(report)
    .addCommand(draw)
    .addCommand(clearRegistry)
    .addCommand(newsletterSubscription)
    .showHelpAfterError()
    .showSuggestionAfterError()
    .parse(process.argv);
