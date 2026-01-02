const CLEANING_PRICES = {
  VESTIDO: 10.0,
  TRAJE: 15.0,
};

export const calculateCleaningTotal = (
  items: Array<{ item_name: string; quantity: number }>
) => {
  return items.reduce((total, item) => {
    const pricePerItem =
      CLEANING_PRICES[item.item_name as keyof typeof CLEANING_PRICES] || 10.0; // Default price
    return total + pricePerItem * item.quantity;
  }, 0);
};
