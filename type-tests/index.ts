import { isEven, InsufficientConfidenceError, type IsEvenOptions, type IsEvenResult } from "is-jeven";

declare function expectType<T>(value: T): void;

expectType<Promise<boolean>>(isEven(2));
expectType<Promise<boolean>>(isEven(2, { apiKey: "test-key" }));
expectType<Promise<boolean>>(isEven(2, { includeProbabilities: false }));
expectType<Promise<IsEvenResult>>(isEven(2, { includeProbabilities: true }));
expectType<Promise<boolean>>(isEven(2, { minConfidence: 0.99 }));
expectType<Promise<IsEvenResult>>(isEven(2, { includeProbabilities: true, minConfidence: 0.99 }));

const error = new InsufficientConfidenceError(0.8, 0.99);
expectType<Error>(error);
expectType<number>(error.confidence);
expectType<number>(error.minConfidence);

declare const options: IsEvenOptions;
expectType<Promise<boolean | IsEvenResult>>(isEven(2, options));

// @ts-expect-error An object result cannot be used as a boolean verdict.
expectType<Promise<boolean>>(isEven(2, { includeProbabilities: true }));
// @ts-expect-error A dynamic option requires narrowing the result.
expectType<Promise<boolean>>(isEven(2, options));
// @ts-expect-error The output flag must be a boolean.
isEven(2, { includeProbabilities: "true" });
// @ts-expect-error The minimum confidence must be numeric.
isEven(2, { minConfidence: "0.99" });
