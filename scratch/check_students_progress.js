const { createClient } = require("@supabase/supabase-js");

const url = "https://apdwhwgznljjwqlbrizs.supabase.co";
const key = "sb_publishable_zRYnnouwZSsyDhQMrkiyAw_JbobGM3C";
const supabase = createClient(url, key);

async function run() {
  const { data: progress, error } = await supabase.from("video_progress").select("*");
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("All video progress records in DB:", progress);
}

run();
