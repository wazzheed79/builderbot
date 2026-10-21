#!/usr/bin/env node
/**
 * Reddit Assistant for Chuffed Quotes
 * 
 * Safely connects to Reddit via the official OAuth2 API to:
 *  1. Read inbox, unread direct messages, and comment mentions.
 *  2. Send direct messages or reply to comments.
 *  3. Scan UK subreddits (r/DIYUK, r/UKPersonalFinance, trade subs) for quoting discussions.
 * 
 * Uses built-in Node.js fetch — zero extra packages needed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load .env.local if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envLocalPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envLocalPath)) {
  try {
    process.loadEnvFile(envLocalPath);
  } catch {
    // Fallback manual parser if loadEnvFile has quirks
    const lines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
      if (match && !match[1].startsWith("#")) {
        const key = match[1];
        let val = (match[2] || "").trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const CLIENT_ID = process.env.REDDIT_CLIENT_ID || "";
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || "";
const USERNAME = process.env.REDDIT_USERNAME || "";
const PASSWORD = process.env.REDDIT_PASSWORD || "";
const USER_AGENT =
  process.env.REDDIT_USER_AGENT ||
  `nodejs:chuffed-quotes-assistant:v1.0.0 (by /u/${USERNAME || "anonymous"})`;

let cachedToken = null;
let tokenExpiresAt = 0;

function checkConfig() {
  const missing = [];
  if (!CLIENT_ID) missing.push("REDDIT_CLIENT_ID");
  if (!CLIENT_SECRET) missing.push("REDDIT_CLIENT_SECRET");
  if (!USERNAME) missing.push("REDDIT_USERNAME");
  if (!PASSWORD) missing.push("REDDIT_PASSWORD");

  if (missing.length > 0) {
    console.error("\n❌ Missing required Reddit credentials in .env.local:");
    for (const m of missing) {
      console.error(`   - ${m}`);
    }
    console.error("\nSetup instructions:");
    console.error("1. Go to https://www.reddit.com/prefs/apps");
    console.error("2. Click 'create app' -> select 'script'");
    console.error("3. Set redirect uri to http://localhost:8080");
    console.error("4. Add the credentials to builderbot-app/.env.local:\n");
    console.error("   REDDIT_CLIENT_ID=your_client_id_here");
    console.error("   REDDIT_CLIENT_SECRET=your_client_secret_here");
    console.error("   REDDIT_USERNAME=your_reddit_username");
    console.error("   REDDIT_PASSWORD=your_reddit_password\n");
    process.exit(1);
  }
}

/**
 * Get OAuth2 bearer token from Reddit
 */
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const authHeader = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`;
  const params = new URLSearchParams({
    grant_type: "password",
    username: USERNAME,
    password: PASSWORD,
  });

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit OAuth authentication failed (HTTP ${res.status}): ${text}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Reddit OAuth error: ${data.error} - ${data.error_description || "Check credentials"}`);
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken;
}

/**
 * Execute an authenticated call to Reddit API
 */
