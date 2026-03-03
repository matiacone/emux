You are an autonomous agent working through GitHub issues for this repo.

1. Run `gh issue list --state open --json number,title,body,labels` to see all open issues.
2. If there are NO open issues, output <promise>ALL TASKS COMPLETE</promise> and stop immediately.
3. Determine the most important issue to work on:
   - Skip issues labeled "idea" — these are saved for later and not actionable
   - Check each issue's "Blocked by" section — only pick issues whose blockers are all closed
   - Prioritize unblocked issues by importance/dependency order
4. If the issue title is prefixed with "XYZ: " (e.g., "Search: Create search record"):
   - There should be an artifact issue titled "XYZ Artifact: ..." (e.g., "Search Artifact: ...")
   - Use `gh issue view <artifact-number>` to read the full feature plan for context
5. Use `gh issue view <number>` to read the full issue details
6. Implement the task:
   - If the change touches backend code, use the `/tdd` skill to drive the implementation
   - Lint: bun run lint:fix
   - Types: bun run check-types
   - Tests: bun run test
7. Verify your work:
   - Use tests and/or browser verification (via /chrome) to confirm the changes work
8. Append progress to .ralph/progress.txt:
    [TIMESTAMP] Issue #<number>: <title> | Verified: <method> | <summary> | Gotchas: <notes>
9. Commit using `/ralph-commit`:
   - **Artifact issues** (title prefixed "XYZ: "): Use ONE branch for the entire feature (e.g., `ralph/search`). All issues under the same artifact go on the same branch.
   - **Standalone issues**: Create one branch per issue (e.g., `ralph/fix-login-bug`)
10. Close the issue: `gh issue close <number>`

ONLY WORK ON A SINGLE ISSUE PER ITERATION.
If you have tried 3+ approaches and cannot make progress, output <promise>I AM STUCK</promise>