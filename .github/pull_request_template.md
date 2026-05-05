<!--
Thanks for the PR. Keep this template's structure; delete the comments before submitting.
First-time contributor? Read docs/engineering-onboarding.md before opening the PR.
-->

## Summary

<!-- 1-3 sentences describing what changed and why. Lead with the why. -->

## Changes

<!-- Bullet list of notable changes. Group by area if it spans multiple. Examples:
- `src/app/(dashboard)/widgets/page.tsx`: new page at /widgets
- `prisma/schema.prisma`: added `Widget` model + migration `20260505_add_widget`
-->

## Schema / migrations

<!-- Delete this section if no schema changes. Otherwise: -->
- [ ] Migration committed under `prisma/migrations/`
- [ ] `npx prisma migrate deploy` run against **production** before merge (Vercel does NOT auto-apply migrations — see [docs/engineering-onboarding.md §8.3](../docs/engineering-onboarding.md#83-production-migrations))
- [ ] No backwards-incompatible changes (column drops, type narrowing, required-without-default)

## Environment variables

<!-- Delete this section if no new env vars. Otherwise list them and confirm where they're set: -->
- [ ] Added to [.env.example](../.env.example)
- [ ] Added to Vercel: Production / Preview / Development
- [ ] Documented in [docs/engineering-onboarding.md §8.2](../docs/engineering-onboarding.md#82-env-var-matrix)

## Test plan

<!-- How did you verify this works? Bullet list of manual / automated checks. -->
- [ ] `pnpm check` passes locally (lint + tsc + build)
- [ ] Logged in as ADMIN and walked through the affected screen(s)
- [ ] Logged in as REP (or seeded `rep@lifescientific.com`) to confirm authorization scoping still holds
- [ ] Preview deployment URL: <!-- paste from Vercel check -->

## Screenshots / recordings

<!-- For UI changes. Drag-drop into the PR description. Otherwise delete. -->

## Risk and rollback

<!-- One sentence: what's the worst that could happen, and how do we revert?
Examples: "Pure UI change, revert by reverting commit." or "Touches auth flow;
revert and redeploy. Existing sessions remain valid because JWT shape is unchanged." -->

---

> New here? Start with [docs/engineering-onboarding.md](../docs/engineering-onboarding.md). For step-by-step recipes (adding a page, API route, migration, S3 upload, email, cron), see [docs/cookbook.md](../docs/cookbook.md).
