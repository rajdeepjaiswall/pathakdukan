# Pathak Bhandar E-Commerce Platform

## Overview
Pathak Bhandar is a comprehensive e-commerce platform designed for a premium bakery and confectionery store. It features a customer-facing storefront and a complete administrative dashboard. The platform aims to streamline product, order, and business operations for the bakery.

## User Preferences
Preferred communication style: Simple, everyday language.
No emojis in any communication or files unless explicitly requested.

## Recent Changes (Apr 26, 2026)
- **Legal Pages — Shipping Policy & Invoice Terms**: Extended the legal pages system with two more page types: `shipping` and `invoice`. The `legal_pages` table already stored `pageType` as free text so no DB migration was needed; only the server-side validator (`isValidLegalPageType` in `server/routes.ts`) now accepts the two new values. The admin editor at `/admin/legal-pages` shows 4 tabs (Privacy Policy, Terms of Service, Shipping Policy, Invoice Terms) with Truck and Receipt icons; new public routes `/shipping-policy` and `/invoice-terms` reuse the same `LegalPageView` component. A new lightweight summary endpoint `GET /api/legal-pages` returns `[{ pageType, hasContent }]` for all four types; the website footer (`client/src/components/layout/footer.tsx`) queries this endpoint and only renders a link in the bottom-right strip if `hasContent === true`. Result: Shipping Policy and Invoice Terms stay hidden in the footer until the admin adds at least one section, at which point they automatically appear next to the existing Privacy/Terms links.
- **Product Page Media Display**: Replaced the fixed `aspect-square` + `object-cover` (cropping) media frame with a natural-aspect-ratio container (`w-full h-auto max-h-[70vh] object-contain`). Each slide now adapts to its own ratio for both images and videos. Added swipe gestures (touchstart/touchend) on the inline carousel, plus a new full-screen modal viewer (`client/src/components/product/media-viewer-modal.tsx`) opened by clicking any media or the new maximize button. Modal features: backdrop blur + dark overlay, close button (top-right), prev/next arrows (desktop) and swipe (mobile), indicator dots, keyboard navigation (Esc/←/→), body scroll lock; videos autoplay muted with a top-left mute/unmute toggle and pause when the modal closes or media switches; portal-mounted to `document.body` so it overlays everything.
- **Legal Pages Management**: Privacy Policy and Terms of Service are now fully admin-editable.
  - New `legal_pages` table with `pageType` ("privacy" | "terms"), `level` (2/3 for h2/h3), `title`, `content`, `listItems[]`, `highlight`, `displayOrder`, `isActive`.
  - Public API: `GET /api/legal-pages/:pageType` returns active sections + computed `lastUpdated`.
  - Admin API: `GET/POST/PATCH/DELETE /api/admin/legal-pages` (admin role required).
  - Admin editor at `/admin/legal-pages` with tabs to switch between Privacy/Terms, add/edit/delete/reorder/toggle visibility, and a "View page" link.
  - Single dynamic public page component `client/src/pages/legal-page.tsx` used by both `/privacy-policy` and `/terms-of-service` routes.
  - Initial content seeded from the previous static pages via `scripts/seed-legal-pages.ts` (idempotent — skips if rows exist).
  - Old static `PrivacyPolicy.tsx` and `TermsOfService.tsx` files removed.
  - Sidebar entry "Legal Pages" added under admin nav.

## System Architecture

### Frontend Architecture
- **Technology**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI components with custom theming
- **Build Tool**: Vite

### Backend Architecture
- **Technology**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Authentication**: JWT tokens with bcrypt
- **API Design**: RESTful API

### Database Strategy
Supports dual database configurations:
- **Development/Cloud**: PostgreSQL with Neon serverless
- **Production/cPanel**: MySQL
- **Schema Management**: Separate schema files for each database type
- **Migrations**: Drizzle Kit

