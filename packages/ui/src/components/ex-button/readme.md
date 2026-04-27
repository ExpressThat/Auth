# ex-button



<!-- Auto Generated Below -->


## Properties

| Property                 | Attribute                  | Description                                         | Type                                  | Default     |
| ------------------------ | -------------------------- | --------------------------------------------------- | ------------------------------------- | ----------- |
| `colorBackground`        | `color-background`         |                                                     | `string \| undefined`                 | `undefined` |
| `colorDivider`           | `color-divider`            |                                                     | `string \| undefined`                 | `undefined` |
| `colorError`             | `color-error`              |                                                     | `string \| undefined`                 | `undefined` |
| `colorInputBackground`   | `color-input-background`   |                                                     | `string \| undefined`                 | `undefined` |
| `colorInputBorder`       | `color-input-border`       |                                                     | `string \| undefined`                 | `undefined` |
| `colorInputBorderFocus`  | `color-input-border-focus` |                                                     | `string \| undefined`                 | `undefined` |
| `colorLink`              | `color-link`               |                                                     | `string \| undefined`                 | `undefined` |
| `colorPrimary`           | `color-primary`            |                                                     | `string \| undefined`                 | `undefined` |
| `colorPrimaryForeground` | `color-primary-foreground` |                                                     | `string \| undefined`                 | `undefined` |
| `colorPrimaryHover`      | `color-primary-hover`      |                                                     | `string \| undefined`                 | `undefined` |
| `colorSurface`           | `color-surface`            |                                                     | `string \| undefined`                 | `undefined` |
| `colorText`              | `color-text`               |                                                     | `string \| undefined`                 | `undefined` |
| `colorTextMuted`         | `color-text-muted`         |                                                     | `string \| undefined`                 | `undefined` |
| `disabled`               | `disabled`                 | Disables the button.                                | `boolean`                             | `false`     |
| `fontFamily`             | `font-family`              |                                                     | `string \| undefined`                 | `undefined` |
| `fontSizeLg`             | `font-size-lg`             |                                                     | `string \| undefined`                 | `undefined` |
| `fontSizeMd`             | `font-size-md`             |                                                     | `string \| undefined`                 | `undefined` |
| `fontSizeSm`             | `font-size-sm`             |                                                     | `string \| undefined`                 | `undefined` |
| `fontSizeXl`             | `font-size-xl`             |                                                     | `string \| undefined`                 | `undefined` |
| `fontSizeXs`             | `font-size-xs`             |                                                     | `string \| undefined`                 | `undefined` |
| `fontWeightMedium`       | `font-weight-medium`       |                                                     | `string \| undefined`                 | `undefined` |
| `fontWeightNormal`       | `font-weight-normal`       |                                                     | `string \| undefined`                 | `undefined` |
| `fontWeightSemibold`     | `font-weight-semibold`     |                                                     | `string \| undefined`                 | `undefined` |
| `isLoading`              | `is-loading`               | Shows a loading indicator and disables interaction. | `boolean`                             | `false`     |
| `label`                  | `label`                    | Text content of the button.                         | `string`                              | `"Button"`  |
| `radiusLg`               | `radius-lg`                |                                                     | `string \| undefined`                 | `undefined` |
| `radiusMd`               | `radius-md`                |                                                     | `string \| undefined`                 | `undefined` |
| `radiusSm`               | `radius-sm`                |                                                     | `string \| undefined`                 | `undefined` |
| `radiusXl`               | `radius-xl`                |                                                     | `string \| undefined`                 | `undefined` |
| `type`                   | `type`                     | HTML button type.                                   | `"button" \| "reset" \| "submit"`     | `"button"`  |
| `variant`                | `variant`                  | Visual style variant.                               | `"ghost" \| "primary" \| "secondary"` | `"primary"` |


## Events

| Event     | Description                       | Type                |
| --------- | --------------------------------- | ------------------- |
| `exClick` | Fired when the button is clicked. | `CustomEvent<void>` |


## Shadow Parts

| Part       | Description |
| ---------- | ----------- |
| `"button"` |             |


## Dependencies

### Used by

 - [ex-login-box](../ex-login-box)

### Graph
```mermaid
graph TD;
  ex-login-box --> ex-button
  style ex-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
