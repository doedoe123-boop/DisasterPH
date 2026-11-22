@AGENTS.md

# DisasterPH

DisasterPH is a map-first disaster awareness app for the Philippines. It uses Next.js App Router, React, MapLibre, Supabase, and Web Push. Treat package-lock.json and the source tree as the current implementation.

- Run `npm ci` with a supported Node.js version, then `npm run lint`, `npx tsc --noEmit`, and `npm run build` as appropriate. Use local fixtures or a disposable development project for checks involving external writes.
- Use `/disasterph` for project conventions and `/security-review` for defensive maintenance. Specialists are available in `.claude/agents/`.
- Run `/security-review` before changing community reports, notifications, or deployment dependencies. Keep detailed security findings out of the repository.
- Keep service-role credentials, moderation credentials, and VAPID private keys on the server. Use environment variable names in reports and omit their values.
- Verify source provenance and freshness for public alerts and shelter information. Label fixtures and unverified status clearly. Keep the map usable when upstream sources or tiles are unavailable.
