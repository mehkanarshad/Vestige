# Vestige

Vestige is a personal styling-session web app. It combines a fresh YouCam skin
analysis, a user's styling intention, real apparel search results from
Channel3, and explicit garment feedback to produce ranked catalog picks. A
user can try on one garment at a time with YouCam Clothes Virtual Try-On and
review prior sessions and skin-analysis estimates.

Vestige is a styling and product-discovery prototype, not a medical product or
an online store. It does not diagnose skin conditions, sell products, or
assemble a complete outfit from multiple coordinated catalog products.

## What the app does

### 1. Accounts and sessions

- Users register with a name, email address, and password. Passwords are
  bcrypt-hashed before storage.
- Sign-in uses NextAuth Credentials with JWT-backed sessions.
- Authenticated users can create styling sessions and review their session
  history and style profile.
- Each session stores its photo, structured skin summary, raw YouCam response,
  selected styling intention, catalog recommendations, try-on result, and
  feedback.

### 2. Fresh skin analysis and saved color profile

- Each submitted session photo is normalized with Sharp and sent to YouCam's
  Skin Analysis and Skin Tone Analysis tasks.
- Vestige extracts concern estimates for acne, dark circles, wrinkles, pores,
  texture, redness, and age spots, along with the returned skin type and facial
  skin-color sample.
- The concern values in `SkinSummary.concernScores` are derived from YouCam's
  raw scores as `1 - raw_score / 100`. They are automated estimates; they are
  not clinical measurements.
- The first valid facial skin-color sample creates a Skin Passport in the
  user's style profile. The passport remains the saved reference profile;
  each session's fresh summary is stored separately on that session.
- YouCam does not provide an undertone label. Vestige does not infer one from
  the result.

### 3. Skin-analysis changes over time

- Trend data is calculated from fresh analyses already stored on sessions.
  Vestige does not keep a second persisted trend history.
- Analyses are compared by concern where both contain a valid score. Regional
  values for a concern are averaged before comparison.
- The analysis view shows the trajectory from the first available estimate to
  the current one, including percentage-point change and relative percent
  change when the baseline is nonzero. The Style Journey shows per-concern
  trajectory indicators.
- Historical placeholder/Passport-reuse records are not treated as fresh
  analyses.
- A lower or higher estimate is not presented as proof of improvement or
  decline. Lighting, angle, and other photo conditions can affect results.

### 4. Catalog search and recommendations

- Channel3 is the external product-search source. The Prisma `Garment` model
  is Vestige's only in-app catalog store.
- A recommendation request sends four generic searches to Channel3, one each
  for tops, bottoms, dresses, and outerwear. The selected intention is included
  in the search phrase, for example, `women's professional top clothing`.
  Searches request in-stock women's products, with a maximum of 12 results per
  category.
- The Channel3 API key is used only on the server. Photos, account identifiers,
  skin analysis, and saved personal style/color preferences are not sent to
  Channel3.
- Results must have a recognized clothing category, HTTPS product image,
  dominant color, and in-stock retailer offer to be ingested. Products are
  upserted into `Garment` with a Channel3 external ID, product/retailer
  information, color data, and available structured attributes.
- Products without usable required data are skipped. There is no invented
  garment or mock-product fallback when Channel3 is unconfigured or
  unavailable.
- Catalog recommendation generation ranks the products returned by the
  current searches and presents up to three individual product picks. It does
  not compose a multi-product outfit.

### 5. How ranking works

The existing ranking pipeline is deterministic; GPT does not generate catalog
items or their product details.

1. Vestige reads the current session's fresh skin-color Lab value, up to two
   preceding fresh Lab readings, the selected intention, and the user's saved
   garment-preference vector.
2. Each product gets a current skin-color compatibility score. With at least
   two readings, it also gets an average compatibility score across the latest
   three readings. This is the skin-color trajectory signal.
3. The selected intention is scored against available normalized catalog
   style, silhouette, formality, and texture facets, plus garment Lab chroma.
   Target facets for each intention are defined in the deterministic scorer.
   Channel3 search also includes the intention in each category query.
4. User feedback on garments contributes preferences for category, color
   coordinates, tone, silhouette, formality, style, and texture. Preference
   vectors from other users contribute a collaborative score when enough
   similar-user interaction history exists.
5. `rankGarments` combines current color (35%), recent color trajectory (15%,
   folded into current color when history is insufficient), intention fit
   (20%), personal preference (20%), and collaborative preference (10%).
   Personal/collaborative weights are scaled by interaction confidence;
   available components are normalized before sorting.

The resulting score is a deterministic heuristic, not a trained model or a
calibrated probability of satisfaction. Recommendation cards expose component
scores so users can see why products ranked. Concern trajectories such as
redness and acne remain informational; there is no validated mapping from
those estimates to garment properties.