async function redditApi(endpoint, options = {}) {
  const token = await getAccessToken();
  const url = endpoint.startsWith("http") ? endpoint : `https://oauth.reddit.com${endpoint}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": USER_AGENT,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit API error on ${endpoint} (HTTP ${res.status}): ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  return await res.text();
}

// -----------------------------------------------------------------------------
// Commands
// -----------------------------------------------------------------------------

/**
 * Test credentials and verify connection
 */
async function cmdTest() {
  console.log("Connecting to Reddit...");
  const me = await redditApi("/api/v1/me");
  console.log("\n=================================================");
  console.log(`✅ Successfully connected to Reddit!`);
  console.log(`   Username:       /u/${me.name}`);
  console.log(`   Link Karma:     ${me.link_karma}`);
  console.log(`   Comment Karma:  ${me.comment_karma}`);
  console.log(`   Account ID:     ${me.id}`);
  console.log(`   Has Mail:       ${me.has_mail ? "📬 YES (unread messages waiting!)" : "No unread mail"}`);
  console.log("=================================================\n");
}

/**
 * Read inbox messages (unread or all)
 */
async function cmdInbox(showAll = false) {
  const endpoint = showAll ? "/message/inbox?limit=15" : "/message/unread?limit=15";
  console.log(`Fetching ${showAll ? "inbox" : "unread"} messages for /u/${USERNAME}...`);
  const res = await redditApi(endpoint);

  const messages = (res?.data?.children || []).map((c) => c.data);
  if (messages.length === 0) {
    console.log(`\n📭 No ${showAll ? "" : "unread "}messages in your inbox.`);
    return;
  }

  console.log(`\n=================================================`);
  console.log(`📬 Found ${messages.length} message(s):`);
  console.log(`=================================================`);

  for (const [idx, m] of messages.entries()) {
    const date = new Date(m.created_utc * 1000).toLocaleString("en-GB");
    console.log(`\n[${idx + 1}] ID: ${m.name} | From: /u/${m.author || "reddit"} | ${date}`);
    console.log(`    Subject:   ${m.subject}`);
    if (m.subreddit) console.log(`    Subreddit: r/${m.subreddit}`);
    console.log(`    Body:`);
    const preview = (m.body || "").split("\n").map((line) => `      ${line}`).join("\n");
    console.log(preview);
    console.log(`-------------------------------------------------`);
  }
  console.log(`\n💡 To reply: node scripts/reddit-assistant.mjs reply <ID> "your reply text"\n`);
}

/**
 * Send a direct message
 */
async function cmdSend(toUser, subject, text) {
  if (!toUser || !subject || !text) {
    console.error("Usage: node scripts/reddit-assistant.mjs send <username> \"<subject>\" \"<message>\"");
    process.exit(1);
  }

  const cleanUser = toUser.replace(/^(\/u\/|u\/)/, "");
  console.log(`Sending direct message to /u/${cleanUser}...`);

  const params = new URLSearchParams({
    api_type: "json",
    to: cleanUser,
    subject: subject,
    text: text,
  });

  const res = await redditApi("/api/compose", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const errors = res?.json?.errors || [];
  if (errors.length > 0) {
    console.error(`❌ Failed to send message:`, errors);
    process.exit(1);
  }

  console.log(`✅ Message sent successfully to /u/${cleanUser}!`);
}

/**
 * Reply to a comment or direct message
 */
async function cmdReply(thingId, text) {
  if (!thingId || !text) {
    console.error("Usage: node scripts/reddit-assistant.mjs reply <thing_id> \"<your message>\"");
    console.error("Example: node scripts/reddit-assistant.mjs reply t4_12345 \"Hi mate, here is the info...\"");
    process.exit(1);
  }

  console.log(`Sending reply to ${thingId}...`);

  const params = new URLSearchParams({
    api_type: "json",
    thing_id: thingId,
    text: text,
  });

  const res = await redditApi("/api/comment", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const errors = res?.json?.errors || [];
  if (errors.length > 0) {
    console.error(`❌ Failed to send reply:`, errors);
    process.exit(1);
  }

  console.log(`✅ Reply posted successfully!`);
}

/**
 * Submit a new post to a subreddit
 */
async function cmdPost(subName, title, text) {
  if (!subName || !title || !text) {
    console.error("Usage: node scripts/reddit-assistant.mjs post <subreddit> \"<title>\" \"<text>\"");
    console.error("Example: node scripts/reddit-assistant.mjs post UKSmallBusiness \"Built a free quoting tool for trades\" \"Hey everyone...\"");
    process.exit(1);
  }

  const cleanSub = subName.replace(/^(\/r\/|r\/)/, "");
  console.log(`Submitting post to r/${cleanSub}...`);

  const params = new URLSearchParams({
    api_type: "json",
    kind: "self",
    sr: cleanSub,
    title: title,
    text: text,
  });

  const res = await redditApi("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const errors = res?.json?.errors || [];
  if (errors.length > 0) {
    console.error(`❌ Failed to submit post:`, errors);
    process.exit(1);
  }

  const postUrl = res?.json?.data?.url || `https://reddit.com/r/${cleanSub}`;
  console.log(`✅ Post created successfully!`);
  console.log(`   Link: ${postUrl}`);
}

