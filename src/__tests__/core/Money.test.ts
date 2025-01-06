import { describe, it, expect } from "vitest";
import { Money } from "../../core/Money";
import { ROUNDING_MODE } from "../../constants/money";
import { MoneyError } from "../../errors/MoneyErrors";

describe("Money", () => {
  describe("constructor", () => {
    it("creates a valid Money instance with string value", () => {
      const money = new Money("100.50", "USD");

      expect(money.value()).toBe("100.5");
      expect(money.toString()).toBe("$100.50");
    });

    it("creates a valid Money instance with number value", () => {
      const money = new Money(100.5, "USD");

      expect(money.value()).toBe("100.5");
      expect(money.toString()).toBe("$100.50");
    });

    it("throws error for invalid amount", () => {
      expect(() => new Money("invalid", "USD")).toThrow(MoneyError);
      expect(() => new Money(NaN, "USD")).toThrow(MoneyError);
      expect(() => new Money(Infinity, "USD")).toThrow(MoneyError);
    });

    it("throws error for invalid currency", () => {
      expect(() => new Money("100.50", "INVALID")).toThrow();
    });

    it("respects custom options", () => {
      const money = new Money("100.50", "USD", {
        symbol: "USD",
        decimals: 3,
        displayDecimals: 1,
        roundingMode: ROUNDING_MODE.ROUND_UP,
      });

      expect(money.toString()).toBe("USD100.5");
    });
  });

  describe("static methods", () => {
    it("creates zero value instance", () => {
      const zero = Money.zero("USD");

      expect(zero.isZero()).toBe(true);
      expect(zero.toString()).toBe("$0.00");
    });

    it("creates instance from value", () => {
      const money = Money.from("100.50", "USD");

      expect(money.value()).toBe("100.5");
      expect(money.toString()).toBe("$100.50");
    });
  });

  describe("arithmetic operations", () => {
    const money1 = new Money("100.50", "USD");
    const money2 = new Money("50.25", "USD");
    const diffCurrency = new Money("50.25", "EUR");

    it("adds two Money instances", () => {
      const sum = money1.add(money2);

      expect(sum.value()).toBe("150.75");
    });

    it("subtracts two Money instances", () => {
      const difference = money1.subtract(money2);

      expect(difference.value()).toBe("50.25");
    });

    it("multiplies by a factor", () => {
      const product = money1.multiply(2);

      expect(product.value()).toBe("201");
    });

    it("divides by a divisor", () => {
      const quotient = money1.divide(2);

      expect(quotient.value()).toBe("50.25");
    });

    it("throws error when dividing by zero", () => {
      expect(() => money1.divide(0)).toThrow(MoneyError);
    });

    it("throws error when operating with different currencies", () => {
      expect(() => money1.add(diffCurrency)).toThrow();
      expect(() => money1.subtract(diffCurrency)).toThrow();
    });
  });

  describe("allocation", () => {
    it("allocates money equally", () => {
      const money = new Money("100", "USD");
      const shares = money.allocate([1, 1, 1]);

      expect(shares).toHaveLength(3);
      expect(shares[0].toString()).toBe("$33.34");
      expect(shares[1].toString()).toBe("$33.33");
      expect(shares[2].toString()).toBe("$33.33");

      const total = shares.reduce(
        (sum, share) => sum.add(share),
        Money.zero("USD")
      );
      expect(total.equals(money)).toBe(true);
    });

    it("allocates money by ratio", () => {
      const money = new Money("100", "USD");
      const shares = money.allocate([2, 3, 5]);

      expect(shares[0].toString()).toBe("$20.00");
      expect(shares[1].toString()).toBe("$30.00");
      expect(shares[2].toString()).toBe("$50.00");

      const total = shares.reduce(
        (sum, share) => sum.add(share),
        Money.zero("USD")
      );
      expect(total.equals(money)).toBe(true);
    });

    it("handles remainders correctly", () => {
      const money = new Money("100.01", "USD");
      const shares = money.allocate([1, 1, 1]);

      expect(shares[0].toString()).toBe("$33.34");
      expect(shares[1].toString()).toBe("$33.34");
      expect(shares[2].toString()).toBe("$33.33");

      const total = shares.reduce(
        (sum, share) => sum.add(share),
        Money.zero("USD")
      );
      expect(total.equals(money)).toBe(true);
    });

    it("handles various remainder cases", () => {
      // Case 1: Amount that divides evenly
      const money1 = new Money("100.00", "USD");
      const shares1 = money1.allocate([1, 1, 1]);
      expect(shares1.map((s) => s.toString())).toEqual([
        "$33.34",
        "$33.33",
        "$33.33",
      ]);

      // Case 2: One cent remainder
      const money2 = new Money("100.01", "USD");
      const shares2 = money2.allocate([1, 1, 1]);
      expect(shares2.map((s) => s.toString())).toEqual([
        "$33.34",
        "$33.34",
        "$33.33",
      ]);

      // Case 3: Two cents remainder
      const money3 = new Money("100.02", "USD");
      const shares3 = money3.allocate([1, 1, 1]);
      expect(shares3.map((s) => s.toString())).toEqual([
        "$33.34",
        "$33.34",
        "$33.34",
      ]);

      // Case 4: Uneven ratios with remainder
      const money4 = new Money("100.01", "USD");
      const shares4 = money4.allocate([1, 2, 1]);
      expect(shares4.map((s) => s.toString())).toEqual([
        "$25.00",
        "$50.01",
        "$25.00",
      ]);

      // Verify all totals
      [
        { money: money1, shares: shares1 },
        { money: money2, shares: shares2 },
        { money: money3, shares: shares3 },
        { money: money4, shares: shares4 },
      ].forEach(({ money, shares }) => {
        const total = shares.reduce(
          (sum, share) => sum.add(share),
          Money.zero("USD")
        );
        expect(total.equals(money)).toBe(true);
      });
    });

    it("throws error for empty ratios", () => {
      const money = new Money("100", "USD");
      expect(() => money.allocate([])).toThrow();
    });
  });

  describe("comparison operations", () => {
    const money1 = new Money("100.50", "USD");
    const money2 = new Money("50.25", "USD");
    const equal = new Money("100.50", "USD");

    it("compares equality", () => {
      expect(money1.equals(equal)).toBe(true);
      expect(money1.equals(money2)).toBe(false);
    });

    it("compares greater than", () => {
      expect(money1.greaterThan(money2)).toBe(true);
      expect(money2.greaterThan(money1)).toBe(false);
    });

    it("compares less than", () => {
      expect(money2.lessThan(money1)).toBe(true);
      expect(money1.lessThan(money2)).toBe(false);
    });

    it("compares greater than or equal", () => {
      expect(money1.greaterThanOrEqual(equal)).toBe(true);
      expect(money1.greaterThanOrEqual(money2)).toBe(true);
      expect(money2.greaterThanOrEqual(money1)).toBe(false);
    });

    it("compares less than or equal", () => {
      expect(money1.lessThanOrEqual(equal)).toBe(true);
      expect(money2.lessThanOrEqual(money1)).toBe(true);
      expect(money1.lessThanOrEqual(money2)).toBe(false);
    });

    it("provides comprehensive comparison", () => {
      const comparison = money1.compare(money2);

      expect(comparison).toEqual({
        equal: false,
        greaterThan: true,
        lessThan: false,
      });
    });
  });

  describe("value checks", () => {
    it("checks for zero value", () => {
      expect(Money.zero("USD").isZero()).toBe(true);
      expect(new Money("0.00", "USD").isZero()).toBe(true);
      expect(new Money("1.00", "USD").isZero()).toBe(false);
    });

    it("checks for positive value", () => {
      expect(new Money("100.50", "USD").isPositive()).toBe(true);
      expect(new Money("-100.50", "USD").isPositive()).toBe(false);
      expect(Money.zero("USD").isPositive()).toBe(true);
    });

    it("checks for negative value", () => {
      expect(new Money("-100.50", "USD").isNegative()).toBe(true);
      expect(new Money("100.50", "USD").isNegative()).toBe(false);
      expect(Money.zero("USD").isNegative()).toBe(false);
    });
  });

  describe("formatting", () => {
    const money = new Money("1234567.89", "USD");

    it("formats value without symbol", () => {
      expect(money.formattedValue()).toBe("1,234,567.89");
    });

    it("formats value with symbol", () => {
      expect(money.formattedValueWithSymbol()).toBe("$1,234,567.89");
    });

    it("formats using toString", () => {
      expect(money.toString()).toBe("$1,234,567.89");
    });

    it("formats using locale string", () => {
      expect(money.toLocaleString("en-US")).toBe("$1,234,567.89");
      expect(money.toLocaleString("de-DE")).toBe("1.234.567,89\u00A0$");
    });

    it("handles custom format options", () => {
      expect(money.toLocaleString("en-US", { currencyDisplay: "code" })).toBe(
        "USD\u00A01,234,567.89"
      );
    });
  });

  describe("serialization", () => {
    const money = new Money("1234.56", "USD");

    it("converts to JSON", () => {
      const json = money.toJSON();

      expect(json).toEqual({
        currency: "USD",
        symbol: "$",
        decimals: 2,
        displayDecimals: 2,
        value: "1234.56",
        prettyValue: "$1,234.56",
        negative: false,
      });
    });

    it("works with JSON.stringify", () => {
      const obj = { price: money };
      const json = JSON.stringify(obj);

      expect(JSON.parse(json).price.value).toBe("1234.56");
    });
  });
});
