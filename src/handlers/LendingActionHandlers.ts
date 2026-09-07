/*
 * Zodial's core user-facing lending flow: deposit, withdraw, borrow, repay.
 */
import { indexer } from "envio";
import { bumpStats } from "./LifecycleHandlers.js";

const FIELDS = { instruction: ["args", "accounts"], transaction: ["signature"] } as const;

indexer.onInstruction(
  { program: "Zodial", instruction: "lending_account_deposit", fields: FIELDS },
  async ({ instruction, context }) => {
    const { args, accounts, transaction, block } = instruction;
    const txSig = transaction.signature;
    const amount = BigInt(args.amount);
    context.Deposit.set({
      id: txSig,
      account: accounts.marginfi_account.address,
      bank: accounts.bank.address,
      authority: accounts.authority.address,
      amount,
      depositUpToLimit: args.deposit_up_to_limit ?? undefined,
      slot: block.slot,
      txSig,
    });
    await bumpStats(context, { deposits: 1, totalDepositVolume: amount });
  },
);

indexer.onInstruction(
  { program: "Zodial", instruction: "lending_account_withdraw", fields: FIELDS },
  async ({ instruction, context }) => {
    const { args, accounts, transaction, block } = instruction;
    const txSig = transaction.signature;
    const amount = BigInt(args.amount);
    context.Withdraw.set({
      id: txSig,
      account: accounts.marginfi_account.address,
      bank: accounts.bank.address,
      authority: accounts.authority.address,
      amount,
      withdrawAll: args.withdraw_all ?? undefined,
      slot: block.slot,
      txSig,
    });
    await bumpStats(context, { withdrawals: 1, totalWithdrawVolume: amount });
  },
);

indexer.onInstruction(
  { program: "Zodial", instruction: "lending_account_borrow", fields: FIELDS },
  async ({ instruction, context }) => {
    const { args, accounts, transaction, block } = instruction;
    const txSig = transaction.signature;
    const amount = BigInt(args.amount);
    context.Borrow.set({
      id: txSig,
      account: accounts.marginfi_account.address,
      bank: accounts.bank.address,
      authority: accounts.authority.address,
      amount,
      slot: block.slot,
      txSig,
    });
    await bumpStats(context, { borrows: 1, totalBorrowVolume: amount });
  },
);

indexer.onInstruction(
  { program: "Zodial", instruction: "lending_account_repay", fields: FIELDS },
  async ({ instruction, context }) => {
    const { args, accounts, transaction, block } = instruction;
    const txSig = transaction.signature;
    const amount = BigInt(args.amount);
    context.Repay.set({
      id: txSig,
      account: accounts.marginfi_account.address,
      bank: accounts.bank.address,
      authority: accounts.authority.address,
      amount,
      repayAll: args.repay_all ?? undefined,
      slot: block.slot,
      txSig,
    });
    await bumpStats(context, { repays: 1, totalRepayVolume: amount });
  },
);
