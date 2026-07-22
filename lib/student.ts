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
