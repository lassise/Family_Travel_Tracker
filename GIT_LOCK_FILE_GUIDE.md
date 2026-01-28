# Git Lock File Guide - Understanding and Prevention

## What is `.git/index.lock`?

The `.git/index.lock` file is a **safety mechanism** that Git uses to prevent multiple git operations from running simultaneously on the same repository. It's created automatically when git starts an operation and should be removed automatically when the operation completes.

## Why Does It Exist?

Git creates this lock file to:
1. **Prevent data corruption** - Ensures only one git process modifies the repository at a time
2. **Protect the index** - The index (staging area) can only be modified by one process
3. **Maintain consistency** - Prevents race conditions when multiple git commands run simultaneously

## Common Causes of Lock File Issues

### 1. **IDE/Editor Auto-Save or Git Integration**
- **Cursor/VS Code** may have git extensions that auto-fetch, auto-sync, or check git status
- **File watchers** that trigger git commands on file changes
- **Source control panels** that refresh automatically

### 2. **Multiple Git Processes**
- Running `git add`, `git commit`, or `git push` in multiple terminals simultaneously
- Background scripts or cron jobs running git commands
- CI/CD tools accessing the repository

### 3. **Crashed or Interrupted Git Process**
- Git command was forcefully terminated (Ctrl+C, process killed)
- System crash or power loss during a git operation
- Network timeout during `git push` or `git pull`

### 4. **File System Issues**
- Network file systems (if repo is on a network drive)
- File permissions preventing lock file deletion
- Antivirus software interfering with file operations

## How to Prevent Lock File Issues

### ✅ Best Practices

1. **Close IDE Git Operations Before Manual Commands**
   - Close the Source Control panel in Cursor/VS Code
   - Wait for any pending git operations to complete
   - Use IDE's git features OR terminal, not both simultaneously

2. **Disable Auto-Fetch in IDE** (if not needed)
   ```json
   // In Cursor/VS Code settings.json
   {
     "git.autofetch": false,
     "git.enableSmartCommit": false,
     "git.autoRepositoryDetection": false
   }
   ```

3. **Use One Terminal at a Time**
   - Don't run multiple git commands in different terminals simultaneously
   - Wait for one command to finish before starting another

4. **Check for Background Processes**
   ```powershell
   # Check if any git processes are running
   Get-Process -Name git -ErrorAction SilentlyContinue
   ```

5. **Use Git Hooks Carefully**
   - If you have pre-commit hooks, ensure they complete quickly
   - Avoid hooks that trigger other git commands

### 🔧 Quick Fixes

**If lock file exists and no git process is running:**

```powershell
# Safe to remove if no git process is active
Remove-Item -Path .git/index.lock -Force
```

**Check what's holding the lock:**
```powershell
# See if any git processes are running
Get-Process | Where-Object {$_.ProcessName -like "*git*"}

# Or check file handles (requires Handle.exe from Sysinternals)
# handle.exe .git\index.lock
```

### 🚨 When NOT to Remove the Lock File

**DO NOT** remove the lock file if:
- A git command is currently running (wait for it to finish)
- You see a git process in Task Manager
- The IDE is performing a git operation (check the status bar)

Removing the lock file while git is working can cause **data corruption**.

## Recommended Workflow

### For Manual Git Operations:

1. **Close IDE Git Panels** - Close Source Control panel in Cursor/VS Code
2. **Wait 2-3 seconds** - Let any background operations complete
3. **Run git commands in terminal** - Use PowerShell/Command Prompt
4. **Verify completion** - Wait for command to finish before next one

### For IDE Git Operations:

1. **Use IDE's built-in git** - Commit/push through Cursor/VS Code UI
2. **Don't mix with terminal** - Avoid running terminal git commands while IDE is using git
3. **Check status bar** - Look for "Syncing..." or git operation indicators

## Specific to Your Setup

Based on your project, potential causes:

1. **Cursor IDE** - May have auto-fetch or git status checking enabled
2. **Non-interactive environment** - The agent's git commands might conflict with IDE
3. **Multiple terminals** - If you have multiple PowerShell windows open

### Recommended Solution:

**Option 1: Use IDE Git Features Only**
- Commit and push through Cursor's Source Control panel
- Disable terminal git commands when IDE is open

**Option 2: Use Terminal Git Only**
- Close Cursor/VS Code before running git commands
- Or disable git integration in IDE settings

**Option 3: Add Lock File to .gitignore** (NOT RECOMMENDED)
- This won't help - the lock file is in `.git/` which is never ignored
- Git needs to create/remove it automatically

## Emergency Recovery

If you're stuck with a lock file and need to proceed:

```powershell
# 1. Check for running git processes
Get-Process -Name git -ErrorAction SilentlyContinue

# 2. If none found, check file age (if very old, likely stale)
Get-Item .git/index.lock | Select-Object LastWriteTime

# 3. If file is old (> 5 minutes) and no git process, safe to remove
if ((Get-Item .git/index.lock).LastWriteTime -lt (Get-Date).AddMinutes(-5)) {
    Remove-Item .git/index.lock -Force
}
```

## Prevention Checklist

- [ ] Disable auto-fetch in IDE if not needed
- [ ] Close Source Control panel before terminal git commands
- [ ] Use only one method (IDE OR terminal) at a time
- [ ] Wait for git operations to complete before starting new ones
- [ ] Check for background git processes before removing lock file
- [ ] Avoid interrupting git commands (let them finish)

## Summary

The lock file is **normal and necessary** - it protects your repository. Problems occur when:
- Multiple processes try to use git simultaneously
- A git process crashes and doesn't clean up
- IDE and terminal git operations conflict

**Best practice**: Use one git interface at a time (IDE OR terminal), and wait for operations to complete.
