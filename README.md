# postcss-list-selectors

A PostCSS plugin that collects all CSS selectors to JSON file.


```css
.btn {
    /* btn properties */
}
.btn--xl {
    /* btn--xl properties */
}
```

```json
[
    ".btn",
    ".btn--xl"
]
```

## Usage

```js
postcss([ require('postcss-list-selectors') ])
```

See [PostCSS] docs for examples for your environment.
