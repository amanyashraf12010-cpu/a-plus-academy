import { createClient } from "@/utils/supabase/client";

export interface StudentProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  grade: string;
  education_system?: string;
  school?: string;
  governorate?: string;
}

export interface CourseAccessItem {
  id: string;
  student_id: string;
  course_id: string;
  status: "active" | "revoked";
  access_type: "payment" | "manual" | "free" | "transfer";
  granted_by: string | null;
  revoked_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: StudentProfile;
  courses?: {
    id: string;
    title: string;
    price: number;
    grade: string;
    subject: string;
    teachers?: {
      name: string;
    };
  };
  granted_by_profile?: {
    full_name: string;
  } | null;
  revoked_by_profile?: {
    full_name: string;
  } | null;
}

// =========================================================================
// 1. Fetching Course Access Records
// =========================================================================

export async function getCourseAccessList(filters?: {
  search?: string;
  courseId?: string;
  status?: string;
  accessType?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("course_access")
    .select(`
      *,
      profiles:student_id (
        id,
        full_name,
        email,
        phone,
        grade,
        education_system,
        school,
        governorate
      ),
      courses:course_id (
        id,
        title,
        price,
        grade,
        subject,
        teachers (
          name
        )
      ),
      granted_by_profile:granted_by (
        full_name
      ),
      revoked_by_profile:revoked_by (
        full_name
      )
    `)
    .order("updated_at", { ascending: false });

  if (filters?.courseId && filters.courseId !== "all") {
    query = query.eq("course_id", filters.courseId);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.accessType && filters.accessType !== "all") {
    query = query.eq("access_type", filters.accessType);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching course_access records:", error.message);
    throw error;
  }

  let results = (data || []) as CourseAccessItem[];

  // Client-side search for student name, email, phone, or course title
  if (filters?.search && filters.search.trim() !== "") {
    const term = filters.search.trim().toLowerCase();
    results = results.filter((item) => {
      const studentName = item.profiles?.full_name?.toLowerCase() || "";
      const studentPhone = item.profiles?.phone || "";
      const studentEmail = item.profiles?.email?.toLowerCase() || "";
      const courseTitle = item.courses?.title?.toLowerCase() || "";
      return (
        studentName.includes(term) ||
        studentPhone.includes(term) ||
        studentEmail.includes(term) ||
        courseTitle.includes(term)
      );
    });
  }

  return results;
}

// =========================================================================
// 2. Fetch Single Student Access History
// =========================================================================

export async function getStudentCourseAccesses(studentId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("course_access")
    .select(`
      *,
      courses:course_id (
        id,
        title,
        price,
        grade,
        subject,
        teachers (
          name
        )
      ),
      granted_by_profile:granted_by (
        full_name
      ),
      revoked_by_profile:revoked_by (
        full_name
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching student course accesses:", error.message);
    throw error;
  }

  return (data || []) as CourseAccessItem[];
}

// =========================================================================
// 3. Search Students for Access Modal
// =========================================================================

export async function searchStudentsForAccess(searchTerm: string) {
  const supabase = createClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, grade, education_system, school, governorate")
    .eq("role", "student")
    .order("full_name", { ascending: true })
    .limit(25);

  if (searchTerm && searchTerm.trim() !== "") {
    const term = searchTerm.trim();
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error searching students:", error.message);
    throw error;
  }

  return (data || []) as StudentProfile[];
}

// =========================================================================
// 4. Grant Course Access (Manual / Free / Payment)
// =========================================================================

export async function grantCourseAccess(
  studentId: string,
  courseId: string,
  accessType: "manual" | "free" | "payment" | "transfer" = "manual"
) {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("يجب تسجيل الدخول كمسؤول أولاً.");

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("course_access")
    .upsert(
      {
        student_id: studentId,
        course_id: courseId,
        status: "active",
        access_type: accessType,
        granted_by: user.id,
        revoked_by: null,
        granted_at: now,
        revoked_at: null,
        updated_at: now,
      },
      { onConflict: "student_id,course_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error granting course access:", error.message);
    throw error;
  }

  return data;
}

// =========================================================================
// 5. Revoke Course Access
// =========================================================================

export async function revokeCourseAccess(studentId: string, courseId: string) {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("يجب تسجيل الدخول كمسؤول أولاً.");

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("course_access")
    .update({
      status: "revoked",
      revoked_by: user.id,
      revoked_at: now,
      updated_at: now,
    })
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error revoking course access:", error.message);
    throw error;
  }

  return data;
}

// =========================================================================
// 6. Transfer Course Access (From Course A -> To Course B)
// =========================================================================

export async function transferCourseAccess(
  studentId: string,
  fromCourseId: string,
  toCourseId: string
) {
  if (fromCourseId === toCourseId) {
    throw new Error("لا يمكن نقل الصلاحية إلى نفس الكورس.");
  }

  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("يجب تسجيل الدخول كمسؤول أولاً.");

  const now = new Date().toISOString();

  // 1. Revoke access from current course
  const { error: revokeError } = await supabase
    .from("course_access")
    .update({
      status: "revoked",
      revoked_by: user.id,
      revoked_at: now,
      updated_at: now,
    })
    .eq("student_id", studentId)
    .eq("course_id", fromCourseId);

  if (revokeError) {
    console.error("Error revoking previous course during transfer:", revokeError.message);
    throw revokeError;
  }

  // 2. Grant access to new course with type = transfer
  const { data: grantData, error: grantError } = await supabase
    .from("course_access")
    .upsert(
      {
        student_id: studentId,
        course_id: toCourseId,
        status: "active",
        access_type: "transfer",
        granted_by: user.id,
        revoked_by: null,
        granted_at: now,
        revoked_at: null,
        updated_at: now,
      },
      { onConflict: "student_id,course_id" }
    )
    .select()
    .single();

  if (grantError) {
    console.error("Error granting new course during transfer:", grantError.message);
    throw grantError;
  }

  return grantData;
}

// =========================================================================
// 7. Access Stats
// =========================================================================

export async function getCourseAccessStats() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("course_access")
    .select("status, access_type");

  if (error) {
    console.error("Error fetching access stats:", error.message);
    return {
      total: 0,
      active: 0,
      revoked: 0,
      transferred: 0,
      manual: 0,
    };
  }

  const records = (data || []) as { status: string; access_type: string }[];
  const active = records.filter((r) => r.status === "active").length;
  const revoked = records.filter((r) => r.status === "revoked").length;
  const transferred = records.filter((r) => r.access_type === "transfer" && r.status === "active").length;
  const manual = records.filter((r) => r.access_type === "manual" && r.status === "active").length;

  return {
    total: records.length,
    active,
    revoked,
    transferred,
    manual,
  };
}
