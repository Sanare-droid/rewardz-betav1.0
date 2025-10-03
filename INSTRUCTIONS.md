# Runbook: Local and Production

## Local Development

Prereqs: Node 18+, pnpm (project uses pnpm). Commands:

- Install: pnpm install
- Dev server: pnpm dev (opens Vite dev server)
- Type-check: pnpm typecheck
- Lint/format: pnpm format.fix
- Tests: pnpm test

Build and serve:

- Build client: pnpm build:client
- Build server: pnpm build:server
- Full build: pnpm build
- Start (serve built server bundle): pnpm start

Notes

- SPA routing works in dev via Vite; all in-app links should use React Router Link
- If a deep-link 404 occurs in production, ensure redirects are configured (see below)

## Environment (.env)

Create a .env file at the project root (do not commit secrets). Copy-paste this starter and adjust as needed:

```
# Client (Vite) Firebase config — safe (public web config)
VITE_FIREBASE_API_KEY=AIzaSyCjTTB7gDwdxHUUTH9aZg7rRwJ8knzE3LM
VITE_FIREBASE_AUTH_DOMAIN=rewardz-fe98e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rewardz-fe98e
VITE_FIREBASE_STORAGE_BUCKET=rewardz-fe98e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=429394245504
VITE_FIREBASE_APP_ID=1:429394245504:web:706cc538e61c7b2869b365
VITE_FIREBASE_MEASUREMENT_ID=G-FX616JPYRJ

# Optional client config
VITE_API_BASE_URL=

# Server (do NOT commit real secrets)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# If using webhook Firestore writes, paste JSON for a Firebase service account (single line)
FIREBASE_SERVICE_ACCOUNT=

# Misc
PING_MESSAGE=ping
```

For production: set the same variables in your hosting dashboard (Netlify/Vercel). Do not commit STRIPE_* or FIREBASE_SERVICE_ACCOUNT.

## Production Deployment

You can deploy with Netlify or Vercel. This repo includes Netlify config (netlify.toml) and a Netlify Function.

Netlify

1. [Connect to Netlify](#open-mcp-popover) and deploy via MCP
2. Build command: npm run build:client (defined in netlify.toml)
3. Publish dir: dist/spa
4. SPA redirect included: /\* → /index.html (status=200)
5. Configure env vars in Netlify dashboard if needed

Vercel

1. [Connect to Vercel](#open-mcp-popover) and deploy via MCP
2. Framework: Vite; Build: vite build; Output: dist
3. Add a rewrite/fallback for SPA routes if needed

Preview Links

- Use [Open Preview](#open-preview) for a non-production link during development

## Suggested Integrations (optional, MCP)

- [Connect to Supabase](#open-mcp-popover) for auth, DB, storage
- [Connect to Neon](#open-mcp-popover) + [Connect to Prisma Postgres](#open-mcp-popover) for Postgres ORM
- [Connect to Sentry](#open-mcp-popover) for monitoring
- [Connect to Builder.io](#open-mcp-popover) for CMS/content
- [Connect to Zapier](#open-mcp-popover) for automations

## Convert to React Native (Expo)

Approach: keep web app; create a sibling Expo app to reuse business logic.

Steps

1. Initialize: npx create-expo-app rewardz-native --template
2. Monorepo (optional): move shared code to /shared and set pnpm workspaces
3. UI: replace web components with React Native primitives; consider NativeWind for Tailwind-like styling
4. Navigation: React Navigation (stack + tabs)
5. State/API: reuse shared TS modules; use fetch/React Query; store auth tokens securely (expo-secure-store)
6. Images: use expo-image; upload to Supabase Storage or S3
7. Maps/Location: expo-location + react-native-maps
8. Notifications: expo-notifications or Firebase
9. Payments: Stripe React Native (or in-app purchase for certain flows)
10. Build: Expo EAS (eas build) for iOS/Android; submit with eas submit

Tips

- Avoid DOM/Browser-only APIs; gate platform code with Platform.OS checks
- Keep business logic UI-agnostic in /shared; only view code differs per platform
