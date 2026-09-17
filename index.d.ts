export interface IsEvenOptions {
  /** Your TypeSafe AI API key. Defaults to the TYPESAFE_API_KEY environment variable. */
  apiKey?: string;
  /** Cancel the request or set a timeout with AbortSignal.timeout(ms). */
  signal?: AbortSignal;
}

/**
 * Ask TypeSafe AI's Jev model whether a safe integer is even.
 * Returns the model's verdict, which can be wrong. Each call makes one request.
 * Rejects on invalid input, a missing API key, or an API/network failure.
 */
export declare function isEven(num: number, options?: IsEvenOptions): Promise<boolean>;
