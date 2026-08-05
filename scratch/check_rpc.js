const { createClient } = require("@supabase/supabase-js");

const url = "https://apdwhwgznljjwqlbrizs.supabase.co";
const key = "sb_publishable_zRYnnouwZSsyDhQMrkiyAw_JbobGM3C";
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc("increment_video_views", {
    p_lesson_id: "68af7f26-3bf3-4961-aa5d-5dce513e70d6" // dummy uuid
  });
  console.log("RPC call result:");
  console.log("Data:", data);
  console.log("Error:", error);
}

run();
