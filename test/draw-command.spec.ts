import { afterAll, afterEach, describe, expect, test } from 'bun:test';
import { rmdirSync, unlinkSync } from 'node:fs';
import type { Dragee } from '@fixentropy-io/type/common';
import type { Grapher } from '@fixentropy-io/type/grapher';
import { grapherHandler } from '../src/commands/draw-command.handler.ts';

const testResultDir = 'test/draw-command-test-result/';
const testResultFileName = 'Test.md';

afterEach(() => {
    // Delete test file
    unlinkSync(testResultDir + testResultFileName);
});

afterAll(() => {
    // Delete test directory
    rmdirSync(testResultDir);
});

describe('Should handler grapher', () => {
    test('Format with one report', async () => {
        const grapher: Grapher = {
            namespace: '',
            graphs: [
                {
                    id: 'test',
                    label: 'Test',
                    handler(dragees) {
                        return dragees.map(d => d.name).join(',');
                    }
                }
            ]
        };

        const dragees: Dragee[] = [
            {
                name: 'dragee1',
                profile: 'test/test',
                depends_on: []
            },
            {
                name: 'dragee2',
                profile: 'test/test',
                depends_on: []
            }
        ];

        await grapherHandler(grapher, testResultDir, dragees);

        const createdGraph = await Promise.resolve(
            Bun.file(testResultDir + testResultFileName).text()
        );
        expect(createdGraph).toContain('dragee1,dragee2');
    });
});
