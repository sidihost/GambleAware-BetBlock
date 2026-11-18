# Security Specification — GambleAware Cloud Sync, Support & Admin Console

## Phase 0: Data Invariants
1. **Strict Ownership Isolation**: Every document across `/users/{userId}` and its subcollections (`private`, `profile`, `goals`, `domains`, `blockedApps`, `events`, `urgeLogs`, `surveys`) belongs exclusively to `userId` where `request.auth.uid == userId` and `data.ownerId == request.auth.uid`.
2. **Email Verification Mandate**: All mutations (`create`, `update`, `delete`) require `request.auth.token.email_verified == true`.
3. **Master Gate Integrity**: Subcollection writes verify that the root anchor `/users/{userId}` exists (`exists(...)`) to prevent orphaned subcollection trees.
4. **Admin Bootstrapping & Isolation**: Admin privilege (`isAdmin()`) requires `isVerifiedUser()` AND either bootstrapped superadmin email `'jaredkiu@gmail.com'` OR existence of `/admins/$(request.auth.uid)`. Non-admins cannot read another user's `recoveryProfiles`, `supportTickets`, or `admins` list.
5. **Server-Side Commitment Lock Integrity**: When `existing().lockUntilEpochMs > request.time.toMillis()`, `profile/settings` updates cannot lower `lockUntilEpochMs`, disable `isProtectionEnabled`, disable `antiTamperLockEnabled`, or delete the `profile/settings` document.
6. **Temporal Integrity**: `createdAt` equals `request.time` at creation and is immutable thereafter. Mutable documents verify `updatedAt == request.time` on update.
7. **Support Ticket Separation of Duties**: Users create tickets only with `status == 'OPEN'` and `adminReply == ''`. Users can only update `subject`/`message`/`status in ['OPEN', 'CLOSED']` on their own tickets and cannot forge `adminReply` or `respondedByEmail`. Only `isAdmin()` can transition to `IN_PROGRESS` or `RESOLVED` and write `adminReply`.
8. **Zero Privilege Escalation / Zero Shadow Fields**: `UserRoot.planTier` is locked strictly to `'free'`. All writes validate exact `hasAll` + `hasOnly` field allowlists, strict string `.size()` bounds, regex patterns matching `firebase-blueprint.json`, and `affectedKeys().hasOnly(...)` action gates on `update`.
9. **Secure List Queries**: `allow list` never delegates filtering to the client and never invokes `get()`/`exists()` inside collection queries. It strictly asserts `isOwner(userId) && resource.data.ownerId == request.auth.uid` (or `isAdmin()` for `recoveryProfiles`/`supportTickets`).

## Phase 0: The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Cross-User Read/Write**: Authenticated non-admin `uid_attacker` attempts `get` or `set` on `/users/uid_victim/profile/settings` or `/recoveryProfiles/uid_victim`.
2. **Shadow Field Injection ("Ghost Field")**: Authenticated owner sends `{ ..., isAdmin: true }` or `{ ..., role: 'superadmin' }` to `/users/{uid}/profile/settings` or `/supportTickets/{ticketId}`.
3. **Paid-Tier Privilege Spoof**: Authenticated owner sends `{ ownerId: uid, planTier: 'enterprise', createdAt: serverTimestamp, updatedAt: serverTimestamp }` to `/users/{uid}`.
4. **Unverified Email Bypass**: Authenticated user with `email_verified: false` attempts any `create`, `update`, or `delete` write.
5. **OwnerId Hijack**: Owner creates a `SupportTicket` or `RecoveryProfile` with `ownerId: 'other_uid'`.
6. **Admin Reply Forgery**: Non-admin ticket owner attempts to update `adminReply` or set `status: 'RESOLVED'` with `respondedByEmail` on `/supportTickets/{ticketId}`.
7. **ID Poisoning**: User attempts `create` with a 400-char or slash/script document ID (`id.size() > 128` or failing `^[a-zA-Z0-9_\-]+$`).
8. **Client Timestamp Forgery**: User supplies a backdated `Date` for `createdAt` or `updatedAt` instead of `request.time`.
9. **Immutable Field Mutation**: User updates `recoveryProfiles/{uid}` or `supportTickets/{ticketId}` while changing `createdAt` or `ownerId`.
10. **Denial-of-Wallet String Bloat**: User submits a 10KB string inside `SupportTicket.message` (`> 2000` chars) or `RecoverySurvey.summary` (`> 500` chars).
11. **Commitment Lock Bypass**: While `lockUntilEpochMs > request.time.toMillis()`, user tries to shorten `lockUntilEpochMs`, set `isProtectionEnabled: false`, set `antiTamperLockEnabled: false`, or delete `profile/settings`.
12. **Unauthorized Admin Privilege Grant**: Non-admin user attempts `create` on `/admins/{uid}` to escalate themselves.
