const fs = require("fs");
const file = "C:\\Users\\E C\\Desktop\\acdemy\\a-plus-academy\\lib\\quizzes.ts";
const content = fs.readFileSync(file, "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("getCourseProgressAndLocks")) {
    console.log(`Line ${idx + 1}: ${line}`);
    // Print 50 lines before and after
    const start = Math.max(0, idx - 10);
    const end = Math.min(lines.length - 1, idx + 40);
    for (let i = start; i <= end; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
