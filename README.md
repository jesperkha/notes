# Still

## Run locally

```sh
pnpm install
cp .env.example .env
docker compose up -d --wait db
pnpm db:migrate
pnpm dev
```

To load sample notes into the local database, run `pnpm db:seed`. The script is for development only; the database is empty by default.

Required environment variables: `DATABASE_URL` and `APP_PASSWORD`. `POSTGRES_PASSWORD` configures the local Compose database; set `POSTGRES_PORT` if port 5432 is occupied. `pnpm start` applies migrations before starting the server.

## Deploy

The GitHub Actions workflow publishes `ghcr.io/<owner>/<repository>:latest` on pushes to the default branch and version tags. [Open the GHCR package page](https://github.com/OWNER/REPOSITORY/pkgs/container/REPOSITORY) after replacing the placeholders with the GitHub repository path. Configure `DATABASE_URL` and `APP_PASSWORD` in the deployment environment, then run the image on a network that can reach Postgres.
