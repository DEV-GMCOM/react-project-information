import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

try {
    const gitHash = execSync('git rev-parse HEAD').toString().trim();
    const gitShortHash = execSync('git rev-parse --short HEAD').toString().trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

    const versionInfo = {
        hash: gitHash,
        shortHash: gitShortHash,
        branch: gitBranch,
        buildTime: new Date().toISOString()
    };

    writeFileSync(
        './src/version.json',
        JSON.stringify(versionInfo, null, 2)
    );

    console.log(`✓ Version info generated: ${gitShortHash} (${gitBranch})`);
} catch (error) {
    console.warn('⚠ Git not available, using default version');
    writeFileSync(
        './src/version.json',
        JSON.stringify({ shortHash: 'dev', branch: 'local', buildTime: new Date().toISOString() })
    );
}