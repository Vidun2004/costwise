import type { Transaction } from "./transactions";

export function spentByCategory(txs: Transaction[]) {
  const map = new Map<string, number>();

  for (const t of txs) {
    if (t.type !== "expense") continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }

  return map;
}

export function totalIncomeExpense(txs: Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense };
}
