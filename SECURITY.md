# Security Policy & Repository Protection

## 1. Zero-Trust Credential Architecture
- **No Hardcoded Secrets**: All live CCTV streaming access keys, gateway tokens, and server IP configurations are securely encapsulated and decrypted only in runtime memory.
- **Environment Isolation**: Production credentials (`CORP8_EMAIL`, `CORP8_PASSWORD`, `CORP8_HOST`, `GEMINI_API_KEY`) must never be committed to Git.
- **Client Shielding**: Frontend applications communicate exclusively through authenticated reverse-proxy paths (`/api/sentinel/...`) and never receive raw network IP addresses or camera credentials.

## 2. Anti-Cloning & Reuse Prevention
- Feeds, AI inference loops, and command dispatch endpoints are verified at runtime.
- Unauthorized attempts to probe, scrape, or extract surveillance streams are logged and denied.

## 3. Reporting Vulnerabilities
If you discover a security vulnerability or anomalous behavior, report it immediately to the State Crime Records Bureau (SCRB) Security Operations Command.
