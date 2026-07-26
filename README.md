# loganvestal.com

Logan Vestal's personal site — an art gallery. The homepage is the gallery grid; `/admin`
(Google OAuth-gated) lets her upload and delete artwork, with a watermark applied automatically.
Forked from [website-starter](https://github.com/arvestal/website-starter); see `CLAUDE.md` for
full conventions.

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
