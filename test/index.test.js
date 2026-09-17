import assert from "node:assert/strict";
import { test } from "node:test";
import { isEven } from "is-jeven";

const options = { apiKey: "test-key" };

test("sends the documented Jev request and forwards the abort signal", async (t) => {
  const signal = new AbortController().signal;
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "https://api.typesafe.ai/v1/systemone");
    assert.equal(init.method, "POST");
    assert.deepEqual(init.headers, {
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
    assert.equal(init.signal, signal);
    assert.deepEqual(JSON.parse(init.body), {
      model: "jev-latest",
      state: { num: -2 },
      questions: {
        category: {
          type: "choice",
          instructions: "Is this number even?",
          criteria: { true: null, false: null },
        },
      },
    });
    return Response.json({ answers: { category: { type: "choice", choice: "true" } } });
  });

  assert.equal(await isEven(-2, { ...options, signal }), true);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("returns the model's false verdict, even for an even number", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ answers: { category: { type: "choice", choice: "false" } } }),
  );
  assert.equal(await isEven(0, options), false);
});

test("rejects invalid inputs and missing keys before making a request", async (t) => {
  const previousKey = process.env.TYPESAFE_API_KEY;
  delete process.env.TYPESAFE_API_KEY;
  t.after(() => {
    if (previousKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = previousKey;
  });
  const fetchMock = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Should not reach the network");
  });

  for (const num of [NaN, Infinity, -Infinity, 1.5, 2 ** 53, "2", null]) {
    await assert.rejects(isEven(num, options), /safe integer/);
  }
  for (const apiKey of [undefined, "", "  "]) {
    await assert.rejects(isEven(2, { apiKey }), /API key is required/);
  }
  await assert.rejects(isEven(2), /API key is required/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("reads the environment at call time and allows explicit key overrides", async (t) => {
  const previousKey = process.env.TYPESAFE_API_KEY;
  t.after(() => {
    if (previousKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = previousKey;
  });
  const keys = [];
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    keys.push(init.headers.Authorization);
    return Response.json({ answers: { category: { type: "choice", choice: "true" } } });
  });

  process.env.TYPESAFE_API_KEY = "environment-key";
  assert.equal(await isEven(2), true);
  process.env.TYPESAFE_API_KEY = "updated-key";
  assert.equal(await isEven(2), true);
  assert.equal(await isEven(2, options), true);
  assert.deepEqual(keys, ["Bearer environment-key", "Bearer updated-key", "Bearer test-key"]);
});

test("reports HTTP failures, including non-JSON responses", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    new Response("Service unavailable", { status: 503 }),
  );
  await assert.rejects(isEven(2, options), /TypeSafe AI request failed \(503\)/);
});

test("rejects missing or unexpected verdicts instead of returning false", async (t) => {
  for (const data of [null, {}, { answers: { category: { type: "choice", choice: true } } },
    { answers: { category: { type: "choice", choice: "maybe" } } }]) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json(data));
    await assert.rejects(isEven(2, options), /invalid evenness verdict/);
    fetchMock.mock.restore();
  }
});

test("propagates network errors and cancellation", async (t) => {
  const error = new DOMException("The operation was aborted", "AbortError");
  t.mock.method(globalThis, "fetch", async () => { throw error; });
  await assert.rejects(isEven(2, options), (cause) => cause === error);
});
