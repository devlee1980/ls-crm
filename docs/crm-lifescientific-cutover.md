# Cutover: crm.lifescientific.com → primary CRM domain

## Why

`ls-nexus.com` was registered weeks ago, so enterprise URL filters
(Diacom Guardian, Cisco Umbrella, Forcepoint, Zscaler, Symantec, etc.)
auto-categorize it as **"New Domains"** and block it.

`lifescientific.com` has been registered since 2010 and is already
categorized as **Business** in every major URL reputation database.
By serving the CRM from `crm.lifescientific.com`, we inherit that
reputation immediately and bypass every "new domains" block — no
recategorization wait, no per-customer allowlist requests.

## What this commit changes (already done)

- `next.config.ts` — adds a permanent (308) host-based redirect:
  `(www.)?ls-nexus.com/*` → `https://crm.lifescientific.com/*`
- `src/app/layout.tsx` — `metadataBase`, `openGraph.url`, canonical →
  `https://crm.lifescientific.com`
- `src/app/sitemap.ts` — sitemap entries → `crm.lifescientific.com`
- `public/robots.txt` — `Sitemap:` line → `crm.lifescientific.com`
- `public/.well-known/security.txt` — `Canonical:` → `crm.lifescientific.com`
- `src/lib/email-templates.ts` and `forgot-password/route.ts` —
  `NEXT_PUBLIC_APP_URL` fallback → `crm.lifescientific.com`
- `.env.example` — comments document the new production URL

> Email **FROM** addresses (`noreply@ls-nexus.com`, `info@ls-nexus.com`,
> `action@ls-nexus.com`) are intentionally **unchanged**. The Resend
> sending domain is still verified on `ls-nexus.com`. Migrating sender
> identity to `@lifescientific.com` is a separate task — see "Follow-ups"
> at the bottom.

## What you have to do (the part I can't automate)

### 1. Add the DNS record on `lifescientific.com`

Whoever administers `lifescientific.com` DNS (likely Life Scientific
IT, possibly also on Cloudflare) needs to add **one** record:

| Type  | Name | Value                      | Proxy / TTL  |
| ----- | ---- | -------------------------- | ------------ |
| CNAME | crm  | `cname.vercel-dns.com.`    | DNS only / 60 |

That is the only DNS change. If their DNS provider does not allow CNAME
on a subdomain, alternative is an **ALIAS** record to the same target,
or two **A** records to `216.150.1.1` and `216.150.16.1` (Vercel's
documented anycast IPs at the time of writing — confirm in Vercel
dashboard when you add the domain in step 2).

### 2. Add the domain to the Vercel project

In the Vercel dashboard:

1. Open the `ls-crm` project → **Settings → Domains**.
2. Add domain → enter `crm.lifescientific.com`.
3. Vercel will display the exact DNS record it expects. If the value
   in step 1 differs from what Vercel shows, use Vercel's value.
4. Wait for DNS to validate (usually <5 min). Vercel will issue a
   Let's Encrypt cert automatically.

CLI equivalent (after `vercel login`):

```bash
vercel domains add crm.lifescientific.com ls-crm
```

### 3. Set the production env vars in Vercel

In the same Vercel project → **Settings → Environment Variables**,
update or create the following for the **Production** environment:

| Variable               | Value                              |
| ---------------------- | ---------------------------------- |
| `NEXT_PUBLIC_APP_URL`  | `https://crm.lifescientific.com`   |
| `NEXTAUTH_URL`         | `https://crm.lifescientific.com`   |

Then **redeploy** (Vercel → Deployments → ⋯ on the latest production
deploy → Redeploy, or push a new commit). NextAuth.js uses
`NEXTAUTH_URL` to build OAuth callback URLs and signed-in cookies —
without this change, sign-in will redirect users back to `ls-nexus.com`.

### 4. (Optional but recommended) Make ls-nexus.com a "redirecting alias" in Vercel

The `next.config.ts` redirect handles this in app code, but you can
also do it at the Vercel platform layer for slightly faster response:

1. Vercel project → Settings → Domains → `www.ls-nexus.com` → ⋯ → Edit.
2. Set **Redirect to** = `crm.lifescientific.com`, status `308`.
3. Repeat for the apex `ls-nexus.com`.

If you do this, you can later delete the redirect from `next.config.ts`.
For now both layers work fine together — Vercel's runs first, the app's
runs as fallback.

## Deploy

Just push to `main`. Vercel auto-deploys.

```bash
git add -A
git commit -m "feat(domain): cut over to crm.lifescientific.com primary"
git push
```

## Verify after deploy (replace nothing — copy/paste)

```bash
# 1. New primary should serve the app
curl -sI https://crm.lifescientific.com | head -5

# 2. Old primary should 308 redirect to new primary
curl -sI https://www.ls-nexus.com/dashboard | head -5
# Expect: HTTP/2 308   location: https://crm.lifescientific.com/dashboard

# 3. SEO files should be at the NEW canonical
curl -s https://crm.lifescientific.com/robots.txt
curl -s https://crm.lifescientific.com/sitemap.xml | head -20
curl -s https://crm.lifescientific.com/.well-known/security.txt

# 4. Cert should be valid
echo | openssl s_client -servername crm.lifescientific.com -connect crm.lifescientific.com:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer
```

## Tell users

Send a one-line update to the Diacom team:

> The CRM is now reachable at `https://crm.lifescientific.com`. Please
> update your bookmarks. The old `ls-nexus.com` URL still works for
> external partners but will redirect.

## Follow-ups (separate work, not blocking the unblock)

- **Resend sender domain.** Verify `lifescientific.com` (or
  `notifications.lifescientific.com`) in Resend so transactional emails
  go out as `noreply@lifescientific.com`. Until then, FROM is still
  `@ls-nexus.com` which may hit the same "New Domains" filter on
  recipients' inbound mail filters. Steps:
  1. Resend dashboard → Domains → Add `lifescientific.com`.
  2. Add the DKIM/SPF/DMARC records Resend provides to the
     `lifescientific.com` DNS zone.
  3. Update `from:` literals in:
     - `src/app/api/auth/forgot-password/route.ts` (`noreply@`)
     - `src/app/api/pipeline/route.ts` (`info@`)
     - `src/app/api/pipeline/[id]/route.ts` (`info@`)
     - `src/app/api/action-items/route.ts` (`action@`, 2x)
     - `src/app/api/action-items/[id]/route.ts` (`action@`)
     - `src/app/api/cron/action-items-digest/route.ts` (`action@`)
- **Recategorization.** Still a good idea to clear `ls-nexus.com`
  globally — see `docs/domain-recategorization.md`. Lower priority now
  that it's not the user-facing host.
- **OAuth providers.** None currently configured. If you ever add
  Google/Microsoft sign-in, register `https://crm.lifescientific.com/api/auth/callback/<provider>`
  as the redirect URI.

## Rollback

If anything goes wrong:

1. In Vercel → Deployments → promote the previous deploy.
2. Remove `crm.lifescientific.com` from the Vercel project Domains.
3. The host-based redirect in `next.config.ts` is harmless without
   the new domain — it only fires when the request host matches
   `(www.)?ls-nexus.com`.

DNS rollback: delete the `crm` CNAME on `lifescientific.com`. Cert
auto-renewal stops; nothing else affected.