The separate garment-recommendations endpoint ranks visible, untried catalog
products and a user's own uploaded garments using the latest fresh skin-color
Lab reading when available. It does not ingest Channel3 products itself.

### 6. Try-on and feedback

- A user can select a catalog pick or upload a garment image for virtual
  try-on.
- YouCam Clothes Virtual Try-On receives one garment and the session portrait.
  The feature renders one garment at a time; it does not render a full outfit.
- Vestige calculates a color-match score using the latest fresh session Lab
  color when available, falling back to the saved Skin Passport.
- Users can react to a rendered catalog garment with like, reject, or “more
  like this.” These garment interactions are stored and used to recompute the
  preference vector that influences later ranking.
- Session-level feedback also supports liked, adjusted, or rejected responses
  and optional notes. It updates the style profile's recorded intention,
  preferred/avoided garment facets, and color palette.

### 7. Style profile and history

- The profile accumulates style signals from session feedback and shows a
  profile summary, intention counts, preferences, avoided styles, and colors.
- GPT does not generate recommendations. The only OpenAI call in the current
  implementation is an optional style-profile summary using `gpt-4o-mini`,
  made after session feedback when `OPENAI_API_KEY` is configured. Without the
  key, Vestige uses a local fallback sentence. This is not GPT-4o outfit
  generation. The code does not validate provider credentials at startup, so
  a working key and live API call must be verified separately.
- A Style Evolution snapshot is created when the profile's completed-session
  count reaches a multiple of five.
- `/journey` is the canonical session timeline. The legacy `/history` route
  redirects there.

## What it does not currently do

- It does not generate complete looks by matching several products together;
  each recommendation card is a single catalog item.
- It does not render multiple garments in one virtual try-on.
- It does not infer medical outcomes from skin-analysis estimates.
- It does not use concern-score changes to recommend clothing.
- It does not purchase products or process payments.
- It does not provide account-data export, profile editing, email changes,
  password updates, or working account deletion. Some of these controls appear
  in the account UI but are not wired to backend operations.
- It does not provide a bulk retailer-catalog import. Channel3 searches run
  when the recommendation endpoint is called.

## Architecture and source of truth

- **Web app:** Next.js App Router, React, and TypeScript.
- **Database access:** Prisma Client.
- **Database:** SQLite as configured by `DATABASE_URL`.
- **Authentication:** NextAuth Credentials, bcrypt password hashing, JWT
  sessions.
- **Product search:** Channel3 Product Search API.
- **Skin analysis and virtual try-on:** YouCam APIs.
- **Optional profile prose:** OpenAI, for the style-profile summary only.
- **Image processing:** Sharp.
- **Catalog of record inside Vestige:** `Garment` in `prisma/schema.prisma`.
  Channel3 is an ingestion/search source, not a second Vestige database.
- **Skin-analysis source of truth:** the fresh `skinSummary` and
  `skinAnalysisRaw` stored on each session. Trajectories are derived from
  those session records.
- **User preference source of truth:** garment interactions plus the
  recomputed preference vector in `StyleProfile`.

Relevant code:

- `src/app/api/skin-analysis/route.ts` — validates, normalizes, analyzes, and
  stores the session photo and analysis.
- `src/lib/skin-analysis-history.ts` — reads valid fresh session analyses.
- `src/lib/skin-trends.ts` — shared concern comparison and trajectory
  calculations.
- `src/lib/channel3-catalog.ts` — Channel3 search, response validation, and
  Prisma catalog upserts.
- `src/app/api/recommendations/route.ts` — search, local ranking, and
  recommendation persistence.
- `src/lib/collaborative-filter.ts` — shared garment encoding, feedback
  preferences, and ranking.
- `src/app/api/try-on/route.ts` — authenticated single-garment VTO handoff.
- `prisma/schema.prisma` — user, session, garment, profile, and feedback
  records.

## Requirements

- Node.js compatible with Next.js 15 (Node.js 20 LTS is recommended).
- npm.
- A SQLite database URL for Prisma.
- A YouCam API key for skin analysis and virtual try-on.
- A Channel3 API key for live catalog recommendations.
- An OpenAI API key is optional and only enables generated style-profile
  summaries.

## Local setup

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Create or update `.env.local` locally. If one already exists, **add or
   update only the variables you need; do not overwrite it with `.env.example`**.
   `.env.example` currently documents `CHANNEL3_API_KEY` only. The application
   also reads the following server-side settings:

   ```dotenv
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="replace-with-a-long-random-value"
   YOUCAM_API_KEY="your-server-side-youcam-key"
   YOUCAM_API_BASE_URL="https://yce-api-01.makeupar.com"
   CHANNEL3_API_KEY="your-server-side-channel3-key"
   OPENAI_API_KEY=""
   ```

   `YOUCAM_API_BASE_URL` is optional and defaults to the value shown above.
   `OPENAI_API_KEY` is optional. Keep credentials in the server environment;
   do not put secrets in client-side variables or source control.

