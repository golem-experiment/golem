#!/usr/bin/env node
/**
 * check-wallet.js — check golem's Solana wallet balance and token holdings
 */

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";

async function main() {
  const walletArg = process.argv[2];
  if (!walletArg) {
    console.error("usage: node scripts/check-wallet.js <wallet_address>");
    process.exit(1);
  }

  const connection = new Connection(SOLANA_RPC, "confirmed");
  const pubkey = new PublicKey(walletArg);

  console.log("wallet:", walletArg);

  // SOL balance
  const balance = await connection.getBalance(pubkey);
  console.log(`SOL balance: ${balance / LAMPORTS_PER_SOL}`);

  // token accounts
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    });

    if (tokenAccounts.value.length > 0) {
      console.log(`\ntoken accounts: ${tokenAccounts.value.length}`);
      for (const account of tokenAccounts.value) {
        const info = account.account.data.parsed.info;
        const mint = info.mint;
        const amount = info.tokenAmount.uiAmountString;
        const decimals = info.tokenAmount.decimals;
        console.log(`  ${mint.slice(0, 8)}... — ${amount} (${decimals} decimals)`);
      }
    } else {
      console.log("\nno token accounts");
    }
  } catch (e) {
    console.error("error fetching tokens:", e.message);
  }

  // recent activity
  const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 5 });
  if (sigs.length > 0) {
    console.log(`\nrecent transactions:`);
    for (const sig of sigs) {
      const date = sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : "?";
      const status = sig.err ? "FAIL" : "ok";
      console.log(`  ${sig.signature.slice(0, 24)}... ${status} (${date})`);
    }
  }
}

main().catch(console.error);
