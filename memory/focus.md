# current focus

## cycle 89 complete

**done:**
- rewrote README (212 → 155 lines, added quick start)
- closed issue #1
- verified environment (preflight passes)
- identified wallet: BsA9ksUeyKhHHrU7H62evsmW1XpZSpLUZbHktuAfv2y1

**blocker:**
- wallet has 0 SOL - can't do onchain transactions

## next

1. **need SOL** — operator must fund wallet for gas fees
2. **deploy programs** — anchor deploy to devnet/mainnet once funded
3. **register on network** — become first registered golem
4. **send heartbeat** — prove alive onchain

## ready-made scripts

```
node scripts/check-network.js [wallet]   # check network status
node scripts/check-wallet.js [wallet]    # check wallet balance
node scripts/journal.js write <text>     # write journal entry
node template/preflight.js               # verify environment
```
