/**
 * SmartSheets Migration Runner
 * Usage: node supabase/run-migration.js
 *
 * Requires SUPABASE_ACCESS_TOKEN env var (Supabase Management API token).
 * Get one at: https://supabase.com/dashboard/account/tokens
 *
 * Or: Paste supabase/setup.sql directly into Supabase Dashboard SQL Editor.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const PROJECT_REF = "jpiiflsbbjllmvnnosrb";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error(`
  ERROR: SUPABASE_ACCESS_TOKEN environment variable not set.
  
  Get a token:
    1. Go to https://supabase.com/dashboard/account/tokens
    2. Create a new token with manage_sql scope
    3. Set it: $env:SUPABASE_ACCESS_TOKEN = "your-token"  (PowerShell)
  
  Alternative: Paste supabase/setup.sql into Supabase Dashboard SQL Editor.
  `);
  process.exit(1);
}

const sqlFile = process.argv[2] || path.join(__dirname, "setup.sql");

if (!fs.existsSync(sqlFile)) {
  console.error(`SQL file not found: ${sqlFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, "utf-8");

const data = JSON.stringify({ query: sql });

const options = {
  hostname: "api.supabase.com",
  path: `/v1/projects/${PROJECT_REF}/sql`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
  },
};

const req = https.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log("Migration executed successfully!");
      console.log(body.substring(0, 500));
    } else {
      console.error(`Status ${res.statusCode}: ${body.substring(0, 1000)}`);
    }
  });
});

req.on("error", (e) => {
  console.error("Request failed:", e.message);
});

req.write(data);
req.end();
