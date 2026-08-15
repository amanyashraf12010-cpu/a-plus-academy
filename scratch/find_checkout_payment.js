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
  if (content.toLowerCase().includes("instapay") || content.toLowerCase().includes("vodafone") || content.toLowerCase().includes("checkout")) {
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (line.includes("01") || line.includes("@") || line.includes("رقم") || line.includes("حساب")) {
        occurrences.push({ file, lineNum: idx + 1, content: line.trim() });
      }
    });
  }
});

console.log("Payment details occurrences:", occurrences.slice(0, 40));
