# Deployment

| Part | Host | Config |
|---|---|---|
| Database | Supabase Postgres | schema from `server/db/schema.sql` |
| API | Render (free web service) | [`render.yaml`](../render.yaml) |
| Frontend | Vercel | [`client/vercel.json`](../client/vercel.json) |

Vercel forwards `/api/*` to the Render API, so the browser only talks to one origin and no CORS setup is needed.

## Steps

1. **Supabase**: create a project and run `server/db/schema.sql` (without the `DROP` lines) and the seed. Copy the **Session pooler** connection string from Connect. It's IPv4, which Render needs.
2. **Render**: New → Blueprint → select the repo. Set `DATABASE_URL` to the pooler string. `JWT_SECRET` is generated automatically.
3. **Vercel**: Import the repo, set Root Directory to `client` and deploy. If the Render URL isn't `evms-api.onrender.com`, update it in `client/vercel.json`.
4. **Sample data** (optional): `cd demo && API_URL=https://<render-url>/api node seed.mjs`

## Notes

- Render's free plan sleeps after 15 minutes idle, so the first request can take about a minute.
- Signatures are stored in the database (`files` table), because Render's disk is wiped on every deploy.
