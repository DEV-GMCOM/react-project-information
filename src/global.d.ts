// src/global.d.ts
declare global {
    interface Window {
        downloadedFileNames?: Set<string>;
    }
}

export {};