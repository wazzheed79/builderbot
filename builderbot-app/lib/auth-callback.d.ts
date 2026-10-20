export const OTP_LINK_TYPES: readonly string[];

export function plainAuthError(message: string): string;

export type AuthCallbackResult =
  | { kind: "code"; code: string }
  | { kind: "otp"; tokenHash: string; type: string }
  | { kind: "session"; accessToken: string; refreshToken: string }
  | { kind: "error"; message: string }
  | { kind: "none" };

export function readAuthCallback(search?: string, hash?: string): AuthCallbackResult;

export function authCallbackTarget(
  pathname: string,
  search?: string,
  hash?: string
): string | null;
