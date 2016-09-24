# PostCSS List Selectors [![Build Status][ci-img]][ci]

[PostCSS] plugin that lists all selectors..

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/cssberries/postcss-list-selectors.svg
[ci]:      https://travis-ci.org/cssberries/postcss-list-selectors

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
