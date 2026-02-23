---
name: powershell-fix
description: Advanced wrapper for PowerShell execution to prevent Antigravity IDE freezes. Handles zombie processes, enforces timeouts, and ensures clean exit codes.
license: MIT
---

# PowerShell Fix & Robust Execution

This skill provides tools to execute PowerShell commands safely within Antigravity, avoiding the common "hanging" or "zombie process" issues.

## ⚠️ The Problem
Antigravity can freeze if:
1. A PowerShell process doesn't close `stdout` properly.
2. "Zombie" `conhost.exe` or `powershell.exe` processes accumulate.
3. Interactive prompts (Y/N) block execution effectively forever.

## 🛠 The Solution: `safe_run.js`

Use the included Node.js wrapper to run commands. It wraps the native spawn process with:
- **Timeout Enforcers**: Kills process if it runs longer than X seconds (default: 60s).
- **Zombie Cleanup**: Scans and kills distinct PowerShell processes before start.
- **Non-Interactive Mode**: Sets flags to discourage interaction.
- **Output Streaming**: Pipes output directly to console so you see progress.

## Usage

### 1. Run a Command Safely
Instead of running `npm run dev` directly, use:

```bash
node .agent/skills/powershell-fix/scripts/safe_run.js "npm run dev" --timeout 300000
```

### 2. Deep Clean Environment
If the terminal is already stuck, run the cleanup script directly:

```powershell
.agent/skills/powershell-fix/scripts/cleanup.ps1
```

## Configuration
The `safe_run.js` script accepts:
- `--timeout <ms>`: Max execution time (default 60000ms).
- `--no-clean`: Skip pre-execution zombie killing.
- `--debug`: Show wrapper internal logs.

## Troubleshooting
If this skill fails, manually kill all `node.exe` and `powershell.exe` via Task Manager.
