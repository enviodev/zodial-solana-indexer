# zodial-solana

A HyperIndex demo indexer for [Zodial](https://www.zodial.xyz) — a portfolio-margin
lending protocol on Solana (a marginfi-derived design, with Drift/Kamino/Juplend/Solend
bank integrations bolted on).

Program: `zod11Jzp72T6qBbGVJfR38y1pGY3dBK8nSuouD4mMkZ` — resolved from
`app.zodial.xyz`'s frontend bundle, confirmed as a live upgradeable BPF program via
`getAccountInfo`. The Anchor IDL was pulled directly from its on-chain IDL account
(no source repo needed).

## Entities

- **Group** / **MarginfiAccount** / **Bank** — the object graph (18 banks live per
  the Zodial dashboard).
- **Deposit** / **Withdraw** / **Borrow** / **Repay** — the core lending flow.
- **Liquidation** / **LiquidationLifecycleEvent** — instant liquidations plus the
  start/end deleverage-liquidation guard rail.
- **LendingStats** (`id: "global"`) — a rolling summary of all of the above for a
  one-query demo view.

## Quick start

```bash
pnpm install
pnpm codegen
pnpm dev      # local indexing against HyperSync
```

## Notes

- `ecosystem: svm` — Solana has no event logs for the indexer to key off, so every
  entity here is built from `onInstruction`, decoded against the on-chain Anchor IDL.
- `start_block: 417500000` is set just before the program's first-ever transaction
  (slot 417,548,472, 2026-05-04), found by paginating `getSignaturesForAddress`
  backwards to genesis (~3,280 total txs as of 2026-09-07).
- Covers 13 of the program's 121 instructions — the ones that produce a demoable
  activity feed. Skipped: interest accrual/pulse/keeper bookkeeping, the
  Drift/Kamino/Juplend/Solend external-bank integration instructions, LP-witness
  cache internals, and admin/fee-transfer plumbing.
