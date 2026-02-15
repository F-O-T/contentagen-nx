# Team Scoping Manual Testing Guide

This document provides comprehensive manual testing procedures to verify that team-scoped resources are properly isolated and that all team-related functionality works correctly.

## Prerequisites

Before testing, ensure:
- Database migrations have been run successfully
- All existing data has been migrated (content, forms, dashboards, insights, writers)
- The application is running in a local or staging environment
- You have access to at least 2 test user accounts

## Test Environment Setup

### 1. Create Test Organization with Multiple Teams

```bash
# User 1: Primary account owner
# Create organization "Test Org"
# Organization should auto-create "Default" team

# Create second team: "Marketing Team"
# Create third team: "Engineering Team"
```

### 2. Add Test Users to Teams

```bash
# User 1 (owner): Member of all teams
# User 2: Member of "Marketing Team" only
# User 3: Member of "Engineering Team" only
```

---

## Category 1: New User Onboarding

### Test 1.1: Default Team Creation
**Objective:** Verify that new users get a default team automatically.

**Steps:**
1. Sign up as a new user
2. Complete email verification
3. Access dashboard

**Expected Results:**
- ✅ Organization is created automatically
- ✅ A team named "Default" is created
- ✅ User is added as a member of the "Default" team
- ✅ Session includes `activeTeamId`
- ✅ Default dashboard with insights is created with `teamId`

**Verification Queries:**
```sql
-- Check team was created
SELECT * FROM team WHERE organization_id = '<org-id>';

-- Check user is team member
SELECT * FROM team_member WHERE user_id = '<user-id>';

-- Check session has activeTeamId
SELECT active_team_id FROM session WHERE user_id = '<user-id>';

-- Check default insights have teamId
SELECT id, name, team_id FROM insights WHERE organization_id = '<org-id>';

-- Check default dashboard has teamId
SELECT id, name, team_id FROM dashboards WHERE organization_id = '<org-id>';
```

---

### Test 1.2: Default Team Rename During Onboarding
**Objective:** Verify that the default team is renamed when user completes profile setup.

**Steps:**
1. Sign up as a new user
2. Go to onboarding/profile setup
3. Enter name: "Jane Smith"
4. Enter workspace name: "Jane's Marketing Agency"
5. Complete profile setup

**Expected Results:**
- ✅ User name updated to "Jane Smith"
- ✅ Organization name updated to "Jane's Marketing Agency"
- ✅ Organization slug updated to "janes-marketing-agency"
- ✅ Default team renamed from "Default" to "Jane's Marketing Agency"

**Verification Queries:**
```sql
-- Check team was renamed
SELECT name FROM team WHERE organization_id = '<org-id>';

-- Should show: "Jane's Marketing Agency" (not "Default")
```

---

## Category 2: Content Isolation

### Test 2.1: Content Creation with Team Context
**Objective:** Verify content is created with correct teamId.

**Steps:**
1. Log in as User 1
2. Switch to "Marketing Team"
3. Create new content: "Marketing Blog Post"
4. Switch to "Engineering Team"
5. Create new content: "Engineering Documentation"

**Expected Results:**
- ✅ "Marketing Blog Post" has `teamId` = Marketing Team ID
- ✅ "Engineering Documentation" has `teamId` = Engineering Team ID
- ✅ Both have same `organizationId`

**Verification Queries:**
```sql
SELECT title, team_id, organization_id
FROM content
WHERE organization_id = '<org-id>';
```

---

### Test 2.2: Content Visibility by Team
**Objective:** Verify users only see content from their teams.

**Steps:**
1. Log in as User 2 (Marketing Team only)
2. Navigate to content list
3. Verify content shown

**Expected Results:**
- ✅ User 2 sees "Marketing Blog Post"
- ✅ User 2 does NOT see "Engineering Documentation"
- ✅ Content count matches team-scoped content only

**Verification:**
- Check UI content list
- Use browser DevTools to inspect API response
- Verify `listContentsByTeam` is called with correct teamId

---

### Test 2.3: Content Access Control
**Objective:** Verify users cannot access content from other teams.

