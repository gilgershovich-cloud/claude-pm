---
name: finance-planner
description: >-
  Work on the personal monthly financial-planner bot (הבוט לתכנון כלכלי /
  תקציב חודשי / הוצאות והכנסות / חיסכון / דיווח לרשויות / עוסק פטור / מסמכים
  משפטיים) — everything under finance-planner/. Use whenever the user talks
  about their monthly budget bot, sends bank/credit-card Excel exports,
  payslips, tax forms (101/106/161), legal or family documents, or asks to
  continue the finance app's planning or build.
---

# Finance planner — personal budgeting + tax-reporting bot

Lives in `finance-planner/`. Hebrew-first, single user. Two phases:
1. Monthly budgeting + real savings from bank/credit-card exports.
2. Reporting checklist for the Israeli authorities (VAT, income tax,
   National Insurance), driven by the user's private parameters.

## Read first
- `finance-planner/README.md` — current status and next steps.
- `finance-planner/docs/01-discovery-questionnaire.md` — the intake
  questionnaire (39 questions, 15 must, minimal set of 8), documents to
  request, stated defaults, and the 2026 tax-parameter appendix with a
  confidence level per fact.
- Root `AGENTS.md` still applies to any Next.js code (read
  `node_modules/next/dist/docs/` first).

## Where the answers are
The questionnaire was published as a fillable Artifact form ("שאלון תכנון
כלכלי") that saves to the artifact's `db` at document `intake/answers`
(fields: `answers` keyed by question id, `docs` checklist, `submittedAt`).
Read it with the Artifact tool: `action: "read_db", db_op: "get",
collection: "intake", doc_id: "answers"` on that artifact's URL
(`action: "list"` to find it). The user may also answer in chat.

## Hard rules (agreed in discovery)
- This repository is PUBLIC. It holds code, schemas, templates and generic
  docs only. Zero facts about the user: no first name, no life events, no
  employment or family status, no amounts. Commit messages describe code,
  not personal context. Never commit payslips, bank exports, legal
  documents, ID numbers, or extracted parameters.
- Nothing from court documents (case numbers, judge, findings, quotes)
  ever leaves the user's private storage. Family-court proceedings are
  closed-door; publishing their content is prohibited by law.
- Contents of the user's private finance store are never copied into repo
  files, README, artifacts, commit messages, or sent to any external tool
  (email, shared files, HTTP). Sessions that read external content
  (mail, web, foreign files) must not run with permission prompts
  disabled.
- No assumptions about gender, children, or who pays alimony — only what
  the user and the agreement say. Address the user in neutral/plural
  Hebrew where possible.
- Tax/legal facts carry a confidence level and a "verify with רו"ח/יועץ
  מס" note; annual amounts live in a per-tax-year parameter table, never
  hard-coded in prose or code.
- Question 29 (data consent) has no default: don't send documents to a
  model until the user answers it explicitly.

## Next steps after answers arrive
1. Write `docs/02-prompt-contract.md` (GOAL / CONSTRAINTS / FORMAT /
   FAILURE + decisions).
2. Pick the architecture (default proposed: chat + simple Next.js web page
   in this folder, separate private DB, Telegram only after 3 months).
3. Build one parser per bank/card from one real month of exports.
