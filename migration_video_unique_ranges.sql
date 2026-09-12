-- =========================================================================
-- Migration: Unique Watched Ranges Video Progress (80% Threshold)
-- A+ Academy Platform
-- =========================================================================

-- 1. Add unique range tracking columns to public.video_progress
ALTER TABLE public.video_progress 
  ADD COLUMN IF NOT EXISTS watched_ranges jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_unique_seconds numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_position numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_duration numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Create the server-side unique range tracking & merging RPC function
CREATE OR REPLACE FUNCTION public.sync_video_watch_progress(
  p_lesson_id uuid,
  p_start_sec numeric,
  p_end_sec numeric,
  p_duration numeric,
  p_current_pos numeric DEFAULT 0
)
RETURNS jsonb AS \$\$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_approved boolean;
  v_views_count int;
  v_watched_ranges jsonb;
  v_total_unique numeric;
  v_new_ranges jsonb;
  v_limit int := 4;
  v_threshold numeric := 0.80; -- 80% unique content threshold
  v_completed_view boolean := false;
  v_unique_percent int := 0;
  v_seg_start numeric;
  v_seg_end numeric;
  v_i int;
BEGIN
  -- 1. Check user authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول لمزامنة تقدم المشاهدة.';
  END IF;

  -- 2. Verify profile approval
  SELECT is_approved INTO v_is_approved FROM public.profiles WHERE id = v_user_id;
  IF v_is_approved = false THEN
    RAISE EXCEPTION 'حسابك معلق في انتظار موافقة الإدارة.';
  END IF;

  -- 3. Ensure record exists in video_progress
  INSERT INTO public.video_progress (user_id, lesson_id, views_count, watched_ranges, total_unique_seconds, last_position, video_duration)
  VALUES (v_user_id, p_lesson_id, 0, '[]'::jsonb, 0, p_current_pos, COALESCE(p_duration, 0))
  ON CONFLICT (user_id, lesson_id) DO NOTHING;

  -- 4. Fetch current progress
  SELECT views_count, COALESCE(watched_ranges, '[]'::jsonb), COALESCE(total_unique_seconds, 0)
  INTO v_views_count, v_watched_ranges, v_total_unique
  FROM public.video_progress
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  -- If already reached limit, return locked state
  IF v_views_count >= v_limit THEN
    RETURN jsonb_build_object(
      'views_count', v_views_count,
      'unique_percent', 100,
      'total_unique_seconds', v_total_unique,
      'completed_view', false,
      'is_locked', true
    );
  END IF;

  -- 5. Validate and sanitize incoming interval [p_start_sec, p_end_sec]
  v_seg_start := GREATEST(0, LEAST(p_start_sec, p_end_sec));
  v_seg_end := GREATEST(p_start_sec, p_end_sec);

  -- Clamp to video duration if provided
  IF p_duration > 0 AND v_seg_end > p_duration THEN
    v_seg_end := p_duration;
  END IF;

  -- Ignore invalid intervals or huge chunk jumps (> 120s) to prevent spoofing
  IF v_seg_end > v_seg_start AND (v_seg_end - v_seg_start) <= 120 THEN
    v_new_ranges := '[]'::jsonb;
    
    -- Collect all existing intervals + new interval into ordered list
    WITH raw_list AS (
      SELECT 
        (elem->>0)::numeric AS s, 
        (elem->>1)::numeric AS e 
      FROM jsonb_array_elements(v_watched_ranges) AS elem
      WHERE jsonb_array_length(v_watched_ranges) > 0
      UNION ALL
      SELECT v_seg_start AS s, v_seg_end AS e
    ),
    ordered_list AS (
      SELECT s, e
      FROM raw_list
      WHERE e > s
      ORDER BY s ASC, e ASC
    )
    SELECT jsonb_agg(jsonb_build_array(s, e)) INTO v_new_ranges FROM ordered_list;

    -- Merge overlapping/adjacent intervals
    IF v_new_ranges IS NOT NULL AND jsonb_array_length(v_new_ranges) > 0 THEN
      DECLARE
        v_merged_json jsonb := '[]'::jsonb;
        v_cur_elem jsonb;
        v_m_start numeric;
        v_m_end numeric;
        v_item_start numeric;
        v_item_end numeric;
      BEGIN
        v_m_start := (v_new_ranges->0->>0)::numeric;
        v_m_end := (v_new_ranges->0->>1)::numeric;

        FOR v_i IN 1 .. (jsonb_array_length(v_new_ranges) - 1) LOOP
          v_cur_elem := v_new_ranges->v_i;
          v_item_start := (v_cur_elem->>0)::numeric;
          v_item_end := (v_cur_elem->>1)::numeric;

          IF v_item_start <= v_m_end THEN
            v_m_end := GREATEST(v_m_end, v_item_end);
          ELSE
            v_merged_json := v_merged_json || jsonb_build_array(jsonb_build_array(v_m_start, v_m_end));
            v_m_start := v_item_start;
            v_m_end := v_item_end;
          END IF;
        END LOOP;

        v_merged_json := v_merged_json || jsonb_build_array(jsonb_build_array(v_m_start, v_m_end));
        v_watched_ranges := v_merged_json;
      END;

      -- Calculate total unique seconds from merged ranges
      SELECT COALESCE(SUM((elem->>1)::numeric - (elem->>0)::numeric), 0)
      INTO v_total_unique
      FROM jsonb_array_elements(v_watched_ranges) AS elem;
    END IF;
  END IF;

  -- 6. Calculate percentage and check if 80% threshold is reached
  IF p_duration > 0 THEN
    v_unique_percent := LEAST(100, ROUND((v_total_unique / p_duration) * 100));

    IF (v_total_unique / p_duration) >= v_threshold THEN
      -- View completed!
      v_views_count := v_views_count + 1;
      v_completed_view := true;
      -- Reset ranges for the next view cycle
      v_watched_ranges := '[]'::jsonb;
      v_total_unique := 0;
      v_unique_percent := 0;
    END IF;
  ELSE
    v_unique_percent := 0;
  END IF;

  -- 7. Update database record
  UPDATE public.video_progress
  SET 
    views_count = v_views_count,
    watched_ranges = v_watched_ranges,
    total_unique_seconds = v_total_unique,
    last_position = p_current_pos,
    video_duration = GREATEST(COALESCE(video_duration, 0), COALESCE(p_duration, 0)),
    updated_at = now()
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  RETURN jsonb_build_object(
    'views_count', v_views_count,
    'unique_percent', v_unique_percent,
    'total_unique_seconds', v_total_unique,
    'completed_view', v_completed_view,
    'is_locked', (v_views_count >= v_limit)
  );
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Safe Migration: Reset ONLY records with 4/4 views (views_count >= 4)
-- Records with 0, 1, 2, 3 views remain completely untouched!
UPDATE public.video_progress
SET 
  views_count = 0,
  watched_ranges = '[]'::jsonb,
  total_unique_seconds = 0,
  last_position = 0,
  updated_at = now()
WHERE views_count >= 4;
