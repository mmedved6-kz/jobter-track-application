# Jobter Tracker

Jobter Tracker is a Next.js app for tracking job applications with cookie-session auth and an application CRUD API.

## Development

```bash
npm install
npm run dev
```

## API overview

All API endpoints return JSON.

### Auth APIs

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create account and start session |
| POST | `/api/auth/login` | Sign in and start session |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current signed-in user |

### Application CRUD APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/applications` | List applications (search/filter/pagination) |
| POST | `/api/applications` | Create application |
| GET | `/api/applications/:id` | Fetch one application |
| PATCH | `/api/applications/:id` | Update one application |
| DELETE | `/api/applications/:id` | Delete one application |

## Application API contract

### Success shape

```json
{
  "ok": true,
  "data": {}
}
```

### Error shape

```json
{
  "ok": false,
  "error": {
    "message": "Invalid request body.",
    "code": "INVALID_BODY",
    "details": []
  }
}
```

`details` is only included when validation errors are present.

## List query params (`GET /api/applications`)

| Param | Type | Notes |
| --- | --- | --- |
| `search` | string | Optional, max 120 chars |
| `status` | enum | Optional: `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED` |
| `page` | integer | Optional, default `1`, must be `> 0` |
| `pageSize` | integer | Optional, default `10`, max `100` |

Invalid query params return `400` with `code: "INVALID_QUERY"`.

## Create/Patch body fields (`POST/PATCH`)

All content fields are optional (Notion-style blank records allowed on create):

| Field | Type |
| --- | --- |
| `company` | string (max 120) |
| `role` | string (max 120) |
| `location` | string/null (max 120) |
| `jobUrl` | string/null (http/https URL) |
| `status` | `APPLIED` \| `INTERVIEW` \| `OFFER` \| `REJECTED` |
| `appliedAt` | ISO date string or Date |
| `notes` | string/null (max 5000) |

## Verification scripts

```bash
npm run test:auth:unit
npm run test:auth:api
npm run test:applications:api
```
