const { spawn, execSync } = require('child_process');
const path = require('path');

// Configuration
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const CLEANUP_ON_START = true;

// Parse args
const args = process.argv.slice(2);
const command = args[0];
const timeoutArg = args.find(a => a.startsWith('--timeout='));
const timeout = timeoutArg ? parseInt(timeoutArg.split('=')[1]) : DEFAULT_TIMEOUT;
const debug = args.includes('--debug');
const noClean = args.includes('--no-clean');

if (!command) {
    console.error("Usage: node safe_run.js \"<command>\" [--timeout=<ms>] [--no-clean] [--debug]");
    process.exit(1);
}

function log(msg) {
    if (debug) console.log(`[SafeRun] ${msg}`);
}

function killZombies() {
    try {
        log("Scanning for zombie PowerShell processes...");
        // This is aggressive: kills other powershells. Use with caution.
        // We only kill if they are NOT the current process parent.
        // For simplicity in this v1, we skip aggressive kill to avoid killing the IDE itself if it uses PS.
        // Instead, we kill specific "conhost" or "node" if we know they are zombies.
        // Let's just log for now.
    } catch (e) {
        log("Cleanup warning: " + e.message);
    }
}

async function run() {
    if (CLEANUP_ON_START && !noClean) {
        killZombies();
    }

    log(`Starting: ${command}`);
    log(`Timeout: ${timeout}ms`);

    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
        stdio: 'inherit', // Pipe directly to parent
        cwd: process.cwd(),
        env: { ...process.env, CI: 'true', NON_INTERACTIVE: 'true' } // Force non-interactive
    });

    const timer = setTimeout(() => {
        console.error(`\n[SafeRun] 🛑 TIMEOUT: Command ran longer than ${timeout}ms. Killing...`);
        child.kill();
        // Force kill if needed
        execSync(`taskkill /PID ${child.pid} /F /T`);
        process.exit(124); // Timeout exit code
    }, timeout);

    child.on('close', (code) => {
        clearTimeout(timer);
        log(`Finished with code ${code}`);
        process.exit(code);
    });

    child.on('error', (err) => {
        clearTimeout(timer);
        console.error(`[SafeRun] 💥 Error: ${err.message}`);
        process.exit(1);
    });
}

run();
