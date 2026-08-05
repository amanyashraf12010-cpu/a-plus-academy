const { createClient } = require("@supabase/supabase-js");

const url = "https://apdwhwgznljjwqlbrizs.supabase.co";
const key = "sb_publishable_zRYnnouwZSsyDhQMrkiyAw_JbobGM3C";
const supabase = createClient(url, key);

async function run() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
    return;
  }
  console.log("Buckets:", buckets);
}

run();