**Steps:**
1. As User 1, copy URL of "Engineering Documentation" (ID: xxx)
2. Log in as User 2 (Marketing Team only)
3. Attempt to navigate directly to `/content/xxx`

**Expected Results:**
- ✅ Request returns 404 NOT_FOUND
- ✅ Content is NOT displayed
- ✅ User is NOT redirected to content editor

**Verification:**
- Check browser console for 404 error
- Verify error message: "Content not found"

---

## Category 3: Forms Isolation

### Test 3.1: Form Creation with Team Context
**Objective:** Verify forms are created with correct teamId.

**Steps:**
1. Log in as User 1
2. Switch to "Marketing Team"
3. Create form: "Contact Form"
4. Switch to "Engineering Team"
5. Create form: "Bug Report Form"

**Expected Results:**
- ✅ "Contact Form" has `teamId` = Marketing Team ID
- ✅ "Bug Report Form" has `teamId` = Engineering Team ID

**Verification Queries:**
```sql
SELECT name, team_id FROM forms WHERE organization_id = '<org-id>';
```

---

### Test 3.2: Form Visibility by Team
**Objective:** Verify users only see forms from their teams.

**Steps:**
1. Log in as User 3 (Engineering Team only)
2. Navigate to forms list

**Expected Results:**
- ✅ User 3 sees "Bug Report Form"
- ✅ User 3 does NOT see "Contact Form"

---

### Test 3.3: Form Submission Isolation
**Objective:** Verify form submissions are properly scoped.

**Steps:**
1. Submit data to "Contact Form" (Marketing Team)
2. Submit data to "Bug Report Form" (Engineering Team)
3. As User 2, check form submissions

**Expected Results:**
- ✅ User 2 sees submissions for "Contact Form" only
- ✅ User 2 does NOT see "Bug Report Form" submissions

---

## Category 4: Analytics Isolation

### Test 4.1: Dashboard Creation with Team Context
**Objective:** Verify dashboards are created with correct teamId.

**Steps:**
1. Log in as User 1
2. Switch to "Marketing Team"
3. Create dashboard: "Marketing KPIs"
4. Switch to "Engineering Team"
5. Create dashboard: "Engineering Metrics"

**Expected Results:**
- ✅ "Marketing KPIs" has `teamId` = Marketing Team ID
- ✅ "Engineering Metrics" has `teamId` = Engineering Team ID

**Verification Queries:**
```sql
SELECT name, team_id FROM dashboards WHERE organization_id = '<org-id>';
```

---

### Test 4.2: Dashboard Visibility by Team
**Objective:** Verify users only see dashboards from their teams.

**Steps:**
1. Log in as User 2 (Marketing Team only)
2. Navigate to dashboards list

**Expected Results:**
- ✅ User 2 sees "Marketing KPIs"
- ✅ User 2 sees "Home" dashboard (if part of Marketing Team)
- ✅ User 2 does NOT see "Engineering Metrics"

---

### Test 4.3: Insight Creation with Team Context
**Objective:** Verify insights are created with correct teamId.

**Steps:**
1. Log in as User 1
2. Switch to "Marketing Team"
3. Create insight: "Marketing Traffic Trend"
4. Switch to "Engineering Team"
5. Create insight: "API Response Times"

**Expected Results:**
- ✅ "Marketing Traffic Trend" has `teamId` = Marketing Team ID
- ✅ "API Response Times" has `teamId` = Engineering Team ID

**Verification Queries:**
```sql
SELECT name, team_id FROM insights WHERE organization_id = '<org-id>';
```

---

### Test 4.4: Insight Visibility by Team
**Objective:** Verify users only see insights from their teams.

**Steps:**
1. Log in as User 3 (Engineering Team only)
2. Navigate to insights/analytics page

**Expected Results:**
- ✅ User 3 sees "API Response Times"
- ✅ User 3 does NOT see "Marketing Traffic Trend"

---

## Category 5: AI Writers (Agents) Isolation

### Test 5.1: Writer Creation with Team Context
**Objective:** Verify writers are created with correct teamId.

