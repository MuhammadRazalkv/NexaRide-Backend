export function getGeoApiKey() {
  return process.env.GEOAPI_KEY;
}

export function getPlusAmount(type: 'yearly' | 'monthly') {
  if (type == 'monthly') {
    return process.env.PLUS_AMOUNT_MONTHLY;
  } else {
    return process.env.PLUS_AMOUNT_YEARLY;
  }
}

export function getAccessTokenMaxAge() {
  return parseInt(process.env.ACCESS_MAX_AGE || '');
}
export function getRefreshTokenMaxAge() {
  return parseInt(process.env.REFRESH_MAX_AGE || '');
}