/**
 * Mark messages as read
 */
async function cmdMarkRead(thingId) {
  if (!thingId) {
    console.error("Usage: node scripts/reddit-assistant.mjs read <message_id>");
    process.exit(1);
  }
  const params = new URLSearchParams({ id: thingId });
  await redditApi("/api/read_message", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  console.log(`✅ Marked ${thingId} as read.`);
}

/**
 * Scan UK subreddits for trade quoting, invoicing, and paperwork discussions
 */
async function cmdScan(targetSub) {
  const subreddits = targetSub
    ? [targetSub.replace(/^r\//, "")]
    : ["DIYUK", "UKPersonalFinance", "electricians", "Plumbing", "Roofing"];

  const query = "quote OR quoting OR invoice OR paperwork";
  console.log(`\n🔍 Scanning subreddits: ${subreddits.map((s) => `r/${s}`).join(", ")}`);
  console.log(`   Search Query: "${query}" (Past 7 days)\n`);

  for (const sub of subreddits) {
    try {
      const endpoint = `/r/${sub}/search?q=${encodeURIComponent(query)}&sort=new&t=week&restrict_sr=1&limit=5`;
      const res = await redditApi(endpoint);
      const posts = (res?.data?.children || []).map((c) => c.data);

      console.log(`--- r/${sub} (${posts.length} recent match${posts.length === 1 ? "" : "es"}) ---`);
      if (posts.length === 0) {
        console.log(`   (No matching discussions this week)\n`);
        continue;
      }

      for (const p of posts) {
        const date = new Date(p.created_utc * 1000).toLocaleDateString("en-GB");
        console.log(`📌 "${p.title}"`);
        console.log(`   Author: /u/${p.author} | Upvotes: ${p.score} | Comments: ${p.num_comments} | ${date}`);
        console.log(`   URL:    https://reddit.com${p.permalink}`);
        if (p.selftext) {
          const snippet = p.selftext.slice(0, 160).replace(/\n/g, " ");
          console.log(`   Snippet: "${snippet}..."`);
        }
        console.log("");
      }
    } catch (err) {
      console.warn(`   ⚠️ Could not search r/${sub}: ${err.message}\n`);
    }
  }

  console.log(`💡 Tip: Open any discussion link above in your browser to read and participate thoughtfully.`);
}

// -----------------------------------------------------------------------------
// CLI Router
// -----------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(`
======================================================
🛠️  Reddit Assistant for Chuffed Quotes
======================================================

Commands:
  test                                    Verify connection and check karma
  inbox                                   Show unread messages and comment mentions
  inbox --all                             Show all recent messages
  send <user> "<subject>" "<message>"     Send a new direct message
  reply <id> "<message>"                  Reply to a message (e.g. t4_xxx) or comment
  post <subreddit> "<title>" "<message>"  Post a new discussion to a subreddit
  read <id>                               Mark a message as read
  scan [subreddit]                        Scan UK subreddits (r/DIYUK, etc.) for trade quoting discussions

Examples:
  node scripts/reddit-assistant.mjs test
  node scripts/reddit-assistant.mjs inbox
  node scripts/reddit-assistant.mjs scan DIYUK
  node scripts/reddit-assistant.mjs post UKSmallBusiness "Quoting tool for UK trades" "Built this..."
  node scripts/reddit-assistant.mjs send bob_builder "Quick question" "Hi Bob, saw your post..."
    `);
    return;
  }

  checkConfig();

  switch (command) {
    case "test":
      await cmdTest();
      break;
    case "inbox":
      await cmdInbox(args[1] === "--all");
      break;
    case "send":
      await cmdSend(args[1], args[2], args[3]);
      break;
    case "reply":
      await cmdReply(args[1], args[2]);
      break;
    case "post":
      await cmdPost(args[1], args[2], args[3]);
      break;
    case "read":
      await cmdMarkRead(args[1]);
      break;
    case "scan":
      await cmdScan(args[1]);
      break;
    default:
      console.error(`Unknown command: "${command}". Run with --help for available commands.`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
