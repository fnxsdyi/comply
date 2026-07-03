# Comply — Free Website Compliance Scanner

Scan any website for SSL, security headers, legal pages & cookie compliance. Get an actionable report in seconds. **Free, no sign-up.**

## Features

- **SSL/TLS Audit** — HTTPS, redirects, HSTS config
- **Security Headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP, Permissions-Policy
- **Legal Page Detection** — Privacy Policy & Terms of Service auto-detection
- **Cookie Consent Check** — GDPR / CCPA compliance verification
- **Actionable Reports** — Prioritized fix guides with step-by-step instructions
- **8 Languages** — English, 中文, Deutsch, Español, Français, 日本語, 한국어, Português

## Tech Stack

- **Next.js 16** (App Router + Turbopack)
- **PostgreSQL** + **Prisma ORM**
- **Auth.js v5** — optional GitHub OAuth (not required for scanning)
- **next-intl** — 8-language i18n
- **Tailwind CSS v4**

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/fnxsdyi/comply.git
cd comply

# 2. Set up environment
cp .env.example .env
# Edit .env with your database URL and optional OAuth keys

# 3. Install & set up database
npm install
npx prisma db push

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|:---|:---|:---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ❌ | Auth.js secret (only needed for GitHub OAuth) |
| `AUTH_GITHUB_ID` | ❌ | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | ❌ | GitHub OAuth App Client Secret |
| `NEXT_PUBLIC_APP_URL` | ❌ | Public URL (defaults to localhost) |

> 💡 **Auth is optional.** Scanning works without sign-in. GitHub OAuth is only needed if you want user accounts for scan history.

## Security

- The scanner blocks internal IP ranges to prevent SSRF attacks.
- Global rate limiting: 3 scans per second per process to prevent abuse.
- No authentication is required for scanning. GitHub OAuth is strictly optional.
- Set AUTH_SECRET to a random string for production deployments.
- Error messages are sanitized — internal server details are never exposed to users.


## Contributing

Contributions welcome! Especially:

- New security header checks (e.g., Permissions-Policy, Cross-Origin-*)
- Additional legal page detection patterns
- New language translations (`messages/*.json`)
- Bug fixes & improvements

Open an issue first to discuss what you'd like to change.

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built with 🛡️ by [KAKI LLC](https://kaki.llc).
