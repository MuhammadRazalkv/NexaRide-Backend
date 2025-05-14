import { IOffer } from "../../models/offer.modal";

export default function validateOfferData(data: IOffer): string | null {
  if (!data.title || !data.title.trim()) return "Title is required.";

  if (!["flat", "percentage"].includes(data.type))
    return "Invalid offer type. Must be 'flat' or 'percentage'.";

  if (typeof data.value !== "number" || isNaN(data.value) || data.value <= 0)
    return "Value must be a number greater than 0.";

  if (data.type === "percentage") {
    if (data.value > 90 || data.value < 0)
      return "Percentage value should be between 1 - 90";
    if (!data.maxDiscount || data.maxDiscount <= 0)
      return "Max discount is required for percentage offers and must be > 0.";
  }

  if (data.minFare !== undefined && data.minFare < 0)
    return "Minimum fare cannot be negative.";

  if (!data.validFrom || isNaN(data.validFrom))
    return "Valid from date is required and must be a valid timestamp.";

  if (!data.validTill || isNaN(data.validTill))
    return "Valid till date is required and must be a valid timestamp.";

  if (data.validTill <= data.validFrom)
    return "Valid till must be after valid from.";

  if (data.usageLimitPerUser < 1) return "Limit per user must be positive number.";

  return null;
}
