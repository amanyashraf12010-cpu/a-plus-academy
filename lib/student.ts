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
  if (!user) return { isLoggedIn: false, status: null };

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    console.error("خطأ في جلب حالة الاشتراك:", error.message);
    return { isLoggedIn: true, status: null };
  }

  return { isLoggedIn: true, status: data ? data.status : null };
}

// =========================================================================
// 2. My Enrolled Courses
// =========================================================================

export async function getMyCourses() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولاً.");

  const { data, error } = await supabase
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

  if (error) throw error;
  
  // Extract and return only the courses objects
  return data.map((sub: any) => sub.courses);
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

  const { data, error } = await supabase
    .from("video_progress")
    .select("views_count")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) throw error;
  return data ? data.views_count : 0;
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
