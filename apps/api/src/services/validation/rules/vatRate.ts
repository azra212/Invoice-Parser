import { issue, type ValidationRule } from "../types";

const KNOWN_RATES = [0, 5, 7, 8, 9, 10, 13, 15, 17, 18, 19, 20, 21, 23, 25, 27];

export const vatRateRule: ValidationRule = {
  id: "vatRate",
  async validate(document) {
    if (document.subtotal === null || document.tax === null) return [];
    if (document.tax < 0) {
      return [issue("tax", "Tax cannot be negative.", "error", "vat.negative")];
    }
    if (document.subtotal <= 0) return [];

    const percent = (document.tax / document.subtotal) * 100;
    if (percent > 30) {
      return [
        issue(
          "tax",
          `Tax is ${percent.toFixed(2)}% of the subtotal, which is above 30%.`,
          "error",
          "vat.rate",
        ),
      ];
    }

    if (percent === 0) return [];

    const known = KNOWN_RATES.some((rate) => Math.abs(percent - rate) <= 0.5);
    if (known) return [];

    return [
      issue(
        "tax",
        `Tax is ${percent.toFixed(2)}% of the subtotal, which is not a common VAT rate.`,
        "warning",
        "vat.unknown",
      ),
    ];
  },
};
