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

`isEven(num: number, options?: IsEvenOptions): Promise<boolean>`

- `num`: a safe integer, including zero and negative integers.
- `options.apiKey`: overrides the `TYPESAFE_API_KEY` environment variable.
- `options.signal`: an optional `AbortSignal` for cancellation or a timeout.

This is a joke package FYI.

## Development

```sh
npm test
npm run typecheck
```

## License

MIT
