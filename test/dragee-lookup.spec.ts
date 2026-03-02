import { describe, expect, test } from 'bun:test';
import type { Dragee } from '@fixentropy-io/type/common';
import { lookupForDragees } from '../src/dragee-lookup.ts';

describe('Should retrive dragees from directory', () => {
    test('with directory not found', async () => {
        const testFolder = './azertyuiop';
        expect(lookupForDragees(testFolder)).rejects.toThrowError();
    });

    test('with no dragees in directory', async () => {
        const testFolder = './src';
        const dragees: Dragee[] = await lookupForDragees(testFolder);

        expect(dragees).toBeEmpty();
    });

    test('with dragees in directory', async () => {
        const testFolder = './test/approval/sample/ddd';
        const dragees: Dragee[] = await lookupForDragees(testFolder);

        expect(dragees).toBeArrayOfSize(8);
        const result = dragees.map(d => d.name).sort();
        expect(result).toEqual(
            [
                'io.dragee.annotation.ddd.sample.ACommand',
                'io.dragee.annotation.ddd.sample.AFactory',
                'io.dragee.annotation.ddd.sample.AnAggregate',
                'io.dragee.annotation.ddd.sample.AnEntity',
                'io.dragee.annotation.ddd.sample.AnEvent',
                'io.dragee.annotation.ddd.sample.ARepository',
                'io.dragee.annotation.ddd.sample.AService',
                'io.dragee.annotation.ddd.sample.AValueObject'
            ].sort()
        );
    });
});
