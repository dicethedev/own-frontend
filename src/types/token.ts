export interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  logo: string;
  decimals: number;
  type: TokenType;
}

export type TokenType = "RWA" | "STABLECOIN" | "OTHER";
