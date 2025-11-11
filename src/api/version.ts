import versionInfo from '../version.json' assert { type: 'json' };

export interface VersionInfo {
    hash: string;
    shortHash: string;
    branch: string;
    buildTime: string;
}

export const getAppVersion = (): VersionInfo => versionInfo;