### Key Features & Implementations
- **Authentication System**: Multi-role (Customer, Admin, Super Admin) authentication with JWTs and bcrypt hashing, hybrid authentication middleware supporting both JWT and session-based auth for Google OAuth compatibility.
- **Product Management**: Hierarchical category system, comprehensive product catalog with images, pricing, inventory, GST integration, and image handling.
- **E-commerce Features**: Persistent shopping cart, wishlist, full order management lifecycle, address management, and UPI QR code payment integration.
- **Admin Dashboard**: Comprehensive order, product, customer, and banner management, with basic sales and inventory reporting.
- **Video Banner System**: Enhanced banner management with video upload capabilities, auto-play functionality, smart carousel timing (30-second delay after video ends), progress tracking, and file optimization.
- **Phone Verification System**: SMS-based OTP verification for customer phone numbers during checkout using Fast2SMS API, with verification badges, resend functionality, and order confirmation SMS with tracking links.
- **Manual QR/UPI Payment System**: Complete payment verification flow with:
  - Admin-configurable QR code and UPI details (admin/payments page)
  - Multi-step checkout: Address → Payment Method → Payment Waiting → Confirmation
  - Customer UTR submission for payment verification
  - Admin dashboard for pending payment verification (approve/reject)
  - Payment statuses: pending_payment, payment_success, payment_failed
  - WhatsApp support integration for failed payments
  - Database tables: manual_payment_config, manual_payment_details
- **New Homepage Sections**: Admin-controlled homepage sections driven by product flags:
  - **Trending in Prayagraj**: Products with `isTrending=true` shown in a ranked carousel with #1, #2, #3 badges
  - **Product of the Day**: Single product with `isProductOfDay=true` shown in a hero banner with add-to-cart
  - **Chef Editorial Picks**: Products with `isChefSpecial=true` shown in a premium editorial grid with chef hat badge
  - **Customer Testimonials**: Static testimonials section with 5-star ratings
  - Admin toggles for all three flags added to the admin products form
