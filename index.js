/**
 * Ask Jev whether a number is even.
 * @param {number} num
 * @param {import('./index.js').IsEvenOptions} [options]
 * @returns {Promise<boolean | import('./index.js').IsEvenResult>}
 */
export async function isEven(num, options = {}) {
  const { signal, includeProbabilities = false, minConfidence } = options;
  const apiKey = options.apiKey ?? globalThis.process?.env?.TYPESAFE_API_KEY;

  if (!Number.isSafeInteger(num)) {
    throw new TypeError("Expected a safe integer.");
  }

  if (typeof includeProbabilities !== "boolean") {
    throw new TypeError("Expected options.includeProbabilities to be a boolean.");
  }

  if (minConfidence !== undefined && !isProbability(minConfidence)) {
    throw new TypeError("Expected options.minConfidence to be a finite number from 0 to 1.");
  }

  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new TypeError("A TypeSafe AI API key is required. Set TYPESAFE_API_KEY or pass options.apiKey.");
  }

  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jev-latest",
      state: { num },
      questions: {
        category: {
          type: "choice",
          instructions: "Is this number even?",
          criteria: { true: null, false: null },
        },
      },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`TypeSafe AI request failed (${response.status}).`);
  }

  const data = await response.json();
  const answer = data?.answers?.category;

  if (answer?.type !== "choice" || !["true", "false"].includes(answer.choice)) {
    throw new Error("TypeSafe AI returned an invalid evenness verdict.");
  }

  const even = answer.choice === "true";

  if (includeProbabilities || minConfidence !== undefined) {
    if (!isProbability(answer.confidence)) {
      throw new Error("TypeSafe AI returned an invalid confidence score.");
    }
    if (minConfidence !== undefined && answer.confidence < minConfidence) {
      throw new InsufficientConfidenceError(answer.confidence, minConfidence);
    }
  }

  if (!includeProbabilities) return even;

  const probabilities = answer.probabilities;
  if (!isProbability(probabilities?.true) || !isProbability(probabilities?.false)) {
    throw new Error("TypeSafe AI returned invalid parity probabilities.");
  }

  return {
    even,
    confidence: answer.confidence,
    probabilities: { even: probabilities.true, odd: probabilities.false },
  };
}

/** @param {unknown} value @returns {value is number} */
function isProbability(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export class InsufficientConfidenceError extends Error {
  /** @param {number} confidence @param {number} minConfidence */
  constructor(confidence, minConfidence) {
    super(`Jev's confidence (${confidence}) is below the required minimum (${minConfidence}).`);
    this.name = "InsufficientConfidenceError";
    this.confidence = confidence;
    this.minConfidence = minConfidence;
  }
}
