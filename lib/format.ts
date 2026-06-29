export function group(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function money(amount: number) {
  const [whole, decimals] = amount.toFixed(2).split('.');
  return `${group(whole)}.${decimals}`;
}

export function moneyWhole(amount: number) {
  return group(String(Math.round(amount)));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function transferFees(amount: number) {
  const klareFee = round2(amount * 0.005);
  const total = round2(amount + klareFee);
  return { klareFee, total };
}
