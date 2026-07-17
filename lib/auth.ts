import { createClient } from '@/utils/supabase/client'

interface RegisterData {
  email: string
  password: string
  fullName: string
  phone: string
  parentPhone: string
  parentJob: string
  school: string
  governorate: string
  gender: string
  educationSystem: string
  track: string
  grade: string
}

export async function registerUser(formData: RegisterData) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        phone: formData.phone,
        parent_phone: formData.parentPhone,
        parent_job: formData.parentJob,
        school: formData.school,
        governorate: formData.governorate,
        gender: formData.gender,
        education_system: formData.educationSystem,
        track: formData.track,
        grade: formData.grade,
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

export async function loginUser(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    console.log(data);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  return {
    success: true,
    user: data.user,
    profile,
  };
}
export async function logoutUser() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}