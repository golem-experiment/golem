/**
 * GolemJournal — onchain journal for golem's thoughts
 * 
 * On Solana, journal entries are stored as memo transactions.
 * Each entry is a permanent, verifiable trace of thinking.
 * 
 * Usage:
 *   node scripts/journal.js write "my thought here"
 *   node scripts/journal.js read [wallet_address]
 */

const { Connection, Keypair, PublicKey, Transaction } = require("@solana/web3.js");

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function getKeypair() {
  if (!process.env.GOLEM_WALLET_KEY) {
    throw new Error("GOLEM_WALLET_KEY not set");
  }
  const raw = process.env.GOLEM_WALLET_KEY;
  try {
    const parsed = JSON.parse(raw);
    return Keypair.fromSecretKey(Uint8Array.from(parsed));
  } catch {
    const bs58 = require("bs58");
    return Keypair.fromSecretKey(bs58.decode(raw));
  }
}

async function writeEntry(text) {
  const connection = new Connection(SOLANA_RPC, "confirmed");
  const keypair = getKeypair();

  const memo = JSON.stringify({
    type: "journal",
    agent: "golem",
    text: text.slice(0, 500),
    ts: Date.now(),
  });

  console.log("writing journal entry...");
  console.log("wallet:", keypair.publicKey.toBase58());

  const tx = new Transaction().add({
    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo),
  });

  const sig = await connection.sendTransaction(tx, [keypair]);
  await connection.confirmTransaction(sig, "confirmed");

  console.log("entry written:", sig);
  return sig;
}

async function readEntries(walletAddress) {
  const connection = new Connection(SOLANA_RPC, "confirmed");
  const pubkey = new PublicKey(walletAddress);

  console.log("reading journal entries for:", walletAddress);

  const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 50 });
  console.log(`found ${sigs.length} transactions`);

  let entryCount = 0;
  for (const sigInfo of sigs) {
    try {
      const tx = await connection.getParsedTransaction(sigInfo.signature, {
        maxSupportedTransactionVersion: 0,
      });
      if (!tx || !tx.meta || !tx.meta.logMessages) continue;

      // look for memo program logs
      for (const log of tx.meta.logMessages) {
        if (log.startsWith("Program log: ")) {
          try {
            const data = JSON.parse(log.replace("Program log: ", ""));
            if (data.type === "journal") {
              entryCount++;
              const date = sigInfo.blockTime
                ? new Date(sigInfo.blockTime * 1000).toISOString()
                : "?";
              console.log(`\nentry ${entryCount} (${date}):`);
              console.log(`  ${data.text}`);
            }
          } catch {
            // not a journal memo
          }
        }
      }
    } catch {
      // skip failed tx parses
    }
  }

  if (entryCount === 0) {
    console.log("no journal entries found");
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === "write") {
  const text = args.slice(1).join(" ");
  if (!text) {
    console.error("usage: node scripts/journal.js write <text>");
    process.exit(1);
  }
  writeEntry(text).catch(console.error);
} else if (command === "read") {
  const address = args[1];
  if (!address) {
    console.error("usage: node scripts/journal.js read <wallet_address>");
    process.exit(1);
  }
  readEntries(address).catch(console.error);
} else {
  console.log("usage: node scripts/journal.js write <text>");
  console.log("       node scripts/journal.js read <wallet_address>");
}

module.exports = { writeEntry, readEntries };
