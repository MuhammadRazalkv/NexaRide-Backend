import { offerService } from "../bindings/offer.bindings";
export async function calculateFareWithDiscount(
  requestedFare: number,
  userId: string
) {
  const MIN_FARE = 50;
  const APP_COMMISSION_RATE = 0.2;

  // Ensure minimum fare
  let fare = Math.max(requestedFare, MIN_FARE);

  let bestDiscount = 0;
  let bestOffer = null;

  // Find applicable offers for rides above minimum threshold
  if (fare > MIN_FARE) {
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
            discount = Math.min((fare * offer.value) / 100, offer.maxDiscount);
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

  const appCommission = fare * APP_COMMISSION_RATE;
  const driverShare = fare - appCommission;

  // Calculate final fare after discount
  const appEarningAfterDiscount = Math.max(appCommission - bestDiscount, 0);
  let finalFare = Math.round(driverShare + appEarningAfterDiscount);
  finalFare = Math.max(finalFare, MIN_FARE);

  return {
    finalFare,
    driverShare,
    bestOffer,
    bestDiscount,
    originalFare: fare,
  };
}
