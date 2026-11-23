import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("test-results", { recursive: true });
const base = process.env.TEST_WEB_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "msedge",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(base + "");
  await page.getByRole("button", { name: "Sign in to SHIRTERP" }).click();
  await page
    .getByRole("heading", { name: "A good day to make great things." })
    .waitFor({ timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true, animations: "disabled",
  });
  for (const [key, title] of [
    ["customers", "Customers"],
    ["suppliers", "Suppliers"],
    ["products", "Products"],
    ["inventory", "Inventory"],
    ["purchases", "Purchases"],
    ["sales", "Sales orders"],
    ["quotations", "Quotations"],
    ["invoices", "GST invoices"],
    ["production", "Production"],
    ["accounts", "Accounts & finance"],
    ["expenses", "Expenses"],
    ["employees", "HR & payroll"],
    ["eway", "GST & e-way bills"],
    ["reports", "Reports & analytics"],
    ["payments", "Online payments"],
    ["settings", "Company & settings"],
  ]) {
    await page.goto(`${base}/#${key}`);
    await page
      .getByRole("heading", { name: title, exact: true })
      .waitFor({ timeout: 60000 });
    await page.locator(".loading").waitFor({ state: "hidden", timeout: 60000 });
    assert.equal(await page.locator(".error-box").count(), 0, `${key} error`);
    console.log(`PASS ${key}`);
  }
  await page.goto(base + "/#invoices");
  await page.locator("tbody tr").first().waitFor();
  await page
    .getByRole("button", { name: "View invoice", exact: true })
    .first()
    .click();
  await page.getByRole("heading", { name: "Installment history" }).waitFor();
  await page.getByRole("button", { name: "Close dialog" }).click();
  console.log("PASS invoice detail");
  await page.goto(base + "/#customers");
  await page.getByRole("button", { name: "Add customer", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  const firstField = page.getByRole("dialog").locator("input").first();
  await firstField.fill("Focus check");
  assert.equal(
    await firstField.evaluate((el) => el === document.activeElement),
    true,
    "typing retains dialog focus",
  );
  assert.equal(
    await page.evaluate(() => document.body.style.overflow),
    "hidden",
    "dialog locks background scroll",
  );
  await page.screenshot({
    path: "test-results/customer-modal-desktop.png",
    fullPage: true, animations: "disabled",
  });
  await page.getByRole("button", { name: "Cancel", exact: true }).focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .getByRole("button", { name: "Close dialog" })
      .evaluate((el) => el === document.activeElement),
    true,
    "dialog traps keyboard focus",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  assert.equal(
    await page
      .getByRole("button", { name: "Add customer", exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
    "closing restores focus",
  );
  console.log("PASS customer form");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/#dashboard");
  await page
    .getByRole("heading", { name: "A good day to make great things." })
    .waitFor();
  await page.locator(".loading").waitFor({ state: "hidden" });
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true, animations: "disabled",
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "mobile viewport overflow",
  );
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.locator(".nav-item").filter({ hasText: "Customers" }).click();
  await page.getByRole("heading", { name: "Customers", exact: true }).waitFor();
  console.log("PASS mobile navigation and responsive layout");
  await page.getByRole("button", { name: "Add customer", exact: true }).click();
  await page.screenshot({
    path: "test-results/customer-modal-mobile.png",
    fullPage: true, animations: "disabled",
  });
  assert.ok(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.getBoundingClientRect().right <= window.innerWidth),
    "mobile dialog fits viewport",
  );
  await page.keyboard.press("Escape");
  await page.getByLabel("Language", { exact: true }).selectOption("ta");
  await page
    .getByRole("heading", { name: "வாடிக்கையாளர்கள்", exact: true })
    .waitFor();
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  console.log("PASS Tamil language selection");
  assert.deepEqual(errors, []);
  console.log("PASS no browser runtime errors");
} finally {
  await browser.close();
}

