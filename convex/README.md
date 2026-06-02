# Convex Implementation Staging

This folder now contains the live Convex schema/functions for the TOEFL 120 Coach development deployment.

When account access is available:

```bash
npm install
npm run convex:dev
```

Current deployment:

```bash
CONVEX_DEPLOYMENT=dev:pleasant-quail-129
NEXT_PUBLIC_CONVEX_URL=https://pleasant-quail-129.convex.cloud
```

Current auth provider:

```bash
CLERK_JWT_ISSUER_DOMAIN=https://assuring-snake-39.clerk.accounts.dev
```

Do not launch the app publicly until user-owned Convex mutations replace full-state `/api/state` writes for progress-changing events.
