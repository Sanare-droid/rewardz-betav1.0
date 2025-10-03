# Project Status

Owner: mzangasanare@gmail.com

## Overview

Rewardz web app built with Vite + React Router + Tailwind. Backend scaffolding (Express) and Netlify Function included. This document tracks progress, gaps to production, and required integrations.

## Implemented

- App shell, theming, and responsive mobile layout
- Core routes: Home, Alerts, Search, Community, Profile, Login/Signup, Onboarding, Splash, Get Started
- Lost/Found flows: Report Lost/Found, Match, Claim Reward, Confirm Reunion, Payment, Payment Success, Poster, Report View, Report Submitted, Dialer
- React Router v6 SPA with Link-based navigation
- User context (localStorage) for simple identity and greetings
- Stock images (placeholder pet photos) wired across UI
- Builder preview alias routes to prevent 404s (OwnerContact/ClaimReward/etc.)
- Netlify SPA redirect (/\* -> /index.html) to fix deep-link 404s in production

## Gaps to MVP (next steps)

- Real authentication (email/password, OAuth)
- Persistent database (users, reports, pets, rewards, matches)
- Image/file uploads for pet photos
- Payments processing for rewards
- Geolocation and maps (report location, search radius)
- Notifications (email, SMS, push)
- Moderation/reporting and audit logs
- Accessibility, performance, analytics, error monitoring

## Recommended Integrations (MCP-enabled)

- Authentication + DB + Storage: Supabase (auth, Postgres, file storage) or Neon (Postgres) + Prisma; [Connect to Supabase](#open-mcp-popover) or [Connect to Neon](#open-mcp-popover) and [Connect to Prisma Postgres](#open-mcp-popover)
- Payments: Stripe for reward escrow/payouts (server webhook + client SDK)
- Maps/Geolocation: Mapbox or Google Maps (place search, reverse geocode)
- Notifications: OneSignal or Firebase Cloud Messaging; email via Resend/SendGrid; SMS via Twilio
- Error Monitoring: [Connect to Sentry](#open-mcp-popover)
- Content Management: [Connect to Builder.io](#open-mcp-popover)
- Automation: [Connect to Zapier](#open-mcp-popover)
- Deployment/Hosting: [Connect to Netlify](#open-mcp-popover) or [Connect to Vercel](#open-mcp-popover)

## Data Model (initial)

- users(id, email, name, avatar_url)
- pets(id, owner_id, name, species, breed, color, photos[], tags)
- reports(id, type[LOST|FOUND], pet_id?, location, description, status)
- rewards(id, report_id, amount_cents, status)
- matches(id, lost_report_id, found_report_id, score)
- messages(id, from_user_id, to_user_id, report_id, body)

## Security/Privacy

- Auth required for posting/editing; rate-limit APIs
- Validate uploads (size/type), store in private buckets where applicable
- Sensitive actions signed and audited; avoid logging PII/secrets

## QA Checklist

- [ ] All deep-links load (Netlify redirect + route aliases)
- [ ] Navigation uses Link (no hard reloads)
- [ ] Forms validate and show errors
- [ ] Mobile layout verified on common devices
- [ ] No console errors; 404/500 handled

## Deployment Status

- Netlify configuration present; SPA redirect added
- Next: connect MCP and deploy: [Open MCP popover](#open-mcp-popover)
