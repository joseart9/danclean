const PRICE_PER_ITEM = 14;
const DISCOUNT_EVERY = 12;
// Each group of 12 items costs 140 instead of 168 (discount of 28)
const GROUP_PRICE = 140;

export const calculateIroningTotal = (quantity: number): number => {
  if (quantity <= 0) return 0;

  // Calculate how many complete groups of 12 items
  const completeGroups = Math.floor(quantity / DISCOUNT_EVERY);

  // Calculate the remainder items after complete groups (0-11)
  const remainder = quantity % DISCOUNT_EVERY;

  // Each complete group of 12 items costs 140 (discounted from 168)
  const groupsTotal = completeGroups * GROUP_PRICE;

  // Remainder items (1-11) cost 14 each
  const remainderTotal = remainder * PRICE_PER_ITEM;

  return groupsTotal + remainderTotal;
};
