---
name: bracha-landing
description: >-
  Work on Bracha Aharon's bilingual event-video-editing landing page — the
  Next.js app in bracha-aharon-video/. Use whenever the user asks to edit,
  restyle, add/remove sections, change text/content, update contact details or
  portfolio, fix bugs, or deploy "Bracha's site" / "the landing page" / "the
  video-editing site".
---

# Bracha Aharon — landing page

Bilingual (Hebrew RTL default + English at `/en`) marketing landing page for
**ברכה אהרון – עריכת וידאו לאירועים** (event video editing). Lives in the
`bracha-aharon-video/` subdirectory of this repo.

- **Live (temporary):** https://bracha-aharon.gershovich.dev
- **Future domain:** bracha-aharon.co.il (not yet purchased)
- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · `pg` (Postgres)

## ⚠️ Read first
`AGENTS.md` at the repo root applies: **this Next.js may differ from training
data — read the relevant guide in `node_modules/next/dist/docs/` before writing
Next.js code**, and heed deprecation notices. Always run from inside
`bracha-aharon-video/`.

## Where things live
| Need to change… | File |
|---|---|
| **Text / wording** (he + en) — hero, services, FAQ, process, packages, testimonials, nav | `lib/content.ts` |
| **Business details** — phone, WhatsApp, email, social links, service areas, brand name, `baseUrl` | `lib/site.ts` |
| **Portfolio items / gallery** | `lib/portfolio.ts` + images in `public/portfolio/` |
| **SEO / metadata / JSON-LD** | `lib/seo.ts`, `components/JsonLd.tsx`, `app/sitemap.ts`, `app/robots.ts` |
| **Locales / RTL / path rules** | `lib/i18n.ts` (Hebrew = root `/`, English = `/en`) |
| **Visual sections / layout** | `components/*` (e.g. `Hero`, `ServicesGrid`, `Packages`, `Faq`, `ContactForm`, `Footer`) |
| **Colors / fonts / global styles** | `app/globals.css`, `lib/fonts.ts` |
| **Contact form backend** | `app/api/contact/route.ts` + `lib/db.ts` |

Most "Bracha wants to change X wording" requests = edit `lib/content.ts` only.
All copy is bilingual: update **both** `he` and `en`.

## Contact form & database
- POST `/api/contact` → `insertLead()` in `lib/db.ts` → Postgres table `leads`
  (auto-created on first insert; no migration step).
- Connection string resolved prefix-agnostically: `DATABASE_URL`, `POSTGRES_URL`,
  `STORAGE_*_URL`, etc. (Neon via Vercel storage integration — already wired).
- No DB configured → form returns 503 and the UI falls back to WhatsApp.
- **View leads:** Vercel → Storage → `bracha-aharon-db` → Data Editor → `leads`.
- Optional email alerts on new leads: set `RESEND_API_KEY` (+ `CONTACT_TO`) env
  vars — see `sendNotification()` in the route. Not configured yet.

## Build, verify, deploy
```bash
cd bracha-aharon-video
npm install          # first time / after dependency changes
npm run dev          # local preview at http://localhost:3000 (/ and /en)
npm run build        # ALWAYS run before pushing — must exit 0
```
**Deploy is automatic:** the Vercel project `claude-pm-4fkj` builds from the
`master` branch (Root Directory = `bracha-aharon-video`). Push to `master` →
live site updates in ~1 min. No manual deploy/CLI needed.

Workflow: commit on the dev branch `claude/video-editing-landing-page-S5giW`,
push it, then fast-forward `master` to it:
```bash
git push origin claude/video-editing-landing-page-S5giW
git push origin claude/video-editing-landing-page-S5giW:master
```
(For larger/riskier changes, open a PR and let Bracha review the Vercel Preview
deployment before merging to master.)

## Already set up — do NOT redo
Vercel project + GitHub connection · domain `bracha-aharon.gershovich.dev` ·
Neon Postgres connected with env vars injected. Editing = just push code.

## Launch checklist (still PLACEHOLDER in `lib/site.ts`)
Before going fully public, replace with Bracha's real data:
- [ ] `phoneDisplay`, `phoneE164`, `whatsappNumber`
- [ ] `email`
- [ ] `social` (instagram / facebook / youtube / tiktok) — empty string hides a link
- [ ] real `public/portfolio/` images (currently SVG placeholders)
- [ ] when `bracha-aharon.co.il` is bought: add it in Vercel (Auto-configure via
      Cloudflare) and set `baseUrl` in `lib/site.ts` to the final domain
