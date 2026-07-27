# loganvestal.com

Live at [loganvestal.com](https://loganvestal.com).

Logan Vestal's personal site — an art gallery. The homepage is the gallery grid, with an About
and Contact page. `/admin` (Google OAuth-gated) lets her upload artwork (with a caption and alt
text), edit, and delete pieces herself; every upload gets a watermark applied automatically, and
deleting asks for confirmation first. Forked from
[website-starter](https://github.com/arvestal/website-starter); see `CLAUDE.md` for full
conventions.

## Development

```
npm install
cp .env.example .env    # fill in GOOGLE_CLIENT_ID/SECRET, ADMIN_EMAIL, ADMIN_JWT_SECRET
npm run dev              # nodemon, http://localhost:8080
npm run lint
npm test                  # jest, 100% coverage required on src/app.js, src/lib/**, src/routes/**
```

## Deployment

Railway, auto-deploying from `main`. See `CLAUDE.md`'s Deployment section for the exact steps
(custom domain, Cloudflare DNS, the deploy-doesn't-pull-new-commits gotcha).
