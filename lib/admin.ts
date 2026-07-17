import { createClient } from "@/utils/supabase/client";

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