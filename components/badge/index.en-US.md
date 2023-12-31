---
category: Components
type: Data Display
title: Badge
---

Small numerical value or status descriptor for UI elements.

## When To Use

Badge normally appears in proximity to notifications or user avatars with eye-catching appeal, typically displaying unread messages count.

## API

```jsx
<Badge count={5}>
  <a href="#" className="head-example" />
</Badge>
```

```jsx
<Badge count={5} />
```

| Property | Description | Type | Default |
| -------- | ----------- | ---- | ------- |
| count | Number to show in badge | ReactNode |  |
| dot | Whether to display a red dot instead of `count` | boolean | `false` |
| offset | set offset of the badge dot, like`[x, y]` | `[number, number]` | - |
| overflowCount | Max count to show | number | 99 |
| showZero | Whether to show badge when `count` is zero | boolean | `false` |
| status | Set Badge as a status dot | `success` \| `processing` \| `default` \| `error` \| `warning` | `''` |
| text | If `status` or `color` is set, `text` sets the display text of the status `dot` | ReactNode | `''` |
| color | Customize Badge dot color | string |  |
| size | If `count` is set, `size` sets the size of badge | `default` \| `small` | `default` |
| title | Text to show when hovering over the badge | string |  |
