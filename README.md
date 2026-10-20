# E-Commerce — .NET + Angular

Full-stack e-commerce application built with **ASP.NET Core 10 (Web API)** and **Angular 21**.

## Features

- Product & category catalog with image management
- Shopping cart (Redis-backed, with guest cart support)
- Authentication & authorization (ASP.NET Core Identity + JWT)
- Orders, delivery methods and shipping addresses
- Stripe payment integration (PaymentIntent + webhook)
- Stock reservations with Hangfire background expiration jobs
- Rate limiting and security headers
- Unit/integration tests (xUnit)

## Repository structure

```
Backend_Src/
  Src/
    ECom.Api/              # ASP.NET Core Web API
    ECom.Api.Tests/        # Tests
    ECom.Infrastructure/   # EF Core, repositories, services
    Ecom.Core/             # Entities, DTOs, interfaces

FrontEnd_Src/
  Src/
    client/                # Angular application
```

## Prerequisites

- .NET 10 SDK
- SQL Server (LocalDB or full instance)
- Redis (running on `localhost:6379`)
- Node.js 20+ and npm

## Backend setup

```powershell
cd Backend_Src
dotnet restore
dotnet run --project Src/ECom.Api
```

The API listens on `http://localhost:5090`.

Sensitive values in `appsettings.json` are intentionally empty. Provide them with
[.NET user-secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets):

```powershell
cd Src/ECom.Api
dotnet user-secrets set "EmailSetting:password" "<gmail-app-password>"
dotnet user-secrets set "token:Secret" "<jwt-signing-secret>"
dotnet user-secrets set "Stripe:SecretKey" "<stripe-secret-key>"
dotnet user-secrets set "Stripe:WebhookSecret" "<stripe-webhook-secret>"
```

Database migrations are applied on startup / via EF Core tooling, and an admin
account is seeded using `Seed:AdminEmail` plus user-secrets.

## Frontend setup

```powershell
cd FrontEnd_Src/Src/client
npm install
npm start
```

The Angular dev server runs on `http://localhost:4200` and calls the API at
`http://localhost:5090/api/v1` (see `src/environments/environment.development.ts`).

## Tests

```powershell
cd Backend_Src
dotnet test
```

## Notes

- Never commit real credentials. Use user-secrets locally and environment
  variables / a secret manager in production.
- Stripe publishable keys (`pk_...`) are public by design; secret keys
  (`sk_...`) and webhook secrets (`whsec_...`) must stay private.
