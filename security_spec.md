# Security Spec

## Data Invariants
1. A user profile must belong to the authenticated user.
2. A saved look must belong to the authenticated user and be stored in their `savedLooks` subcollection.

## The "Dirty Dozen" Payloads
1. Create user profile with mismatched userId
2. Create user profile with missing heightCm
3. Update user profile injecting an admin flag
4. Update user profile constraints with > 20 fabrics
5. Create user profile with too long userId
6. Create saved look without valid lookId
7. Create saved look with mismatched userId
8. Read another user's profile
9. Read another user's saved look
10. Update another user's profile
11. Query saved looks without auth
12. Create saved look with a string for priceUSD

## The Test Runner
(Would be implemented in `firestore.rules.test.ts`)
