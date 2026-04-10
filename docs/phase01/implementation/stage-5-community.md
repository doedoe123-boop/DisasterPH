# Stage 5: Community

## Objective

Evaluate whether community reporting can add useful local visibility without undermining trust, moderation capacity, or user safety.

## Recommendation

Delay this stage until the official-source and saved-place experience is strong. Community reporting is valuable, but it introduces the highest misinformation, privacy, and moderation burden in the roadmap.

## Scope

### Crowdsourced Reporting

- Local flood reports
- Blocked road reports
- Community-submitted observations
- Optional photo or text evidence only if moderation is ready

### Potential User Value

- Faster visibility into local road conditions
- Localized flood awareness before official updates catch up
- Community confirmation of disruptions near saved places

## Major Risks

- Misinformation
- Panic amplification
- Malicious or prank submissions
- Doxxing or privacy exposure
- Moderator overload during peak disasters

## Trust And Moderation Requirements

- Queue all reports for review before broad exposure, at least initially
- Add confidence tiers such as:
  - unverified
  - reviewed
  - corroborated
- Separate official incidents from community reports visually and semantically
- Do not mix crowdsourced reports into core official severity logic without review

## Verification Strategies

- Require location precision limits rather than exact household detail
- Compare reports against:
  - official incidents
  - nearby report clusters
  - time-based consistency
- Consider trusted volunteer or LGU reviewer roles later

## Suggested Delivery Approach

- Phase 1 of community features:
  - internal-only prototype
  - no public publishing
  - collect moderation workflow lessons
- Phase 2:
  - limited public beta in selected areas
  - clear report labeling
  - strict abuse controls

## What Should Wait

- Public write access at national scale
- Anonymous reports without safeguards
- Fully automated trust scoring used for public alerting
- Integration of community reports into notification triggers

## Recommended Acceptance Criteria

- Community reports are clearly separated from official data
- Moderation and abuse handling are defined before launch
- Privacy and safety risks are reviewed before any public rollout