- **Cloudflare R2 CDN Image/Video Storage**: ALL media is uploaded to Cloudflare R2 CDN; only public CDN URLs are stored in the database. Upload logic is in `server/r2.ts`. R2 upload is wired into ALL admin save routes: products (POST/PUT), banners (POST/PATCH), categories (POST/PATCH), and manual_payment_config (POST). File structure: `products/images/`, `products/videos/`, `banners/images/`, `banners/videos/`, `categories/`, `misc/qr/`. Full database migration completed (44 files migrated, 0 failures) — all legacy base64 data converted to CDN URLs with backup columns preserved. Credentials: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_PUBLIC_URL`.
- **Event Inquiry System**: Dark-chocolate collapsible banner strip above the footer. Customers submit Name, Event Name, Event Location, and Phone for catering/event orders. On submit shows "Our experts will call you shortly!". Submissions stored in `event_inquiries` DB table. Admin can view all inquiries at GET `/api/admin/event-inquiries`.
- **Trust Bar**: Slim 4-icon horizontal bar (Free Delivery, Easy Payments, Quality Guarantee, Delivered in 30 Min) with 2-col mobile / 4-col desktop layout.
- **SEO Optimization**: Full Open Graph tags, Twitter Card meta, JSON-LD structured data (Bakery schema), keyword meta tags, canonical URL in index.html
- **Data Flow**: JWT-based user authentication, category-based product display, user-specific shopping carts, and order processing with inventory updates.
- **UI/UX Decisions**: Focus on a custom design system with Tailwind CSS and Radix UI for a consistent and premium look.

## External Dependencies

### Core Libraries
- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Backend**: Express.js, jsonwebtoken, bcrypt
- **Database**: Drizzle ORM, PostgreSQL driver (Neon serverless), mysql2
- **Validation**: Zod

### Development Tools
- TypeScript
- Vite
- ESBuild
- Drizzle Kit

### Other Integrations
- Google Maps API (for address management)
- Postal API (for PIN code auto-population)
- Web Audio API (for audio notifications)
- Fast2SMS API (for OTP verification and order confirmation SMS)
  - Note: User declined Twilio Replit integration, uses Fast2SMS directly with API key stored in secrets
  - Configuration: FAST2SMS_API_KEY environment variable
  - DLT Template: ID 206901, Sender ID GETDON, Format: CustomerName|OTP
  - DLT Content Template ID: 1207176761125931947

## Deployment

### cPanel Deployment
A comprehensive deployment guide is available in `CPANEL_DEPLOYMENT_GUIDE.md` covering:
- MySQL database setup via phpMyAdmin
- File upload via File Manager
- Node.js app configuration
- Environment variables setup
- SSL certificate installation
- Complete SQL schema available in `database-schema-mysql.sql`

### Database Migration Path
- **Replit/Development**: Uses PostgreSQL (Neon) with `shared/schema.ts`
- **cPanel/Production**: Uses MySQL with `shared/schema-mysql.ts`
- Both schemas are maintained in parallel for dual deployment support
## Reports & GST Sales Report (Apr 2026)
- Reports page (`client/src/pages/super-admin/reports.tsx`) is mounted at both `/super-admin/reports` and `/admin/reports` so both `admin` and `super_admin` roles can access it. Customers/Payments tabs remain super_admin-only (hidden for admins).
- Sales tab shows only **delivered** orders within a chosen date range, with quick presets (Today / Yesterday / Last 7 / Last 30 days).
- Columns: Order #, Date, State, Price (subtotal), CGST, SGST, IGST, Grand Total. A footer row totals every numeric column.
- GST split logic: bakery's home state is `Uttar Pradesh` (Prayagraj). Intra-state deliveries → `gstAmount` is split equally into CGST + SGST; inter-state deliveries → full `gstAmount` shown as IGST.
- Backend: `GET /api/admin/reports/orders?startDate=&endDate=&status=delivered` (admin + super_admin), backed by `storage.getOrdersReport(start, end, status?)` which now accepts an optional status filter.
- Dashboard "Reports" tile now navigates to `/admin/reports`.

## Admin Account Settings + Password Change OTP Flow (Apr 2026)
- Page: `/admin/account` (file `client/src/pages/admin/account.tsx`), accessible to both `admin` and `super_admin` roles. Linked from the dashboard tile "My Account".
- Profile section: edit `firstName`, `lastName`, `phone` (WhatsApp number). `username` is shown disabled (cannot be changed).
- Password change uses two-step WhatsApp OTP verification:
  1. Click **Send OTP and Change Password** → backend sends a 6-digit OTP to the admin's WhatsApp **and** to a Super Admin's WhatsApp.
  2. Admin enters both OTPs, the new password, confirms it, and submits → backend verifies both OTPs (via `otpService.verifyOTP` with type `whatsapp`) and bcrypt-hashes the new password into `users.password`.
- If the user IS the super_admin, only their own OTP is required (no higher authority to approve).
- Backend endpoints (in `server/routes.ts`, all behind `authenticateUser + requireAdmin`):
  - `GET  /api/admin/account` — returns the caller's profile.
  - `PATCH /api/admin/account` — updates `firstName`, `lastName`, `phone`.
  - `POST /api/admin/account/change-password/init` — sends OTPs; rejects with friendly errors if the admin or super-admin has no WhatsApp number set.
  - `POST /api/admin/account/change-password/verify` — body: `{ adminOtp, superAdminOtp?, newPassword }`. Verifies both OTPs and updates the password.
- WhatsApp delivery uses the existing `otpService.sendWhatsAppOTP(phone, name, purpose)` (Fast2SMS).
- Initial state: no admin in the DB has a `phone` set. They must save a WhatsApp number in the Profile section before they can use the password-change flow.

## Contact Us — Dynamic Page with Admin Editor + Push-Live (Apr 2026)

**Public page**: `/contact-us` (file `client/src/pages/contact-us.tsx`)
- Premium centered layout: circular profile image, store name, social-icon row, contact details card, "Save Contact" button.
- Reads from `GET /api/contact-info` which returns the **published** version only.
- Empty fields are hidden automatically.
- Social icons (WhatsApp, Facebook, Instagram, Email) use the brown/champagne brand theme on a cream background, with hover/active animations.
- WhatsApp link auto-converts to `https://wa.me/<digits>`. Phone uses `tel:`. Email uses `mailto:`.
- "Save Contact" button generates a `.vcf` (vCard 3.0) file containing name, phone, WhatsApp, email, address and the website URL — opens in the user's default contacts app.

