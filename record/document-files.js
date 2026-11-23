'use strict';

window.ProtectDocumentFiles = (() => {
    function open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('protect-document-files', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('files', { autoIncrement: true });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function access(mode, action) {
        const database = await open();
        try {
            return await new Promise((resolve, reject) => {
                const transaction = database.transaction('files', mode);
                const request = action(transaction.objectStore('files'));
                transaction.oncomplete = () => resolve(request.result);
                transaction.onabort = () => reject(transaction.error);
            });
        } finally {
            database.close();
        }
    }

    return {
        save: file => access('readwrite', files => files.add(file)),
        load: id => access('readonly', files => files.get(id)),
        remove: id => access('readwrite', files => files.delete(id)),
        async download(entry) {
            const file = await this.load(entry.id);
            if (!file) throw new Error('File unavailable');
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.download = entry.name;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    };
})();
