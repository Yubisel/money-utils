# @thesmilingsloth/money-utils

A robust, type-safe money handling utility for JavaScript/TypeScript applications with support for both fiat and cryptocurrency operations.

[![npm version](https://badge.fury.io/js/@thesmilingsloth%2Fmoney-utils.svg)](https://badge.fury.io/js/@thesmilingsloth%2Fmoney-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Money Class](#money-class)
  - [Currency Management](#currency-management)
- [Advanced Usage](#advanced-usage)
  - [Custom Currencies](#custom-currencies)
  - [Rounding Modes](#rounding-modes)
  - [Allocation](#allocation)
  - [Formatting](#formatting)
  - [Comparison Operations](#comparison-operations)
  - [Value Extraction](#value-extraction)
  - [Serialization](#serialization)
- [API Documentation](#api-documentation)
  - [Money Class API](#money-class-api)
  - [Currency Class API](#currency-class-api)
  - [Types](#types)
  - [Constants](#constants)
- [Contributing](#contributing)
- [Testing](#testing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

- 🎯 **Type-safe**: Written in TypeScript with comprehensive type definitions
- 💰 **Precise calculations**: Uses [decimal.js](https://github.com/MikeMcl/decimal.js/) for accurate decimal arithmetic
- 🌍 **Internationalization**: Built-in support for formatting and localization
- 🔄 **Currency conversion**: Support for both fiat and cryptocurrencies
- 🛡️ **Immutable operations**: All operations return new instances
- 🎨 **Customizable**: Configurable decimal places, rounding modes, and formatting options
- 🌲 **Tree-shakeable**: Import only what you need
- 0️⃣ **Zero dependencies**: Includes decimal.js as its only dependency

## Installation

```bash
# Using npm
npm install @thesmilingsloth/money-utils

# Using yarn
yarn add @thesmilingsloth/money-utils

# Using pnpm
pnpm add @thesmilingsloth/money-utils
```

> **Note**: `decimal.js` is included as a dependency and will be automatically installed. No need to install it separately.

## Quick Start

```typescript
import { Money, Currency } from "@thesmilingsloth/money-utils";

// Create a new money instance
const price = new Money("99.99", "USD");

// Basic arithmetic operations
const tax = price.multiply(0.2); // 20% tax
const total = price.add(tax);

// Format with symbol
console.log(total.toString()); // "$119.99"

// Locale-aware formatting
console.log(total.toLocaleString("de-DE")); // "119,99 $"
```

## Core Concepts

### Money Class

The `Money` class is the core of this library. It provides:

- Immutable arithmetic operations (add, subtract, multiply, divide)
- Comparison methods
- Formatting options
- Allocation functionality
- Rounding controls

```typescript
// Creating money instances
const amount = new Money("100.50", "USD");
const zero = Money.zero("USD");

// Arithmetic
const sum = amount.add(new Money("50.25", "USD"));
const product = amount.multiply(2);

// Comparisons
const isGreater = amount.greaterThan(zero);
const isEqual = amount.equals(new Money("100.50", "USD"));

// Formatting
console.log(amount.toString()); // "$100.50"
console.log(amount.toLocaleString("ja-JP")); // "￥100.50"
```

### Currency Management

The `Currency` class manages currency configurations through a singleton registry:

```typescript
// Access built-in currencies
const usd = Currency.USD;
const btc = Currency.BTC;

// Get all registered currencies
const allCurrencies = Currency.currencies;

// Get a specific currency
const eur = Currency.getCurrency("EUR");
```

## Advanced Usage

### Custom Currencies

Register and use custom currencies, including cryptocurrencies and tokens:

```typescript
// Register a custom cryptocurrency
Currency.register({
  name: "Custom Token",
  code: "CTK",
  symbol: "⚡",
  symbolPosition: "prefix",
  decimalSeparator: ".",
  decimals: 6,
  minorUnits: "1000000",
  thousandsSeparator: ",",
  isCrypto: true,
});

// Use the custom currency
const tokenAmount = new Money("1000.123456", "CTK");
console.log(tokenAmount.toString()); // "⚡1,000.123456"

// Register multiple currencies at once
Currency.register([
  {
    name: "Gold Token",
    code: "GLD",
    symbol: "🔶",
    symbolPosition: "prefix",
    decimals: 8,
    minorUnits: "100000000",
    decimalSeparator: ".",
    thousandsSeparator: ",",
    isCrypto: true,
  },
  {
    name: "Silver Token",
    code: "SLV",
    symbol: "🔷",
    symbolPosition: "suffix",
    decimals: 4,
    minorUnits: "10000",
    decimalSeparator: ".",
    thousandsSeparator: ",",
    isCrypto: true,
  },
]);

// Initialize with specific currencies only
Currency.initialize([Currency.USD, Currency.EUR, customToken]);
```

### Rounding Modes

Control decimal precision and rounding behavior:

```typescript
import { Money, ROUNDING_MODE } from "@thesmilingsloth/money-utils";

// Create with specific rounding mode
const amount = new Money("100.555", "USD", {
  roundingMode: ROUNDING_MODE.ROUND_HALF_UP,
  decimals: 2,
});

// Different rounding modes
const roundUp = new Money("100.555", "USD", {
  roundingMode: ROUNDING_MODE.ROUND_UP,
});
const roundDown = new Money("100.555", "USD", {
  roundingMode: ROUNDING_MODE.ROUND_DOWN,
});

// Round to specific decimals
const rounded = amount.round(2); // Rounds to 2 decimal places
```

### Allocation

Split money into parts while handling remainders:

```typescript
// Split amount equally
const amount = new Money("100", "USD");
const equalShares = amount.allocate([1, 1, 1]); // [33.34, 33.33, 33.33]

// Split by ratios
const total = new Money("100", "USD");
const shares = total.allocate([2, 3, 5]); // Split in ratio 2:3:5
// shares[0] = $20.00
// shares[1] = $30.00
// shares[2] = $50.00

// Handle remainders automatically
const oddAmount = new Money("100.01", "USD");
const threeWaySplit = oddAmount.allocate([1, 1, 1]);
// Remainder is added to first share
```

### Formatting

Flexible formatting options:

```typescript
const amount = new Money("1234567.89", "USD");

// Basic formatting
console.log(amount.toString()); // "$1,234,567.89"
console.log(amount.formattedValue()); // "1,234,567.89"
console.log(amount.formattedValueWithSymbol()); // "$1,234,567.89"

// Localized formatting
console.log(amount.toLocaleString("en-US")); // "$1,234,567.89"
console.log(amount.toLocaleString("de-DE")); // "1.234.567,89 $"
console.log(amount.toLocaleString("ja-JP")); // "￥1,234,567.89"

// Custom format options
console.log(
  amount.toLocaleString("en-US", {
    style: "currency",
    currencyDisplay: "name",
  })
); // "1,234,567.89 US dollars"

// Cryptocurrency formatting
const btc = new Money("1.23456789", "BTC");
console.log(btc.toString()); // "₿1.23456789"
```

### Comparison Operations

Compare money instances:

```typescript
const amount1 = new Money("100.00", "USD");
const amount2 = new Money("200.00", "USD");

// Simple comparisons
const isEqual = amount1.equals(amount2); // false
const isGreater = amount1.greaterThan(amount2); // false
const isLess = amount1.lessThan(amount2); // true

// Combined comparison
const comparison = amount1.compare(amount2);
console.log(comparison); // { equal: false, greaterThan: false, lessThan: true }

// Value checks
const isZero = amount1.isZero(); // false
const isPositive = amount1.isPositive(); // true
const isNegative = amount1.isNegative(); // false
```

### Value Extraction

Access the underlying values:

```typescript
const amount = new Money("1234.56", "USD");

// Get raw values
console.log(amount.value()); // "1234.56"
console.log(amount.absoluteValue()); // "1234.56"
console.log(amount.negatedValue()); // "-1234.56"

// Get formatted values
console.log(amount.formattedValue()); // "1,234.56"
console.log(amount.formattedValueWithSymbol()); // "$1,234.56"
```

### Serialization

Convert to and from JSON:

```typescript
const amount = new Money("1234.56", "USD");

// Convert to JSON
const json = amount.toJSON();
console.log(json);
// {
//   currency: "USD",
//   symbol: "$",
//   decimals: 2,
//   displayDecimals: 2,
//   value: "1234.56",
//   prettyValue: "$1,234.56",
//   negative: false
// }

// Use in JSON.stringify()
const jsonString = JSON.stringify({ price: amount });
```

## API Documentation

### Money Class API

#### Constructor

```typescript
constructor(value: string | number, currency: string, options?: MoneyOptions)
```

Creates a new Money instance.

**Parameters:**

- `value`: The monetary value (string or number)
- `currency`: Currency code (e.g., "USD", "EUR")
- `options`: Optional configuration object
  ```typescript
  interface MoneyOptions {
    symbol?: string; // Custom currency symbol
    decimals?: number; // Decimal places for calculations
    displayDecimals?: number; // Decimal places for display
    roundingMode?: RoundingMode; // Rounding mode for calculations
  }
  ```

#### Static Methods

```typescript
static zero(currency: string, options?: MoneyOptions): Money
```

Creates a zero-value Money instance.

```typescript
static from(value: string | number, currency: string, options?: MoneyOptions): Money
```

Alternative constructor method.

#### Arithmetic Methods

```typescript
add(other: Money): Money              // Add two Money instances
subtract(other: Money): Money         // Subtract Money instances
multiply(factor: number): Money       // Multiply by a number
divide(divisor: number): Money        // Divide by a number
allocate(ratios: number[]): Money[]   // Split into proportional parts
```

#### Comparison Methods

```typescript
equals(other: Money): boolean
greaterThan(other: Money): boolean
lessThan(other: Money): boolean
greaterThanOrEqual(other: Money): boolean
lessThanOrEqual(other: Money): boolean
compare(other: Money): MoneyComparisonResult
```

#### Value Methods

```typescript
value(): string                       // Raw value as string
absoluteValue(): string              // Absolute value
negatedValue(): string               // Negated value
isZero(): boolean                    // Check if zero
isPositive(): boolean                // Check if positive
isNegative(): boolean                // Check if negative
```

#### Formatting Methods

```typescript
toString(): string                   // Format with symbol
formattedValue(): string            // Format without symbol
formattedValueWithSymbol(): string  // Format with symbol
toLocaleString(locale?: string, options?: Intl.NumberFormatOptions): string
```

### Currency Class API

#### Static Methods

```typescript
static register(currency: CurrencyConfig | CurrencyConfig[]): CurrencyConfig | CurrencyConfig[]
```

Register new currency configurations.

```typescript
static unregister(currency: CurrencyConfig | CurrencyConfig[]): void
```

Remove currency configurations.

```typescript
static getCurrency(code: string): CurrencyConfig | undefined
```

Get currency configuration by code.

```typescript
static initialize(currencies?: CurrencyConfig[]): void
```

Initialize currency registry.

#### Static Properties

```typescript
static readonly USD: CurrencyConfig  // US Dollar configuration
static readonly EUR: CurrencyConfig  // Euro configuration
static readonly GBP: CurrencyConfig  // British Pound configuration
static readonly JPY: CurrencyConfig  // Japanese Yen configuration
static readonly BTC: CurrencyConfig  // Bitcoin configuration
static readonly ETH: CurrencyConfig  // Ethereum configuration
```

### Types

#### CurrencyConfig

```typescript
interface CurrencyConfig {
  name: string; // Full currency name
  code: string; // Currency code
  symbol: string; // Currency symbol
  symbolPosition: string; // 'prefix' or 'suffix'
  decimalSeparator: string; // Decimal point character
  decimals: number; // Number of decimal places
  minorUnits: string; // Minor units in main unit
  thousandsSeparator: string; // Thousands separator
  isCrypto?: boolean; // Is cryptocurrency
}
```

#### MoneyComparisonResult

```typescript
interface MoneyComparisonResult {
  equal: boolean;
  greaterThan: boolean;
  lessThan: boolean;
}
```

### Constants

#### ROUNDING_MODE

```typescript
const ROUNDING_MODE = {
  ROUND_UP: 0, // Round away from zero
  ROUND_DOWN: 1, // Round toward zero
  ROUND_CEIL: 2, // Round toward +Infinity
  ROUND_FLOOR: 3, // Round toward -Infinity
  ROUND_HALF_UP: 4, // Round half away from zero
  ROUND_HALF_DOWN: 5, // Round half toward zero
  ROUND_HALF_EVEN: 6, // Round half to even
  ROUND_HALF_CEIL: 7, // Round half toward +Infinity
  ROUND_HALF_FLOOR: 8, // Round half toward -Infinity
} as const;
```

#### SYMBOL_POSITION

```typescript
const SYMBOL_POSITION = {
  PREFIX: "prefix", // Symbol before amount
  SUFFIX: "suffix", // Symbol after amount
} as const;
```

For more detailed API documentation and examples, visit our [TypeDoc Documentation](https://github.com/yourusername/money-utils/docs).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## License

MIT © [Smiling Sloth](https://github.com/thesmilingsloth)

## Acknowledgments

- [decimal.js](https://github.com/MikeMcl/decimal.js/) for precise decimal arithmetic
- Inspired by various money handling libraries in the JavaScript ecosystem
