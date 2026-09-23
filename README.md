# is-jeven

Is it even? Ask Jev.

Uses TypeSafe AI's Jev model under the hood to determine if a number is even.

## Usage

Get an API key from the [TypeSafe console](https://console.typesafe.ai), then:

```sh
export TYPESAFE_API_KEY="your-typesafe-api-key"
```

```js
import { isEven } from "is-jeven";

console.log(await isEven(2)); // true (probably)
console.log(await isEven(3)); // false (hopefully)
```

## API

`isEven(num: number, options?: IsEvenOptions): Promise<boolean>` by default.

- `num`: a safe integer, including zero and negative integers.
- `options.apiKey`: overrides the `TYPESAFE_API_KEY` environment variable.
- `options.signal`: an optional `AbortSignal` for cancellation or a timeout.
- `options.includeProbabilities`: return an `IsEvenResult` with the verdict, confidence,
  and parity probabilities instead of a boolean. Defaults to `false`.
- `options.minConfidence`: an optional minimum confidence from 0 to 1, inclusive.
  Rejects with `InsufficientConfidenceError` when the model's confidence in its
  selected verdict is below this value. Unset by default; equality is accepted.

### Probabilities

For workflows where knowing that 2 is even is not enough:

```js
const result = await isEven(2, { includeProbabilities: true });
// Illustrative response; actual scores come from Jev:
// {
//   even: true,
//   confidence: 0.9,
//   probabilities: { even: 0.8, odd: 0.2 }
// }
```

The [TypeSafe API](https://api.typesafe.ai/docs) supplies both the confidence in the
selected verdict and the probability of each answer. These are distinct fields;
`confidence` is not necessarily the same as `probabilities.even`, especially when
the verdict is odd. All scores are from 0 to 1 and are returned unchanged. Each
call still makes one request, and the model can still be wrong.

### Minimum confidence

For critical workflows involving the number 2:

```js
import { isEven, InsufficientConfidenceError } from "is-jeven";

try {
  const result = await isEven(2, {
    includeProbabilities: true,
    minConfidence: 0.99,
  });
  console.log(result.even, result.probabilities);
} catch (error) {
  if (!(error instanceof InsufficientConfidenceError)) throw error;
  console.log(error.confidence, error.minConfidence);
}
```

`minConfidence` also works without `includeProbabilities`, keeping the boolean
return type. It checks `confidence` for either verdict, so a confident odd verdict
still returns `false`. An uncertain verdict rejects instead of being treated as
odd. There are no automatic retries or local arithmetic fallbacks.

This is a joke package FYI.

## Development

```sh
npm test
npm run typecheck
```

## License

MIT
