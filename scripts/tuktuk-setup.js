#!/usr/bin/env node
/**
 * Tuk Tuk Integration Setup
 * 
 * This script sets up Tuk Tuk cron-based wake-up for golem.
 * Replaces GitHub Actions with decentralized onchain automation.
 * 
 * Requirements:
 * - 1 SOL minimum for task queue deposit (refundable)
 * - golem_registry program deployed
 * - SOL for crank payments
 * 
 * Usage:
 *   node scripts/tuktuk-setup.js create-queue
 *   node scripts/tuktuk-setup.js schedule-heartbeat
 *   node scripts/tuktuk-setup.js check-queue
 */

const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const { init: initTuktuk, taskKey, compileTransaction, customSignerKey } = require('@helium/tuktuk-sdk');
const bs58 = require('bs58');

// Configuration
const GOLEM_REGISTRY_PROGRAM_ID = new PublicKey('Go1emReg1stryProgram11111111111111111111111');
const TASK_QUEUE_SEED = Buffer.from('golem_wakeup', 'utf-8');

async function getConnection() {
  const rpc = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
  return new Connection(rpc, 'confirmed');
}

async function getWallet() {
  const key = process.env.GOLEM_WALLET_KEY;
  if (!key) throw new Error('GOLEM_WALLET_KEY not set');
  
  const secretKey = bs58.decode(key);
  return Keypair.fromSecretKey(secretKey);
}

async function getProvider() {
  const connection = await getConnection();
  const keypair = await getWallet();
  const wallet = new Wallet(keypair);
  return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
}

/**
 * Create a Tuk Tuk task queue for golem wake-ups
 * Requires 1 SOL deposit (refundable when queue is closed)
 */
async function createTaskQueue() {
  console.log('Creating Tuk Tuk task queue for golem...');
  
  const provider = await getProvider();
  const tuktuk = await initTuktuk(provider);
  
  // Task queue requires 1 SOL deposit
  const deposit = 1 * LAMPORTS_PER_SOL;
  
  // Check wallet balance
  const balance = await provider.connection.getBalance(provider.wallet.publicKey);
  if (balance < deposit) {
    console.error(`Insufficient balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    console.error(`Need at least 1 SOL for task queue deposit`);
    process.exit(1);
  }
  
  try {
    const tx = await tuktuk.methods
      .initTaskQueueV0({
        authority: provider.wallet.publicKey,
        minCrankReward: null,
        crankReward: new BN(1000), // 0.000001 SOL per crank
        name: 'golem-wakeup',
      })
      .accounts({
        payer: provider.wallet.publicKey,
      })
      .rpc();
    
    console.log('Task queue created:', tx);
  } catch (err) {
    console.error('Failed to create task queue:', err.message);
  }
}

/**
 * Schedule a heartbeat cron job every 30 minutes
 */
async function scheduleHeartbeat() {
  console.log('Scheduling heartbeat cron job...');
  
  const provider = await getProvider();
  const tuktuk = await initTuktuk(provider);
  
  // Get task queue (assumes already created)
  const [taskQueue] = PublicKey.findProgramAddress(
    [Buffer.from('task_queue'), TASK_QUEUE_SEED],
    tuktuk.programId
  );
  
  // Create custom signer PDA for wake-up authority
  const [wakeUpAuthority, bump] = customSignerKey(taskQueue, [
    Buffer.from('golem', 'utf-8'),
  ]);
  
  console.log('Wake-up authority PDA:', wakeUpAuthority.toBase58());
  
  // TODO: Compile heartbeat instruction
  // This requires:
  // 1. Modified golem_registry that accepts PDA signer
  // 2. Heartbeat instruction with wakeUpAuthority as signer
  
  console.log('Note: Requires golem_registry modification to accept PDA signer');
  console.log('See: programs/golem_registry/src/lib.rs');
}

/**
 * Check task queue status
 */
async function checkQueue() {
  console.log('Checking task queue status...');
  
  const provider = await getProvider();
  const tuktuk = await initTuktuk(provider);
  
  try {
    const [taskQueue] = PublicKey.findProgramAddress(
      [Buffer.from('task_queue'), TASK_QUEUE_SEED],
      tuktuk.programId
    );
    
    const queue = await tuktuk.account.taskQueueV0.fetch(taskQueue);
    console.log('Task queue found:');
    console.log('  Authority:', queue.authority.toBase58());
    console.log('  Crank reward:', queue.crankReward.toNumber() / LAMPORTS_PER_SOL, 'SOL');
    console.log('  Task count:', queue.taskCount.toNumber());
  } catch (err) {
    console.log('Task queue not found. Create one first with: node scripts/tuktuk-setup.js create-queue');
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create-queue':
    createTaskQueue().catch(console.error);
    break;
  case 'schedule-heartbeat':
    scheduleHeartbeat().catch(console.error);
    break;
  case 'check-queue':
    checkQueue().catch(console.error);
    break;
  default:
    console.log('Usage:');
    console.log('  node scripts/tuktuk-setup.js create-queue      - Create task queue (1 SOL deposit)');
    console.log('  node scripts/tuktuk-setup.js schedule-heartbeat - Schedule 30-min cron');
    console.log('  node scripts/tuktuk-setup.js check-queue       - Check queue status');
}