**Admin editor**: `/admin/contact-settings` (file `client/src/pages/admin/contact-settings.tsx`)
- Reachable from the dashboard tile **Contact Us**. Available to both `admin` and `super_admin`.
- Form sections: Basic Info (store name + profile image upload or URL), Contact Details (phone, email, address), Social Links (WhatsApp number, Facebook URL, Instagram URL, mailto email).
- Image upload is base64-embedded (max 2 MB) — same pattern as the About page.
- Three buttons:
  - **Preview Live Page** — opens `/contact-us` in a new tab.
  - **Save Draft** — stores in `draftData`. Visitors do NOT see this.
  - **Push Live** — saves the draft and copies it into `publishedData`. Visitors now see the new content.
- Validates email + Facebook/Instagram URLs before saving.
- Shows "Draft last saved" and "Published" timestamps.

**Schema** (`shared/schema.ts`): new `contactSettings` table — single row.
```
id serial PK
draft_data    jsonb  // admin's working copy
published_data jsonb // what visitors see
updated_at    timestamp
published_at  timestamp
```
Created in DB manually via `CREATE TABLE IF NOT EXISTS contact_settings (...)` (drizzle-kit push had unrelated interactive prompts on a pre-existing google_id constraint).

**Backend routes** (`server/routes.ts`, around line 2496):
- `GET  /api/contact-info` — public. Returns `publishedData` only.
- `GET  /api/admin/contact-settings` — admin. Returns full row (draft + published + timestamps).
- `PATCH /api/admin/contact-settings` — admin. Validates with `contactDataSchema` (Zod) and updates `draftData`.
- `POST /api/admin/contact-settings/publish` — admin. Copies `draftData` → `publishedData`.

**Storage methods**: `getContactSettings`, `saveContactDraft`, `publishContactSettings` in `server/storage.ts`.

**Not changed**: navbar, footer, theme, About Us, product pages.

---

## Dynamic Header / Footer + GetDown Foundation (April 2026)

### Header & Footer (admin-controlled, draft + published)
- **Public header & footer** (`client/src/components/layout/header.tsx`, `client/src/components/layout/footer.tsx`) read live config from `GET /api/site-settings` and render the published version only.
- **Header config**: optional logo upload (defaults to baked-in `pathakLogo`), toggle search icon, toggle hamburger menu.
- **Footer**: optional logo, description, horizontal sitemap (Title + Link rows), green "Managed by GetDown Foundation" badge linking to `/getdown-foundation`.
- **Admin editors**: `/admin/header-settings` and `/admin/footer-settings` (both available to `admin` and `super_admin`). Each has Save Draft + Push Live + Preview, plus draft/published timestamps.
- **Schema** (`shared/schema.ts`): single-row `site_settings` table with `header_draft`, `header_published`, `footer_draft`, `footer_published` jsonb columns + per-section `*_published_at` timestamps.
- **Backend routes** (`server/routes.ts`):
  - `GET  /api/site-settings` — public. Returns `{ header: headerPublished, footer: footerPublished }`.
  - `GET  /api/admin/site-settings` — admin. Returns full row.
  - `PATCH /api/admin/site-settings/header` (Zod-validated)
  - `PATCH /api/admin/site-settings/footer` (Zod-validated)
  - `POST /api/admin/site-settings/header/publish`
  - `POST /api/admin/site-settings/footer/publish`

### GetDown Foundation page (super-admin controlled)
- **Public page** `/getdown-foundation` (`client/src/pages/getdown-foundation.tsx`): green-themed hero, About panel (logo + description published by super-admin), and a WhatsApp-OTP-verified enquiry form (Name, Business Name, Location, Annual Scale dropdown, WhatsApp number).
- **OTP flow** uses existing `otpService.sendWhatsAppOTP` + `verifyOTP`. After successful OTP verification, the phone is added to an in-memory `verifiedFoundationPhones` Map (10-min TTL); enquiry submission requires a still-valid entry, then deletes it (single-use).
- **Super-admin pages**:
  - `/super-admin/foundation-settings` — two tabs: "Public Page" (logo + description draft/publish) and "WhatsApp API" (provider, API key, sender ID, phone number ID, template name — kept secret, never returned to public endpoint).
  - `/super-admin/foundation-enquiries` — searchable list (by name / phone / business name) of all submitted enquiries with CSV export.
