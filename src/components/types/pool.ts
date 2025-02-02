// Define the pool interface
export interface Pool {
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  depositToken: string;
  volume24h: string;
  logoUrl?: string; // Optional logo URL
}