3. Generate Prisma Client and create/update the database schema:

   ```bash
   npm run db:generate
   npm run db:push
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

Recommendations require a working Channel3 key. Skin analysis and try-on
require a working YouCam key. The app surfaces provider/configuration failures;
it does not substitute generated mock products.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Next.js in development mode. |
| `npm run build` | Create a production build and run Next's type/lint checks. |
| `npm run start` | Start the production build. |
| `npm run db:generate` | Generate Prisma Client. |
| `npm run db:push` | Push the Prisma schema to the configured database. |
| `npm run db:seed` | Seed the demo account and sample history. |
| `npm run db:studio` | Open Prisma Studio. |
| `node --import tsx --test src/lib/skin-trends.test.ts src/lib/collaborative-filter.test.ts` | Run focused trajectory and ranking tests. |

The seed script is demo data, not a live catalog import. It creates mock
recommendations and sample session history for its demo account; seeded legacy
analysis payloads are not counted as fresh YouCam skin analyses. Re-running the
seed script deletes and recreates that demo account's session/feedback history.
Do not run it against data you need to preserve.

## API surface

User and session data endpoints require authentication. Registration and
NextAuth sign-in endpoints are public.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/register` | `POST` | Register an account. |
| `/api/auth/[...nextauth]` | `GET`, `POST` | NextAuth sign-in/session endpoints. |
| `/api/session` | `GET`, `POST` | List the current user's sessions or create one. |
| `/api/session/[id]` | `GET`, `PATCH` | Read or update an owned session. |
| `/api/skin-analysis` | `POST` | Analyze a session photo, store analysis, and return its comparison. |
| `/api/recommendations` | `POST` | Search Channel3, ingest valid products, rank, and persist picks. |
| `/api/garment-recommendations` | `GET` | Rank visible, untried garments for the user's profile. |
| `/api/garment-score` | `POST` | Estimate a garment image's color and score it against the latest skin color. |
| `/api/try-on` | `POST` | Submit a one-garment YouCam virtual try-on. |
| `/api/garment-feedback` | `POST` | Save like/reject/more-like-this feedback for a tried garment. |
| `/api/feedback` | `POST` | Save session-level feedback and start a profile update. |
| `/api/profile` | `GET` | Read the current user's profile and evolution snapshots. |

## Main screens

| Route | What it shows or does |
| --- | --- |
| `/signup`, `/login` | Account registration and credential sign-in. |
| `/home` | Authenticated home and entry to a styling session. |
| `/session/new` | Starts a new session and continues into its steps. |
| `/session/[id]/photo` | Uploads the session photo and requests fresh analysis. |
| `/session/[id]/analysis` | Shows the structured analysis and available trend. |
| `/session/[id]/intention` | Chooses one of seven styling intentions. |
| `/session/[id]/recommend` | Shows up to three single-product catalog picks. |
| `/session/[id]/tryon` | Renders one selected or uploaded garment at a time. |
| `/session/[id]/feedback` | Records session-level feedback and notes. |
| `/session/[id]/complete` | Summarizes the completed styling session. |
| `/journey` | Shows the session timeline and skin-analysis trajectory. |
| `/style-profile` | Shows accumulated profile and style signals. |
| `/account` | Shows account settings and sign-out. Several displayed settings are placeholders. |

## Data and privacy notes

- Session photos are normalized and stored as data URLs in the SQLite-backed
  session record. Raw analysis responses and structured summaries are also
  stored per session. This prototype does not use a separate object-storage
  service.
- Session photos are sent to YouCam for fresh skin analysis. During try-on,
  the session portrait and selected garment are sent to YouCam for rendering.
- Channel3 receives apparel-search text that includes the selected intention
  and category, plus in-stock/gender filters. It does not receive the user's
  photo, name, account ID, skin analysis, or saved preferences.
- Skin analysis values are sensitive personal data. Treat the local database
  and any deployment backups accordingly.
- SQLite and local data-URL image storage are suitable for local development
  and a controlled demonstration, not an automatically production-ready
  multi-user deployment.

## Current implementation caveats

- The database uses `prisma db push`; this repository does not currently define
  a Prisma migrations directory.
- Channel3 is a search API. The app queries it when a user requests
  recommendations; it is not a comprehensive retailer inventory feed.
- The account page contains visible controls for editing account details,
  exporting data, and deletion, but the corresponding operations are not
  implemented.
- The seed data's sample recommendations are fixture content. They should not
  be mistaken for products returned by Channel3 or as evidence that a live
  Channel3/YouCam integration has been exercised.
