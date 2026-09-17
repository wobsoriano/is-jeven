/**
 * Ask Jev whether a number is even.
 * @param {number} num
 * @param {import('./index.js').IsEvenOptions} [options]
 * @returns {Promise<boolean>}
 */
export async function isEven(num, options = {}) {
  const { signal } = options;
  const apiKey = options.apiKey ??
    (typeof process !== "undefined" ? process.env.TYPESAFE_API_KEY : undefined);

  if (!Number.isSafeInteger(num)) {
    throw new TypeError("Expected a safe integer.");
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

  return answer.choice === "true";
}
