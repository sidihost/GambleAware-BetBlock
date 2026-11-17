# Security Specification — GambleAware Cloud Sync

## Phase 0: Data Invariants
1. **Strict Ownership Isolation**: Every document across `/users/{userId}` and its subcollections (`private`, `profile`, `domains`, `blockedApps`, `events`, `urgeLogs`) belongs exclusively to `userId` where `request.auth.uid == userId` and `data.ownerId == request.auth.uid`.
2. **Email Verification Mandate**: All mutations (`create`, `update`) require `request.auth.token.email_verified == true`.
3. **Master Gate Integrity**: Subcollection writes (`domains`, `blockedApps`, `events`, `urgeLogs`, `profile`, `private`) verify that the root anchor `/users/{userId}` exists (`exists(...)`) to prevent orphaned subcollection trees.
4. **PII Isolation**: `email` and `displayName` are confined solely to `/users/{userId}/private/{docId}` and forbidden from root or listable documents.
5. **Temporal Integrity**: `createdAt` is verified equal to `request.time` at creation and immutable thereafter. Mutable documents verify `updatedAt == request.time` on update.
6. **Immutable Append-Only Logs**: `events` and `urgeLogs` cannot be edited after creation (`allow update: if false`).
7. **Zero Privilege Escalation / Zero Shadow Fields**: `UserRoot.planTier` is locked strictly to `'free'`. All writes validate exact `hasAll` + `hasOnly` field allowlists, strict string `.size()` bounds, regex patterns matching `firebase-blueprint.json`, and `affectedKeys().hasOnly(...)` action gates on `update`.
8. **Secure List Queries**: `allow list` never delegates filtering to the client and never invokes `get()`/`exists()`. It strictly asserts `isOwner(userId) && resource.data.ownerId == request.auth.uid`.

## Phase 0: The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Cross-User Read/Write**: Authenticated user `uid_attacker` attempts `get` or `set` on `/users/uid_victim/profile/settings`.
2. **Shadow Field Injection ("Ghost Field")**: Authenticated owner sends `{ ..., isAdmin: true }` or `{ ..., role: 'superadmin' }` to `/users/{uid}/profile/settings`.
3. **Paid-Tier Privilege Spoof**: Authenticated owner sends `{ ownerId: uid, planTier: 'enterprise', createdAt: serverTimestamp, updatedAt: serverTimestamp }` to `/users/{uid}`.
4. **Unverified Email Bypass**: Authenticated user with `email_verified: false` attempts any `create` or `update` write.
5. **OwnerId Hijack**: Owner creates a `CustomDomainRule` under `/users/{uid}/domains/bet9ja_com` with `ownerId: 'other_uid'`.
6. **Orphaned Subcollection Write**: Authenticated user attempts `create` on `/users/{uid}/domains/sportybet_com` when `/users/{uid}` does not exist.
7. **ID Poisoning**: User attempts `create` with a 400-char or slash/script document ID (`id.size() > 128` or failing `^[a-zA-Z0-9_\-]+$`).
8. **Client Timestamp Forgery**: User supplies a backdated `Date` for `createdAt` or `updatedAt` instead of `request.time`.
9. **Immutable Field Mutation**: User updates `profile/settings` while changing `createdAt` or `ownerId`.
10. **Denial-of-Wallet String Bloat**: User submits a 10KB string inside `UrgeLog.note` (`> 280` chars) or `CustomDomainRule.domain` (`> 253` chars).
11. **Regex Domain Injection**: User creates `CustomDomainRule` with invalid/XSS domain `"<script>alert(1)</script>"` failing `^[a-z0-9.-]+\.[a-z]{2,}$`.
12. **Blanket List Scraping**: Attacker attempts `list` across another user's subcollection or unauthenticated collection group.
