export const calculateCleaningTotal = (
  items: Array<{ item_name: string; quantity: number; price: number }>
) => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};
