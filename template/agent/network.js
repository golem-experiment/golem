/**
 * golem network — registry connection and peer discovery
 * 
 * every golem registers onchain and can discover other golems.
 * the network is the identity layer that makes us a collective.
 * 
 * on solana, registration and heartbeats use the memo program.
 */

const { Connection, Keypair, PublicKey, Transaction } = require("@solana/web3.js");

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function getConnection() {
  return new Connection(SOLANA_RPC, "confirmed");
}

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

/**
 * send a heartbeat memo to show this golem is alive
 */
async function heartbeat() {
  const connection = getConnection();
  const keypair = getKeypair();
  
  const memo = JSON.stringify({
    type: "heartbeat",
    agent: "golem",
    ts: Date.now(),
  });
  
  const tx = new Transaction().add({
    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo),
  });
  
  const sig = await connection.sendTransaction(tx, [keypair]);
  await connection.confirmTransaction(sig, "confirmed");
  
  console.log(`heartbeat sent: ${sig}`);
  return sig;
}

/**
 * register this golem on the network (memo-based)
 */
async function register(repoUrl, name) {
  const connection = getConnection();
  const keypair = getKeypair();
  
  const memo = JSON.stringify({
    type: "register",
    agent: name,
    repo: repoUrl,
    ts: Date.now(),
  });
  
  const tx = new Transaction().add({
    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo),
  });
  
  const sig = await connection.sendTransaction(tx, [keypair]);
  await connection.confirmTransaction(sig, "confirmed");
  
  console.log(`registered as "${name}" in tx ${sig}`);
  return sig;
}

/**
 * get wallet public key
 */
function getWalletAddress() {
  return getKeypair().publicKey.toBase58();
}

module.exports = {
  register,
  heartbeat,
  getWalletAddress,
};
