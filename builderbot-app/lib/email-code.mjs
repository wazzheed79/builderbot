/**
 * The code in the sign-in email is Supabase's email OTP.
 * Supabase allows 6 to 10 digits (`mailer.otp_length`). This project sends 8.
 * `verifyOtp` with type `email` accepts that code, including from a magic-link email.
 */

export const EMAIL_CODE_MIN_LENGTH = 6;
export const EMAIL_CODE_MAX_LENGTH = 10;

/**
 * Digits only, with no length change. Callers decide whether the length is usable.
 * @param {unknown} value
 */
export function emailCodeDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/**
 * A sentence when the code cannot be sent to Supabase, or an empty string when it can.
 * @param {unknown} value
 */
export function emailCodeError(value) {
  const digits = emailCodeDigits(value);
  if (digits.length < EMAIL_CODE_MIN_LENGTH || digits.length > EMAIL_CODE_MAX_LENGTH) {
    return "Enter the code from the email. It is 6 to 10 digits.";
  }
  return "";
}
