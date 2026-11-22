---
name: security-review
description: Run a defensive source and dependency review of DisasterPH, including Next.js, Supabase reports, and Web Push.
disable-model-invocation: true
---

# Defensive security review

1. Record the commit, runtime, and resolved dependency versions in package-lock.json. Run `npm audit --json` when the registry is available. Confirm severity, affected ranges, and patched versions against official advisories. Separate a vulnerable version from a feature-specific exposure.
2. Read the current route handlers and follow their inputs through Supabase, moderation, push delivery, and service-worker handling. Review grants and RLS, client bundles, endpoint ownership, destination validation, rate limits, and sensitive data returned publicly.
3. Review code and fixtures locally. Keep production routes, push subscribers, and production data out of verification. Use mocked local checks for authorization behavior and redact credential values and subscription URLs.
4. Report severity, file and line, impact, deployment prerequisites, remediation, and verification limits. Keep detailed findings out of the repository and record them in the team's private security notes.
