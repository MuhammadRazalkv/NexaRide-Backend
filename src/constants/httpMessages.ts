export const messages = {
  // General Errors
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  BAD_REQUEST: "The request could not be understood or was missing required parameters.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "You do not have permission to access this resource.",
  NOT_FOUND: "The requested resource could not be found.",
  METHOD_NOT_ALLOWED: "This HTTP method is not allowed for this endpoint.",
  VALIDATION_ERROR: "Validation error ",
  TOO_MANY_REQUESTS: "Too many requests. Please wait a moment and try again.",
  DATABASE_OPERATION_FAILED:"Database operation failed. Please try again.",

  // Auth & User Related
  USER_NOT_FOUND: "We couldn't find an account with the provided credentials.",
  USER_CREATION_SUCCESS: "Your account has been created successfully.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  INVALID_CREDENTIALS: "Incorrect email or password.",
  TOKEN_EXPIRED: "Your token has expired. Please log in again.",
  TOKEN_INVALID: "Your session token is invalid. Please authenticate again.",
  ACCOUNT_DISABLED: "Your account has been disabled. Contact support for help.",
  ACCOUNT_BLOCKED: "Your account has been blocked. Please reach out to support for assistance.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before continuing.",
  EMAIL_NOT_FOUND: "Email address is required.",
  INVALID_OTP: "The OTP provided is invalid or has expired.",
  OTP_SENT_SUCCESS: "An OTP has been sent to your email address.",
  GOOGLE_REGISTERED_ACCOUNT: "This email is linked to a Google account. Please use Google Sign-In.",
  EMAIL_VERIFICATION_SUCCESS: "Your email has been successfully verified.",
  LOGIN_SUCCESS: "Logged in successfully.",
  PASSWORD_RESET_LINK_SENT: "A password reset link has been sent to your email.",
  PASSWORD_RESET_SUCCESS: "Your password has been reset successfully.",

  // Input Validation
  MISSING_FIELDS: "Please fill in all required fields.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_TOO_SHORT: "Your password must be at least 8 characters long.",
  PASSWORD_NOT_FOUND: "Password is missing.",
  INVALID_PARAMETERS: "Some of the input parameters are incorrect.",
  INVALID_TOKEN: "The token is invalid or has expired.",
  TOKEN_CREATED: "New session token generated successfully.",
  TOKEN_NOT_PROVIDED: "No token was provided in the request.",
  INVALID_ID: "The provided ID is invalid.",
  ID_NOT_PROVIDED: "ID not provided.",

  // Driver-specific
  DRIVER_NOT_FOUND: "Driver not found.",
  DRIVER_CREATION_SUCCESS: "Driver account created successfully.",
  VEHICLE_CREATION_SUCCESS: "Vehicle registered successfully.",
  VEHICLE_NOT_FOUND: "Vehicle not found.",
  RIDE_NOT_FOUND: "Ride not found.",
  CANNOT_UPDATE_STATUS: "Unable to update driver status at this time.",
  DRIVER_NOT_REJECTED: "There’s an issue with your application status. Please log in to check it.",
  SUBMITTED_FOR_REVERIFICATION: "Your information has been submitted for re-verification.",

  // Payment & Wallet
  INSUFFICIENT_BALANCE: "Your wallet does not have enough balance.",
  PAYMENT_FAILED: "Payment could not be processed. Please try again.",
  INVALID_TRANSACTION: "Invalid transaction details. Please check and try again.",
  WALLET_MINIMUM_AMOUNT: "You must add at least ₹50 to your wallet.",
  WALLET_MAX_AMOUNT: "You can only add up to ₹3000 at a time to your wallet.",
  

  // Ride Booking
  NO_AVAILABLE_RIDES: "No rides are currently available. Please try again later.",
  OTP_VERIFICATION_FAILED: "OTP verification was unsuccessful. Please check the code and try again.",
  RIDE_ALREADY_COMPLETED: "This ride has already been completed.",
  DATA_FETCH_SUCCESS: "Data retrieved successfully.",
  FARE_UPDATED: "The fare has been updated successfully.",

  RATING_ERROR:"Rating should be between 1 to 5",
  PLAN_ALREADY_EXISTS: "User already has an active subscription."
};
