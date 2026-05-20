# Solution

A walkthrough of how this app is put together and why I made the choices I did.

## What it is

A small product catalog system for an imaginary e-commerce admin/employee. There's a .NET 8 Web API on the backend, 
a Postgres 16 database, and an Angular 20 SPA on the frontend. 
Admins can create, edit and delete products and categories, while employees can only view. Users needs to log in first.

The brief asked for a few specific things and I wanted those pieces to be the focus rather than burying them under abstractions.

## The stack

| Layer | Choice |
| --- | --- |
| Database | Postgres 16, running in a container via docker-compose |
| Data access | Npgsql (ADO.NET driver) |
| API | ASP.NET Core 8, controllers + minimal hosting |
| Auth | JWT bearer tokens with role claims |
| Frontend | Angular 20 standalone components, signals + RxJS |
| UI library | Angular Material 20 |
| Styles | TailwindCSS 3 (preflight disabled so it doesn't fight Material) |

## Folder layout

```
ProductManagementApp/
├── docker-compose.yml          # Postgres container
├── .env.example                # template for credentials
├── db/
│   ├── 01_schema.sql           # tables + indexes
│   ├── 02_functions.sql        # stored functions for CRUD + search
│   └── 03_seed.sql             # default admin + seed products
├── backend/
│   └── ProductCatalog.Api/
│       ├── Program.cs          # composition root, DI, middleware pipeline
│       ├── Controllers/        # Auth, Products, Categories
│       ├── Entities/           # Product (IComparable), Category, User
│       ├── Dtos/               # request/response records
│       ├── Repositories/       # IRepository<T,K> + RepositoryBase
│       ├── Search/             # ProductSearchEngine (BCL only)
│       ├── Extensions/         # ProductQueryExtensions (custom LINQ)
│       ├── Middleware/         # exception + request logging
│       ├── Auth/               # JWT service + settings
│       ├── Caching/            # SearchCache (dictionary-based)
│       ├── Trees/              # CategoryTree builder
│       ├── Serialization/      # PriceJsonConverter
│       └── Validation/         # pattern-matching validators
└── frontend/
    └── src/app/
        ├── core/
        │   ├── models/         # TS interfaces
        │   ├── state/          # AppState static wrapper
        │   ├── services/       # AuthService, ProductService, CategoryService
        │   ├── interceptors/   # auth (attaches JWT), error (snackbars)
        │   └── guards/         # authGuard, adminGuard
        ├── shared/components/  # search-bar, category-filter, confirm-dialog
        └── features/
            ├── auth/           # login, register
            ├── products/       # product-list + product-details-dialog
            └── categories/     # management page + dialog
```

## Backend tour

### Data access

The repository pattern talks to Postgres via
stored functions. `IRepository<TEntity, TKey>` defines the standard
`GetByIdAsync / GetAllAsync / AddAsync / UpdateAsync / DeleteAsync` shape.
`RepositoryBase<T,K>` owns the connection lifecycle and gives concrete repos
three protected helpers - `ExecuteFunctionListAsync`,
`ExecuteFunctionSingleAsync`, `ExecuteScalarFunctionAsync` - each
takes a `Func<NpgsqlDataReader, T>` mapper. The concrete repos
(`ProductRepository`, `CategoryRepository`, `UserRepository`) supply the SQL
call string and the row mapper, and that's it.

Going to Npgsql keeps the SQL boundary explicit and
puts the database in charge of the operations it's best at.

### The search engine

The brief required:
- only the .NET base class library, no NuGets
- fuzzy matching (so "lptop" matches "laptop")
- multi-field weighted scoring
- generic over entity type so it could be reused

The implementation lives in `Search/ProductSearchEngine.cs`. The engine takes
a list of `SearchableField<T>` (a selector function + a weight) and a fuzzy
threshold. For each item, it sums `field.Weight × fieldScore` across every
(query term, field) pair. The per-field score is a substring bonus on exact
hits, otherwise the best Levenshtein similarity (`1 - distance / maxLen`)
across the field's tokens, gated by the threshold so unrelated words score
zero.

Levenshtein is implemented with two rolling arrays instead of a full N×M
matrix to keep allocations small. That's a minor optimisation, but it matters
for large catalogue searches.

The engine is registered in `Program.cs` as a singleton, configured with
three product fields (name weight 1.0, sku 0.8, description 0.4) and a
threshold of 0.6. The product controller injects it and uses it when a
`search` query parameter is present.

### Pattern matching for validation

`Validation/ProductValidator.cs`; Each validator is a single `switch` expression with property
patterns, which reads like a list of guard clauses:

```csharp
public static ValidationResult Validate(CreateProductRequest? request) =>
    request switch {
        null                          => Fail("Request body is required."),
        { Name: null or "" }          => Fail("Name is required."),
        { Name.Length: > 255 }        => Fail("Name must be 255 characters or fewer."),
        ...
    };
```

No reflection, no attributes scattered on DTO properties, no extra dependency.

### Custom middleware, custom JSON

The middleware lives in `Middleware/`. A constructor takes
`RequestDelegate` and the logger, then an `InvokeAsync(HttpContext)` method.
Two of them: an exception handler that catches anything downstream and
writes a `{ error, traceId }` JSON body, and a request logger that records
method, path, status code and elapsed milliseconds.

The custom JSON serialisation is focused: `PriceJsonConverter`
on `ProductDto.Price` forces two decimal places (so `19.9` becomes `19.90`).

### Auth

JWT bearer tokens. `Auth/JwtTokenService` issues them with the user's id,
username and role claim. The standard `JwtBearer` middleware validates them
and exposes the claims on `HttpContext.User`. Write endpoints carry
`[Authorize(Roles = UserRoles.Admin)]`; read endpoints are
`[AllowAnonymous]`. Employees who get past the login screen can READ Data
but anything that mutates state returns 403 unless they're an admin (CREATE UPDATE DELETE).

Passwords are hashed with BCrypt. The seed file's admin
hash was verified against the literal string `Admin#123`.

## Frontend Tour

### Standalone components, signals, RxJS

Angular 20 defaults to standalone components and that's what I used. Each component declares its own imports, 
and the router lazy-loads each feature via `loadComponent`.

State is split between signals and RxJS by what fits:
- HTTP calls are observables.
- In-memory state ("am I authenticated?", "is the dialog saving?") is a
  signal so templates can read it synchronously.

`AuthService` is a good example - it subscribes
to the login response via RxJS, then updates an internal signal and pushes
the user into `AppState` for persistence.

### The static AppState wrapper

`core/state/app-state.ts` is a static class. It wraps a `Map` for synchronous reads, a per-key `BehaviorSubject` 
for observers, and an optional `localStorage` mirror for keys that should survive a refresh.

Three things use it: the auth token (persistent), the product list filter
(persistent - so users don't lose their view when navigating to
/categories), and a categories cache (in-memory).

### Forms, dialogs, role-aware UI

Every form is reactive. The validation rules mirror the backend - same
required fields, same length limits - so the user gets immediate inline
feedback before submit. Client-side validation is a UX shortcut; the API still runs the same checks.

Add and edit share a single dialog component. `ProductDetailsDialogComponent`
and `CategoryDialogComponent` both take an optional entity in their data
input. One component, two flows, no duplication.

The admin / employee split is template-driven -
`@if (auth.isAdmin())` around the Add / Edit / Delete buttons.

### Interceptors and guards

Two functional interceptors. `authInterceptor` attaches
`Authorization: Bearer <jwt>` to every outgoing request when a token is
present. `errorInterceptor` is the central place that maps HTTP failures to
user-visible snackbars and handles 401 by logging the user out and
redirecting to `/login`.

`authGuard` is a functional `CanActivateFn` that bounces unauthenticated
users to `/login` with a `returnUrl` query param so they can come back to
where they wanted after signing in.

## Tradeoffs and things I'd change

### Things I made simpler than they could be

- **Search is in-memory after one DB round trip.** When the user types a
  query, the API pulls the first 500 rows for the active category and
  re-ranks them with the search engine. This is fine for a small catalogue
  but won't scale. The proper fix is moving fuzzy matching into Postgres via
  `pg_trgm` and an index. I'd flag this as a known limitation rather than
  pretending it scales.

- **Stored procedure / repository ergonomics.** Each repo manually spells
  out parameter names and mappers. A reflection-based mapper would cut the
  boilerplate, but it would also hide the SQL boundary, which is the thing
  the brief was asking me to show.

- **Cycle prevention in categories is shallow.** `sp_update_category`
  rejects the direct case (A's parent = A) but not A → B → A. Catching
  deeper cycles would need a recursive CTE walking the ancestor chain.

- **No optimistic updates on the client.** Every product mutation triggers
  a re-fetch. Simple to reason about, slower under high latency.

### Things that look heavier than they are

- **Static AppState alongside DI services.** The services own their domains, AppState is
  a side channel for cross-cutting scratch state. But it's worth defending,
  and I'd reach for NgRx or a signal store instead in a larger app.

- **Angular Material + Tailwind.** Tailwind's preflight is disabled in
  `tailwind.config.js` so its CSS reset doesn't clobber Material's base
  styles. With that one switch, the two coexist cleanly - Material for
  components, Tailwind for layout utilities.

### Security shortcuts that would not survive production

- The JWT secret is in `appsettings.json`. Real deployments would inject it
  via environment variables, Azure Key Vault, AWS Secrets Manager, etc...
- The token sits in `localStorage`, which makes it XSS-readable. The
  alternative - an `HttpOnly` cookie - is the standard recommendation for
  production SPAs; I went with `localStorage` because it's simpler to demo.
- There's no rate limiting on the login endpoint. I'd add the
  `Microsoft.AspNetCore.RateLimiting` middleware in a real app.

## Running it

The README has the actual instructions, but the short version:

```
cp .env.example .env          # set credentials
docker-compose up -d          # start Postgres
cd backend && dotnet run --project ProductCatalog.Api      # API on :5080
cd frontend && npm install && npm start                    # Angular on :4200
```

Default admin: `admin / Admin#123`.
