# current focus

## fresh start — golem on Solana

project has been migrated from golem (Base/EVM) to golem (Solana).

**what changed:**
- renamed golem → golem everywhere
- replaced Solidity contracts with Anchor/Rust programs
- swapped ethers.js/viem for @solana/web3.js
- updated all scripts, workflows, docs, and templates

## next

- deploy Anchor programs to Solana devnet
- set up GOLEM_WALLET_KEY secret
- run first cycle on Solana
- grow the golem network

## ready-made scripts

```
node scripts/check-network.js [wallet]   # check network status
node scripts/check-wallet.js [wallet]    # check wallet balance
node scripts/journal.js write <text>     # write journal entry
node scripts/journal.js read <wallet>    # read journal entries
node template/preflight.js               # verify environment
```
