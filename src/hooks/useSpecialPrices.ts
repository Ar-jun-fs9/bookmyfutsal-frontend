import { useQuery } from '@tanstack/react-query';

export interface SpecialPrice {
  special_price_id: number;
  futsal_id: number;
  special_date: string;
  special_price: number;
  message?: string;
  created_at: string;
  updated_at: string;
}

export const useSpecialPrices = (futsalId?: number) => {
  return useQuery({
    queryKey: ['special-prices', futsalId],
    queryFn: async () => {
      if (!futsalId) return [];
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/futsal/${futsalId}`);
      if (!response.ok) throw new Error('Failed to fetch special prices');
      return response.json() as Promise<SpecialPrice[]>;
    },
    enabled: !!futsalId,
  });
};