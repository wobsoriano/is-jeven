import assert from "node:assert/strict";
import { test } from "node:test";
import { isEven } from "is-jeven";

const options = { apiKey: "test-key", includeProbabilities: true };
const answer = {
  type: "choice",
  choice: "true",
  confidence: 0.9,
  probabilities: { true: 0.8, false: 0.2 },
};

test("includes model probabilities and confidence in a single request", async (t) => {
  const signal = new AbortController().signal;
  const fetchMock = t.mock.method(globalThis, "fetch", async (_url, init) => {
    assert.equal(init.signal, signal);
    const body = JSON.parse(init.body);
    assert.deepEqual(body.state, { num: -2 });
    assert.deepEqual(body.questions.category.criteria, { true: null, false: null });
    assert.equal("includeProbabilities" in body, false);
    return Response.json({ answers: { category: answer } });
  });

  assert.deepEqual(await isEven(-2, { ...options, signal }), {
    even: true,
    confidence: 0.9,
    probabilities: { even: 0.8, odd: 0.2 },
  });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("keeps the boolean return when probabilities are not requested", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ answers: { category: answer } }),
  );
  assert.equal(await isEven(2, { apiKey: "test-key" }), true);
  assert.equal(await isEven(2, { ...options, includeProbabilities: false }), true);
  assert.equal(await isEven(2, { ...options, includeProbabilities: undefined }), true);
});

test("preserves the model's odd verdict for an even number", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    answers: { category: { ...answer, choice: "false", probabilities: { true: 0.2, false: 0.8 } } },
  }));
  assert.deepEqual(await isEven(2, options), {
    even: false,
    confidence: 0.9,
    probabilities: { even: 0.2, odd: 0.8 },
  });
});

test("rejects invalid output options before making a request", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Should not reach the network");
  });
  for (const includeProbabilities of [null, 0, 1, "true", {}, []]) {
    await assert.rejects(isEven(2, { ...options, includeProbabilities }), {
      name: "TypeError",
      message: /includeProbabilities/,
    });
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("rejects missing and invalid confidence when details are requested", async (t) => {
  for (const confidence of [undefined, null, "0.9", true, -0.1, 1.1, NaN, Infinity]) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () =>
      Response.json({ answers: { category: { ...answer, confidence } } }),
    );
    await assert.rejects(isEven(2, options), /invalid confidence score/);
    fetchMock.mock.restore();
  }
});

test("rejects missing and invalid parity probabilities", async (t) => {
  for (const probabilities of [
    undefined, null, {}, { true: 0.8 }, { false: 0.2 },
    { true: "0.8", false: 0.2 }, { true: 0.8, false: null },
    { true: -0.1, false: 1 }, { true: 0.8, false: 1.2 },
    { true: NaN, false: 0.2 }, { true: 0.8, false: Infinity },
  ]) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () =>
      Response.json({ answers: { category: { ...answer, probabilities } } }),
    );
    await assert.rejects(isEven(2, options), /invalid parity probabilities/);
    fetchMock.mock.restore();
  }
});

test("accepts probability boundaries without adjusting model scores", async (t) => {
  for (const confidence of [0, 1]) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({
      answers: { category: { ...answer, confidence, probabilities: { true: 1, false: 0 } } },
    }));
    assert.deepEqual(await isEven(2, options), {
      even: true,
      confidence,
      probabilities: { even: 1, odd: 0 },
    });
    fetchMock.mock.restore();
  }
});
