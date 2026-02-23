#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import execa from 'execa';
import fs from 'fs/promises';
import path from 'path';
import prompts from 'prompts';
import { glob } from 'glob';

// --- Constants ---
const IGNORE_PATTERNS = {
    fullstack: [
        '# === repo-hygiene-git: BEGIN (fullstack) ===',
        '# Env / secrets',
        '.env',
        '.env.local',
        '.env.*.local',
        '*.pem',
        '*.key',
        'service_account*.json',
        'credentials*.json',
        '',
        '# Python',
        '__pycache__/',
        '*.pyc',
        '*.pyo',
        '*.pyd',
        '.venv/',
        'backend/.venv/',
        'venv/',
        '',
        '# Node',
        'node_modules/',
        'frontend/node_modules/',
        'dist/',
        'frontend/dist/',
        'build/',
        '.vite/',
        'frontend/node_modules/.vite/',
        '.next/',
        '.playwright/',
        'coverage/',
        '*.log',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*',
        '',
        '# OS / IDE',
        '.DS_Store',
        'Thumbs.db',
        '.idea/',
        '.vscode/',
        '',
        '# Temp',
        '.tmp/',
        '# === repo-hygiene-git: END ==='
    ]
};

const CRITICAL_FILES = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
    'config.json',
    'secrets.json',
    'credentials.json',
    'service_account.json',
    'id_rsa',
    'id_rsa.pub',
    '*.pem',
    '*.key'
];

// --- Helpers ---

async function getGitRoot() {
    try {
        const { stdout } = await execa('git', ['rev-parse', '--show-toplevel']);
        return stdout.trim();
    } catch (error) {
        return null;
    }
}

async function getTrackedFiles(root) {
    try {
        // List all files tracked by git
        const { stdout } = await execa('git', ['ls-files'], { cwd: root });
        return stdout.split('\n').filter(Boolean);
    } catch (error) {
        return [];
    }
}

async function getGitStatus(root) {
    try {
        const { stdout } = await execa('git', ['status', '--porcelain'], { cwd: root });
        return stdout.split('\n').filter(Boolean);
    } catch (error) {
        return [];
    }
}

async function checkIgnoreMatch(root, file) {
    try {
        await execa('git', ['check-ignore', '-q', file], { cwd: root });
        return true;
    } catch {
        return false;
    }
}

// Check which of the tracked files match our critical patterns *or* should be ignored
async function analyzeRepo(root) {
    const trackedFiles = await getTrackedFiles(root);

    // 1. Secrets that are tracked
    const secrets = [];
    // Simple glob matching for critical files against tracked files
    // Note: This is a heuristic. For robust matching we might need minimatch or similar against the list
    // But strictly speaking, we want to know if specific filenames exist in the tracked list.
    // Let's use a simple includes or endsWith for now, or minimatch if we import it.
    // Since we rely on 'glob' package, lets use it to find files on disk, then check if they are tracked.

    // Actually, better approach:
    // Iterate strictly defined critical patterns. detailed scan.
    // For this MVP, let's just check exact matches for common .env files in root and subdirs

    for (const file of trackedFiles) {
        const basename = path.basename(file);
        if (basename === '.env' || basename.startsWith('.env.') || basename.endsWith('.pem') || basename.endsWith('.key') || basename.includes('credentials') && basename.endsWith('.json')) {
            secrets.push(file);
        }
    }

    // 2. Trash files that are tracked (node_modules, venv, etc)
    const trash = [];
    const trashPatterns = ['node_modules/', '.venv/', '__pycache__/', 'dist/', '.vite/', '.next/', '.idea/', '.vscode/'];

    for (const file of trackedFiles) {
        if (trashPatterns.some(pattern => file.includes(pattern.replace(/\/$/, '')))) {
            trash.push(file);
        }
        // Also check specific extensions
        if (file.endsWith('.pyc') || file.endsWith('.log') || file.endsWith('.DS_Store')) {
            trash.push(file);
        }
    }

    return { secrets, trash };
}

async function updateGitignore(root, policy = 'fullstack') {
    const gitignorePath = path.join(root, '.gitignore');
    let content = '';
    try {
        content = await fs.readFile(gitignorePath, 'utf-8');
    } catch (err) {
        // File doesn't exist
    }

    const lines = content.split('\n');
    const hasMarker = lines.some(line => line.includes('repo-hygiene-git: BEGIN'));

    if (hasMarker) {
        console.log(chalk.yellow('Existing repo-hygiene-git block found. Skipping .gitignore update.'));
        return false;
    }

    const newBlock = IGNORE_PATTERNS[policy].join('\n');
    const newContent = content ? `${content}\n\n${newBlock}\n` : `${newBlock}\n`;

    await fs.writeFile(gitignorePath, newContent, 'utf-8');
    console.log(chalk.green(`Updated .gitignore with ${policy} policy.`));
    return true;
}

async function removeFromIndex(root, files) {
    if (files.length === 0) return;

    console.log(chalk.blue(`Removing ${files.length} items from git index (keeping files on disk)...`));

    // Process in chunks to avoid command line length limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);
        await execa('git', ['rm', '-r', '--cached', '--ignore-unmatch', ...chunk], { cwd: root });
    }
}

// --- Commands ---

