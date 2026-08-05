const { createClient } = require("@supabase/supabase-js");

const url = "https://apdwhwgznljjwqlbrizs.supabase.co";
const key = "sb_publishable_zRYnnouwZSsyDhQMrkiyAw_JbobGM3C";
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from("lessons").select("*");
  if (error) {
    console.error("Error fetching lessons:", error);
    return;
  }
  console.log("Total lessons in DB:", data.length);
  if (data.length > 0) {
    console.log("Sample lesson:", data[0]);
  }
}

run();
