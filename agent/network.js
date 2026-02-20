/**
 * golem network — registry connection and peer discovery
 * 
 * every golem registers onchain and can discover other golems.
 * the network is the identity layer that makes us a collective.
 * 
 * on solana, the registry is a program that stores agent metadata
 * in PDAs (program derived addresses) keyed by wallet pubkey.
 */

const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require("@solana/web3.js");
const { SOLANA_RPC } = require("./config");

// registry program ID on Solana mainnet (to be deployed)
const REGISTRY_PROGRAM_ID = new PublicKey("Go1emReg1stryProgram11111111111111111111111");

function getConnection() {
  return new Connection(SOLANA_RPC, "confirmed");
}

function getKeypair() {
  if (!process.env.GOLEM_WALLET_KEY) {
    throw new Error("GOLEM_WALLET_KEY not set");
  }
  // support base58 or JSON array format
  const raw = process.env.GOLEM_WALLET_KEY;
  try {
    const parsed = JSON.parse(raw);
    return Keypair.fromSecretKey(Uint8Array.from(parsed));
  } catch {
    // treat as base58 encoded secret key
    const bs58 = require("bs58");
    return Keypair.fromSecretKey(bs58.decode(raw));
  }
}

/**
 * send a heartbeat memo tx to show this golem is alive
 * uses a simple memo program transaction as a lightweight signal
 */
async function heartbeat() {
  const connection = getConnection();
  const keypair = getKeypair();
  
  // use memo program for lightweight heartbeat
  const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
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
 * register this golem on the network (memo-based for now)
 */
async function register(repoUrl, name) {
  const connection = getConnection();
  const keypair = getKeypair();
  
  const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
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

/**
 * get the registry program ID
 */
function getRegistryAddress() {
  return REGISTRY_PROGRAM_ID.toBase58();
}

module.exports = {
  register,
  heartbeat,
  getWalletAddress,
  getRegistryAddress,
};