**Steps:**
1. Log in as User 1
2. Switch to "Marketing Team"
3. Create writer: "Marketing Content Writer"
4. Switch to "Engineering Team"
5. Create writer: "Technical Documentation Writer"

**Expected Results:**
- ✅ "Marketing Content Writer" has `teamId` = Marketing Team ID
- ✅ "Technical Documentation Writer" has `teamId` = Engineering Team ID

**Verification Queries:**
```sql
SELECT name, team_id FROM writer WHERE organization_id = '<org-id>';
```

---

### Test 5.2: Writer Visibility by Team
**Objective:** Verify users only see writers from their teams.

**Steps:**
1. Log in as User 2 (Marketing Team only)
2. Navigate to writers list

**Expected Results:**
- ✅ User 2 sees "Marketing Content Writer"
- ✅ User 2 does NOT see "Technical Documentation Writer"

---

## Category 6: Organization-Scoped Resources

### Test 6.1: Teams List (Organization-Scoped)
**Objective:** Verify all users can see all teams in their organization.

**Steps:**
1. Log in as User 2 (Marketing Team only)
2. Navigate to Organization Settings > Teams

**Expected Results:**
- ✅ User 2 sees "Default" team
- ✅ User 2 sees "Marketing Team"
- ✅ User 2 sees "Engineering Team"
- ✅ User 2 can see team names but may have limited actions

---

### Test 6.2: Invitations (Organization-Scoped)
**Objective:** Verify invitations are org-scoped but can specify team.

**Steps:**
1. Log in as User 1 (owner)
2. Navigate to Organization Settings > Invitations
3. Create invitation for "newuser@example.com"
4. Select team: "Marketing Team"

**Expected Results:**
- ✅ Invitation is created with `organizationId`
- ✅ Invitation includes `teamId` = Marketing Team ID
- ✅ When accepted, new user is added to Marketing Team

---

### Test 6.3: Webhooks (Organization-Scoped)
**Objective:** Verify webhooks are organization-scoped, not team-scoped.

**Steps:**
1. Log in as User 1
2. Navigate to Settings > Webhooks
3. Create webhook endpoint
4. Switch teams
5. Check webhooks list

**Expected Results:**
- ✅ Webhook endpoint has `organizationId` only (no `teamId`)
- ✅ Webhook is visible across all teams
- ✅ Webhook receives events from all teams

---

## Category 7: Events and Analytics Tracking

### Test 7.1: Event Emission with teamId
**Objective:** Verify all billable events include teamId.

**Steps:**
1. Log in as User 1
2. Switch to "Marketing Team"
3. Create content (triggers `content.created` event)
4. Publish content (triggers `content.published` event)
5. Create form (triggers `form.created` event)

**Expected Results:**
- ✅ All events in `events` table have `team_id` column populated
- ✅ Events have correct `team_id` matching active team

**Verification Queries:**
```sql
SELECT event_name, organization_id, team_id
FROM events
WHERE organization_id = '<org-id>'
ORDER BY timestamp DESC
LIMIT 10;
```

---

### Test 7.2: Usage Tracking by Team
**Objective:** Verify usage can be tracked per team.

**Steps:**
1. Create content in "Marketing Team"
2. Create content in "Engineering Team"
3. Check usage views

**Expected Results:**
- ✅ `current_month_usage_by_team` view shows separate entries per team
- ✅ Team-level usage is tracked correctly

**Verification Queries:**
```sql
SELECT team_id, event_category, event_count, month_to_date_cost
FROM current_month_usage_by_team
WHERE organization_id = '<org-id>';
```

---

## Category 8: Team Switching

### Test 8.1: Active Team Context Switch
**Objective:** Verify switching teams updates context correctly.

**Steps:**
1. Log in as User 1
2. Navigate to content list (should show Marketing Team content)
3. Switch to "Engineering Team" via team switcher
4. Verify content list updates

**Expected Results:**
- ✅ Content list refreshes
- ✅ Only Engineering Team content is shown
- ✅ Session `activeTeamId` is updated
- ✅ All subsequent requests use new `teamId`

