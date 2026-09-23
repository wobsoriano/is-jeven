import assert from "node:assert/strict";
import { test } from "node:test";
import { isEven, InsufficientConfidenceError } from "is-jeven";

const options = { apiKey: "test-key" };

test("rejects invalid confidence thresholds before making a request", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Should not reach the network");
  });
  for (const minConfidence of [null, "0.9", true, NaN, Infinity, -Infinity, -0.1, 1.1]) {
    await assert.rejects(isEven(2, { ...options, minConfidence }), {
      name: "TypeError",
      message: /minConfidence/,
    });
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("rejects low confidence for either verdict and output mode without retrying", async (t) => {
  for (const choice of ["true", "false"]) {
    for (const includeProbabilities of [false, true]) {
      const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({
        answers: { category: { type: "choice", choice, confidence: 0.8 } },
      }));
      await assert.rejects(isEven(2, { ...options, includeProbabilities, minConfidence: 0.9 }), (error) => {
        assert.ok(error instanceof InsufficientConfidenceError);
        assert.ok(error instanceof Error);
        assert.equal(error.name, "InsufficientConfidenceError");
        assert.equal(error.confidence, 0.8);
        assert.equal(error.minConfidence, 0.9);
        assert.match(error.message, /below the required minimum/);
        return true;
      });
      assert.equal(fetchMock.mock.callCount(), 1);
      fetchMock.mock.restore();
    }
  }
});

test("uses confidence in the selected verdict rather than the even probability", async (t) => {
  const signal = new AbortController().signal;
  const fetchMock = t.mock.method(globalThis, "fetch", async (_url, init) => {
    assert.equal(init.signal, signal);
    assert.equal("minConfidence" in JSON.parse(init.body), false);
    return Response.json({ answers: { category: {
      type: "choice",
      choice: "false",
      confidence: 0.95,
      probabilities: { true: 0.2, false: 0.8 },
    } } });
  });
  const thresholdOptions = { ...options, minConfidence: 0.9, signal };
  assert.equal(await isEven(2, thresholdOptions), false);
  assert.deepEqual(await isEven(2, { ...thresholdOptions, includeProbabilities: true }), {
    even: false,
    confidence: 0.95,
    probabilities: { even: 0.2, odd: 0.8 },
  });
  assert.equal(fetchMock.mock.callCount(), 2);
});

test("accepts confidence equal to the threshold including zero and one", async (t) => {
  for (const minConfidence of [0, 0.9, 1]) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({
      answers: { category: { type: "choice", choice: "true", confidence: minConfidence } },
    }));
    assert.equal(await isEven(2, { ...options, minConfidence }), true);
    fetchMock.mock.restore();
  }
});

test("requires a valid confidence score when a threshold is set", async (t) => {
  for (const confidence of [undefined, null, "0.9", -0.1, 1.1, NaN, Infinity]) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({
      answers: { category: { type: "choice", choice: "true", confidence } },
    }));
    await assert.rejects(isEven(2, { ...options, minConfidence: 0 }), /invalid confidence score/);
    fetchMock.mock.restore();
  }
});

test("leaves the threshold disabled when omitted or undefined", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    answers: { category: { type: "choice", choice: "false" } },
  }));
  assert.equal(await isEven(2, options), false);
  assert.equal(await isEven(2, { ...options, minConfidence: undefined }), false);
});
