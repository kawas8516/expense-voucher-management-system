// Demo generator for the README / submission.
// 1. resets the database (npm run db:setup in server/)
// 2. draws signature images
// 3. seeds realistic vouchers through the API
// 4. records a walkthrough video + saves screenshots with Playwright (uses installed Edge)
//
// needs both dev servers running:  server -> npm run dev,  client -> npm run dev
// run:  cd demo && npm install && npm run demo

import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { seedVouchers, api, token } from "./seed.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = path.join(ROOT, "docs", "screenshots");
const VIDEO_DIR = path.join(ROOT, "docs", "video-tmp");
const SIGN_DIR = path.join(ROOT, "demo", "signatures");
const APP = "http://localhost:5173";
const API = "http://localhost:5000/api";
const PASSWORD = "password123";

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(SIGN_DIR, { recursive: true });

// ---------- 1. reset db ----------
console.log("Resetting database...");
execSync("npm run db:setup", { cwd: path.join(ROOT, "server"), stdio: "inherit" });

const browser = await chromium.launch({ channel: "msedge", headless: true });

// ---------- 2. signature images ----------
console.log("Drawing signatures...");
async function drawSignature(name, file, color) {
  const page = await browser.newPage();
  const dataUrl = await page.evaluate(
    ({ name, color }) => {
      const c = document.createElement("canvas");
      c.width = 360;
      c.height = 110;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = color;
      ctx.font = "italic 40px 'Segoe Script', 'Brush Script MT', cursive";
      ctx.fillText(name, 18, 65);
      // underline stroke
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
  await page.close();
  const p = path.join(SIGN_DIR, file);
  fs.writeFileSync(p, Buffer.from(dataUrl.split(",")[1], "base64"));
  return p;
}
const SIGN = {
  rahul: await drawSignature("Rahul Sharma", "rahul.png", "#1a237e"),
  priya: await drawSignature("Priya Mehta", "priya.png", "#0d47a1"),
  director: await drawSignature("Anil Verma", "director.png", "#111111"),
};

// ---------- 3. seed vouchers via API ----------
console.log("Seeding vouchers...");
await seedVouchers(API);

// ---------- 4. walkthrough video + screenshots ----------
console.log("Recording walkthrough...");
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
page.on("dialog", (d) => d.accept()); // confirm() popups

const pause = (ms = 1200) => page.waitForTimeout(ms);

// caption bar at the bottom of the video, hidden for screenshots
async function caption(text) {
  await page.evaluate((text) => {
    let el = document.getElementById("demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-caption";
      el.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;padding:10px 16px;background:rgba(0,0,0,.78);color:#fff;font:16px Arial;z-index:9999;text-align:center";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display = "block";
  }, text);
}
async function shot(name, fullPage = true) {
  await page.evaluate(() => {
    const el = document.getElementById("demo-caption");
    if (el) el.style.display = "none";
  });
  await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage });
  await page.evaluate(() => {
    const el = document.getElementById("demo-caption");
    if (el) el.style.display = "block";
  });
  console.log("  saved", name);
}
async function login(email, text) {
  await page.goto(APP + "/login");
  await caption(text);
  await page.locator("input[type=email]").pressSequentially(email, { delay: 35 });
  await page.locator("input[type=password]").pressSequentially(PASSWORD, { delay: 35 });
  await pause(500);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForSelector("text=Welcome");
  await pause();
}
async function logout() {
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForSelector("input[type=email]");
}
async function scrollDown(times = 4) {
  for (let i = 0; i < times; i++) {
    await page.mouse.wheel(0, 250);
    await page.waitForTimeout(350);
  }
}

// --- login page ---
await page.goto(APP + "/login");
await caption("Expense Voucher Management System - login page");
await pause(1500);
await shot("01-login", false);
await page.getByRole("button", { name: "Login" }).click();
await caption("Form validation on login");
await pause(1200);
await shot("02-login-validation", false);

// --- employee ---
await login("employee@test.com", "Employee (Rahul) logs in");
await caption("Employee dashboard - only his own vouchers are counted");
await pause(2000);
await shot("03-employee-dashboard");

await page.locator(".navbar").getByRole("link", { exact: true, name: "Create Voucher" }).click();
await caption("Create voucher - voucher number is generated automatically");
await page.waitForSelector("input[name=title]");
await pause();
await page.getByRole("button", { name: "Save & Submit" }).click();
await caption("Required fields are validated before saving");
await pause(1500);
await shot("04-create-voucher-validation");

await caption("Employee fills the voucher and uploads his signature");
await page.fill("input[name=expense_date]", "2026-10-10");
await page.locator("input[name=title]").pressSequentially("Cab to airport - Pune client trip", { delay: 30 });
await page.selectOption("select[name=category]", "Travel");
await page.locator("input[name=amount]").pressSequentially("1150", { delay: 60 });
await page.locator("textarea[name=description]").pressSequentially("Uber from Andheri office to airport", { delay: 25 });
await page.setInputFiles("input[type=file]", SIGN.rahul);
await pause(1000);
await shot("05-create-voucher-filled");
await page.getByRole("button", { name: "Save & Submit" }).click();
await page.waitForSelector("text=Voucher submitted for approval");
await caption("Voucher submitted - it is now read-only for the employee");
await pause(1500);
await shot("06-voucher-submitted");
await scrollDown(5);
await pause();

await page.locator(".navbar").getByRole("link", { exact: true, name: "My Vouchers" }).click();
await page.waitForSelector("text=voucher(s) found");
await caption("My Vouchers - drafts can still be edited or deleted");
await pause(2000);
await shot("07-my-vouchers");
await logout();

// --- director ---
await login("director@test.com", "Director logs in");
await caption("Director dashboard - pending count, today's approvals and recent activity");
await pause(2200);
await shot("08-director-dashboard");

await page.locator(".navbar").getByRole("link", { exact: true, name: "Pending Approvals" }).click();
await page.waitForSelector("text=voucher(s) waiting");
await caption("Pending approvals - oldest request first");
await pause(1800);
await shot("09-pending-approvals");

await page.locator("tr", { hasText: "Cab to airport" }).getByRole("link", { name: "Approve / Reject" }).click();
await page.waitForSelector(".action-box");
await caption("Director reviews the details (cannot change them)");
await pause();
await scrollDown(6);
await caption("Director uploads his signature and approves");
await page.setInputFiles(".action-box input[type=file]", SIGN.director);
await pause(1200);
await shot("10-approve-reject-box");
await page.getByRole("button", { name: "Approve" }).click();
await page.waitForSelector("text=Voucher approved");
await caption("Approved - both signatures and approval date are saved");
await pause(1200);
await shot("11-voucher-approved");
await scrollDown(5);
await pause();

await page.locator(".navbar").getByRole("link", { exact: true, name: "Pending Approvals" }).click();
await page.waitForSelector("text=voucher(s) waiting");
await page.locator("tr", { hasText: "Broadband" }).getByRole("link", { name: "Approve / Reject" }).click();
await page.waitForSelector(".action-box");
await scrollDown(6);
await caption("Rejecting needs a reason");
await page.getByRole("button", { name: "Reject" }).click();
await pause(1000);
await page.locator(".action-box textarea").pressSequentially("Broadband is already covered in the WFH allowance.", { delay: 25 });
await pause(600);
await page.getByRole("button", { name: "Reject" }).click();
await page.waitForSelector("text=Voucher rejected");
await caption("Voucher rejected");
await pause(1500);

await page.locator(".navbar").getByRole("link", { exact: true, name: "All Vouchers" }).click();
await page.waitForSelector("text=voucher(s) found");
await caption("All vouchers - search, filter and sort");
await pause();
await page.fill(".filters input[name=department]", "sales");
await page.selectOption(".filters select[name=status]", "approved");
await pause(600);
await page.getByRole("button", { name: "Search" }).click();
await pause(1500);
await page.getByRole("button", { name: "Reset" }).click();
await pause(800);
await page.locator("th", { hasText: "Amount" }).click();
await caption("Click a column header to sort (amount ascending)");
await pause(1800);
await shot("12-director-all-vouchers-sorted");
await logout();

// --- employee sees rejection ---
await login("employee@test.com", "Employee checks the status of his vouchers");
await page.locator(".navbar").getByRole("link", { exact: true, name: "My Vouchers" }).click();
await page.waitForSelector("text=voucher(s) found");
await pause();
await page.locator("tr", { hasText: "Broadband" }).getByRole("link", { name: "View" }).click();
await page.waitForSelector("text=Rejection Reason");
await caption("Employee can see why his voucher was rejected");
await pause(2000);
await shot("13-employee-rejected-voucher");
await logout();

// --- accounts ---
await login("accounts@test.com", "Accounts team logs in");
await caption("Accounts dashboard - approved amount ready for reimbursement");
await pause(2000);
await shot("14-accounts-dashboard");

await page.locator(".navbar").getByRole("link", { exact: true, name: "All Vouchers" }).click();
await page.waitForSelector("text=voucher(s) found");
await page.selectOption(".filters select[name=status]", "approved");
await page.getByRole("button", { name: "Search" }).click();
await pause(800);
await page.locator("th", { hasText: "Amount" }).click();
await pause(400);
await page.locator("th", { hasText: "Amount" }).click();
await caption("Accounts filters approved vouchers, highest amount first");
await pause(1800);
await shot("15-accounts-approved-vouchers");

await page.locator("tr", { hasText: "Flight to Bangalore" }).getByRole("link", { name: "View" }).click();
await page.waitForSelector("text=Director Signature");
await caption("Accounts can see employee + director signatures and print the voucher");
await pause();
await scrollDown(6);
await pause();
await page.emulateMedia({ media: "print" });
await shot("16-voucher-print-view");
await page.emulateMedia({ media: "screen" });
await caption("End of demo");
await pause(1500);

const video = page.video();
await context.close();
fs.renameSync(await video.path(), path.join(ROOT, "docs", "demo-walkthrough.webm"));
fs.rmSync(VIDEO_DIR, { recursive: true, force: true });

// ---------- mobile screenshots ----------
console.log("Mobile screenshots...");
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const m = await mobile.newPage();
const empToken = await token("employee@test.com");
const me = await api("GET", "/auth/me", empToken);
await m.goto(APP + "/login");
await m.evaluate(
  ({ t, u }) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
  },
  { t: empToken, u: me.user }
);
await m.goto(APP + "/employee");
await m.waitForSelector("text=Welcome");
await m.screenshot({ path: path.join(SHOTS, "mobile-01-dashboard.png"), fullPage: true });
await m.goto(APP + "/employee/vouchers");
await m.waitForSelector("text=voucher(s) found");
await m.screenshot({ path: path.join(SHOTS, "mobile-02-my-vouchers.png"), fullPage: true });
await m.goto(APP + "/employee/create");
await m.waitForSelector("input[name=title]");
await m.screenshot({ path: path.join(SHOTS, "mobile-03-create-voucher.png"), fullPage: true });
await mobile.close();

await browser.close();
console.log("\nDone. Screenshots in docs/screenshots, video at docs/demo-walkthrough.webm");
