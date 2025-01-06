import Decimal from "decimal.js";
import { CurrencyConfig } from "../types/currency";
import { Currency } from "./Currency";
import {
  MoneyComparisonResult,
  MoneyObject,
  MoneyOptions,
  RoundingMode,
} from "../types/money";
import { DEFAULT_DECIMAL_PLACES, SYMBOL_POSITION } from "../constants/symbols";
import { ROUNDING_MODE } from "../constants/money";
import { MoneyError, ERROR_MESSAGES } from "../errors/MoneyErrors";

/**
 * Represents a monetary value with a specific currency.
 * This class provides immutable operations for handling money with precision and type safety.
 *
 * @example
 * ```typescript
 * const price = new Money('99.99', 'USD');
 * const tax = price.multiply(0.2); // 20% tax
 * const total = price.add(tax);
 * console.log(total.toString()); // "$119.99"
 * ```
 */
export class Money {
  private amount: Decimal;
  private currencyConfig: CurrencyConfig;
  private symbol: string;
  private decimals: number;
  private displayDecimals: number;
  private negative: boolean;
  private roundingMode: RoundingMode;

  /**
   * Creates a new Money instance.
   *
   * @param value - The monetary value as a string or number
   * @param currency - The currency code (e.g., 'USD', 'EUR')
   * @param options - Optional configuration for the money instance
   * @throws {MoneyError} If the value is invalid or currency is not found
   *
   * @example
   * ```typescript
   * const money = new Money('100.50', 'USD', { decimals: 2 });
   * ```
   */
  constructor(
    value: string | number,
    currency: string,
    options?: MoneyOptions
  ) {
    this.validateAmount(value);

    this.currencyConfig = this.getCurrencyConfig(currency);
    this.amount = new Decimal(value);
    this.negative = this.amount.lt(0);

    this.symbol = options?.symbol ?? this.currencyConfig.symbol;
    this.decimals =
      options?.decimals ??
      this.currencyConfig.decimals ??
      DEFAULT_DECIMAL_PLACES;
    this.displayDecimals =
      options?.displayDecimals ??
      this.currencyConfig.decimals ??
      DEFAULT_DECIMAL_PLACES;
    this.roundingMode = options?.roundingMode ?? ROUNDING_MODE.ROUND_HALF_EVEN;
  }

  /**
   * Creates a zero value Money instance for the specified currency.
   *
   * @param currency - The currency code
   * @param options - Optional configuration for the money instance
   * @returns A new Money instance with zero value
   *
   * @example
   * ```typescript
   * const zero = Money.zero('USD');
   * ```
   */
  static zero(currency: string, options?: MoneyOptions): Money {
    return new Money("0", currency, options);
  }

