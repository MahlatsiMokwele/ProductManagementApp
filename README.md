# Product Catalog Management System

Take-home assignment: Senior C#/Angular Developer.
Backend for a small e-commerce product catalog. C# (.NET 8) Web API + Postgres.
Angular + TS.

## REQUIREMENTS

- Docker
- DotNet 8
- Angular 16+ (Althoug I have written this with AngularCLI version 20, Node 22.14 and NPM 11.5.2)

## Quick start

1. **Copy env file**

```bash
   cp .env.example .env
```

Edit `.env` and set real values (especially `JWT_SECRET`).

2. **Start Postgres**

```bash
   docker-compose up -d
```

This starts Postgres 16 on port 55475 and runs the SQL scripts in `./db/` to
create the schema, stored functions, and a small seed dataset.

3. **Run the API**

Before running the backend, update the database connection string under `appsettings.json` to ensure the api can connect and communicate with the database.

```bash
   cd backend
   dotnet run --project ProductCatalog.Api
```

The API listens on `http://localhost:5080` by default. Swagger UI is at `/swagger`.

4. **Default seeded admin**

```bash
   username: admin
   password: Admin#123
```

POST to `/api/auth/login` with those credentials to get a JWT (Swagger UI).

5. **Run the Angular frontend**

```bash
   cd frontend
   npm install
   npm start
```

Opens `http://localhost:4200`. Will redirect to `/login` until you sign in.

## What's where

| Path                          | Purpose                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `db/`                         | SQL schema, stored functions, seed data. Mounted into Postgres on first start. |
| `backend/ProductCatalog.Api/` | The Web API project.                                                           |
| `frontend/`                   | Angular 20 SPA (Material + Tailwind).                                          |
| `docker-compose.yml`          | Local Postgres container.                                                      |
| `.env.example`                | Template for credentials. Real `.env` is gitignored.                           |

For an architecture walkthrough, see `solution.md`.
