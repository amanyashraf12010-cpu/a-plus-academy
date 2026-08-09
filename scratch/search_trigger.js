const fs = require("fs");
const content = fs.readFileSync("C:\\Users\\E C\\Desktop\\acdemy\\a-plus-academy\\supabase_schema.sql", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("handle_new_user") || line.includes("trigger")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
