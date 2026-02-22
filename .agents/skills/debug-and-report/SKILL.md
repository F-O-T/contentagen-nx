---
name: debug-and-report
description: Use when investigating bugs or issues that need to be documented in GitHub. Combines systematic debugging with automated issue creation. Triggers on "find this bug", "investigate and file issue", "debug and report", or when systematic investigation should result in a tracked issue.
---

# Debug and Report

## Overview

Systematically investigates bugs following root cause analysis principles, then creates detailed GitHub issues with findings. Ensures issues are actionable and complete.

**Core principle:** Debug to root cause FIRST, then document with evidence. Never file vague issues.

## When to Use

Use when:
- Bug needs investigation AND tracking
- Issue should be documented for team
- Root cause needs to be found before filing
- User asks to "investigate and create issue"
- Converting conversation findings into tracked work

Don't use when:
- Fix is immediate and simple (just fix it)
- Investigation only (use systematic-debugging)
- Issue already well-understood (use gh directly)

## Workflow

### Phase 0: Context & Brainstorming

**REQUIRED FIRST STEP:** Understand the full problem context before investigating.

#### Step 1: Quick Code Search (Do This First)

**Before asking the user questions, search the codebase to understand what exists:**

Use Grep/Glob to quickly find:
- Does the feature/component mentioned already exist?
- What files are involved?
- Are there related patterns or similar code?
- What does the current implementation look like?

**Example:**
```
User mentions: "organization logo isn't working"
→ First search: Grep for "logo" in relevant schemas/components
→ Find: organization.logo field exists, LogoSection component exists
→ NOW ask informed questions about the specific issue
```

**Don't ask basic questions like:**
- ❌ "Does the logo field exist?" (search first!)
- ❌ "Where is the organization schema?" (use Glob!)
- ❌ "Are there any existing components?" (use Grep!)

**DO ask context questions like:**
- ✅ "I see the logo field exists - is it not saving correctly, or not displaying?"
- ✅ "The LogoSection component uses file upload - is that the pattern you want?"
- ✅ "I found three different ways this is handled - which one is broken?"

#### Step 2: Ask Informed Questions

After your initial code search, ask the user:

1. **What's the symptom?** What behavior are you seeing that's wrong?
2. **What's the expected behavior?** What should happen instead?
3. **When does it happen?** Specific conditions, flows, or user actions?
4. **Recent changes?** Was there a recent code change or migration?
5. **Broader context?** Is this part of a larger architectural issue?
6. **Related systems?** What other parts of the codebase might be affected?

**Goal:** Get a complete picture of:
- The user's understanding of the problem
- The scope (single bug vs architectural issue)
- Historical context (why the current code exists)
- User's hypothesis (if any)
- Business impact and priority

**Output:** A clear problem statement and investigation scope agreed with the user.

**Do NOT skip to Phase 1 until you have full context.**

---

### Phase 1: Systematic Investigation

Follow systematic-debugging phases:

1. **Root Cause Investigation**
   - Read error messages completely
   - Reproduce consistently
   - Check recent changes
   - Gather evidence at component boundaries
   - Trace data flow backward

2. **Pattern Analysis**
   - Find working examples
   - Compare against references
   - Identify differences
   - Understand dependencies

3. **Hypothesis Formation**
   - State clear hypothesis
   - Test minimally (if needed for evidence)
   - Verify understanding

**Do NOT skip to Phase 2 until root cause is identified.**

### Phase 2: Document Findings

Structure your findings:

```markdown
## Root Cause
[Clear explanation of what's causing the issue]

## Evidence
- File: path/to/file.ts:LINE_NUMBER
- Pattern: [what's wrong vs what should be]
- Impact: [what fails/breaks]

## Reproduction
[Steps to reproduce, if applicable]

## Suggested Fix
[Specific code changes or approach]
```

### Phase 3: Create GitHub Issue

Use `gh issue create` with:

```bash
gh issue create \
  --title "Clear, specific title" \
  --body "$(cat <<'EOF'
## Summary
Brief description of the bug

## Root Cause
What's causing the issue

## Affected Files
- `path/to/file1.ts:LINE` - specific problem
- `path/to/file2.ts:LINE` - related issue

## Evidence
```language
[Code snippets showing the problem]
```

## Expected Behavior
What should happen

## Actual Behavior
What's happening instead

## Suggested Fix
Specific changes needed:
- [ ] Add `headers` parameter to auth.api.createApiKey()
- [ ] Add `headers` parameter to auth.api.deleteApiKey()

## References
- Related code: path/to/working/example.ts:LINE
- Documentation: [link if applicable]
EOF
)" \
  --label "bug" \
  --assignee "@me"
```

**Title format:** `[Component] Specific problem - brief impact`
- ✅ `[team.ts] Missing headers in API key calls - 401 errors`
- ❌ `API keys broken`
- ❌ `Fix authentication`

## Quick Reference

| Phase | Key Output | Tool |
|-------|-----------|------|
| 0: Context | Problem statement + scope | Conversation with user |
| 1: Investigate | Root cause + evidence | systematic-debugging principles |
| 2: Document | Structured findings | Markdown template |
| 3: Report | GitHub issue | `gh issue create` |

## Template

```markdown
## Summary
[1-2 sentences describing the bug]

## Root Cause
[Technical explanation of what's wrong]

## Affected Files
- `path/to/file.ts:LINE` - [what's wrong here]
- `path/to/file.ts:LINE` - [related issue]

## Evidence
[Code showing the problem vs working examples]

## Expected vs Actual Behavior
**Expected:** [what should happen]
**Actual:** [what's happening]

## Suggested Fix
Specific changes:
- [ ] Change X to Y in file.ts:LINE
- [ ] Add Z parameter in file.ts:LINE

## References
- Working example: path/to/reference.ts:LINE
- Documentation: [if applicable]
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| **Asking before searching** | Search codebase FIRST, ask informed questions SECOND |
| Filing issue before understanding root cause | Complete Phase 1 fully before Phase 2 |
| Vague titles like "Fix bug" | Include component + specific problem |
| Missing file paths and line numbers | Always include exact locations |
| No working examples for comparison | Find and document working pattern |
| Suggested fix is too vague | Be specific: exact lines, exact changes |
| Missing labels/assignees | Use `--label` and `--assignee` flags |
| Asking "does X exist?" | Use Glob/Grep to find it yourself first |

## Red Flags - STOP and Investigate More

If you're about to file an issue with:
- "Not sure what's causing this"
- "Somewhere in this file"
- "Something's wrong with..."
- No line numbers or specific locations
- No comparison to working code
- No hypothesis about root cause

**STOP. Return to Phase 1.**

## Example Output

After running this skill, you should have:

1. **Understanding:** Clear root cause explanation in conversation
2. **Evidence:** File paths, line numbers, code comparisons
3. **Issue:** GitHub issue number with full details
4. **Assignable:** Someone can start fixing immediately from the issue

## Integration with Other Skills

**REQUIRED BACKGROUND:** systematic-debugging for Phase 1 methodology

**Works well with:**
- test-driven-development (for creating failing test in issue)
- verification-before-completion (for verifying fix later)

## Real-World Impact

- **Before:** Vague issues, back-and-forth clarifying, delayed fixes
- **After:** Actionable issues with root cause, ready to fix
- **Time saved:** 15-30 minutes of investigation documented vs 2-3 hours of clarification
