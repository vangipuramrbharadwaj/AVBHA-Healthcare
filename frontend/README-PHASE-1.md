# AVBHA Healthcare — Frontend Phase 1

Application Foundation, Login, Layout, Routing & RBAC.

This frontend was built against the uploaded AVBHA backend API contract. It uses:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`
- `GET /api/v1/dashboard`

The login request includes the required `hospitalCode`, `login`, `password`, plus device metadata. The UI consumes the backend's `roles`, `permissions`, hospital, branch and `mustChangePassword` fields directly.

## Included

- Vite + React + TypeScript
- AVBHA blue/white responsive HMS shell
- Verdana typography
- Secure login against the real backend
- Session restoration and token refresh
- First-login mandatory password-change flow
- Logout
- Protected routes
- Permission-protected routes
- Super Admin permission bypass behavior matching backend semantics
- Role/permission-filtered sidebar
- Hospital and branch context
- `Authorization`, `X-Request-ID`, `X-Hospital-ID`, and `X-Branch-ID` API handling
- 401 refresh/retry handling
- Standardized backend error-envelope handling
- 403 and 404 pages
- Error boundary and loading states
- Real dashboard endpoint connection
- Placeholders for every major HMS module, ready for subsequent frontend phases
- Desktop/tablet/mobile responsive navigation

## Install

Copy the `frontend` folder into the AVBHA project root so the structure is:

```
AVBHA-Healthcare/
  backend/
  frontend/
```

Then:

```bash
cd /Users/vangipuramrbharadwaj/Projects/AVBHA-Healthcare/frontend
cp .env.example .env
npm install
npm run typecheck
npm run build
npm run dev
```

Open:

```
http://localhost:5173
```

Keep backend running on:

```
http://localhost:4000
```

Your backend CORS default already permits `http://localhost:5173`.

## Login

The login form requires:

- Hospital Code
- Username or Email
- Password

The backend seed currently uses `BOOTSTRAP_HOSPITAL_CODE` and `BOOTSTRAP_ADMIN_USERNAME`; use the values from your `.env` and your bootstrap password.

## Security note

Because the current backend refresh endpoint expects the refresh token in JSON rather than an HttpOnly cookie, Phase 1 stores the session in browser `sessionStorage`, not long-lived `localStorage`. For final production hardening, HttpOnly Secure SameSite refresh cookies are preferable and can be handled in Backend Phase 19.

## Next frontend phase

Frontend Phase 2 — Dashboard, Patient Registration & Patient Management.
