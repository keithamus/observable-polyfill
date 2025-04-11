# Observable Polyfill

This polyfills the DOM `Observable` class, as well as `EventTarget.prototype.when`.

To see the explainer of these, please visit https://github.com/WICG/observable.

## Installation

### With npm

If you're using npm, you only need to import the package, like so:

```js
import "observable-polyfill";
```

This will automatically apply the polyfill if required.

If you'd like to manually apply the polyfill, you can instead import the `isSupported` and `apply` functions directly from the `./observable.js` file, which
is mapped to `/fn`:

```js
import { isSupported, apply } from "observable-polyfill/fn";
if (!isSupported()) apply();
```

An `isPolyfilled` function is also available, to detect if it has been polyfilled:

```js
import { isSupported, isPolyfilled, apply } from "observable-polyfill/fn";
if (!isSupported() && !isPolyfilled()) apply();
```

Alternatively, if you're not using a package manager, you can use the `unpkg` script:

```html
<!-- polyfill automatically -->
<script
  type="module"
  async
  src="https://unpkg.com/observable-polyfill@latest/observable.min.js"
></script>
```

```html
<!-- polyfill manually -->
<script type="module" async>
  import {isSupported, apply} from "https://unpkg.com/observable-polyfill@latest/observable.js"
  if (!isSupported()) apply();
</script>
```

## Usage

With the module imported, you can start to use `Observable` and `.when`:

```js
new Observable(...)

document.body.when('click').take(1).subscribe(console.log)
```
