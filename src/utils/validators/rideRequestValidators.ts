interface IRideReqData {
  category: string;
  pickupCoords: [number, number];
  dropOffCoords: [number, number];
  distance: number;
  fare: number;
}
export function validateRideRequest(data: IRideReqData, userId: string) {
  if (!userId) return false;
  if (!data.category) return false;

  // Validate coordinates
  if (
    !data.pickupCoords ||
    !Array.isArray(data.pickupCoords) ||
    data.pickupCoords.length !== 2
  )
    return false;
  if (
    !data.dropOffCoords ||
    !Array.isArray(data.dropOffCoords) ||
    data.dropOffCoords.length !== 2
  )
    return false;

  // Validate coordinate values
  if (
    !isValidLatitude(data.pickupCoords[0]) ||
    !isValidLongitude(data.pickupCoords[1])
  )
    return false;
  if (
    !isValidLatitude(data.dropOffCoords[0]) ||
    !isValidLongitude(data.dropOffCoords[1])
  )
    return false;

  return true;
}

function isValidLatitude(lat: number) {
  return typeof lat === "number" && lat >= -90 && lat <= 90;
}

function isValidLongitude(lng: number) {
  return typeof lng === "number" && lng >= -180 && lng <= 180;
}
