import { menuItems } from './data.mjs';

let wallet = { points: 1250, tier: 'Gold', nextRewardAt: 1500 };
let orderHistory = [];

export const getWallet = () => wallet;
export const getOrders = () => orderHistory;

export function placeOrder(input) {
  const subtotal = input.items.reduce((sum, line) => {
    const product = menuItems.find((m) => m.id === line.id);
    return product ? sum + product.priceKwd * line.qty : sum;
  }, 0);

  const id = `ARK-${2000 + orderHistory.length}`;
  const pointsEarned = input.payWithPoints ? 0 : Math.floor(subtotal * 10);
  wallet = { ...wallet, points: Math.max(0, wallet.points - (input.payWithPoints ? 200 : 0)) + pointsEarned };

  const order = { id, total: Number((subtotal * 1.05).toFixed(2)), status: 'preparing', createdAt: new Date().toISOString() };
  orderHistory = [order, ...orderHistory];
  return { order, etaMinutes: '8-12', pointsEarned };
}