- **Schema** (`shared/schema.ts`):
  - `foundation_settings` (single row): `content_draft`, `content_published`, `whatsapp_api_config` jsonb columns + timestamps.
  - `foundation_enquiries`: id, name, businessName, location, scale, phone, verified, createdAt.
- **Backend routes**:
  - `GET  /api/foundation` — public. Returns `contentPublished` only (never the API config).
  - `POST /api/foundation/send-otp` + `POST /api/foundation/verify-otp` + `POST /api/foundation/enquiry` (verified-phone gate).
  - `GET/PATCH /api/super-admin/foundation`, `POST .../foundation/publish`, `PATCH .../foundation/whatsapp-config`, `GET .../foundation/enquiries?search=`.

### Dashboard tiles
- Admin dashboard adds tiles: **Header Editor**, **Footer Editor**.
- Super-admin dashboard adds tiles: **Foundation Page**, **Foundation Enquiries**.

### Tables created via raw SQL
The new `site_settings`, `foundation_settings`, `foundation_enquiries` tables were created via `executeSql` (drizzle-kit `db:push` interactive prompt is blocked by an unrelated pre-existing `google_id` constraint).

### Super Admin dashboard & role-based permissions (Apr 2026)
- **Roles**: `super_admin` (full + irrevocable access), `admin` (dashboard access + per-feature toggles), `sub_admin` (dashboard access + per-feature toggles).
- **Schema** (`shared/schema.ts`): `users.adminId` (`ADM-XXXXXX`, unique) + `users.isActive`; new `admin_permissions` table (`adminUserId` FK, `permissions` JSONB). Constants: `ADMIN_FEATURE_KEYS` (17 features) + `ADMIN_FEATURE_LABELS` + `defaultPermissionsAllOn()`.
- **Existing admins** are untouched; `adminId` was backfilled (rajdeep=ADM-F8CB6E super_admin, admin=ADM-9DA13F, pathakji=ADM-2606FF, ankit5656=ADM-6AFFAA) and they default to all-permissions-on.
- **Backend** (`server/routes.ts`):
  - `requirePermission(featureKey)` middleware: super_admin always passes; admins/sub_admins are 403'd if they lack the feature.
  - Path-prefix permission guard mounted on `/api/admin/*` (skips `/api/admin/me/*`): inspects the JWT, blocks disabled accounts (`code: ACCOUNT_DISABLED`), and 403s any request whose path matches `PATH_FEATURE_MAP` when the admin lacks that feature (`code: PERMISSION_DENIED`). Maps cover orders, products, categories, customers, banners, popup-banners, about-sections, legal-pages, manual-payment-config, pending-payments, verify-payment, payment-gateways, contact-settings, site-settings/header, site-settings/footer, analytics/reports, testimonials, verified-customers.
  - Login + `/api/auth/status` block disabled admins.
  - Routes:
    - `GET /api/admin/me/permissions` — returns own `{adminId, role, isActive, permissions, features}` (used by sidebar/dashboard tile filtering, refetched every 30s).
    - `GET /api/super-admin/admins` — list (super_admin only) with embedded `adminPermissions`.
    - `POST /api/super-admin/admins` — auto-generates unique `ADM-XXXXXX` + 12-char password, creates user + permissions row (default all-on), tries `otpService.sendWhatsAppMessage` if available, returns generated `{username, password, adminId}` to display once.
    - `PUT /api/super-admin/admins/:id` — edit profile fields.
    - `PATCH /api/super-admin/admins/:id/status` — toggle `isActive` (cannot disable super_admin or self).
    - `GET/PATCH /api/super-admin/admins/:id/permissions` — read/upsert per-feature toggles (cannot edit super_admin).
    - `POST /api/super-admin/admins/:id/reset-password` — regenerates 12-char password, returns it.
    - `DELETE /api/super-admin/admins/:id` — deletes user + permissions row (cannot delete super_admin or self).
