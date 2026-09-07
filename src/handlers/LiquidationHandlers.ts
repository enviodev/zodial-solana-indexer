/*
 * Zodial's risk-engine flow: instant liquidations plus the start/end
 * deleverage-liquidation lifecycle that guards unhealthy accounts.
 */
import { indexer } from "envio";
import { bumpStats } from "./LifecycleHandlers.js";

const FIELDS = { instruction: ["args", "accounts"], transaction: ["signature"] } as const;

indexer.onInstruction(
  { program: "Zodial", instruction: "lending_account_liquidate", fields: FIELDS },
  async ({ instruction, context }) => {
    const { args, accounts, transaction, block } = instruction;
    const txSig = transaction.signature;
    context.Liquidation.set({
      id: txSig,
      group: accounts.group.address,
      assetBank: accounts.asset_bank.address,
      liabBank: accounts.liab_bank.address,
      liquidatorAccount: accounts.liquidator_marginfi_account.address,
      liquidateeAccount: accounts.liquidatee_marginfi_account.address,
      authority: accounts.authority.address,
      assetAmount: BigInt(args.asset_amount),
      slot: block.slot,
      txSig,
    });
    await bumpStats(context, { liquidations: 1 });
  },
);

indexer.onInstruction(
  { program: "Zodial", instruction: "start_liquidation", fields: FIELDS },
  async ({ instruction, context }) => {
    const { accounts, transaction, block } = instruction;
    const txSig = transaction.signature;
    context.LiquidationLifecycleEvent.set({
      id: txSig,
      kind: "start",
      marginfiAccount: accounts.marginfi_account.address,
      liquidationRecord: accounts.liquidation_record.address,
      slot: block.slot,
      txSig,
    });
    await bumpStats(context, { liquidationsStarted: 1 });
  },
);

indexer.onInstruction(
  { program: "Zodial", instruction: "end_liquidation", fields: FIELDS },
  async ({ instruction, context }) => {
    const { accounts, transaction, block } = instruction;
    const txSig = transaction.signature;
    context.LiquidationLifecycleEvent.set({
      id: txSig,
      kind: "end",
      marginfiAccount: accounts.marginfi_account.address,
      liquidationRecord: accounts.liquidation_record.address,
      slot: block.slot,
      txSig,
    });
    await bumpStats(context, { liquidationsEnded: 1 });
  },
);
