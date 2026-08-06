const fs = require("fs");
const envPath = "C:\\Users\\E C\\Desktop\\acdemy\\a-plus-academy\\.env.local";
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const keys = content.split("\n").map(line => line.split("=")[0].trim()).filter(Boolean);
  console.log("Env keys:", keys);
} else {
  console.log("File does not exist");
}
