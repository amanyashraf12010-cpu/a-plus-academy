import { createClient } from "@/utils/supabase/client";

// =========================================================================
// 1. Student Management
// =========================================================================

export async function getStudents() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function approveStudent(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", id);

  if (error) throw error;
}

export async function rejectStudent(id: string) {
  const supabase = createClient();

  // Deleting the profile record to revoke access completely
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =========================================================================
// 2. Subscriptions & Payments
// =========================================================================

export async function getPendingSubscriptions() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      profiles:user_id (full_name, phone),
      courses:course_id (title, price),
      lessons:lesson_id (id, title, price)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function approveSubscription(id: string) {
  const supabase = createClient();

  // 1. Fetch subscription details first to see if it's for a specific lesson
  const { data: sub, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, user_id, course_id, lesson_id")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // 2. Update status to approved
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({ status: "approved" })
    .eq("id", id);

  if (updateError) throw updateError;

  // 3. If it's a specific lesson subscription, grant access in lesson_access table
  if (sub?.lesson_id && sub?.user_id && sub?.course_id) {
    try {
      const { error: accessError } = await supabase
        .from("lesson_access")
        .upsert(
          {
            user_id: sub.user_id,
            course_id: sub.course_id,
            lesson_id: sub.lesson_id,
          },
          { onConflict: "user_id,lesson_id" }
        );

      if (accessError) {
        console.error("Error inserting into lesson_access:", accessError);
      }
    } catch (e) {
      console.warn("Could not insert to lesson_access:", e);
    }
  }
}

export async function rejectSubscription(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) throw error;
}

// =========================================================================
// 3. Teachers Management
// =========================================================================

export async function getTeachers() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addTeacher(teacher: {
  name: string;
  image?: string;
  subject?: string;
  description?: string;
  about?: string;
  education_system?: string;
  grade?: string;
  track?: string;
  order?: number;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("teachers")
    .insert([teacher])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateTeacher(id: string, teacher: {
  name?: string;
  image?: string;
  subject?: string;
  description?: string;
  about?: string;
  education_system?: string;
  grade?: string;
  track?: string;
  order?: number;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("teachers")
    .update(teacher)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteTeacher(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("teachers")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =========================================================================
// 4. Courses Management
// =========================================================================

export async function getCourses() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("courses")
    .select("*, teachers(name), subscriptions(status)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function toggleCourseVisibility(id: string, isVisible: boolean) {
  const supabase = createClient();

  const { error } = await supabase
    .from("courses")
    .update({ is_visible: isVisible })
    .eq("id", id);

  if (error) throw error;
}

export async function getCourse(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("courses")
    .select("*, teachers(name)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function addCourse(course: {
  title: string;
  description?: string;
  image?: string;
  teacher_id: string;
  grade?: string;
  subject?: string;
  price?: number;
  original_price?: number | null;
  subscription_type?: string;
  video_count?: number;
  duration?: string;
  what_will_learn?: string;
  related_courses?: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("courses")
    .insert([course])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateCourse(id: string, course: {
  title?: string;
  description?: string;
  image?: string;
  teacher_id?: string;
  grade?: string;
  subject?: string;
  price?: number;
  original_price?: number | null;
  subscription_type?: string;
  video_count?: number;
  duration?: string;
  what_will_learn?: string;
  related_courses?: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("courses")
    .update(course)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteCourse(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =========================================================================
// 5. Lessons Management
// =========================================================================

export async function getLessons(courseId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function addLesson(lesson: {
  course_id: string;
  title: string;
  video_url: string;
  order?: number;
  price?: number;
  description?: string;
  duration?: string;
  pdf_url?: string;
  publish_at?: string | null;
  video_verified?: boolean;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("lessons")
    .insert([lesson])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateLesson(id: string, lesson: {
  title?: string;
  video_url?: string;
  order?: number;
  price?: number;
  description?: string;
  duration?: string;
  pdf_url?: string;
  publish_at?: string | null;
  video_verified?: boolean;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("lessons")
    .update(lesson)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteLesson(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getReceiptSignedUrl(filePath: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(filePath, 3600); // 1 hour validity

  if (error) throw error;
  return data.signedUrl;
}

export async function resetStudentVideoProgress(userId: string, lessonId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("video_progress")
    .update({ views_count: 0 })
    .eq("user_id", userId)
    .eq("lesson_id", lessonId);

  if (error) throw error;
}