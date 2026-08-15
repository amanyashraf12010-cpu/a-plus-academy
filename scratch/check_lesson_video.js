const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const envPath = "C:\\Users\\E C\\Desktop\\acdemy\\a-plus-academy\\.env.local";
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLessonVideo() {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, video_url")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("DB Error:", error);
    return;
  }
  console.log("Recent lessons:", data);
}

checkLessonVideo();
