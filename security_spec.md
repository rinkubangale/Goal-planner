# Security Specification for Ascent Tracker

## 1. Data Invariants
- A goal must always have a `userId` matching the authenticated user.
- A contribution must always have a `userId` matching the user and a `goalId` that matches a valid goal document belonging to that user.
- Users can only read and write their own data.
- Timestamps must be validated using `request.time`.

## 2. The Dirty Dozen Payloads (Targeting PERMISSION_DENIED)

1. **Identity Spoofing**: Creating a goal with a `userId` that isn't yours.
2. **Goal Hijacking**: Attempting to read another user's goal document.
3. **Ghost Contributions**: Adding a contribution to a goal owned by someone else.
4. **Blanket Read Attack**: Trying to list all goals without a `where` clause filtering by `userId`. (Note: Rules will enforce this via `resource.data.userId == request.auth.uid`).
5. **Schema Poisoning**: Sending a 1MB string as a goal name.
6. **Type Mismatch**: Sending a string for `targetAmount`.
7. **Timestamp Fraud**: Setting `createdAt` to a past date manually.
8. **Immutability Breach**: Attempting to change `userId` on an existing goal.
9. **Role Escalation**: Attempting to write to an `admins` collection if it existed.
10. **State Corruption**: Attempting to modify `targetAmount` while only supposedly updating the `name` (Shadow Update).
11. **Negative Value Attack**: Creating a contribution with a negative amount.
12. **Orphaned Writes**: Creating a contribution for a non-existent goal ID by bypassing the relational check.

## 3. Test Runner (Draft)
A `firestore.rules.test.ts` would be needed to verify these, focusing on `assertFails` for each of the above.