- **Storage** (`server/storage.ts`): `getAdminUserById`, `setUserActive`, `generateUniqueAdminId`, `getAdminPermissions`, `upsertAdminPermissions`, `deleteAdminUser`.
- **Frontend**:
  - `/super-admin/admins` (`client/src/pages/super-admin/admin-management.tsx`): cards per admin with role badge, enabled-feature counter, eye-icon Permissions modal (Switch toggles + Enable-all/Disable-all + Save), Add (shows generated credentials in modal with copy + WhatsApp deep-link), Edit, Reset Password, Toggle status, Delete. Super admin row is locked.
  - `client/src/hooks/use-admin-permissions.ts` — TanStack Query hook polling `/api/admin/me/permissions` every 30s with `hasPermission(feature)` helper.
  - `client/src/components/admin/admin-sidebar.tsx` — filters nav items by permission; shows "Admin Management" for super_admin only.
  - `client/src/pages/admin/dashboard.tsx` — `DashboardTiles` component renders only the tiles the current admin can access.
  - `client/src/lib/auth.ts` — `User` type extended with `sub_admin`, `adminId`, `isActive`, `adminPermissions`.
- **Feature keys** (17): dashboard, orders, products, categories, customers, banners, about, contact_settings, header_settings, footer_settings, legal_pages, testimonials, verified_customers, payments, payment_gateway, reports, account.

### Change Phone Number with email OTP (Apr 2026)
- **Backend** (`server/routes.ts`):
  - `POST /api/account/change-phone/request-otp` — auth required. Validates new phone (10-digit, starts 6-9), rejects if same as current, requires email on file. Generates OTP via existing `otpService.createOTP(identifier='change_phone:<userId>', type='email', purpose='change_phone')`. Returns masked email + delivery status.
  - `POST /api/account/change-phone/confirm` — auth required. Verifies OTP via existing `otpService.verifyOTP`. On success calls `storage.updateUser(userId, { phone, isVerified: true })`.
- **Email delivery** (`server/email-service.ts`): `sendOtpEmail(email, otp)` — Resend SDK wrapper, from `Pathak Bhandar <contact@getdownfoundation.in>`. Subject: "OTP to Confirm Phone Number Change". Failures are logged only — never block the OTP flow (OTP stays in DB; user can resend or contact support). Requires `RESEND_API_KEY` secret.
- **OTP system untouched**: existing 5-min expiry, 3-attempt limit, master OTP `565656`, 60s resend cooldown, identifier+type cleanup all reused as-is.
- **Frontend** (`client/src/pages/customer/account.tsx`): new "Change Phone Number" card in Profile tab. Two-step flow: (1) enter new phone → "Send OTP to Email"; (2) enter 6-digit OTP → "Verify & Update". Shows masked email, current vs new phone, 60s resend cooldown, Cancel button. Hidden if user has no email on file.

