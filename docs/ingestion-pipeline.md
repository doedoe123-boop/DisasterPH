# Ingestion Pipeline

## Flow

1. Scheduler dispatches per-source jobs.
2. Fetcher retrieves raw source data.
3. Transformer maps source payload into normalized incident objects.
4. Validator checks required fields and source-specific assumptions.
5. Dedupe layer compares hashes and external identifiers.
6. Persistence layer upserts incidents and records fetch run metadata.
7. Alert engine evaluates changes.
8. Source health service updates freshness status.

## Source Transformers

- `EonetEventTransformer`
- `PagasaEventTransformer`
- `PhivolcsEventTransformer`

## Failure Handling

- Retry transient network failures with backoff
- Mark source as delayed if fetch exceeds freshness SLA
- Keep prior incidents visible with stale badges instead of hard-dropping them
- Capture raw payload samples for parser debugging

## Source-Specific Notes

- EONET: metadata repository for visualization and reference, not precise operations
- PAGASA: prioritize advisories, bulletins, and weather pages
- PHIVOLCS: prioritize latest earthquake listings and volcano bulletins
