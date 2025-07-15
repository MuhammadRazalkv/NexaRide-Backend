import { offerService } from "../bindings/offer.bindings";
import { userService } from "../bindings/user.bindings";
export async function calculateFareWithDiscount(
  requestedFare: number,
  userId: string
) {
  const MIN_FARE = 50;
  const APP_COMMISSION_RATE = 0.2; // 20 %
  const PREMIUM_DISCOUNT_RATE = 0.3; // 30 %

  // Ensure minimum fare
  let fare = Math.max(requestedFare, MIN_FARE);

  let bestDiscount = 0;
  let bestOffer = null;
  let premiumDiscount = 0;

  const appCommission = Math.round(fare * APP_COMMISSION_RATE);
  const driverShare = fare - appCommission;
  // Find applicable offers for rides above minimum threshold
  if (fare > MIN_FARE) {
    try {
      const premiumUser = await userService.subscriptionStatus(userId);
      if (premiumUser.isSubscribed && fare > MIN_FARE) {
        premiumDiscount = Math.round(appCommission * PREMIUM_DISCOUNT_RATE);
      }
    } catch (error) {
      premiumDiscount = 0;
    }

    const todayTimestamp = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    try {
      const offers = await offerService.findValidOffers(todayTimestamp, fare);
      if (offers && offers.length) {
        for (const offer of offers) {
          // Check if user has already exceeded the offer usage limit
          const offerUsage = await offerService.findOfferUsage(
            userId,
            offer.id
          );
          if (offerUsage >= offer.usageLimitPerUser) {
            continue;
          }

          // Calculate potential discount
          let discount = 0;
          if (offer.type === "percentage") {
            discount = Math.round(
              Math.min((fare * offer.value) / 100, offer.maxDiscount)
            );
          } else {
            discount = Math.min(offer.value, offer.maxDiscount);
          }

          // Ensure fare after discount is still above minimum
          if (fare - discount < MIN_FARE) {
            continue;
          }

          // Save best offer
          if (discount > bestDiscount) {
            bestDiscount = discount;
            bestOffer = offer;
          }
        }
      }
    } catch (error) {
      console.error("Error finding valid offers:", error);
    }
  }

  // Calculate final fare after discount
  const appEarningAAfterPremiumDiscount = Math.max(
    appCommission - premiumDiscount,
    0
  );
  const appEarningAfterDiscount = Math.max(
    appEarningAAfterPremiumDiscount - bestDiscount,
    0
  );
  let finalFare = Math.round(driverShare + appEarningAfterDiscount);
  finalFare = Math.max(finalFare, MIN_FARE);

  return {
    finalFare,
    driverShare,
    bestOffer,
    bestDiscount,
    originalFare: fare,
    isPremiumUser: premiumDiscount > 0,
    premiumDiscount,
  };
}
