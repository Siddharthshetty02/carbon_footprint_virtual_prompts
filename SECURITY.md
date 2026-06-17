# Security Policy

## Overview

CarbonWise is a client-side web application that processes and stores all data locally in the user's browser using `localStorage`. No data is transmitted to any server.

## Security Measures

### Content Security Policy (CSP)

A strict CSP is enforced via `<meta>` tag in `index.html`:

```
default-src 'self';
script-src 'self';
style-src 'self' https://fonts.googleapis.com 'unsafe-inline';
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob:;
connect-src 'self';
```

This prevents:
- Execution of inline scripts
- Loading scripts from third-party domains
- Connection to unauthorized external services

### Input Sanitization

All user inputs are sanitized before DOM insertion or storage:

1. **HTML Entity Encoding** (`escapeHtml`): Converts `<`, `>`, `"`, `'`, `&`, `/`, `` ` `` to their HTML entity equivalents.
2. **Script Removal** (`sanitizeString`): Strips `<script>` tags, event handler attributes (`on*=`), `javascript:` URLs, and `data:text/html` URIs.
3. **Numeric Validation** (`sanitizeNumber`): Validates type, checks for NaN/Infinity, and enforces min/max bounds.
4. **URL Validation** (`sanitizeUrl`): Only allows `http:` and `https:` protocols.

### No Dangerous JavaScript

ESLint rules prohibit:
- `eval()` — `no-eval`
- `setTimeout/setInterval` with string arguments — `no-implied-eval`
- `new Function()` — `no-new-func`
- `javascript:` URLs — `no-script-url`

### Storage Security

- All `localStorage` keys are namespaced with `cw_` prefix
- JSON serialization/deserialization is wrapped in try/catch
- Storage size is monitored and capped at 4.5 MB
- Schema versioning supports safe data migration
- `clearAll()` only removes CarbonWise data

### No External Runtime Dependencies

The production build contains zero third-party JavaScript libraries. All functionality (charting, routing, state management) is implemented with vanilla JavaScript, eliminating supply-chain attack vectors.

## Reporting a Vulnerability

If you discover a security vulnerability, please open a GitHub issue or contact the maintainers directly.

## Scope

Since CarbonWise runs entirely in the browser with no backend:
- There is no server-side attack surface
- No user authentication or PII collection
- No API keys or secrets
- No database or external storage

The primary threat model is XSS via user input, which is mitigated through the sanitization layer described above.
