import axios from "axios";
import { getGeoApiKey } from "./env";
export const getRouteDetails = async (
  pickupCoords: [number, number],
  dropOffCoords: [number, number]
) => {
  try {
    const apiKey = getGeoApiKey();
    if (!apiKey) {
      return;
    }
    const api = `https://api.geoapify.com/v1/routing?waypoints=${pickupCoords[0]},${pickupCoords[1]}|${dropOffCoords[0]},${dropOffCoords[1]}&mode=drive&apiKey=${apiKey}&type=short`;
    const response = await axios.get(api);
    const distance: number = response.data.features[0].properties.distance;
    const time: number = response.data.features[0].properties.time;
    return { distance, time };
  } catch (error) {
    console.log(error);
    return undefined;
  }
};
