# Hotline verification checklist

Every phone number in DisasterPH lives in `src/lib/hotlines.ts`. When you re-check the list, update `HOTLINES_REVIEWED_ON` in that file. The date is shown to users next to the agency lines.

**Status as of 22 Nov 2026:**

- **911** is backed by official sources.
- **The agency lines** come from public listings and have **not** been confirmed directly with each agency.

## Emergency number

| Number | Purpose | Evidence | Status |
| ------ | ------- | -------- | ------ |
| **911** | Nationwide emergency: police, fire, medical, rescue | DILG launched Unified 911 nationwide on 11 Sep 2025 ([DILG](https://calabarzon.dilg.gov.ph/one-number-for-all-emergencies-unified-911-to-launch-nationwide/)). Executive Order No. 56 (2018) made 911 the nationwide emergency hotline, replacing 117 ([Inquirer](https://newsinfo.inquirer.net/996682/eo-makes-911-countrys-emergency-hotline-number)). | Official source |

**Removed:** "PNP Emergency 117". EO 56 (2018) replaced 117 with 911 ([Daily Tribune](https://tribune.net.ph/2024/08/18/pnp-replaces-patrol-117-with-911-hotline)).

## Agency lines (information and coordination, not emergencies)

| Name | Number shown | Purpose label | Evidence so far | To confirm with |
| ---- | ------------ | ------------- | --------------- | --------------- |
| NDRRMC Operations Center | (02) 8911-1406 | Disaster operations center | Public lists name 8911-1406 as an Operations Center line (also 8912-2665, 8912-5668). The trunk line is 8911-5061 to 65 ([Rappler](https://www.rappler.com/environment/disasters/191715-list-emergency-hotlines-social-media-accounts-philippines/)). The app previously showed both numbers inconsistently; it now uses the operations center line everywhere. | OCD/NDRRMC |
| Philippine Red Cross | 143 | Red Cross hotline | Widely published | PRC |
| PHIVOLCS | (02) 8426-1468 | Earthquakes and volcanoes | Public listings | PHIVOLCS |
| PAGASA | (02) 8284-0800 | Weather and tropical cyclones | Public listings | PAGASA |
| BFP (Fire) | (02) 8426-0219 | Fire protection office | Public listings. Fire emergencies go through 911. | BFP |
| DOH | 1555 | Health hotline | Public listings | DOH |
| Philippine Coast Guard | (02) 8527-8481 | Maritime incidents | Public listings | PCG |

## How to verify a line

1. Confirm the number and its purpose through the agency's official website or social media account, or by contacting the agency directly.
2. Record what was confirmed: the source URL or contact, and the date.
3. Update `src/lib/hotlines.ts` (number, `dial` digits, purpose) and `HOTLINES_REVIEWED_ON`.
4. Remove any line that cannot be confirmed. A missing number is safer than a wrong one.
