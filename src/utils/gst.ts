export const getGstBreakdown = (priceWithGst: number, category: string, quantity: number = 1, customGstRate?: number | null) => {
  const gstRate = customGstRate != null ? (customGstRate / 100) : (category === 'Mulch Film' ? 0.18 : 0.05);
  const basePrice = priceWithGst / (1 + gstRate);
  const gstAmount = priceWithGst - basePrice;
  return {
    basePrice: Number((basePrice * quantity).toFixed(2)),
    gstAmount: Number((gstAmount * quantity).toFixed(2)),
    gstRate: gstRate * 100,
    finalPrice: Number((priceWithGst * quantity).toFixed(2))
  };
};
