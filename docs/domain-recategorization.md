# ls-nexus.com — URL Reputation Recategorization Packet

`www.ls-nexus.com` is a recently-registered domain. Several enterprise web filters
default new domains to **"Newly Seen"** or **"Uncategorized"** and block them by
policy. To stop being blocked at customer sites (Diacom Guardian was the first
report), submit a recategorization request to each of the major URL-reputation
vendors below.

## Domain audit (verified 2026-04-23)

- Apex `ls-nexus.com` → `216.150.16.193`, `216.150.1.193` (Vercel anycast).
- `www.ls-nexus.com` CNAME → `49b70447c3938fff.vercel-dns-016.com.`
- SSL: Let's Encrypt, valid through Jul 13 2026.
- HSTS preload header active (`max-age=63072000; includeSubDomains; preload`).
- No Vercel Password Protection. Login form is publicly reachable for crawlers.
- Apex 307-redirects to `https://www.ls-nexus.com/`. Use `www` in submissions.

## Suggested category

**Business and Industry** (or vendor equivalent: `Business`, `Business and Economy`,
`Computers/Internet — Business`).

## Suggested description (paste into every form)

> www.ls-nexus.com is the production sales force management platform (CRM) for
> Life Scientific, an established crop-protection company. The domain is owned
> and operated by Life Scientific and serves only authenticated employees and
> partners. It is hosted on Vercel with a valid Let's Encrypt SSL certificate,
> publishes a security.txt at /.well-known/security.txt, and exposes a robots.txt
> and sitemap.xml. Please categorize as Business / Business and Industry.

## Vendors to submit to

| Vendor | Submission URL | Suggested category |
|---|---|---|
| Cisco Talos | https://talosintelligence.com/reputation_center | Business and Industry |
| Symantec / Broadcom Site Review | https://sitereview.bluecoat.com/ | Business |
| Webroot BrightCloud | https://www.brightcloud.com/tools/url-ip-lookup.php | Business and Economy |
| Forcepoint URL Categorization | https://csi.forcepoint.com/ | Business and Economy |
| Cloudflare Radar Domain Intelligence | https://radar.cloudflare.com/domains/feedback | Business |
| Palo Alto Test-A-Site | https://urlfiltering.paloaltonetworks.com/ | Business and Economy |
| Fortinet FortiGuard | https://fortiguard.com/webfilter | Business |

### Cisco Talos

1. Go to https://talosintelligence.com/reputation_center
2. Enter `www.ls-nexus.com` in the lookup box.
3. Click **Submit a Dispute** / **Web Categorization Dispute**.
4. Category: `Business and Industry`. Paste the suggested description. Provide
   contact email `security@lifescientific.com`.

### Symantec / Broadcom Site Review

1. Go to https://sitereview.bluecoat.com/
2. Enter `www.ls-nexus.com`. Click **Check**.
3. Click **Request Review**. Category: `Business`. Paste description.

### Webroot BrightCloud

1. Go to https://www.brightcloud.com/tools/url-ip-lookup.php
2. Enter `www.ls-nexus.com`. Click **Look Up**.
3. Click **Request Reclassification**. Category: `Business and Economy`.

### Forcepoint

1. Go to https://csi.forcepoint.com/
2. Search `www.ls-nexus.com`.
3. Click **Suggest a category**. Pick `Business and Economy`.

### Cloudflare Radar

1. Go to https://radar.cloudflare.com/domains/feedback
2. Submit category `Business` for `ls-nexus.com`.

### Palo Alto

1. Go to https://urlfiltering.paloaltonetworks.com/
2. Enter `www.ls-nexus.com`. Click **Search**.
3. Click **Request Change** / **Request Recategorization**. Pick
   `Business and Economy`.

### Fortinet FortiGuard

1. Go to https://fortiguard.com/webfilter
2. Enter `www.ls-nexus.com`. Click **Search**.
3. Click **Submit a URL Rating** / **Suggest Web Rating Submission**. Pick
   `Business`.

## After submission

- Most vendors process requests within 24 hours – 7 days.
- Once recategorized, customer firewalls that pull updates from these vendors
  will start allowing the domain on the next refresh cycle (usually 24 h).
- If a specific customer is blocked before recategorization propagates, send
  them `[diacom-allowlist-request.md](diacom-allowlist-request.md)` (or the
  customer-specific equivalent) so their IT can add a manual exception.

## Re-test after submitting

Use these public tools to confirm the new category was accepted:

- Talos: https://talosintelligence.com/reputation_center/lookup?search=ls-nexus.com
- Symantec: https://sitereview.bluecoat.com/#/lookup-result/www.ls-nexus.com
- BrightCloud: https://www.brightcloud.com/tools/url-ip-lookup.php
- Palo Alto: https://urlfiltering.paloaltonetworks.com/query/www.ls-nexus.com
- FortiGuard: https://fortiguard.com/webfilter?q=www.ls-nexus.com
