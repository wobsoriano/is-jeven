export interface IsEvenOptions {
  /** Your TypeSafe AI API key. Defaults to the TYPESAFE_API_KEY environment variable. */
  apiKey?: string;
  /** Cancel the request or set a timeout with AbortSignal.timeout(ms). */
  signal?: AbortSignal;
  /** Include the model's confidence and parity probabilities. Defaults to false. */
  includeProbabilities?: boolean;
}

export interface IsEvenResult {
  /** The model's verdict, which can be wrong. */
  even: boolean;
  /** The model's confidence in its selected verdict, from 0 to 1. */
  confidence: number;
  /** The model's probability for each parity, from 0 to 1. */
  probabilities: { even: number; odd: number };
}

/**
 * Ask TypeSafe AI's Jev model whether a safe integer is even.
 * Returns the model's verdict, which can be wrong. Each call makes one request.
 * Rejects on invalid input, a missing API key, or an API/network failure.
 */
export declare function isEven(
  num: number,
  options: IsEvenOptions & { includeProbabilities: true },
): Promise<IsEvenResult>;
export declare function isEven(
  num: number,
  options?: IsEvenOptions & { includeProbabilities?: false },
): Promise<boolean>;
export declare function isEven(
  num: number,
  options?: IsEvenOptions,
): Promise<boolean | IsEvenResult>;
