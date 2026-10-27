# Deployment

| Part | Host | Config |
|---|---|---|
| Database | Supabase Postgres | schema from `server/db/schema.sql` |
| Audit log | MongoDB Atlas (free M0) | `MONGO_URL`, database `evms` |
| API | Render (free web service) | [`render.yaml`](../render.yaml) |
| Frontend | Vercel | [`client/vercel.json`](../client/vercel.json) |

Vercel forwards `/api/*` to the Render API, so the browser only talks to one origin and no CORS setup is needed.

## Steps

1. **Supabase**: create a project and run `server/db/schema.sql` (without the `DROP` lines) and the seed. Copy the **Session pooler** connection string from Connect. It's IPv4, which Render needs.
2. **Render**: New → Blueprint → select the repo. Set `DATABASE_URL` to the pooler string. `JWT_SECRET` is generated automatically.
3. **Vercel**: Import the repo, set Root Directory to `client` and deploy. If the Render URL isn't `evms-api.onrender.com`, update it in `client/vercel.json`.
4. **MongoDB Atlas**: create a free M0 cluster and a database user. In Network Access allow `0.0.0.0/0` (Render's free plan has no fixed IP). Copy the connection string (Connect → Drivers), put the password in and add `/evms` as the database name. Set it as `MONGO_URL` on Render. Then run `npm run db:backfill-audit` once (in `server/`, with the live `DATABASE_URL` and `MONGO_URL`) so vouchers created earlier get a history.
5. **Sample data**: in `server/`, with `DATABASE_URL` and `MONGO_URL` pointing at Supabase and Atlas, run `npm run db:seed-demo -- --force`. It resets both databases and loads 9 users, about 45 vouchers spread over the last 60 days, and the matching audit events. `--force` is required because it deletes the existing data.

## Notes

- Render's free plan sleeps after 15 minutes idle, so the first request can take about a minute. The login page pings the API as soon as it opens, shows a "starting the server" note, and retries the login until the server is up.
- Signatures are stored in the database (`files` table), because Render's disk is wiped on every deploy.
