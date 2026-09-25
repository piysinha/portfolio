# Host on Cloudflare Pages, not Vercel

The site is hosted on Cloudflare Pages, and the contact form runs as a Pages Function. We rejected Vercel because its free Hobby plan is for non-commercial use only, and the site is meant to attract freelance clients. We rejected GitHub Pages because it can't run server code, so the contact form would have to depend on a third-party form service. Cloudflare's free tier allows commercial use and includes serverless functions, Turnstile spam protection and DNS, which keeps the whole site at zero cost apart from the domain.
