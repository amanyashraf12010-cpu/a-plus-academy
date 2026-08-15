const fs = require("fs");
const path = require("path");

function walk(dir, results = []) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith(".") && file !== "node_modules" && file !== ".next") {
        walk(fullPath, results);
      }
    } else {
      if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walk("C:\\Users\\E C\\Desktop\\acdemy\\a-plus-academy");
const occurrences = [];

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes('from("courses")') || content.includes("from('courses')")) {
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (line.includes("from(") || line.includes("select")) {
        occurrences.push({ file, lineNum: idx + 1, content: line.trim() });
      }
    });
  }
});

console.log("Course queries found:", occurrences);
