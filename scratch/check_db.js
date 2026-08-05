const { createClient } = require("@supabase/supabase-js");

const url = "https://apdwhwgznljjwqlbrizs.supabase.co";
const key = "sb_publishable_zRYnnouwZSsyDhQMrkiyAw_JbobGM3C";
const supabase = createClient(url, key);

async function run() {
  // 1. Fetch courses
  const { data: courses, error: courseErr } = await supabase
    .from("courses")
    .select("*");

  if (courseErr) {
    console.error("Error fetching courses:", courseErr);
    return;
  }
  console.log("Courses:", courses.map(c => ({ id: c.id, title: c.title })));

  // 2. Fetch all lessons
  const { data: lessons, error: lessonErr } = await supabase
    .from("lessons")
    .select("*");

  if (lessonErr) {
    console.error("Error fetching lessons:", lessonErr);
    return;
  }
  console.log("Lessons count:", lessons.length);
  lessons.forEach(l => console.log(`  - Lesson ID: ${l.id}, Course ID: ${l.course_id}, Title: ${l.title}`));
}

run();
