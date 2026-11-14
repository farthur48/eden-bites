# Eden Bites — Ordering & Admin

Production-ready storefront, checkout and admin dashboard for the Eden Bites
food ordering platform.
Tagline: **Life in every bite.**

## Stack

- Next.js 16 (App Router) with React 19
- TypeScript 5.9
- Tailwind CSS 4
- Supabase (PostgreSQL, Auth, Storage)
- Netlify deployment via `@netlify/plugin-nextjs`

## Getting started

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

### Environment variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged server operations. Never expose to the browser. |
| `ADMIN_EMAILS` | Server only | Comma-separated allowlist of admin account emails |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical site URL used in metadata |
| `NEXT_PUBLIC_STORE_OPEN` | Public | Fallback open/closed state when settings are unavailable |
| `NEXT_PUBLIC_STORE_NOTE` | Public | Fallback closed message |
| `NEXT_PUBLIC_CONTACT_*` | Public | Fallback contact details when settings are unavailable |

Business details, contact links, logo, pickup instructions and notification
preferences are managed from **Admin → Settings** after the migrations run.

### Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_foundation.sql` in the Supabase SQL editor.
3. Run `supabase/migrations/0002_ordering_and_admin.sql`.
4. Create the owner account in **Authentication → Users**.
5. Add that email to `ADMIN_EMAILS`.
6. Promote the account to a database admin:

```sql
update public.profiles
set is_admin = true
where id = (
  select id from auth.users where email = 'owner@example.com'
);
```

The application allowlist (`ADMIN_EMAILS`) gates dashboard access. The
`profiles.is_admin` flag gates database writes and privileged reads through
Row Level Security. Both should be configured for the owner account.

The migrations create the public `product-images` storage bucket and its
policies. Migration `0002` also adds menu customisation, order fee status,
business settings and seeds the two supplied meals (Banku & Tilapia, Acheke &
Tilapia) only when the products table is empty. The seeded store row starts
closed; open it from **Admin → Settings** or with:

```sql
update public.store_settings set is_open = true where id = 'main';
```

Orders are created server-side with the service-role client, so pricing and
options are always validated against the current menu. Customer accounts and
online payments are intentionally not part of the product.

### Customer flow

1. Browse `/menu` and customize a meal.
2. Add it to the cart (`localStorage` key `eden-bites-cart:v1`).
3. Check out with delivery or pickup details.
4. Receive an order reference, then pay on delivery or pickup.

Delivery fees are never calculated automatically. The kitchen confirms the fee
manually from the order detail page, which updates the final total.

### Netlify deployment

1. Connect the repository to Netlify.
2. Use the build command `npm run build` and publish directory `.next`. Both are
   already configured in `netlify.toml`.
3. Add every environment variable in the Netlify dashboard and set
   `NEXT_PUBLIC_SITE_URL` to the production URL.
4. Deploy. The Next.js runtime plugin is configured in `netlify.toml` and pinned
   in `devDependencies`.
5. The deployment health check is available at `/api/health`.

Node.js 22 is pinned for Netlify in `netlify.toml` and `.nvmrc`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Structure

```text
src/
  app/
    (customer)/          Storefront, menu, cart, checkout and confirmation
    admin/
      login/             Admin sign-in
      (dashboard)/       Dashboard, orders, menu management and settings
    api/health/          Deployment health probe
  components/
    admin/               Order, menu and settings editor components
    brand/               Brand wordmark / optional uploaded logo
    layout/              Header, footer, containers, admin shell
    menu/                Product presentation and customization
    ui/                  Reusable buttons, badges, states
  lib/
    auth.ts              Server-side admin guard
    auth/                Admin allowlist and auth types
    cart/                localStorage cart state and helpers
    data/                Server-only Supabase reads and writes
    menu/                Catalog mapping, fixtures and option helpers
    orders/              Server-side pricing, persistence and confirmation
    store/               Store open/closed availability
    supabase/            Browser, server, admin and proxy clients
    env.ts               Public environment handling
    env.server.ts        Server-only environment handling
  proxy.ts               Next.js 16 request proxy for /admin
  types/database.ts      Database types matching the migrations
```

## Order lifecycle

Only these statuses are used: `new`, `preparing`, `completed`, `cancelled`.

- New orders are created as `new` with a server-generated `EB-YYYYMMDD-XXXXXX`
  reference.
- Delivery orders start with `delivery_fee_status = 'pending'` and a subtotal-only
  total. Pickup orders use `not_required`.
- Admins confirm the fee from the order page, which sets the final total, or
  reset it to pending.
- Customers are never shown real-time tracking. The confirmation page reflects
  the order at page load.

## Security notes

- The service role key is only imported by `lib/supabase/admin.ts`, which is
  marked `server-only`. Order creation and confirmation lookup use it on the
  server; it must never be exposed to the browser.
- Admin access is enforced in three places: the request proxy, the protected
  dashboard layout, and the login action.
- Orders have no public insert policy. Checkout validates every line, option and
  quantity server-side and recalculates pricing from the current menu.
- Prices are stored as integer pesewas, never floating point.
- No products or prices are hardcoded in customer-facing pages. The fixture
  catalog is used only when Supabase is not configured, so the UI can be
  previewed locally.

## Outstanding assets and credentials

- The official Eden Bites logo has not been supplied as a repository asset. The
  storefront uses a typographic wordmark fallback. Once supplied, upload it from
  **Admin → Settings → Business logo**; the header and footer use the saved
  logo URL automatically. Do not redesign the identity.
- Live Supabase credentials, admin email addresses and the Netlify site must be
  configured in the deployment environment.
- Product photography is managed through Supabase Storage (`product-images`).
- Order confirmation cookies are only a preview fallback when Supabase or the
  service-role key is missing. Very large preview orders may exceed the cookie
  size limit and will not be retrievable.
