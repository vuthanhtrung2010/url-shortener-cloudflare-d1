# Introduction
This project is a serverless version of [Next.JS URL Shortener](https://github.com/vuthanhtrung2010/url-shortener) can be run using CloudFlare workers with CloudFlare D1 database for faster scale and easy to deploy.

# Deploying instructions
1. Install dependencies using [Bun](https://bun.com/)
```
bun install
```

2. Create your D1 database on CloudFlare
```
npx wrangler d1 create <your-db-name>
```

3. Replace the `.env` file with your account ID and your account token, you can google.it how to get your account ID and its token

4. Run the migration
```
bun run db:migrate-production
```

5. Run the typecheck
```
bun run typecheck
```

6. Deploy it on CloudFlare 🚀
```
bun run deploy
```
