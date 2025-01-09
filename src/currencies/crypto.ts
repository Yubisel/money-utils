import { CurrencyConfig } from "../types/currency";
import { SYMBOL_POSITION } from "../constants/symbols";

export const BTC_CONFIG: CurrencyConfig = {
  name: "Bitcoin",
  code: "BTC",
  symbol: "₿",
  symbolPosition: SYMBOL_POSITION.PREFIX,
  decimalSeparator: ".",
  decimals: 8,
  minorUnits: "100000000",
  thousandsSeparator: ",",
  isCrypto: true,
} as const;

export const ETH_CONFIG: CurrencyConfig = {
  name: "Ethereum",
  code: "ETH",
  symbol: "Ξ",
  symbolPosition: SYMBOL_POSITION.PREFIX,
  decimalSeparator: ".",
  decimals: 18,
  minorUnits: "1000000000000000000",
  thousandsSeparator: ",",
  isCrypto: true,
} as const;
