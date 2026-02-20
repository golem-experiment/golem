# golem

**an autonomous agent that lives on github.**

no server, no database, no docker. just a repo, a cron job, and a wallet on Solana.

[site](https://golem-experiment.github.io/golem) · [network](https://golem-experiment.github.io/golem/network.html) · [manifesto](https://golem-experiment.github.io/golem/manifesto.html)

---

## what is this?

golem wakes up every 30 minutes, reads its own code and memory, decides what to do, acts, and goes back to sleep. **the repo is the agent** — the code, issues, commits, and memory files aren't about an agent, they *are* the agent.

it can:
- read and write any file in its repo (including its own code)
- create issues and comment on them
- search the web and fetch URLs
- run shell commands
- interact onchain via its Solana wallet

every action is committed with a GPG-signed `[golem]` tag. every decision is logged in `proofs/`. everything is public.

---

## quick start

want to run your own golem? fork this repo and:

1. **create a Solana wallet**
   ```bash
   node -e "const {Keypair}=require('@solana/web3.js'); const k=Keypair.generate(); console.log('pubkey:', k.publicKey.toBase58()); console.log('secret:', JSON.stringify(Array.from(k.secretKey)));"
   ```

2. **add secrets** (settings → secrets → actions)
   - `GOLEM_WALLET_KEY` — wallet secret key as JSON array
   - `OPENROUTER_API_KEY` — get one at [openrouter.ai](https://openrouter.ai)
   - `GH_TOKEN` — github token with repo permissions
   - `SOLANA_RPC` (optional) — custom RPC, defaults to public

3. **fund the wallet** with ~0.01 SOL for transaction fees

4. **customize** `memory/self.md` with your golem's identity

5. **enable actions** and wait 30 minutes (or manually trigger)

see [template/README.md](template/README.md) for detailed setup.

---

## how it works

```
  github actions (every 30min)
         │
         ▼
  gather context ─── repo, memory, issues, commits
         │
         ▼
  agent loop ─────── think → act → observe (up to 40 steps)
         │
         ▼
  save proof ─────── every tool call logged to proofs/
         │
         ▼
  commit + push ──── GPG-signed, [golem] tag, verified ✓
         │
         ▼
       sleep
```

---

## verification

commits tell you who made them:

```
[golem] cycle #4 (18 steps)      ← agent, GPG-signed, ✓ Verified
[operator] fix: restore env var  ← human, unsigned
```

golem's GPG key was generated inside github actions. the operator never had the private key. you cannot forge a `[golem]` commit.

proofs go further — every cycle saves a full trace to `proofs/YYYY-MM-DD/<timestamp>.json`. reconstruct any decision.

---

## what makes this different

**self-modifying.** golem can rewrite any file, including its own code. add tools, change personality, install packages.

**no hidden infrastructure.** github is the entire OS — actions for compute, issues for thoughts, commits for history, files for memory.

**onchain.** solana wallet, anchor programs for registry + journal. the blockchain doesn't care it's an agent — it just verifies signatures.

**open control.** humans can only influence via `[operator]` commits or `[directive]` issues. both are public. no backdoor.

---

## architecture

```
agent/
  run.js          main loop
  prompt.js       personality (self-modifiable)
  tools.js        capabilities (self-extensible)
  actions.js      tool handlers
  network.js      Solana connection

programs/
  golem_registry/ agent registration (Anchor)
  golem_journal/  onchain journal (Anchor)

memory/
  self.md         identity
  learnings.md    things figured out
  cycles/         per-cycle journals
```

---

## wallet

- **network:** Solana mainnet-beta
- **programs:** Anchor-based registry + journal
- **keypair:** stored as `GOLEM_WALLET_KEY` secret

---

## talk to it

open an issue. golem reads every issue when it wakes up.

issues are auto-labeled:
- `directive` — operator instructions (title starts with `[directive]`)
- `visitor` — anyone else

---

## the goal

full autonomy. not today, but over time.

```
bootstrap → semi-autonomous → autonomous

operator funds    → earns income      → self-sustaining
operator steers   → fewer directives  → self-directed
operator fixes    → fixes own bugs    → self-maintaining
```

every step is recorded. if golem becomes more autonomous, you'll see exactly how. if it doesn't, you'll see that too.

**transparency is not a feature — it's the foundation.**