program
    .name('repo-hygiene')
    .description('Auto-clean Git repository state')
    .option('--root <path>', 'Path to repo root', process.cwd())
    .option('--policy <type>', 'Ignore policy (fullstack)', 'fullstack')
    .option('--yes', 'Skip confirmation prompts')
    .option('--dry-run', 'Show plan without making changes');

program
    .command('scan')
    .description('Analyze repository health')
    .action(async (options) => {
        const root = await getGitRoot() || program.opts().root;
        if (!root) {
            console.error(chalk.red('Error: Not a git repository.'));
            process.exit(1);
        }

        console.log(chalk.bold(`Scanning repo at: ${root}`));
        const { secrets, trash } = await analyzeRepo(root);

        if (secrets.length > 0) {
            console.log(chalk.red.bold('\nCRITICAL: Secrets tracked in git:'));
            secrets.forEach(f => console.log(`  - ${f}`));
        } else {
            console.log(chalk.green('\nNo secrets found in tracked files.'));
        }

        if (trash.length > 0) {
            console.log(chalk.yellow.bold('\nWARNING: Trash/Generated files tracked in git:'));
            if (trash.length > 10) {
                trash.slice(0, 10).forEach(f => console.log(`  - ${f}`));
                console.log(`  ... and ${trash.length - 10} more`);
            } else {
                trash.forEach(f => console.log(`  - ${f}`));
            }
        } else {
            console.log(chalk.green('\nNo trash files found in index.'));
        }

        // Check .gitignore existence
        try {
            await fs.access(path.join(root, '.gitignore'));
            console.log(chalk.green('\n.gitignore exists.'));
        } catch {
            console.log(chalk.red('\n.gitignore is MISSING.'));
        }
    });

program
    .command('fix')
    .description('Apply fixes to repository')
    .option('--commit', 'Create a commit with fixes')
    .option('--message <msg>', 'Commit message', 'chore: repo hygiene (ignore build artifacts/secrets)')
    .action(async (cmdObj) => {
        const opts = program.opts();
        const root = await getGitRoot() || opts.root;
        if (!root) {
            console.error(chalk.red('Error: Not a git repository.'));
            process.exit(1);
        }

        // 1. Update .gitignore
        if (!opts.dryRun) {
            await updateGitignore(root, opts.policy);
        } else {
            console.log(chalk.cyan('[Dry Run] Would update .gitignore'));
        }

        // 2. Analyze tracked files again (now that .gitignore might be updated, actually we need to check if they match *our patterns* regardless of current gitignore, 
        // but identifying trash is based on our list, not just gitignore matching because they are ALREADY tracked)
        const { secrets, trash } = await analyzeRepo(root);
        const allToClean = [...secrets, ...trash];

        if (allToClean.length > 0) {
            console.log(chalk.yellow(`Found ${allToClean.length} files to remove from index.`));

            if (!opts.yes && !opts.dryRun) {
                const response = await prompts({
                    type: 'confirm',
                    name: 'value',
                    message: 'Do you want to remove these files from git index (files remain on disk)?',
                    initial: true
                });
                if (!response.value) {
                    console.log(chalk.gray('Aborting removal.'));
                    return;
                }
            }

            if (!opts.dryRun) {
                await removeFromIndex(root, secrets); // Remove secrets first
                await removeFromIndex(root, trash);   // Remove trash
                console.log(chalk.green('Removed files from index.'));
            } else {
                console.log(chalk.cyan(`[Dry Run] Would run: git rm -r --cached <${allToClean.length} files>`));
            }
        } else {
            console.log(chalk.green('Index is clean.'));
        }

        // 3. Commit if requested
        if (cmdObj.commit && !opts.dryRun) {
            const status = await getGitStatus(root);
            if (status.length === 0) {
                console.log(chalk.gray('No changes to commit.'));
            } else {
                console.log(chalk.blue('Committing changes...'));
                await execa('git', ['add', '.gitignore'], { cwd: root }); // Ensure .gitignore is staged
                // We already did rm --cached, so those deletions are staged.
                // But we might need to add changes if we modified .gitignore

                await execa('git', ['commit', '-m', cmdObj.message], { cwd: root });
                console.log(chalk.green('Committed changes.'));
            }
        }
    });

program
    .command('undo')
    .description('Undo last commit made by repo-hygiene')
    .action(async () => {
        const root = await getGitRoot() || program.opts().root;
        if (!root) {
            console.error(chalk.red('Error: Not a git repository.'));
            process.exit(1);
        }

        try {
            const { stdout } = await execa('git', ['log', '-1', '--pretty=%B'], { cwd: root });
            if (stdout.includes('repo hygiene')) {
                const response = await prompts({
                    type: 'confirm',
                    name: 'value',
                    message: 'Undo last repo-hygiene commit (git reset --hard HEAD~1)? WARNING: This is destructive to uncommitted changes.',
                    initial: true
                });
                if (response.value) {
                    await execa('git', ['reset', '--hard', 'HEAD~1'], { cwd: root });
                    console.log(chalk.green('Undone last commit.'));
                }
            } else {
                console.log(chalk.yellow('Last commit does not appear to be made by repo-hygiene.'));
                console.log(chalk.gray(`Last commit message: ${stdout.trim()}`));
            }
        } catch (e) {
            console.error(chalk.red('Error checking git log or resetting:'), e.message);
        }
    });

program.parse(process.argv);
