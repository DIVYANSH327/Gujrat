/**
 * Gemini Authentication & Key Validation Utility
 * Validates whether the configured GEMINI_API_KEY is a valid Google AI Studio key
 * (starts with "AIzaSy" / "AIza" and conforms to standard Google Cloud API key format)
 * rather than an internal OAuth/bearer ticket (e.g. starting with "AQ." or "ya29.")
 * which generativelanguage.googleapis.com rejects with 401 ACCESS_TOKEN_TYPE_UNSUPPORTED.
 */

export function isGeminiApiKeyValid(key: string | undefined = process.env.GEMINI_API_KEY): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  // Valid Google Cloud / AI Studio API keys start with "AIza" and are 39 characters
  if (!trimmed.startsWith('AIza')) return false;
  if (trimmed.length < 35 || trimmed.length > 45) return false;
  return true;
}

export function getGeminiKeyStatus(): {
  configured: boolean;
  valid: boolean;
  reason: string;
} {
  const rawKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!rawKey) {
    return {
      configured: false,
      valid: false,
      reason: 'GEMINI_API_KEY is not set in environment secrets.'
    };
  }

  if (rawKey.startsWith('AQ.') || rawKey.startsWith('ya29.')) {
    return {
      configured: true,
      valid: false,
      reason: 'Current credential is an internal OAuth/Bearer token rather than a Google AI Studio API key (which begins with AIzaSy...). GenerativeLanguage API rejected with 401 UNAUTHENTICATED.'
    };
  }

  if (!rawKey.startsWith('AIza')) {
    return {
      configured: true,
      valid: false,
      reason: 'Google Gemini API keys must begin with "AIza" (format: AIzaSy...).'
    };
  }

  return {
    configured: true,
    valid: true,
    reason: 'Valid Google Gemini API Key configured.'
  };
}
