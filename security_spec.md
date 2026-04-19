# Security Specification: ProScout AI

## Data Invariants
1. A user can only edit their own profile.
2. Only users with the 'scout' role can create or modify assessments.
3. Athletes can only read assessments where they are the 'athleteId'.
4. News can only be modified by admins.
5. All IDs must be valid strings.

## The "Dirty Dozen" Payloads (Denial Expected)
1. Unauthorized profile update (changing someone else's bio).
2. Privilege escalation (Athlete trying to set their role to 'scout').
3. Shadow field injection (`isVerified: true` in user profile).
4. Invalid ID poisoning (1.5KB string as userId).
5. Orphaned assessment (invalid athleteId).
6. Fake scout creation (uid mismatch in request.auth).
7. Unauthorized assessment read (Athlete reading someone else's assessment).
8. Admin news update by regular user.
9. Mutation of terminal state (if any).
10. Large payload denial of wallet (metric values > 1000).
11. Untrusted timestamp in assessment.
12. Resource scraping (listing all users without permission).

## Test Runner (firestore.rules.test.ts placeholder)
// I will implement the rules and then verify via manual review as per environment limits.