  /**
   * Creates a new Money instance from a value and currency.
   *
   * @param value - The monetary value
   * @param currency - The currency code
   * @param options - Optional configuration for the money instance
   * @returns A new Money instance
   */
  static from(
    value: string | number,
    currency: string,
    options?: MoneyOptions
  ): Money {
    return new Money(value, currency, options);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currencyConfig.code !== other.currencyConfig.code) {
      throw new Error(
        `Money: Cannot operate on different currencies(current: "${this.currencyConfig.code}", other: "${other.currencyConfig.code}")`
      );
    }
  }

  private getCurrencyConfig(code: string): CurrencyConfig {
    const currencyConfig = Currency.getCurrency(code);

    if (!currencyConfig) {
      throw new Error(
        `Money: Currency config for ${code} not found. Config can be registered with "Currency.register(<CurrencyConfig>)"`
      );
    }

    return currencyConfig;
  }

  /**
   * Adds another Money instance to this one.
   * Both instances must be of the same currency.
   *
   * @param other - The Money instance to add
   * @returns A new Money instance with the sum
   * @throws {Error} If currencies don't match
   *
   * @example
   * ```typescript
   * const sum = money1.add(money2);
   * ```
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);

    return this.cloneWithNewAmount(this.amount.plus(other.amount));
  }

  /**
   * Subtracts another Money instance from this one.
   * Both instances must be of the same currency.
   *
   * @param other - The Money instance to subtract
   * @returns A new Money instance with the difference
   * @throws {Error} If currencies don't match
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);

    return this.cloneWithNewAmount(this.amount.minus(other.amount));
  }

  /**
   * Multiplies the monetary value by a factor.
   *
   * @param factor - The multiplication factor
   * @returns A new Money instance with the product
   *
   * @example
   * ```typescript
   * const doubled = money.multiply(2);
   * ```
   */
  multiply(factor: number): Money {
    return this.cloneWithNewAmount(this.amount.times(factor));
  }

  /**
   * Divides the monetary value by a divisor.
   *
   * @param divisor - The number to divide by
   * @returns A new Money instance with the quotient
   * @throws {MoneyError} If divisor is zero
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new MoneyError(ERROR_MESSAGES.DIVISION_BY_ZERO);
    }

    return this.cloneWithNewAmount(this.amount.dividedBy(divisor));
  }

  /**
   * Allocates the monetary amount according to ratios.
   * Useful for splitting money into parts while handling remainders.
   *
   * @param ratios - Array of ratio values for allocation
   * @returns Array of Money instances representing the allocated amounts
   * @throws {Error} If ratios array is empty
   *
   * @example
   * ```typescript
   * const shares = money.allocate([1, 1, 1]); // Split into three equal parts
   * ```
   */
  allocate(ratios: number[]): Money[] {
    if (ratios.length === 0) {
      throw new Error("Money: Cannot allocate to empty ratios");
    }

    const total = ratios.reduce((sum, ratio) => sum + ratio, 0);

    // Calculate the exact share amounts without rounding
    const exactShares = ratios.map((ratio) =>
      this.amount.times(ratio).dividedBy(total)
    );

    // Calculate the lowest amount each share should receive
    const shareFloors = exactShares.map((share) =>
      share.toDecimalPlaces(this.decimals, Decimal.ROUND_DOWN)
    );

    // Calculate how much is left to distribute
    const remainder = this.amount.minus(
      shareFloors.reduce((sum, share) => sum.plus(share), new Decimal(0))
    );

    // Convert to minor units for remainder distribution
    const remainderInMinorUnits = remainder
      .times(new Decimal(this.currencyConfig.minorUnits))
      .toNumber();

    // Calculate which shares should get an extra minor unit
    const sharesBySize = exactShares
      .map((share, index) => ({
        index,
        mod: share.minus(shareFloors[index]).times(total).toNumber(),
      }))
      .sort((a, b) => b.mod - a.mod);

    // Distribute the remainder
    const result = shareFloors.map(
      (share) =>
        new Money(share.toString(), this.currencyConfig.code, {
          symbol: this.symbol,
          decimals: this.decimals,
          displayDecimals: this.displayDecimals,
          roundingMode: this.roundingMode,
        })
    );

    // Add one minor unit to shares that should get it
    for (let i = 0; i < remainderInMinorUnits; i++) {
      const targetIndex = sharesBySize[i].index;
      const minorUnit = new Decimal(1).dividedBy(
        new Decimal(this.currencyConfig.minorUnits)
      );
      result[targetIndex] = result[targetIndex].add(
        new Money(minorUnit.toString(), this.currencyConfig.code, {
          symbol: this.symbol,
          decimals: this.decimals,
          displayDecimals: this.displayDecimals,
          roundingMode: this.roundingMode,
        })
      );
    }

    return result;
  }

  /**
   * Checks if this Money instance equals another.
   *
   * @param other - The Money instance to compare with
   * @returns true if the instances are equal
   * @throws {Error} If currencies don't match
   */
  equals(other: Money): boolean {
    this.assertSameCurrency(other);

    return this.amount.eq(other.amount);
  }

  /**
   * Checks if this Money instance is greater than another.
   *
   * @param other - The Money instance to compare with
   * @returns true if this instance is greater
   * @throws {Error} If currencies don't match
   */
  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);

    return this.amount.greaterThan(other.amount);
  }

  /**
   * Checks if this Money instance is less than another.
   *
   * @param other - The Money instance to compare with
   * @returns true if this instance is less
   * @throws {Error} If currencies don't match
   */
  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);

    return this.amount.lessThan(other.amount);
  }

  /**
   * Checks if this Money instance is greater than or equal to another.
   *
   * @param other - The Money instance to compare with
   * @returns true if this instance is greater or equal
   * @throws {Error} If currencies don't match
   */
  greaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);

    return this.amount.greaterThanOrEqualTo(other.amount);
  }

  /**
   * Checks if this Money instance is less than or equal to another.
   *
   * @param other - The Money instance to compare with
   * @returns true if this instance is less or equal
   * @throws {Error} If currencies don't match
   */
  lessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);

    return this.amount.lessThanOrEqualTo(other.amount);
  }

  /**
   * Compares this Money instance with another and returns a comparison result object.
   *
   * @param other - The Money instance to compare with
   * @returns Object containing equality and comparison results
   * @throws {Error} If currencies don't match
   */
  compare(other: Money): MoneyComparisonResult {
    this.assertSameCurrency(other);

    return {
      equal: this.equals(other),
      greaterThan: this.greaterThan(other),
      lessThan: this.lessThan(other),
    };
  }

  /**
   * Checks if the monetary value is zero.
   *
   * @returns true if the value is zero
   */
  isZero(): boolean {
    return this.amount.isZero();
  }

  /**
   * Checks if the monetary value is positive.
   *
   * @returns true if the value is positive
   */
  isPositive(): boolean {
    return !this.negative && this.amount.isPositive();
  }

  /**
   * Checks if the monetary value is negative.
   *
   * @returns true if the value is negative
   */
  isNegative(): boolean {
    return this.negative;
  }

  /**
   * Returns the raw string value of the amount.
   *
   * @returns String representation of the monetary value
   */
  value(): string {
    return this.amount.toString();
  }

  /**
   * Returns the absolute value as a string.
   *
   * @returns String representation of the absolute monetary value
   */
  absoluteValue(): string {
    return this.amount.abs().toString();
  }

  /**
   * Returns the negated value as a string.
   *
   * @returns String representation of the negated monetary value
   */
  negatedValue(): string {
    return this.amount.negated().toString();
  }

  /**
   * Returns the formatted value according to the currency configuration.
   *
   * @returns Formatted string representation of the monetary value
   */
  formattedValue(): string {
    // First round to the specified number of decimal places
    const roundedAmount = this.amount.toDecimalPlaces(
      this.displayDecimals,
      this.roundingMode
    );

    // Format with thousand separators and decimal separator
    const parts = roundedAmount.toFixed(this.displayDecimals).split(".");

    // Replace every group of three digits in the integer part with the thousands separator
    const integerPart = parts[0].replace(
      /\B(?=(\d{3})+(?!\d))/g, // Regular expression to find positions for thousands separator
      this.currencyConfig.thousandsSeparator // The thousands separator from the currency configuration
    );
    const decimalPart = parts[1] || "";

    return decimalPart
      ? `${integerPart}${this.currencyConfig.decimalSeparator}${decimalPart}`
      : integerPart;
  }

  /**
   * Returns the formatted value with the currency symbol.
   *
   * @returns Formatted string with currency symbol
   */
  formattedValueWithSymbol(): string {
    if (this.currencyConfig.symbolPosition === SYMBOL_POSITION.PREFIX) {
      return `${this.symbol}${this.formattedValue()}`;
    }

    return `${this.formattedValue()}${this.symbol}`;
  }

  /**
   * Returns a localized string representation using Intl.NumberFormat.
   *
   * @param locale - The locale to use for formatting
   * @param options - Additional Intl.NumberFormat options
   * @returns Localized string representation
   *
   * @example
   * ```typescript
   * money.toLocaleString('de-DE'); // "123,45 €"
   * ```
   */
  toLocaleString(
    locale?: Intl.LocalesArgument,
    options?: Intl.NumberFormatOptions
  ): string {
    if (this.currencyConfig.isCrypto) {
      return this.formattedValueWithSymbol();
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currencyConfig.code,
      ...options,
    }).format(this.amount.toNumber());
  }

  private cloneWithNewAmount(amount: Decimal): Money {
    return new Money(amount.toString(), this.currencyConfig.code, {
      symbol: this.symbol,
      decimals: this.decimals,
      displayDecimals: this.displayDecimals,
      roundingMode: this.roundingMode,
    });
  }

  /**
   * Rounds the monetary value to the specified number of decimal places.
   *
   * @param decimals - Number of decimal places (defaults to instance decimals)
   * @returns A new Money instance with rounded value
   */
  round(decimals?: number): Money {
    const precision = decimals ?? this.decimals;

    return this.cloneWithNewAmount(
      this.amount.toDecimalPlaces(precision, this.roundingMode)
    );
  }

  private validateAmount(value: string | number): void {
    try {
      const decimal = new Decimal(value);

      if (!decimal.isFinite()) {
        throw new MoneyError(ERROR_MESSAGES.INVALID_AMOUNT);
      }
    } catch (error) {
      throw new MoneyError(ERROR_MESSAGES.INVALID_AMOUNT);
    }
  }

  /**
   * Returns a JSON representation of the Money instance.
   *
   * @returns JSON object containing the money details
   */
  toJSON(): MoneyObject {
    return {
      currency: this.currencyConfig.code,
      symbol: this.symbol,
      decimals: this.decimals,
      displayDecimals: this.displayDecimals,
      value: this.value(),
      prettyValue: this.formattedValueWithSymbol(),
      negative: this.negative,
    };
  }

  /**
   * Returns a string representation of the Money instance.
   *
   * @returns Formatted string with currency symbol
   */
  toString(): string {
    return this.formattedValueWithSymbol();
  }
}
