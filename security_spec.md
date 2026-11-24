# Security Specification & Payload-First TDD (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny**: All unspecified Firestore paths deny read and write (`match /{document=**} { allow read, write: if false; }`).
2. **Draft & Visibility Isolation**: Unauthenticated or non-admin visitors may ONLY `get` or `list` public portfolio documents (`profile`, `experiences`, `organizations`, `education`, `certificates`, `trainings`, `skills`, `interests`, `projects`, `publications`, `contacts`, `siteSettings`) where `resource.data.status == 'published' && resource.data.isVisible == true`.
3. **Admin RBAC Verification**: Write, update, delete, and draft-read operations require `request.auth != null && request.auth.token.email_verified == true` AND either an existing document at `/admins/$(request.auth.uid)` or the verified bootstrapped owner email (`osamanursamsil@gmail.com`). Public self-registration to `/admins` is strictly forbidden.
4. **PII Isolation**: Visitor inquiries in `/contactMessages/{messageId}` allow public `create` ONLY with `status == 'new'` and strict schema bounds; `get`, `list`, `update`, and `delete` are strictly restricted to verified admins.
5. **Strict Schema & Immutability**: Every write validates required & allowed keys (`hasAll` + `hasOnly`), string `.size()` limits, bounded array sizes (`<= 12` or `<= 8`), server timestamps (`request.time`), and `createdAt` immutability on updates.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Self-Admin Escalation**: Non-admin user attempts `create` on `/admins/{ownUid}` with `{ role: "super_admin", email: "attacker@example.com", displayName: "Hacker", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }`.
2. **Unverified Admin Email Spoof**: User with `email: "osamanursamsil@gmail.com"` and `email_verified: false` attempts `update` on `/profile/main`.
3. **Draft Leakage via Direct Get**: Public visitor attempts `get` on `/projects/draft_proj_1` where `status == "draft"`.
4. **Hidden Content Scraping via List**: Public visitor executes `list` on `/certificates` without filtering `status == "published"` and `isVisible == true`.
5. **Shadow Field Injection on Create**: Admin attempts `create` on `/skills/s1` including ghost field `isVerified: true` not in `hasOnly(...)`.
6. **Value Poisoning on Update**: Admin attempts `update` on `/projects/p1` with `title: 12345` (non-string) or a 10KB string exceeding `maxLength: 200`.
7. **ID Poisoning**: Attacker attempts `create` on `/contactMessages/<200-char-junk-id-with-slashes>` violating `isValidId()`.
8. **Client-Spoofed Timestamp**: Public visitor submits `/contactMessages/m1` with `createdAt: Timestamp.fromDate(new Date('2020-01-01'))` instead of `request.time`.
9. **Immutable Timestamp Tampering**: Admin attempts `update` on `/experiences/e1` modifying `createdAt`.
10. **PII Read Leak**: Non-admin authenticated user attempts `get` or `list` on `/contactMessages`.
11. **Contact Message Status Spoofing**: Public visitor submits `/contactMessages/m2` with `status: "replied"` instead of `"new"`.
12. **Unbounded Array Resource Exhaustion**: Admin attempts `create` on `/experiences/e2` with `responsibilities` containing 50 items (exceeds `<= 12` guard) or non-string first element.
