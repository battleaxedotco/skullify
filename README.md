# skullify

[![NPM](https://nodei.co/npm/skullify.png)](https://npmjs.org/package/skullify)

| [Installation](#installation) | [Use](#use) | [API](#api) | [Notes](#notes-and-todo) |
| ----------------------------- | :---------: | :---------: | :----------------------: |

![](https://thumbs.gfycat.com/ThirstyTenseCommabutterfly-small.gif)

> [See the demonstration panel above here](https://github.com/battleaxedotco/skullify-test-panel)

## Installation

```bash
npm install skullify
```

## Use

```js
// Import the skullify component
import { skullify } from "skullify";

export default {
  // Register it as a component within the .vue file
  components: {
    skullify,
  },
};
```

```html
<!--
   Use it within this file's template:
 -->
<skullify
  ref="icon"
  folder="./src/assets/wrenches"
  :options="{
    autoplay: true,
  }"
/>
<!-- 
  Note that "ref" is required if you intend to shuffle animations
 -->
```

See the [examples section here](#skullify-examples) for more in-depth use cases.

# API

`<skullify>`

- [Props](#skullify-props)
- [Methods](#skullify-methods)
- [Events](#skullify-events)
- [Examples](#skullify-examples)

---

## `<skullify> props`

| Prop              | Type     | Default                                                              |                                                                                                                                                                                                                 Description |
| :---------------- | :------- | :------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| animationData?    | `Object` | `null`                                                               |                                                                                                                                             The contents of a Lottie file, takes precedence over `folder` and `files` props |
| folder?           | `String` | `null`                                                               | The relative filepath (from panel root) to a folder containing lottie JSONs. Takes precedence over `files` but is overridden by `animationData`. All valid files within this folder will be in the "deck" as cards to draw. |
| files?            | `Array`  | `[]`                                                                 |                                                                                               An array of relative filepaths from panel root to valid lottie JSON files. All valids will be in the "deck" as cards to draw. |
| name?             | `String` | `(Generated UUID)`                                                   |                                                                                                             The unique identifier for this instance, in case advanced namespaced lottie methods are used within the project |
| options?          | `Object` | `{ loop: false, prerender: true, autoplay: false, animType: "svg" }` |                                                                                                                                      Parameters for `lottie.loadAnimation` used on mount (or whenever the file is shuffled) |
| uniqueRollLength? | `Number` | `1`                                                                  |                                     The length of roll history that any new roll for file or segment cannot match, e.g. `1` means new roll cannot be same as last roll, `2` means new roll cannot be same as last two rolls |
| speed?            | `Number` | `1`                                                                  |                                                                                                                                                          The playback speed of the instance, with `1` being original AE fps |
| direction?        | `Number` | `1`                                                                  |                                                                                                                                                               Whether animation is played forward (`1`) or in reverse(`-1`) |
| skeleton?         | `Array`  | `[960, 540]`                                                         |                                                              Width and height dimensions used to create experimental CSS container aspect ratio matching animation to mask the initial paint of lottie (currently disabled) |

---

## `<skullify> methods`

To allow multiple instances and control them individually, you must use standard Vue `ref`s:

```html
<skullify ref="target" />
```

```js
export default {
  mounted() {
    const myComponent = this.$refs.target; // A reference pointer to the direct Vue data of this component
    myComponent.shuffleFile(); // shuffleFile is a method of the child Vue component
  },
};
```

| Method               | Params           |                                                                                                                          Description |
| :------------------- | :--------------- | -----------------------------------------------------------------------------------------------------------------------------------: |
| `reconstruct()`      |                  | Destroys the current instance, removes all events, reinitializes according to the currently active index, and regenerates all events |
| `shuffleFile()`      |                  |                                                   Rolls a random number to set as active index, then calls `reconstruct()` on itself |
| `shuffleSegment()`   |                  |                                              Rolls a random number to set as active index, then calls `playSegmentChunk()` on itself |
| `playSegmentChunk()` | index = `Number` |                                                               Plays the segment of frames between two comp marker locations by index |

> Skullify includes all [native Lottie methods](https://github.com/airbnb/lottie-web#usage)

---

## `<skullify> events`

| Event     | Params                  |                                                                                   Description |
| :-------- | :---------------------- | --------------------------------------------------------------------------------------------: |
| `@load`   |                         |             Called at the end of a `reconstruct()` method, when any new animation is rendered |
| `@unload` |                         | Called at the beginning of a `reconstruct()` method, when any existing animation is destroyed |
| `@error`  | errorMessage = `String` |                           Called during any method or parsing error with description of error |

> Skullify includes all [native Lottie events](https://github.com/airbnb/lottie-web#events). All events are dash-case, e.g. "dom-loaded", "loop-complete", "loaded-images", etc.

---

## `<skullify> examples`

### Using the folder prop:

```html
<skullify
  ref="icon"
  folder="./src/assets/wrenches"
  :options="{
    autoplay: true,
  }"
/>
```

### Using the files prop:

```html
<skullify
  ref="icon"
  :files="[
    './src/assets/wrenches/white.json',
    './src/assets/wrenches/blue.json',
    './src/assets/wrenches/green.json',
    './src/assets/wrenches/yellow.json',
  ]"
  :options="{
    autoplay: true,
  }"
/>
```

### Using the files prop with JSON data instead of file paths:

```html
<skullify
  ref="icon"
  :files="fileList"
  :options="{
    autoplay: true,
  }"
/>
```

```js
export default {
  data: () => ({
    fileList: [
      require("./assets/wrenches/blue.json"),
      require("./assets/wrenches/green.json"),
      require("./assets/wrenches/white.json"),
      require("./assets/wrenches/yellow.json"),
    ],
  }),
};
```

### Using the animationData prop:

```html
<skullify
  ref="icon"
  :animationData="currentAnimationData"
  :options="{
    autoplay: true,
  }"
/>
```

```js
export default {
  data: () => ({
    activeIndex: 0, // Changing this value will cycle through the array
    fileList: [
      require("./assets/wrenches/blue.json"),
      require("./assets/wrenches/green.json"),
      require("./assets/wrenches/white.json"),
      require("./assets/wrenches/yellow.json"),
    ],
  }),
  computed: {
    currentAnimationData(val) {
      return this.fileList.length ? this.fileList[this.activeIndex] : null;
    },
  },
};
```

### Using shuffleFile() in any of the above

Roll from the current file to a new random file:

```js
export default {
  methods: {
    randomizeAnimation() {
      this.$refs.icon.shuffleFile();
    },
  },
};
```

---

## Notes and Todo

- Skullify doesn't register it's content as static, and lazy loads. The first ~100ms result in it's container being minimally sized then expanding when the animation loads, pushing content below down and causing a noticeable unfolding effect. This is no issue when everything is centered or it's parent contains static `min-width` and `min-height`, but it should accept a `skeleton` to prevent this
- shuffleSegment is not yet written, though it's been proven to work in the example panel
- **uniqueRollLength** should not be the `files.length` or `files.length - 1`. If you set this as `3` with a list of `4` files, this will result in the same sequence played indefinitely, e.g. `0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, ...`
