# postcss-list-selectors

A PostCSS plugin that collects all CSS selectors to JSON file.


```css
.btn {
    /* btn declarations */
}
.btn--xl {
    /* btn--xl declarations */
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
