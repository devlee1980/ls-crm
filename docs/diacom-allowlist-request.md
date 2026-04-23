# Diacom IT — allowlist request for www.ls-nexus.com

Use this email when a Diacom user reports the `Sorry, you have been blocked`
page from `guardian.diacom.ie` while trying to reach LS Nexus. Send to your
Diacom contact and ask them to forward to whoever administers Diacom Guardian.

---

**To:** _[Diacom IT contact]_
**Cc:** _[Your Diacom day-to-day contact]_
**Subject:** Allowlist request — www.ls-nexus.com (Diacom Guardian)

Hi,

Diacom Guardian is currently blocking `www.ls-nexus.com` (resolved IP
`152.86.136.15`) under category **"New Domains"**, policy **"Diacom Guardian"**.
Could you please add an allowlist exception so Diacom users can access it?

`www.ls-nexus.com` is **LS Nexus**, the production sales force management
platform owned and operated by Life Scientific. Your team uses it to manage
joint pipeline and forecasts with us. Domain details for verification:

- Hostname: `www.ls-nexus.com` (apex `ls-nexus.com` 307-redirects to `www`)
- Hosting: Vercel (`server: Vercel`, `x-vercel-id` headers present)
- TLS: Let's Encrypt, valid through 13 July 2026, HSTS preloaded
- Owner contact: Lee McDuffie, Life Scientific
- Security contact: `security@lifescientific.com` (also published at
  `https://www.ls-nexus.com/.well-known/security.txt`)
- Robots / sitemap: `https://www.ls-nexus.com/robots.txt`,
  `https://www.ls-nexus.com/sitemap.xml`

The "New Domains" categorization is a temporary artefact of the domain being
recently registered. We have submitted recategorization requests to the major
URL-reputation vendors (Cisco Talos, Symantec, Webroot, Forcepoint, Cloudflare,
Palo Alto, Fortinet) so this should clear globally within a week, but in the
meantime an explicit allowlist entry on Diacom Guardian will unblock your team
immediately.

Happy to provide any additional verification you need (DNS records, SSL
fingerprint, a call with our security team).

Thanks,
Lee McDuffie
Life Scientific