### Live Mirror Backup Database (Apr 2026)
- **Why**: Insurance — every change made to the live Neon DB is also copied to a second Neon project (`pathak-bhandar-mirror`, `ep-purple-violet-aka2ko7q.c-3.us-west-2.aws.neon.tech`) so we always have an up-to-date backup. Neon stays the single primary; the mirror is read-only / standby.
- **Connection**: stored as `MIRROR_DATABASE_URL` secret. Uses `@neondatabase/serverless` Pool — same driver as the primary.
- **Initial bulk copy**: done one-time with `pg_dump --schema-only` then `pg_dump --data-only --column-inserts` from primary → loaded into mirror via psql. All 28 tables matched row-for-row after copy.
- **Live replication** (`server/db.ts` + `server/mirror.ts`):
  - The primary `pool.query` is monkey-patched to detect any `INSERT`/`UPDATE`/`DELETE` SQL.
  - On every write: primary executes first; once it resolves, the same `(sql, params)` is fired to the mirror pool in the background (fire-and-forget, never blocks the response).
  - If the mirror write fails, the SQL + params + error are recorded in a `mirror_failures` table on the **primary** DB (so we don't lose retry info if mirror is down). A `setInterval` retry loop runs every 5 minutes and replays unresolved failures, marking `resolved_at` on success.
  - In-memory stats track total/successful/failed writes, last success/failure timestamps.
- **Admin UI**:
  - `GET /api/super-admin/mirror/health` returns `{enabled, stats, pendingFailures, oldestPendingAt, primaryRowCounts, mirrorRowCounts, inSync}` for 9 key tables (users, products, orders, order_items, cart_items, addresses, reviews, wishlist_items, phonepe_transactions).
  - `POST /api/super-admin/mirror/retry` manually retries up to 200 pending failures.
  - New tile **Backup Database** on the super-admin dashboard → `/super-admin/backup-status` (`client/src/pages/super-admin/backup-status.tsx`). Shows in-sync status, success rate, pending retries, last copy time, per-table row count comparison, last error message, and a "Retry pending" button.
  - Page auto-refreshes every 30 seconds.
- **Safety**: `mirror_failures` writes are excluded from mirroring (regex skip) to avoid loops. The mirror DB has its own `mirror_failures` table created at startup but it stays empty.

## Charges Management — Delivery + Handling (Jun 2026)
- **Separate additive layer** over the existing cart. Does NOT modify cart/coupon/tax/payment/order-placement core math. `summary.total = subtotal + gstAmount + delivery + handling`.
- **Priority-toggle model**, applied independently to delivery and handling. Each has a master enable toggle; when enabled, the FIRST enabled rule wins in order: (1) Free-threshold waiver (subtotal ≥ threshold → 0), (2) Percentage of subtotal, (3) Fixed amount. Enabled with no method = FREE (0). Disabled → contributes 0 and the row is hidden.
- **Schema** (`shared/schema.ts`, MySQL parity in `shared/schema-mysql.ts`): `handlingCharge` column on `orders`; single-row `charges_settings` table (delivery+handling enable/threshold/percentage/fixed); `chargesConfigSchema` (Zod, pct ≤ 100, values ≥ 0) + `ChargesConfig`/`ChargesSettings` types. `'charges'` added to `ADMIN_FEATURE_KEYS`/`ADMIN_FEATURE_LABELS`.
- **Backend** (`server/storage.ts`, `server/routes.ts`, `server/index.ts`): `getChargesConfig`/`saveChargesConfig` + normalizer (Drizzle decimal strings → numbers). `GET /api/charges` (public), `GET/POST /api/admin/charges` (admin, permission `charges` via PATH_FEATURE_MAP `[/^\/charges/, 'charges']`). Startup migration: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS handling_charge`; `CREATE TABLE IF NOT EXISTS charges_settings`.
- **Cart calc** (`client/src/lib/cart.ts`): `computeCharges(subtotal, config)` + `calculateCartSummary(items, config)`; `ComputedCharge`/`CartSummary` carry `method` (`free_threshold`|`percentage`|`fixed`|`none`) + `percentage` so the UI can explain the charge. `chargeMethodSuffix(method, percentage, amount)` returns ` (5%)` for percentage, ` (Fixed)` for fixed, and `''` when amount ≤ 0 (FREE/waived/none). `client/src/hooks/use-charges.ts` fetches config; wired into `use-cart.ts` so all consumers update live.
- **Customer display**: delivery + handling rows in `cart.tsx`, `cart-sidebar.tsx`, `checkout.tsx` (FREE / ₹amount / hidden when off). Each charged row appends the method hint via `chargeMethodSuffix` — e.g. `Delivery (5%)` or `Handling (Fixed)`, mirroring the `CGST (2.5%)` style; FREE/waived rows stay plain. `AddToCartPopup` free-delivery progress uses SUBTOTAL only (never handling) and hides when delivery is off / threshold disabled / threshold 0. `handlingCharge` added to checkout payload, COD localStorage, customer + admin order views, and invoice.
- **Admin page**: `/admin/charges` (`client/src/pages/admin/charges.tsx`) — master toggles + numbered priority sections + info note; Save → `POST /api/admin/charges`. **Percentage and Fixed are mutually exclusive per category** — enabling one auto-clears the other (Free Threshold stays independent); enforced in the toggle handlers AND normalized on load (if a legacy config has both on, Fixed is cleared, keeping Percentage to match the calc priority). Dashboard tile + sidebar nav (Truck icon, feature `charges`). Auth guard hoists all hooks above the early return (redirect in useEffect) and allows `admin`/`super_admin`/`sub_admin`.
