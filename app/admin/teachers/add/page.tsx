import { redirect } from "next/navigation";

export default function AddTeacherRedirect() {
  redirect("/admin/teachers");
}
