# Security Policy & Repository Protection — Sentinel Grid

## 1. Zero-Trust Credential Architecture
- **Zero Hardcoded Secrets**: All live CCTV streaming access keys, gateway tokens, and server IP configurations are managed strictly via server-side runtime environment variables (`process.env.*`) or Google Cloud Secret Manager. No production credentials or decryption keys are embedded in source code.
- **Environment Isolation**: Production credentials (`CORP8_EMAIL`, `CORP8_PASSWORD`, `CORP8_HOST`, `GEMINI_API_KEY`, `FIREBASE_PRIVATE_KEY`) must never be committed to Git.
- **Client Shielding & Credential Isolation**: Frontend applications communicate exclusively through authenticated reverse-proxy paths (`/api/sentinel/...`) and never receive raw network IP addresses, camera passwords, or RTSP credentials.

## 2. Server-Side Access Control & Anti-Reuse
- Feeds, AI inference loops, and command dispatch endpoints are verified at runtime using Role-Based Access Control (RBAC) and Firebase Admin Token validation.
- All camera access enforces authoritative registry validation to prevent SSRF and unauthorized network probing.
- Rate limiting is enforced across all authentication, camera streaming, and analytical endpoints.
- Unauthorized attempts to probe, scrape, or extract surveillance streams are logged to the security audit trail and denied.

## 3. Reporting Vulnerabilities
If you discover a security vulnerability or anomalous behavior, report it immediately to the State Crime Records Bureau (SCRB) Security Operations Command.
