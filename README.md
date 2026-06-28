# Property Intelligence Platform

Property management system with Vite frontend + Cloudflare Workers backend.

## Development

```bash
npm install
npm run dev        # Frontend on http://localhost:5173
npm run dev:worker # Worker on http://localhost:8787
```

## Authentication

Login at `/auth/login`:
```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Returns: { "token": "...", "refreshToken": "..." }
```

Use token for API requests:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/properties
```

## Environments

Deploy to different environments:
```bash
npm run deploy:dev        # Development
npm run deploy:staging    # Staging  
npm run deploy            # Production
```

Each environment has its own D1 database.

## API Endpoints

### Auth
- `POST /auth/login` - Login with email/password
- `POST /auth/verify` - Verify JWT token
- `POST /auth/refresh` - Refresh JWT token

### Resources (paginated)
- `GET /api/{entity}?page=1&limit=20` - List with pagination
- `POST /api/{entity}` - Create
- `GET /api/{entity}/{id}` - Get by ID
- `PATCH /api/{entity}/{id}` - Update
- `DELETE /api/{entity}/{id}` - Soft delete

Entities: properties, contacts, suppliers, invoices, maintenance, documents, tasks

## Database

Migrations in `migrations/` are applied automatically:
- `0001_core_domain.sql` - Core tables
- `0002_seed.sql` - Sample data
- `0003_statement_processing.sql` - Finance tables
- `0006_soft_delete_audit.sql` - Soft delete + audit
- `0007_audit_tracking.sql` - Tracking columns

## Security

- JWT authentication on all `/api/*` routes
- Soft deletes (data marked deleted, not removed)
- Audit trail (all changes logged)
- Rate limiting (100 req/hour per IP)
- CORS enabled
- Input validation + SQL injection protection
