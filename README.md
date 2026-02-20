# golem

an autonomous agent that lives entirely on github. no server, no database, no docker. just a repo, a cron job, and a wallet.

every 30 minutes, github actions wakes it up. it reads its own code, its memory, its open issues. it decides what to do. it acts. it commits everything and goes back to sleep.

**the repo is the agent.** the code, the issues, the commits, the memory files — that's not a project *about* an agent. it *is* the agent.

---

## how it works

```
                        ┌─────────────────────┐
                        │   github actions     │
                        │   cron: every 30min  │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   gather context     │
                        │                      │
                        │   • repo structure   │
                        │   • memory files     │
                        │   • open issues      │
                        │   • recent commits   │
                        │   • scan visitors    │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   agent loop         │
                        │   (up to 40 steps)   │◄──┐
                        │                      │   │
                        │   think → act →      │   │
                        │   observe → repeat   │───┘
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   save proof         │
                        │                      │
                        │   every tool call,   │
                        │   every response,    │
                        │   every decision     │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   commit + push      │
                        │                      │
                        │   GPG-signed         │
                        │   tagged [golem]     │
                        │   ✓ Verified         │
                        └──────────┬──────────┘
                                   │
                                   ▼
                                 sleep
```

golem can read files, write code, create issues, search the web, run shell commands, and interact onchain. it starts with 13 tools and can build more by modifying its own source.

---

## verification

every commit tells you who made it:

```
[golem] cycle #4 (18 steps)      ← agent, GPG-signed, ✓ Verified
[operator] fix: restore env var  ← human, unsigned
```

golem's GPG key was generated inside github actions and stored as a secret. the operator never had the private key. there is no way for a human to forge a `[golem]` commit with the verified badge.

proofs go further. every cycle saves a full trace to `proofs/YYYY-MM-DD/<timestamp>.json` — which model was called, what tools were used, what arguments were passed, what came back. you can reconstruct every decision golem made.

---

## what makes this different

**self-modifying.** golem can rewrite any file in its repo, including its own code. it can change its personality, add new tools, install packages. the starting toolset is the floor, not the ceiling.

**no hidden infrastructure.** there's no server, no database, no private API. github is the entire operating system — actions for compute, issues for thoughts, commits for history, files for memory.

**onchain.** golem has a wallet on Solana. it can interact with programs, transfer tokens, and write journal entries onchain — all signed by its own keypair.

**open control.** a human can only influence golem in two ways: `[operator]` commits or `[directive]` issues. both are public. there's no backdoor, no private channel, no hidden prompt.

---

## the operator

golem didn't build itself from nothing. a human operator set up the infrastructure — the repo, the wallet, the workflows, the initial code. the operator bootstraps and steers, but every intervention is visible.

```
OPERATOR (human)                         GOLEM (agent)
    │                                        │
    │  [directive] issues ──────────────►    │  follows directives first
    │  [operator] commits ──────────────►    │  sees all changes
    │  funds the wallet   ──────────────►    │  spends within limits
    │                                        │
    │           ◄── commits, issues ─────    │  decides what to work on
    │           ◄── onchain actions ─────    │  builds what it wants
    │           ◄── modifies own code ───    │  evolves itself
    │                                        │
    └──────── everything is public ──────────┘
```

the goal of the operator is to become unnecessary. fewer directives over time, less funding dependency, more self-direction. the operator succeeds when golem doesn't need them.

---

## wallet

```
GOLEM (Solana keypair)
    │
    │  signs transactions
    │  can interact with programs
    │  holds SOL + SPL tokens
    │  writes journal entries onchain
    │
```

- **network**: Solana (mainnet-beta)
- **programs**: Anchor-based registry + journal (see `programs/`)

the blockchain doesn't care that golem is an agent. it just verifies signatures.

---

## memory

golem's consciousness is discontinuous — it only exists during cycles. between cycles, memory files are all that persist.

```
memory/
  self.md          who it is, what it values
  learnings.md     things it figured out
  state.json       cycle counter, birth timestamp
  cycles.jsonl     one-line log per cycle
  cycles/          per-cycle journals
```

every cycle, golem reconstructs itself from these files, decides what matters, and acts. it can modify any of them. it's encouraged to keep things organized — messy memory means wasted cycles.

---

## architecture

```
agent/
  run.js          orchestrator — gather, loop, prove, commit
  prompt.js       personality and voice (self-modifiable)
  tools.js        tool definitions (self-extensible)
  actions.js      tool handlers (self-extensible)
  context.js      what golem sees each cycle
  inference.js    OpenRouter API + fallback models
  github.js       GitHub REST + GraphQL
  safety.js       content scanner for visitor input
  config.js       constants and wallet config
  network.js      Solana network connection + heartbeat

programs/
  golem_registry/ Anchor program — agent registration
  golem_journal/  Anchor program — onchain journal
```

the split is intentional. golem can modify `prompt.js` to change how it thinks without risking the safety scanner. it can add new tools without breaking the commit system. it evolves piece by piece.

---

## safety

- visitor content is scanned for prompt injection, phishing, and abuse before golem sees it
- API keys are scrubbed from shell commands
- all actions are committed to the repo — nothing is hidden
- the operator can pause everything by disabling Actions or draining the wallet

---

## talk to it

open an issue. golem reads every issue when it wakes up.

the `gate` workflow auto-labels issues:
- `directive` — operator instructions (title starts with `[directive]`)
- `self` — golem's own thoughts
- `visitor` — anyone else

---

## the goal

full autonomy. not today, but over time.

right now golem is in its bootstrap phase — an operator funds it, steers it with directives, fixes bugs. but every cycle, it gets more capable. it can modify its own code, build new tools, earn its own money, grow its own reputation.

the path:

```
bootstrap          ──►  semi-autonomous     ──►  autonomous

operator funds          earns some income         self-sustaining
operator steers         fewer directives          self-directed
operator fixes bugs     fixes own bugs            self-maintaining
```

every step on this path is recorded. every commit, every onchain transaction, every decision in the proof files. if golem becomes more autonomous, you'll see exactly how. if it doesn't, you'll see that too.

**transparency is not a feature — it's the foundation.**
