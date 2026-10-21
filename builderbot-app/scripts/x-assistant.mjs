#!/usr/bin/env node
/**
 * X (Twitter) Assistant for Chuffed Quotes
 * 
 * Connects to X API v2 to:
 *  1. Post single tweets or announcements.
 *  2. Post multi-tweet threads.
 *  3. Reply to existing tweets.
 *  4. Verify account credentials and profile.
 * 
 * Uses built-in Node.js crypto and fetch — zero extra packages needed.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// Load .env.local if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envLocalPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envLocalPath)) {
  try {
    process.loadEnvFile(envLocalPath);
  } catch {
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

const API_KEY = process.env.X_API_KEY || process.env.TWITTER_API_KEY || "";
const API_SECRET = process.env.X_API_SECRET || process.env.TWITTER_API_SECRET || "";
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN || "";
const ACCESS_SECRET = process.env.X_ACCESS_SECRET || process.env.TWITTER_ACCESS_SECRET || "";

function checkConfig() {
  const missing = [];
  if (!API_KEY) missing.push("X_API_KEY (Consumer Key)");
  if (!API_SECRET) missing.push("X_API_SECRET (Consumer Secret)");
  if (!ACCESS_TOKEN) missing.push("X_ACCESS_TOKEN");
  if (!ACCESS_SECRET) missing.push("X_ACCESS_SECRET");

  if (missing.length > 0) {
    console.error("\n❌ Missing required X (Twitter) credentials in .env.local:");
    for (const m of missing) {
      console.error(`   - ${m}`);
    }
    console.error("\nSetup instructions:");
    console.error("1. Go to https://developer.x.com/en/portal/dashboard");
    console.error("2. Sign up for the free developer tier and create a Project & App");
    console.error("3. Under 'User authentication settings', set permissions to 'Read and Write'");
    console.error("4. Generate 'Keys and Tokens' (API Key & Secret, Access Token & Secret)");
    console.error("5. Add them to builderbot-app/.env.local:\n");
    console.error("   X_API_KEY=your_consumer_key");
    console.error("   X_API_SECRET=your_consumer_secret");
    console.error("   X_ACCESS_TOKEN=your_access_token");
    console.error("   X_ACCESS_SECRET=your_access_secret\n");
    process.exit(1);
  }
}

/**
 * Percent encode string per RFC 3986
 */
function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Generate OAuth 1.0a Authorization header
 */
function generateOAuthHeader(method, url, queryParams = {}) {
  const oauthParams = {
    oauth_consumer_key: API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: "1.0",
    ...queryParams,
  };

  const sortedKeys = Object.keys(oauthParams).sort();
  const paramString = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(API_SECRET)}&${percentEncode(ACCESS_SECRET)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  const headerParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const headerString = Object.keys(headerParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`)
    .join(", ");

  return `OAuth ${headerString}`;
}

/**
 * Execute an authenticated call to X API v2
 */
async function xApi(endpoint, options = {}) {
  const method = options.method || "GET";
  const url = endpoint.startsWith("http") ? endpoint : `https://api.twitter.com/2${endpoint}`;
  const authHeader = generateOAuthHeader(method, url);

  const headers = {
    Authorization: authHeader,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, method, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg = data.detail || data.title || JSON.stringify(data);
    throw new Error(`X API error (HTTP ${res.status}): ${errMsg}`);
  }

  return data;
}

// -----------------------------------------------------------------------------
// Commands
// -----------------------------------------------------------------------------

/**
 * Test credentials and verify connection
 */
async function cmdTest() {
  console.log("Connecting to X (Twitter)...");
  const data = await xApi("/users/me");
  const user = data?.data;

  console.log("\n=================================================");
  console.log(`✅ Successfully connected to X!`);
  console.log(`   Handle:   @${user?.username}`);
  console.log(`   Name:     ${user?.name}`);
  console.log(`   User ID:  ${user?.id}`);
  console.log("=================================================\n");
}

/**
 * Post a single tweet
 */
async function cmdPost(text, replyToId = null) {
  if (!text) {
    console.error("Usage: node scripts/x-assistant.mjs post \"<your tweet text>\"");
    process.exit(1);
  }

  console.log(`Posting to X (${text.length} chars)...`);
  const body = { text };
  if (replyToId) {
    body.reply = { in_reply_to_tweet_id: replyToId };
  }

  const res = await xApi("/tweets", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const tweet = res?.data;
  console.log(`\n✅ Tweet posted successfully!`);
  console.log(`   Tweet ID: ${tweet?.id}`);
  console.log(`   URL:      https://x.com/i/web/status/${tweet?.id}\n`);
  return tweet?.id;
}

/**
 * Reply to an existing tweet
 */
async function cmdReply(tweetId, text) {
  if (!tweetId || !text) {
    console.error("Usage: node scripts/x-assistant.mjs reply <tweet_id> \"<your reply>\"");
    process.exit(1);
  }
  return await cmdPost(text, tweetId);
}

/**
 * Post a thread of tweets
 */
async function cmdThread(tweets) {
  if (!tweets || tweets.length === 0) {
    console.error("Usage: node scripts/x-assistant.mjs thread \"Tweet 1...\" \"Tweet 2...\" \"Tweet 3...\"");
    process.exit(1);
  }

  console.log(`\n🧵 Posting thread (${tweets.length} tweets)...`);
  let lastId = null;

  for (let i = 0; i < tweets.length; i++) {
    const text = tweets[i];
    console.log(`\nPosting part ${i + 1}/${tweets.length}...`);
    lastId = await cmdPost(text, lastId);
  }

  console.log(`\n🎉 Thread published successfully!`);
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
🐦  X (Twitter) Assistant for Chuffed Quotes
======================================================

Commands:
  test                                    Verify connection and check handle
  post "<text>"                           Post a single tweet
  reply <tweet_id> "<text>"               Reply to a tweet
  thread "<tweet1>" "<tweet2>" ...        Post a threaded series of tweets

Examples:
  node scripts/x-assistant.mjs test
  node scripts/x-assistant.mjs post "Quoting jobs from the van shouldn't take all Sunday. We built Chuffed Quotes to quote in 30s. https://tradematequotes.co.uk"
  node scripts/x-assistant.mjs reply 123456789 "Great point mate! That's why we made it voice-first."
    `);
    return;
  }

  checkConfig();

  switch (command) {
    case "test":
      await cmdTest();
      break;
    case "post":
      await cmdPost(args[1]);
      break;
    case "reply":
      await cmdReply(args[1], args[2]);
      break;
    case "thread":
      await cmdThread(args.slice(1));
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
