# Security Policy & Responsible Disclosure

## 1. Zero-Trust Credential Architecture
- **No Hardcoded Secrets**: All live CCTV streaming access keys, gateway tokens, and server IP configurations are securely encapsulated and decrypted only in runtime memory.
- **Environment Isolation**: Production credentials (`CORP8_EMAIL`, `CORP8_PASSWORD`, `CORP8_HOST`, `GEMINI_API_KEY`) must never be committed to Git.
- **Client Shielding**: Frontend applications communicate exclusively through authenticated reverse-proxy paths (`/api/sentinel/...`) and never receive raw network IP addresses or camera credentials.
- **Evidence Integrity**: All captured frames and evidentiary records compute SHA-256 digests at edge ingress time in compliance with Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.

## 2. Infrastructure & API Security
- CCTV stream gateways and AI dispatch endpoints enforce strict token authorization and rate limiting.
- Sensitive environment variables and secrets are managed via standard environment configuration and Secret Manager.

## 3. Reporting Vulnerabilities
If you discover a security vulnerability or anomalous behavior, report it to the Gujarat Police State Crime Records Bureau (SCRB) Security Operations Command.
