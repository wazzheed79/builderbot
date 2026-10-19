// Live checks. Set E2E_BASE_URL or NEXT_PUBLIC_APP_URL to the site you want to test.
import { brand } from "../lib/brand.mjs";

const BASE_URL = process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";

const SAMPLE_PHOTO_BASE64 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

async function runTestSuite() {
  console.log(`\n======================================================`);
  console.log(`🚀 ${brand.name} live check`);
  if (!BASE_URL) {
    throw new Error("Set E2E_BASE_URL or NEXT_PUBLIC_APP_URL before running this live check.");
  }
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Time:   ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  const results = [];

  async function test(name, fn) {
    const start = performance.now();
    try {
      await fn();
      const duration = Math.round(performance.now() - start);
      console.log(`  ✅ PASS: ${name} (${duration}ms)`);
      results.push({ name, status: "PASS", duration });
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      console.error(`  ❌ FAIL: ${name} (${duration}ms)`);
      console.error(`     Error: ${err.message}`);
      results.push({ name, status: "FAIL", duration, error: err.message });
    }
  }

  // 1. Landing Page Health Check
  await test("Landing Page (GET /)", async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    if (!text.includes(brand.name) && !text.includes(brand.shortName)) {
      throw new Error(`Landing page content missing ${brand.name}`);
    }
  });

  // 2. PWA Manifest & App Shortcuts Check
  await test("PWA Manifest & Mobile Shortcuts (GET /manifest.json)", async () => {
    const res = await fetch(`${BASE_URL}/manifest.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = await res.json();
    if (!manifest.name) throw new Error("Manifest missing app name");
    if (!manifest.shortcuts || manifest.shortcuts.length < 2) {
      throw new Error("PWA Shortcuts missing (New Quote / Customers expected)");
    }
    const hasNewQuote = manifest.shortcuts.some((s) => s.url === "/quotes");
    if (!hasNewQuote) throw new Error("PWA shortcut for /quotes not found");
  });

  // 3. Customer Quote Acceptance Page & Progress Tracker
  await test("Customer Quote Page & Progress Tracker (GET /q/BB-1042)", async () => {
    const res = await fetch(`${BASE_URL}/q/BB-1042`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes("Retrieving Quotation") && !html.includes("BB-1042")) {
      throw new Error("Quote viewer shell not loaded");
    }
    const scriptMatches = [
      ...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.js)"/g),
    ].map((m) => m[1]);
    let hasProgressTracker = false;
    for (const s of scriptMatches) {
      const chunkRes = await fetch(`${BASE_URL}${s}`);
      if (chunkRes.ok) {
        const text = await chunkRes.text();
        if (text.includes("Job Progress Tracker") || text.includes("Progress Tracker")) {
          hasProgressTracker = true;
          break;
        }
      }
    }
    if (!hasProgressTracker) {
      throw new Error("Progress Tracker component not detected in production client bundle");
    }
  });

  // 4. Quote Generator Page
  await test("Quote Generator App Screen (GET /quotes)", async () => {
    const res = await fetch(`${BASE_URL}/quotes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  // 5. Settings Screen
  await test("Settings Screen (GET /settings)", async () => {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  // 6. Pricing Screen
  await test("Pricing Screen (GET /pricing)", async () => {
    const res = await fetch(`${BASE_URL}/pricing`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  // 7. A5 Marketing Flyer
  await test("Marketing Flyer & QR Engine (GET /flyer)", async () => {
    const res = await fetch(`${BASE_URL}/flyer`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  // 8. AI / Trade Estimator API: Basic Job
  await test("Quote Engine API: Basic Job Itemization (POST /api/quote/generate)", async () => {
    const res = await fetch(`${BASE_URL}/api/quote/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: "Take down 6 panels of damaged garden fencing and install new slotted concrete posts, gravel boards, and featheredge panels.",
        trade: "Fencing & Landscaping",
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    const data = await res.json();
    if (!data.title || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("Invalid quote response structure or empty line items");
    }
    if (typeof data.suggestedDepositPercent !== "number") {
      throw new Error("Missing suggested deposit percentage");
    }
  });

  // 9. AI / Trade Estimator API: Quote DNA Personal Rates Calibration
  await test("Quote Engine API: Quote DNA Pricing Calibration (POST /api/quote/generate)", async () => {
    const customDayRate = 340;
    const customHourlyRate = 58;
    const res = await fetch(`${BASE_URL}/api/quote/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: "Fit 8 fence panels and dig post holes with rapid postcrete",
        trade: "Fencing",
        pricingMemory: {
          laborHourlyRate: customHourlyRate,
          laborDayRate: customDayRate,
          preferredMarkupPercent: 22,
        },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const laborItems = data.items.filter((i) => i.type === "labor");
    if (laborItems.length === 0) throw new Error("No labor items generated");
    // Verify calibrated labor rate matches personal rate if hourly
    const hourlyItem = laborItems.find((i) => i.unit === "hrs" || i.unit === "hr");
    if (hourlyItem && hourlyItem.rate !== customHourlyRate && !data.aiPowered) {
      throw new Error(`Expected calibrated rate of £${customHourlyRate}, got £${hourlyItem.rate}`);
    }
  });

  // 10. AI / Trade Estimator API: Multimodal Photo Support
  await test("Quote Engine API: Voice + Photo Multimodal Inspection (POST /api/quote/generate)", async () => {
    const res = await fetch(`${BASE_URL}/api/quote/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: "Replace cracked basin and install new chrome monobloc mixer tap",
        trade: "Plumbing",
        photos: [SAMPLE_PHOTO_BASE64],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      throw new Error("Failed to generate items with attached photo");
    }
  });

  // 11. Instant Deposit Payment API
  await test("Deposit Payment Gateway API (POST /api/stripe/deposit)", async () => {
    const res = await fetch(`${BASE_URL}/api/stripe/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: "BB-TEST-E2E",
        quoteTitle: "Test Fencing Project",
        depositAmount: 180,
        contractorName: "Boylen Trade Services",
        customerEmail: "homeowner.test@example.com",
      }),
    });
    if (res.status === 403) {
      const data = await res.json();
      if (!data.error) throw new Error("Expected 403 error payload for free beta");
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.url && !data.demo) {
      throw new Error("Stripe deposit endpoint did not return checkout session URL or demo mode payload");
    }
  });

  // Summary
  console.log(`\n======================================================`);
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`🏁 Test Summary: ${passed}/${total} PASSED (${failed} failed)`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Fatal error running test suite:", err);
  process.exit(1);
});
