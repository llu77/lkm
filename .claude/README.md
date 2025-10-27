# Claude Configuration Directory

This directory contains Claude Code and Claude Flow configuration and state files.

## Directory Structure

```
.claude/
├── README.md                    # This file
├── commands/                    # Slash commands
│   └── dedupe.md               # GitHub issue deduplication command
├── memory-backup-*.json        # Session memory backups (gitignored)
├── checkpoints/                # Auto-checkpoints (gitignored)
├── session-*.json              # Session state (gitignored)
└── neural-models/              # Neural model weights (gitignored)
```

## Files

### `commands/`
Contains custom slash commands for Claude Code.

- **`dedupe.md`** - Analyzes GitHub issues for duplicates using advanced prompting patterns

### `memory-backup-*.json` (gitignored)
Session memory backups created by Claude Flow.

- Automatically created at session end
- Compressed and synced to GitHub gists
- Contains context from namespaces: swarm, tasks, patterns, errors, optimizations
- **Not committed** - use GitHub gists for backup instead

### `checkpoints/` (gitignored)
Auto-checkpoint data created every 5 minutes.

- Contains incremental state snapshots
- Used for recovery and rollback
- Automatically cleaned after 20 checkpoints
- **Not committed** - use git commits for persistence

### `session-*.json` (gitignored)
Active session state and metrics.

- Performance tracking
- Operation history
- Learning data for neural models
- **Not committed** - ephemeral data only

### `neural-models/` (gitignored)
Neural model weights and training data.

- Task predictor model
- Error preventer model
- Performance optimizer model
- **Not committed** - models are personal to each developer

## Configuration

See `config/claude-flow.json` for full configuration options.

### Quick Settings

**Enable all features:**
```bash
export CLAUDE_FLOW_AUTO_COMMIT=true
export CLAUDE_FLOW_HOOKS_ENABLED=true
export CLAUDE_FLOW_NEURAL_OPTIMIZATION=true
export CLAUDE_FLOW_MEMORY_PERSISTENCE=true
```

**Disable auto-commit (safer):**
```bash
export CLAUDE_FLOW_AUTO_COMMIT=false
```

**Change checkpoint interval:**
```json
{
  "checkpoints": {
    "interval": 600
  }
}
```

## Security

⚠️ **Important**: This directory may contain sensitive information:

- Session context and prompts
- Code patterns and snippets
- Error messages with stack traces
- Project-specific knowledge

**Protected by .gitignore:**
- Memory backups
- Session data
- Neural models
- Checkpoints

**Committed to git:**
- Slash commands
- Configuration

**Backed up to GitHub:**
- Memory backups → private gists
- Checkpoints → checkpoint branch
- Learnings → sync across team (optional)

## Backup and Recovery

### Manual Backup

```bash
# Backup memory
npx claude-flow@alpha memory backup --destination .claude/manual-backup.json

# Create checkpoint
npx claude-flow@alpha checkpoint create --message "Manual backup"
```

### Restore from Backup

```bash
# Restore memory
npx claude-flow@alpha memory restore --source .claude/manual-backup.json

# Restore from checkpoint
git checkout checkpoint/TIMESTAMP
```

### Sync to GitHub

```bash
# Backup to private gist
npx claude-flow@alpha github create-gist --name "claude-memory-backup" --content @.claude/manual-backup.json --private

# Push checkpoint branch
git push origin checkpoints
```

## Cleanup

```bash
# Clean old checkpoints (keeps last 20)
npx claude-flow@alpha checkpoint clean --keep 20

# Clean old memory backups
find .claude -name "memory-backup-*.json" -mtime +30 -delete

# Reset neural models
rm -rf .claude/neural-models/
```

## Troubleshooting

**Memory not persisting?**
- Check `.claude/` directory exists and is writable
- Verify `CLAUDE_FLOW_MEMORY_PERSISTENCE=true`
- Look for errors in `npx claude-flow@alpha memory list`

**Checkpoints failing?**
- Ensure git is configured (`git config user.name`, `user.email`)
- Check write permissions on `.claude/checkpoints/`
- Verify `CLAUDE_FLOW_CHECKPOINT_ENABLED=true`

**Neural models not improving?**
- Models need 100+ operations to train effectively
- Check `neural.models.*.update_frequency` in config
- Review model logs: `npx claude-flow@alpha neural status`

## Privacy

Claude Flow can share anonymized patterns to improve predictions for all users.

**Disable sharing:**
```json
{
  "optimization": {
    "share_anonymized_patterns": false
  }
}
```

**What's shared** (if enabled):
- Operation success/failure patterns
- Performance metrics
- Error patterns (anonymized)

**Never shared:**
- Code content
- Prompts
- File names
- Session data
- Personal information
