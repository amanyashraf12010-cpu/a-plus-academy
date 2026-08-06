const fs = require("fs");
const path = require("path");

const envPath = "C:\\Users\\E C\\Desktop\\acdemy\\a-plus-academy\\.env.local";
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  console.log("Env local contains SUPABASE_SERVICE_ROLE_KEY:", content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("SERVICE_ROLE"));
} else {
  console.log(".env.local does not exist at", envPath);
}