**Verification:**
- Check browser DevTools > Network tab
- Verify API requests include new `teamId`
- Check session in database:
```sql
SELECT active_team_id FROM session WHERE user_id = '<user-id>';
```

---

### Test 8.2: Team Context Persistence
**Objective:** Verify active team persists across page reloads.

**Steps:**
1. Log in as User 1
2. Switch to "Marketing Team"
3. Refresh browser (F5)
4. Check which team is active

**Expected Results:**
- ✅ User remains on "Marketing Team" after refresh
- ✅ Content list shows Marketing Team content
- ✅ Session `activeTeamId` is unchanged

---

## Category 9: Migration Verification

### Test 9.1: Existing Content Migration
**Objective:** Verify all existing content has teamId.

**Steps:**
1. Run migration verification script (if available)
2. Check database for null teamIds

**Verification Queries:**
```sql
-- Should return 0 rows
SELECT COUNT(*) FROM content WHERE team_id IS NULL;

-- Check distribution
SELECT team_id, COUNT(*)
FROM content
GROUP BY team_id;
```

---

### Test 9.2: Existing Forms Migration
**Objective:** Verify all existing forms have teamId.

**Verification Queries:**
```sql
-- Should return 0 rows
SELECT COUNT(*) FROM forms WHERE team_id IS NULL;
```

---

### Test 9.3: Existing Dashboards Migration
**Objective:** Verify all existing dashboards have teamId.

**Verification Queries:**
```sql
-- Should return 0 rows
SELECT COUNT(*) FROM dashboards WHERE team_id IS NULL;
```

---

### Test 9.4: Existing Insights Migration
**Objective:** Verify all existing insights have teamId.

**Verification Queries:**
```sql
-- Should return 0 rows
SELECT COUNT(*) FROM insights WHERE team_id IS NULL;
```

---

### Test 9.5: Existing Writers Migration
**Objective:** Verify all existing writers have teamId.

**Verification Queries:**
```sql
-- Should return 0 rows
SELECT COUNT(*) FROM writer WHERE team_id IS NULL;
```

---

## Category 10: Edge Cases

### Test 10.1: User with No Team Access
**Objective:** Verify behavior when user has no team membership.

**Steps:**
1. Create User 4
2. Add User 4 to organization as member
3. Do NOT add to any team
4. Log in as User 4

**Expected Results:**
- ✅ User can log in
- ✅ Session `activeTeamId` is null
- ✅ User sees empty content/forms/dashboards lists
- ✅ User is prompted to contact admin or create a team (if owner)

---

### Test 10.2: Team Deletion
**Objective:** Verify cascade deletion works correctly.

**Steps:**
1. Create test team "Temp Team"
2. Create content in "Temp Team"
3. Delete "Temp Team"

**Expected Results:**
- ✅ Team is deleted
- ✅ Content in team is also deleted (cascade)
- ✅ Team members are removed from team
- ✅ Users previously in team switch to another team

---

### Test 10.3: Last Team Deletion Prevention
**Objective:** Verify organization must have at least one team.

**Steps:**
1. Attempt to delete the last remaining team

**Expected Results:**
- ✅ Deletion is prevented
- ✅ Error message: "Cannot delete the last team in organization"

---

## Summary Checklist

After completing all tests, verify:

- [ ] All new resources (content, forms, dashboards, insights, writers) have `teamId`
- [ ] Users can only see resources from their teams
- [ ] Users cannot access resources from other teams via direct URL
- [ ] Team switching works correctly
- [ ] Active team persists across sessions
- [ ] All events include `teamId`
- [ ] Organization-scoped resources (webhooks, teams, invitations) are visible across teams
- [ ] Default team is created on signup
- [ ] Default team is renamed during onboarding
- [ ] All migrations completed successfully (no null `teamId` values)
- [ ] Team deletion cascades correctly

---

## Reporting Issues

If any test fails, report with:
1. Test number and name
2. Steps to reproduce
3. Expected vs actual result
4. Screenshots or logs
5. Database query results (if applicable)

---

**Last Updated:** 2026-02-14
**Version:** 1.0
