# WePay — Deployment & Android Release Guide

The Android app talks to the **same Next.js backend** as the website. Deploy the backend first, then build the app pointing at it.

```
Android app (apps/mobile)  ──HTTPS──▶  Next.js API (Vercel)  ──▶  PostgreSQL
Website (src/app)          ──cookie─▶  same API
```

---

## 1. Database

Use any managed PostgreSQL (Neon, Supabase, Railway, AWS RDS…).

**Existing database (keeps all users):** the mobile release adds four new tables and changes nothing else. Apply either:

```bash
npm run db:push                       # what this project already uses
# or, if you prefer reviewed SQL:
psql "$DATABASE_URL" -f prisma/sql/001_mobile_support.sql
```

**Brand-new database:** `npm run db:push` creates everything.

> Back up production before any schema change. `001_mobile_support.sql` is wrapped in a transaction and uses `IF NOT EXISTS`, so it's safe to re-run.

## 2. Backend (Next.js on Vercel)

1. Import the GitHub repo into Vercel (framework auto-detected; root directory = repo root).
2. Set environment variables (Production):

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (use the pooled URL on Neon/Supabase) |
| `NEXTAUTH_URL` | yes | `https://your-domain` |
| `NEXTAUTH_SECRET` | yes | `openssl rand -base64 32` |
| `MOBILE_JWT_SECRET` | yes | `openssl rand -base64 48` — **different** from `NEXTAUTH_SECRET`. Rotating it signs every phone out. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | for password reset | Any SMTP provider (Resend, Mailgun, Zoho, Google Workspace). Without these, "Forgot password" honestly tells users to contact support. |

3. Deploy, then smoke-test:

```bash
curl -i https://your-domain/api/user/profile          # expect 401
curl -i -X POST https://your-domain/api/mobile/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"someone@example.com","password":"wrong"}'   # expect 401 "Invalid email or password"
```

HTTPS is automatic on Vercel. The app refuses non-HTTPS API URLs in release builds (except `localhost`/emulator addresses for testing).

## 3. Android app

### One-time setup
```bash
cd apps/mobile
npm install
npm install -g eas-cli        # or use: npx eas-cli@latest <command>
eas login                     # free Expo account
eas init                      # links the project; writes extra.eas.projectId into app.json
```

### Point the app at your backend
Edit `apps/mobile/eas.json` and replace `https://REPLACE-WITH-YOUR-BACKEND-DOMAIN` in the `preview` and `production` profiles. A build with the placeholder shows an "App not configured" screen instead of running.

Optional: set `EXPO_PUBLIC_SUPPORT_EMAIL` in the same `env` blocks to show an "Email support" button in Help.

### Build an APK (direct install / testing)
```bash
npm run build:apk        # = eas build --platform android --profile preview
```
EAS prints a link. Open it on the phone to download and install the APK. It runs without any laptop or dev server.

### Build an AAB (Google Play)
```bash
npm run build:aab        # = eas build --platform android --profile production
```

### Signing
On the first Android build, EAS offers to **generate an upload keystore and stores it securely** for you. Accept that unless you already have a keystore. Back it up: `eas credentials` → Android → download. Losing it means you can't publish updates under the same Play listing (Play App Signing can recover this if enabled).

### Identity
- App name: **WePay**
- Package ID: **`zm.wepay.app`** (`app.json` → `android.package`). This **cannot change** after the first Play upload, so change it now if you own a different domain (e.g. `com.yourcompany.wepay`).
- Version: bump `expo.version` for user-visible releases; `versionCode` auto-increments on production builds (`appVersionSource: remote`).
- Permissions: only `INTERNET` and `ACCESS_NETWORK_STATE`. Storage, microphone and overlay permissions are explicitly blocked. `allowBackup` is off, so tokens aren't copied into cloud backups.

### Google Play checklist
- Play Console developer account; create the app, upload the AAB to Internal testing first.
- **Data safety form**: declare name, email, phone, government ID (NRC), financial info (salary, loans), collected for account management / app functionality, encrypted in transit.
- **Financial features declaration**: Google requires personal-loan apps to declare that, show APR (18% p.a. here) and repayment period (1–36 months), and in many markets to provide licensing information. Confirm WePay's licensing position with the Bank of Zambia before public release.
- Privacy policy URL (hosted page, lawyer-reviewed).

## 4. Running locally

```bash
# backend
cp .env.example .env      # fill DATABASE_URL, NEXTAUTH_SECRET, MOBILE_JWT_SECRET
npm install && npm run db:push && npm run dev

# app (Android emulator reaches your laptop at 10.0.2.2)
cd apps/mobile
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 npx expo run:android
```
`expo run:android` makes a local development build (needs Android Studio). For a quicker loop, `npx expo start` with the Expo Go app also works, as long as your Expo Go version supports SDK 58.

## 5. Tests

```bash
# API integration tests — need a disposable Postgres DB whose name contains "test"
createdb wepay_test && DATABASE_URL=postgresql://localhost/wepay_test npx prisma db push
DATABASE_URL=postgresql://localhost/wepay_test MOBILE_JWT_SECRET=$(openssl rand -hex 32) npm run test:api

npm run typecheck && npm run build          # web app still builds
cd apps/mobile && npm run typecheck && npm run lint
```
The test suite **truncates every table**, and it refuses to run unless the database name contains `test`.
