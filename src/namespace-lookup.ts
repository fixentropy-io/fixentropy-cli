import type { Dragee } from '@fixentropy-io/type/common';

export const lookupForNamespaces = async (dragees: Dragee[]): Promise<string[]> => {
    console.log('Looking up for namespaces');

    const nonUniqueNamespaces = dragees.map(dragee => {
        const [namespace] = dragee.profile.split('/');
        return namespace;
    });

    return [...new Set(nonUniqueNamespaces)];
};
