-- =========================================================================
-- Migration: Update course_stats View for Course Access Sync
-- Syncs enrolled student counts with both manual course_access and payment subscriptions
-- =========================================================================

CREATE OR REPLACE VIEW public.course_stats AS
WITH active_enrolled AS (
  -- 1. Active course_access
  SELECT course_id, student_id AS user_id
  FROM public.course_access
  WHERE status = 'active'
  UNION
  -- 2. Approved subscriptions that are not explicitly revoked in course_access
  SELECT s.course_id, s.user_id
  FROM public.subscriptions s
  WHERE s.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public.course_access ca
      WHERE ca.course_id = s.course_id
        AND ca.student_id = s.user_id
        AND ca.status = 'revoked'
    )
)
SELECT 
  c.id AS course_id,
  COUNT(DISTINCT ae.user_id) AS student_count
FROM public.courses c
LEFT JOIN active_enrolled ae ON ae.course_id = c.id
GROUP BY c.id;

GRANT SELECT ON public.course_stats TO anon, authenticated;
