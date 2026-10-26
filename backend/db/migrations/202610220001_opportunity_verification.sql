UPDATE opportunities
SET is_published = 0,
    source_url = NULL,
    application_url = NULL,
    verification_status = 'removed',
    date_checked = NULL
WHERE seed_key LIKE 'sample:%';

WITH ranked_sources AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY lower(trim(source_url)) ORDER BY created_at, id) AS duplicate_rank
  FROM opportunities
  WHERE source_url IS NOT NULL AND verification_status != 'removed'
)
UPDATE opportunities
SET is_published = 0, verification_status = 'removed', date_checked = NULL
WHERE id IN (SELECT id FROM ranked_sources WHERE duplicate_rank > 1);

CREATE UNIQUE INDEX IF NOT EXISTS opportunities_source_url_unique
ON opportunities(lower(trim(source_url)))
WHERE source_url IS NOT NULL AND verification_status != 'removed';