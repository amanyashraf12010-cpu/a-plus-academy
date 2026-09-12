import { createClient } from "@/utils/supabase/client";

// =========================================================================
// 1. Course Subscriptions
// =========================================================================

export async function subscribeToCourse(
  courseId: string,
  paymentMethod: string,
  receiptFile: File
) {
  const supabase = createClient();
  
  // 1. Get current logged-in user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("يجب تسجيل الدخول أولاً.");

  // 2. Upload payment receipt to storage
  const fileExt = receiptFile.name.split('.').pop();
  const filePath = `${user.id}/${courseId}_${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(filePath, receiptFile, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) throw new Error("فشل رفع صورة التحويل: " + uploadError.message);

  // 3. Insert subscription record in the database
  const { error: dbError } = await supabase
    .from("subscriptions")
    .insert([
      {
        user_id: user.id,
        course_id: courseId,
        payment_method: paymentMethod,
        receipt_url: filePath, // Stores the path inside the private bucket
        status: "pending"
      }
    ]);

  // Clean up uploaded file if database insertion fails
  if (dbError) {
    await supabase.storage.from("receipts").remove([filePath]);
    throw dbError;
  }
}

export async function subscribeToFreeCourse(courseId: string) {
  const supabase = createClient();

  // 1. Get current logged-in user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("يجب تسجيل الدخول أولاً.");

  // 2. Check if already has a subscription
  const { data: existingSub, error: checkError } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existingSub) {
    if (existingSub.status === "approved") {
      return { success: true, message: "أنت مشترك بالفعل في هذا الكورس." };
    }
    // If pending, upgrade to approved since it's a free course!
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ status: "approved" })
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    if (updateError) throw updateError;
    return { success: true, message: "تم تفعيل اشتراكك بنجاح!" };
  }

  // 3. Insert subscription record directly as approved!
  const { error: dbError } = await supabase
    .from("subscriptions")
    .insert([
      {
        user_id: user.id,
        course_id: courseId,
        payment_method: "free",
        receipt_url: null,
        status: "approved"
      }
    ]);

  if (dbError) throw dbError;
  return { success: true, message: "تم تسجيلك في الكورس بنجاح!" };
}

export async function getCourseSubscriptionStatus(courseId: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      isLoggedIn: false,
      status: null,
      isFullApproved: false,
      unlockedLessonIds: [] as string[],
      pendingLessonIds: [] as string[],
    };
  }

  try {
    // 1. Fetch full course subscription (lesson_id IS NULL)
    const { data: fullSub } = await supabase
      .from("subscriptions")
      .select("status, lesson_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .is("lesson_id", null)
      .maybeSingle();

    const isFullApproved = fullSub?.status === "approved";
    const fullStatus = fullSub ? fullSub.status : null;

    // 2. Fetch all lesson_access records and approved lesson subscriptions for this user in this course
    const { data: lessonAccessData } = await supabase
      .from("lesson_access")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    const { data: approvedLessonSubs } = await supabase
      .from("subscriptions")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("status", "approved")
      .not("lesson_id", "is", null);

    const unlockedSet = new Set([
      ...(lessonAccessData || []).map((la: any) => la.lesson_id),
      ...(approvedLessonSubs || []).map((as: any) => as.lesson_id)
    ].filter(Boolean));

    const unlockedLessonIds = Array.from(unlockedSet);

    // 3. Fetch pending lesson subscriptions
    const { data: pendingLessonsData } = await supabase
      .from("subscriptions")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("status", "pending")
      .not("lesson_id", "is", null);

    const pendingLessonIds = (pendingLessonsData || []).map((pl: any) => pl.lesson_id).filter(Boolean);

    return {
      isLoggedIn: true,
      status: fullStatus,
      isFullApproved,
      unlockedLessonIds,
      pendingLessonIds,
    };
  } catch (error: any) {
    console.error("خطأ في جلب حالة الاشتراك:", error.message);
    return {
      isLoggedIn: true,
      status: null,
      isFullApproved: false,
      unlockedLessonIds: [],
      pendingLessonIds: [],
    };
  }
}

// =========================================================================
// 2. My Enrolled Courses
// =========================================================================

export async function getMyCourses() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولاً.");

  // 1. Fetch courses with full approved subscription
  const { data: fullSubs, error: fullError } = await supabase
    .from("subscriptions")
    .select(`
      course_id,
      courses (
        id,
        title,
        description,
        image,
        grade,
        subject,
        video_count,
        duration,
        teachers (
          name
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "approved");

  if (fullError) throw fullError;

  // 2. Fetch courses with single lesson access
  const { data: lessonAccessList, error: laError } = await supabase
    .from("lesson_access")
    .select(`
      course_id,
      courses (
        id,
        title,
        description,
        image,
        grade,
        subject,
        video_count,
        duration,
        teachers (
          name
        )
      )
    `)
    .eq("user_id", user.id);

  if (laError) {
    console.warn("Could not fetch lesson_access in getMyCourses:", laError.message);
  }

  // Combine and deduplicate courses
  const courseMap = new Map<string, any>();

  (fullSubs || []).forEach((sub: any) => {
    if (sub.courses && !courseMap.has(sub.courses.id)) {
      courseMap.set(sub.courses.id, sub.courses);
    }
  });

  (lessonAccessList || []).forEach((la: any) => {
    if (la.courses && !courseMap.has(la.courses.id)) {
      courseMap.set(la.courses.id, la.courses);
    }
  });

  return Array.from(courseMap.values());
}

// =========================================================================
// 3. Lesson Access & Video Tracking
// =========================================================================

export async function getLessonVideoUrl(lessonId: string) {
  const supabase = createClient();

  // Call secure RPC function that checks subscription status and increments views
  const { data, error } = await supabase
    .rpc("get_lesson_video_url", { p_lesson_id: lessonId });

  if (error) throw new Error(error.message);

  const rawUrl = data as string;

  // If URL is an external link (like YouTube, Vimeo, Bunny), return it directly
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  // Otherwise, treat as relative path inside private Supabase "videos" bucket
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("videos")
    .createSignedUrl(rawUrl, 900); // 15 minutes link validity

  if (signedUrlError) throw new Error("فشل توليد رابط الفيديو: " + signedUrlError.message);

  return signedUrlData.signedUrl;
}

export async function getVideoProgress(lessonId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("video_progress")
      .select("views_count, total_unique_seconds, video_duration, last_position")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (error) {
      console.warn("Error fetching full video_progress, falling back to views_count:", error.message);
      const { data: fallbackData } = await supabase
        .from("video_progress")
        .select("views_count")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      return {
        views_count: fallbackData?.views_count || 0,
        unique_percent: 0,
        total_unique_seconds: 0,
        last_position: 0,
      };
    }

    if (!data) {
      return {
        views_count: 0,
        unique_percent: 0,
        total_unique_seconds: 0,
        last_position: 0,
      };
    }

    const views_count = data.views_count || 0;
    const total_unique = Number(data.total_unique_seconds) || 0;
    const duration = Number(data.video_duration) || 0;
    const unique_percent = duration > 0 ? Math.min(100, Math.round((total_unique / duration) * 100)) : 0;

    return {
      views_count,
      unique_percent,
      total_unique_seconds: total_unique,
      last_position: Number(data.last_position) || 0,
    };
  } catch (err: any) {
    console.error("getVideoProgress error:", err);
    return {
      views_count: 0,
      unique_percent: 0,
      total_unique_seconds: 0,
      last_position: 0,
    };
  }
}

