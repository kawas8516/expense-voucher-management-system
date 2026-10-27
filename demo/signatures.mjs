// draws a handwritten-looking signature PNG for every sample user
// (used by server/db/seed-demo.js). run once: node signatures.mjs
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "signatures");

export const SIGNERS = [
  ["rahul", "Rahul Sharma", "#1a237e"],
  ["priya", "Priya Mehta", "#0d47a1"],
  ["director", "Anil Verma", "#111111"],
  ["accounts", "Sneha Joshi", "#263238"],
  ["arjun", "Arjun Nair", "#1b5e20"],
  ["kavya", "Kavya Iyer", "#4a148c"],
  ["rohan", "Rohan Desai", "#0d47a1"],
  ["fatima", "Fatima Shaikh", "#1a237e"],
  ["vikram", "Vikram Patil", "#212121"],
];

fs.mkdirSync(DIR, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
for (const [key, name, color] of SIGNERS) {
  const dataUrl = await page.evaluate(
    ({ name, color }) => {
      const c = document.createElement("canvas");
      c.width = 360;
      c.height = 110;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = color;
      ctx.font = "italic 38px 'Segoe Script', 'Brush Script MT', cursive";
      ctx.fillText(name, 16, 64);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 82);
      ctx.bezierCurveTo(120, 95, 220, 70, 330, 84);
      ctx.stroke();
      return c.toDataURL("image/png");
    },
    { name, color }
  );
  fs.writeFileSync(path.join(DIR, key + ".png"), Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log("signature", key);
}
await browser.close();
