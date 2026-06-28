# Deployment Guide

## Prerequisites

1. Cloudflare account with Workers enabled
2. wrangler CLI installed (`npm install -g wrangler`)
3. D1 database created per environment
4. R2 bucket for files
5. KV namespaces for caching/rate limiting

## Environment Setup

### Development (Local)

```bash
npm install
npm run dev          # Frontend on :5173
npm run dev:worker   # Worker on :8787
```

Test credentials:
- Email: `test@example.com`
- Password: `password123`

### Staging (Cloudflare)

```bash
# Set up staging database
wrangler d1 create property-intelligence-staging

# Update wrangler.jsonc with staging DB ID
# Then deploy:
npm run deploy:staging

# Run integration tests
bash integration.test.sh https://your-staging-url.workers.dev
```

### Production (Cloudflare)

```bash
# Create production database (if not exists)
wrangler d1 create property-intelligence-db

# Set JWT secret
wrangler secret put JWT_SECRET --env production

# Deploy
npm run deploy

# Verify
bash integration.test.sh https://your-production-url.workers.dev
```

## Pre-Deployment Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (or only warnings)
- [ ] `npm run test` passes (5/5 tests)
- [ ] Integration tests pass locally
- [ ] JWT_SECRET set in Cloudflare dashboard
- [ ] Database migrations applied
- [ ] Rate limiting KV namespace created
- [ ] R2 bucket configured

## Database Migrations

Migrations run automatically when deploying. To manually apply:

```bash
wrangler d1 execute property-intelligence-db --file migrations/0001_core_domain.sql --remote
```

## Rollback

If deployment fails:

```bash
# Revert to previous commit
git revert HEAD

# Redeploy
npm run deploy
```

## Monitoring

View logs in Cloudflare dashboard:
- Workers → property-intelligence → Logs
- D1 → property-intelligence-db → Query logs
- Analytics → Workers Analytics Engine

## API Endpoints

### Authentication
- `POST /auth/login` - Get JWT token
- `POST /auth/verify` - Verify token validity
- `POST /auth/refresh` - Get new token from refresh token

### Resources (Paginated)
- `GET /api/{entity}?page=1&limit=20` - List
- `POST /api/{entity}` - Create
- `GET /api/{entity}/{id}` - Get
- `PATCH /api/{entity}/{id}` - Update
- `DELETE /api/{entity}/{id}` - Soft delete

Entities: properties, contacts, suppliers, invoices, maintenance, documents, tasks

## Security

- All `/api/*` routes require valid JWT
- Input validation on all POST/PATCH requests
- Rate limiting: 100 req/hour per IP
- Soft deletes preserve data
- Audit trail tracks all changes
- CORS configured for frontend domain
- SQL injection protected (parameterized queries)

## Performance

- Paginated responses (default 20, max 100)
- Client-side caching (60s TTL)
- Request deduplication
- Exponential backoff retry (3 attempts)

## Troubleshooting

### "401 Unauthorized"
- Check JWT token validity
- Verify Authorization header format: `Bearer {token}`
- Token expires after 1 hour, use refresh endpoint

### "413 Payload Too Large"
- Max request size is 1MB
- Check file sizes or split large requests

### "429 Rate Limited"
- Hit 100 requests/hour limit
- Wait 1 hour or contact admin

### Database Errors
- Check migrations have been applied
- Verify D1 database ID in wrangler.jsonc
- Review Worker logs for SQL errors

## Support

For issues:
1. Check logs: `wrangler tail --env production`
2. Review database schema: `wrangler d1 info property-intelligence-db`
3. Run integration tests to isolate issue