export async function syncVideoWatchProgress(
  lessonId: string,
  startSec: number,
  endSec: number,
  duration: number,
  currentPos: number = 0
) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("يجب تسجيل الدخول.");

  try {
    const { data, error } = await supabase.rpc("sync_video_watch_progress", {
      p_lesson_id: lessonId,
      p_start_sec: Math.round(startSec * 10) / 10,
      p_end_sec: Math.round(endSec * 10) / 10,
      p_duration: Math.round(duration * 10) / 10,
      p_current_pos: Math.round(currentPos * 10) / 10,
    });

    if (error) {
      console.warn("sync_video_watch_progress RPC error:", error.message);
      throw error;
    }

    return data as {
      views_count: number;
      unique_percent: number;
      total_unique_seconds: number;
      completed_view: boolean;
      is_locked: boolean;
    };
  } catch (err: any) {
    console.error("Error in syncVideoWatchProgress:", err);
    throw err;
  }
}

export async function recordLessonVideoWatch(lessonId: string) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("يجب تسجيل الدخول.");

  try {
    // 1. Try RPC function
    const { data: newCount, error: rpcError } = await supabase
      .rpc("increment_video_views", { p_lesson_id: lessonId });

    if (!rpcError && typeof newCount === "number") {
      return newCount;
    }
  } catch (rpcErr) {
    console.warn("RPC increment_video_views failed, falling back to direct DB update:", rpcErr);
  }

  // 2. Fallback: Direct select & upsert in video_progress
  const { data: existing } = await supabase
    .from("video_progress")
    .select("views_count")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const currentViews = existing?.views_count || 0;
  if (currentViews >= 4) {
    throw new Error("⚠️ لقد تجاوزت الحد الأقصى للمشاهدات المسموح بها لهذا الفيديو (4 مرات).");
  }

  const nextViews = currentViews + 1;
  const { error: upsertErr } = await supabase
    .from("video_progress")
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      views_count: nextViews,
    }, { onConflict: "user_id,lesson_id" });

  if (upsertErr) throw upsertErr;
  return nextViews;
}

