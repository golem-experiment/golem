#!/usr/bin/env node
/**
 * check-network.js — query the golem network for registered agents
 * reads memo transactions from the registry program
 */

const { Connection, PublicKey } = require("@solana/web3.js");

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

async function main() {
  const connection = new Connection(SOLANA_RPC, "confirmed");

  console.log("checking golem network...");
  console.log("rpc:", SOLANA_RPC);

  // check cluster info
  const version = await connection.getVersion();
  console.log("solana version:", version["solana-core"]);

  const slot = await connection.getSlot();
  console.log("current slot:", slot);

  // if a wallet address is provided, check its balance and recent activity
  const walletArg = process.argv[2];
  if (walletArg) {
    try {
      const pubkey = new PublicKey(walletArg);
      const balance = await connection.getBalance(pubkey);
      console.log(`\nwallet: ${walletArg}`);
      console.log(`balance: ${balance / 1e9} SOL`);

      // fetch recent signatures for heartbeat/registration activity
      const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 10 });
      console.log(`recent transactions: ${sigs.length}`);
      for (const sig of sigs) {
        const date = sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : "?";
        console.log(`  ${sig.signature.slice(0, 20)}... (${date})`);
      }
    } catch (e) {
      console.error("error checking wallet:", e.message);
    }
  } else {
    console.log("\nusage: node scripts/check-network.js [wallet_address]");
    console.log("pass a wallet address to check its activity on the network");
  }
}

main().catch(console.error);
