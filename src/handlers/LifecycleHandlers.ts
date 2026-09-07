/*
 * Zodial group/account/bank creation — the marginfi-derived object graph
 * that every deposit/borrow/liquidation later hangs off of.
 */
import { indexer, type LendingStats } from "envio";

const STATS_ID = "global";
const FIELDS = { instruction: ["args", "accounts"], transaction: ["signature"] } as const;

async function bumpStats(
  context: { LendingStats: { get: (id: string) => Promise<LendingStats | undefined>; set: (e: LendingStats) => void } },
  patch: Partial<Omit<LendingStats, "id">>,
) {
  const prev = await context.LendingStats.get(STATS_ID);
  const base: LendingStats = prev ?? {
    id: STATS_ID,
    groupsCreated: 0,
    accountsCreated: 0,
    banksCreated: 0,
    deposits: 0,
    withdrawals: 0,
    borrows: 0,
    repays: 0,
    liquidations: 0,
    liquidationsStarted: 0,
    liquidationsEnded: 0,
    totalDepositVolume: 0n,
    totalWithdrawVolume: 0n,
    totalBorrowVolume: 0n,
    totalRepayVolume: 0n,
  };
  context.LendingStats.set({
    ...base,
    groupsCreated: base.groupsCreated + (patch.groupsCreated ?? 0),
    accountsCreated: base.accountsCreated + (patch.accountsCreated ?? 0),
    banksCreated: base.banksCreated + (patch.banksCreated ?? 0),
    deposits: base.deposits + (patch.deposits ?? 0),
    withdrawals: base.withdrawals + (patch.withdrawals ?? 0),
    borrows: base.borrows + (patch.borrows ?? 0),
    repays: base.repays + (patch.repays ?? 0),
    liquidations: base.liquidations + (patch.liquidations ?? 0),
    liquidationsStarted: base.liquidationsStarted + (patch.liquidationsStarted ?? 0),
    liquidationsEnded: base.liquidationsEnded + (patch.liquidationsEnded ?? 0),
    totalDepositVolume: base.totalDepositVolume + (patch.totalDepositVolume ?? 0n),
    totalWithdrawVolume: base.totalWithdrawVolume + (patch.totalWithdrawVolume ?? 0n),
    totalBorrowVolume: base.totalBorrowVolume + (patch.totalBorrowVolume ?? 0n),
    totalRepayVolume: base.totalRepayVolume + (patch.totalRepayVolume ?? 0n),
  });
}

indexer.onInstruction(
  { program: "Zodial", instruction: "marginfi_group_initialize", fields: FIELDS },
  async ({ instruction, context }) => {
    const { accounts, transaction, block } = instruction;
    context.Group.set({
      id: accounts.marginfi_group.address,
      admin: accounts.admin.address,
      createdTxSig: transaction.signature,
      createdSlot: block.slot,
    });
    await bumpStats(context, { groupsCreated: 1 });
  },
);

indexer.onInstruction(
  { program: "Zodial", instruction: "marginfi_account_initialize", fields: FIELDS },
  async ({ instruction, context }) => {
    const { accounts, transaction, block } = instruction;
    context.MarginfiAccount.set({
      id: accounts.marginfi_account.address,
      group: accounts.marginfi_group.address,
      authority: accounts.authority.address,
      accountIndex: undefined,
      createdTxSig: transaction.signature,
      createdSlot: block.slot,
    });
    await bumpStats(context, { accountsCreated: 1 });
  },
);

indexer.onInstruction(
  { program: "Zodial", instruction: "marginfi_account_initialize_pda", fields: FIELDS },
  async ({ instruction, context }) => {
    const { args, accounts, transaction, block } = instruction;
    context.MarginfiAccount.set({
      id: accounts.marginfi_account.address,
      group: accounts.marginfi_group.address,
      authority: accounts.authority.address,
      accountIndex: args.account_index,
      createdTxSig: transaction.signature,
      createdSlot: block.slot,
    });
    await bumpStats(context, { accountsCreated: 1 });
  },
);

function bankHandler(kind: "standard" | "with_seed" | "permissionless") {
  return async ({ instruction, context }: any) => {
    const { accounts, transaction, block } = instruction;
    context.Bank.set({
      id: accounts.bank.address,
      group: accounts.marginfi_group.address,
      mint: accounts.bank_mint.address,
      admin: (accounts.admin ?? accounts.fee_payer).address,
      kind,
      addedTxSig: transaction.signature,
      addedSlot: block.slot,
    });
    await bumpStats(context, { banksCreated: 1 });
  };
}

indexer.onInstruction(
  { program: "Zodial", instruction: "lending_pool_add_bank", fields: FIELDS },
  bankHandler("standard"),
);

indexer.onInstruction(
  { program: "Zodial", instruction: "lending_pool_add_bank_with_seed", fields: FIELDS },
  bankHandler("with_seed"),
);

indexer.onInstruction(
  { program: "Zodial", instruction: "lending_pool_add_bank_permissionless", fields: FIELDS },
  bankHandler("permissionless"),
);

export { bumpStats, STATS_ID };
