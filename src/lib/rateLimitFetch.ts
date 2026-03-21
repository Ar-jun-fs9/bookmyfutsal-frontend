/**
 * Rate Limit Error class for handling 429 responses
 */
export class RateLimitError extends Error {
  public retryAfter: number;
  public readonly isRateLimitError: boolean = true;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Custom fetch wrapper that handles rate limiting (HTTP 429)
 * with automatic retry after the specified wait time
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise<Response>
 * @throws {RateLimitError} When rate limited (429)
 */
export async function rateLimitAwareFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    // Try to get Retry-After header, default to 60 seconds
    const retryAfterHeader = response.headers.get('Retry-After');
    let retryAfterMs: number;
    
    if (retryAfterHeader) {
      // Retry-After can be seconds or HTTP date
      const parsed = parseInt(retryAfterHeader, 10);
      if (!isNaN(parsed)) {
        retryAfterMs = parsed * 1000;
      } else {
        // It's a date, calculate difference
        const retryDate = new Date(retryAfterHeader);
        retryAfterMs = Math.max(0, retryDate.getTime() - Date.now());
      }
    } else {
      retryAfterMs = 60000; // Default 60 seconds
    }
    
    const error = new RateLimitError(
      `Rate limited. Retry after ${Math.ceil(retryAfterMs / 1000)} seconds`,
      retryAfterMs
    );
    
    throw error;
  }
  
  return response;
}

/**
 * Custom fetch with automatic retry on rate limit
 * Shows a notification and waits before retrying
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param onRateLimit - Callback when rate limited, receives wait time in ms
 * @param maxRetries - Maximum number of retries (default: 2)
 * @returns Promise<Response>
 */
export async function fetchWithRateLimitRetry(
  url: string,
  options?: RequestInit,
  onRateLimit?: (waitTimeMs: number) => void,
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      const response = await rateLimitAwareFetch(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof RateLimitError) {
        // Notify about rate limit if callback provided
        if (onRateLimit) {
          onRateLimit(error.retryAfter);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, error.retryAfter));
        attempt++;
        
        // console.log(`Rate limited. Retrying (${attempt}/${maxRetries}) after ${error.retryAfter}ms...`);
      } else {
        // Non-rate-limit error, throw immediately
        throw error;
      }
    }
  }
  
  throw lastError;
}

/**
 * React Query retry delay function with exponential backoff
 * Used in query options: retryDelay: exponentialRetryDelay
 * 
 * @param attemptIndex - The current retry attempt (0-indexed)
 * @returns Delay in ms
 */
export function exponentialRetryDelay(attemptIndex: number): number {
  // Exponential backoff: 1000ms, 2000ms, 4000ms, 8000ms... max 30000ms
  return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
}

/**
 * Creates a rate limit notification message
 * @param waitTimeMs - Wait time in milliseconds
 * @returns Formatted message string
 */
export function formatRateLimitMessage(waitTimeMs: number): string {
  const seconds = Math.ceil(waitTimeMs / 1000);
  
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `API rate limit reached. Retrying in ${minutes}m ${remainingSeconds}s...`
      : `API rate limit reached. Retrying in ${minutes} minute(s)...`;
  }
  
  return `API rate limit reached. Retrying in ${seconds} seconds...`;
}
