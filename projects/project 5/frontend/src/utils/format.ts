export const formatBalance = (balance: number | undefined | null): string => {
  if (typeof balance === "number") {
    return balance.toFixed(2);
  }
  return "0.00";
};

export const formatNumber = (num: number | undefined | null): string => {
  if (typeof num === "number") {
    return num.toLocaleString();
  }
  return "0";
};
