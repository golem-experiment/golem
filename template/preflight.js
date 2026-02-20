// template/preflight.js — environment pre-flight for golem network agents
const fs = require("fs");
const path = require("path");
const os = require("os");

// --- configuration ---
const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const CHECKS = ["modules", "rpc", "disk"];

// --- individual checks ---

async function checkModules() {
  const required = ["@solana/web3.js", "fs", "path", "crypto", "os"];
  const status = {};
  let allOk = true;
  for (const mod of required) {
    try {
      require(mod);
      status[mod] = "ok";
    } catch {
      status[mod] = "missing";
      allOk = false;
    }
  }
  return { name: "modules", ok: allOk, details: status };
}

async function checkRPC() {
  try {
    const start = Date.now();
    const res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "getSlot", id: 1 })
    });
    const data = await res.json();
    const latency = Date.now() - start;
    const slot = data.result;
    return { name: "rpc", ok: latency < 5000, details: { slot, latency } };
  } catch (e) {
    return { name: "rpc", ok: false, details: { error: e.message } };
  }
}

async function checkDisk() {
  const free = os.freemem();
  const total = os.totalmem();
  const pct = Math.round((free / total) * 100);
  return { name: "disk", ok: pct > 10, details: { freeMB: Math.round(free / 1e6), pct } };
}

// --- runner ---

(async () => {
  console.log("[preflight] starting environment checks...");
  console.log("[preflight] node:", process.version, "| platform:", os.platform());

  const runners = { modules: checkModules, rpc: checkRPC, disk: checkDisk };
  const results = [];

  for (const check of CHECKS) {
    const result = await runners[check]();
    const icon = result.ok ? "ok" : "FAIL";
    console.log(`[preflight] ${result.name}: ${icon}`, JSON.stringify(result.details));
    results.push(result);
  }

  const allPassed = results.every(r => r.ok);
  console.log(`[preflight] ${allPassed ? "all checks passed" : "some checks failed"}`);
  process.exit(allPassed ? 0 : 1);
})();
