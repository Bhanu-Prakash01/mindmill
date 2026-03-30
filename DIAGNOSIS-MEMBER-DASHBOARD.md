# Member Dashboard Allocation Bug — Diagnosis & Fix

**Date:** 2026-03-30
**Issue:** Admin allocates 25 test slots to a member, but assessments don't appear on the Member Dashboard

## Root Causes Found

### Bug 1: `assignAssessment` silently skips allocation for non-assigned members
**File:** `backend/controllers/assessmentController.js` (line ~542)
**Impact:** When admin uses `POST /api/assessments/:id/assign` with `memberSlots` for a user not yet in `assignedUsers`, the allocation is **silently skipped** with `continue`. No error is thrown — the admin sees "success" but the allocation never happens.

**Fix:** Changed `continue` to auto-assign the user:
```javascript
// BEFORE (bug): silently skips
if (!assessment.assignedUsers.map(u => u.toString()).includes(memberId)) {
  continue;
}

// AFTER (fix): auto-assigns user then allocates
if (!assessment.assignedUsers.map(u => u.toString()).includes(memberId)) {
  assessment.assignedUsers.push(memberId);
  await User.findByIdAndUpdate(memberId, {
    $addToSet: { assignedAssessments: assessment._id }
  });
}
```

### Bug 2: `allocateToMembers` rejects unassigned members
**File:** `backend/controllers/assessmentController.js` (line ~1477)
**Impact:** `POST /api/assessments/:id/allocate` throws an error if members aren't already in `assignedUsers`. Admin must use the assign endpoint first, then allocate — a confusing two-step process.

**Fix:** Changed error to auto-assign:
```javascript
// BEFORE (bug): throws error
if (unassignedMembers.length > 0) {
  throw new ApiError(400, 'Some members are not assigned...');
}

// AFTER (fix): auto-assigns then proceeds
if (unassignedMembers.length > 0) {
  for (const memberId of unassignedMembers) {
    assessment.assignedUsers.push(memberId);
  }
  await User.updateMany(
    { _id: { $in: unassignedMembers } },
    { $addToSet: { assignedAssessments: assessment._id } }
  );
}
```

### Bug 3: `getUserDashboard` hides assessments with exhausted slots
**File:** `backend/controllers/dashboardController.js` (line ~362)
**Impact:** The `availableAssessments` filter requires `testsRemaining > 0` OR `slotsRemaining > 0`. If a member has an allocation with 0 remaining AND the org has 0 general slots, the assessment is hidden even though the member should see their usage.

**Fix:** Show assessments whenever a member allocation entry exists:
```javascript
// BEFORE (bug): requires remaining slots
unlockedAssessments = unlockedAssessments.filter(a => {
  if (a.memberAllocation && a.memberAllocation.testsRemaining > 0) return true;
  return a.slotsRemaining > 0;
});

// AFTER (fix): shows if member has any allocation entry
unlockedAssessments = unlockedAssessments.filter(a => {
  if (a.memberAllocation) return true;
  return a.slotsRemaining > 0;
});
```

## Data Flow (How It Should Work After Fix)

```
Admin clicks "Assign & Allocate" modal
  → POST /api/assessments/:id/assign { userIds: [...], memberSlots: { userId: 25 } }
  → Backend:
     1. Adds user to assessment.assignedUsers (FIXED: auto-adds if missing)
     2. Updates user.assignedAssessments
     3. Creates assessment.memberAllocations entry { testsAllowed: 25 }
     4. Saves assessment
  → Member logs in
  → GET /api/dashboard/user
  → Backend queries: Assessment.find({ memberAllocations: { $elemMatch: { org, member } } })
  → Finds assessment → enriches with memberAllocation
  → Returns assessment in myAssignedAssessments AND availableAssessments
  → Member sees assessment in both "My Assigned Tests" and "Available Assessments"
```

## Verification Steps

1. Restart the backend server
2. Have the admin open the **Assign & Allocate** modal for the assessment
3. Select the member, set 25 test slots
4. Click "Assign & Allocate"
5. Member refreshes their dashboard
6. Assessment should appear in "My Assigned Tests" AND "Available Assessments" sidebar

## Important Distinction

| Action | What It Does | Member Sees Assessment? |
|--------|-------------|------------------------|
| **Unlock** (Unlock Assessment modal) | Adds org to `unlockedBy` (25 org slots) | Only in sidebar (if slots remain) |
| **Assign** (Assign & Allocate modal, no slots) | Adds to `assignedUsers` | In "My Assigned Tests" |
| **Allocate** (Assign & Allocate modal, with slots) | Creates `memberAllocations` entry | In "My Assigned Tests" + sidebar |

The admin must use the **Assign & Allocate** modal (not just Unlock) to make assessments appear in the member's "My Assigned Tests" section.
