import { Decimal } from "decimal.js";
import { ValidMoneyInput, MoneyValidationResult } from "../types/money";
import { ERROR_MESSAGES } from "../errors/MoneyErrors";

export const validateMoneyInput = (
  value: ValidMoneyInput
): MoneyValidationResult => {
  try {
    const decimal = new Decimal(value);
    if (!decimal.isFinite()) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_AMOUNT,
      };
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_AMOUNT,
    };
  }
};
