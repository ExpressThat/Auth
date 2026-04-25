---
name: mitosis
description: |
  Mitosis is an open-source tool that transforms JSX components into fully functional components for frameworks like Angular, React, Qwik, Vue, Svelte, Solid, and React Native.

  Use when user: wants to write UI components once and deploy them across multiple frameworks, maintain a consistent design system, sync design systems from Figma to code, build cross-framework SDKs, or avoid the pitfalls of web components.
---

# Mitosis Overview

## What is Mitosis?

[Mitosis](https://github.com/BuilderIO/mitosis) is an open-source tool that transforms JSX components into fully functional components for frameworks like Angular, React, Qwik, Vue, Svelte, Solid, and React Native.

By writing your UI components once in JSX, you can deploy them across any platform, eliminating the need to rewrite code for each framework.

Using Mitosis, you can:

- Maintain a consistent design system across multiple frameworks ([example](https://github.com/db-ux-design-system/core-web))
- Sync your [design systems from Figma to code](/docs/figma) and publish them to npm across frameworks
- Build high quality cross-framework SDKs ([example](https://github.com/BuilderIO/builder/tree/main/packages/sdks#builderio-sdks))
- Avoid the [pitfalls of web components](#challenges-with-web-components) by compiling to native framework code

<video
  width="752"
  height="428"
  autoplay
  playsInline
  muted
  loop
  src="https://cdn.builder.io/o/assets%2FYJIGb4i01jvw0SRdL5Bt%2F65318cd035a940f88f7c19bfb0844e31%2Fcompressed?apiKey=YJIGb4i01jvw0SRdL5Bt&token=65318cd035a940f88f7c19bfb0844e31&alt=media&optimized=true"
/>

## Why use Mitosis?

With Mitosis, you can streamline your workflow and reduce redundancy without compromising the quality of your design system. Mitosis ensures that your design language speaks clearly and consistently, whether you're working in React, Vue, or any other framework.

By simplifying the development process through having one singular source of truth, Mitosis accelerates project timelines, allowing your team to focus more on innovation and less on integration.

### Challenges with web components

While [web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) are standalone elements designed for reuse across web applications, they present some [key challenges](https://designsystemcentral.com/why-web-components-arent-the-design-system-silver-bullet-just-yet/152/) for design systems:

- Web components do not natively render on the server side. This can be problematic when using frameworks that rely on server-side rendering for performance and SEO benefits.
- Web components do not seamlessly integrate with your library or framework. For instance, web components do not inherently understand or interact with React's context.
- Web components often come with their own rendering libraries and dependencies, which can lead to performance overhead.

Although web components offer a modular and reusable approach to UI elements, these challenges can limit their viability. However, if supporting web components is a requirement, you can use Mitosis to generate them from a single source of truth. Mitosis supports [Lit](https://lit.dev/), [Stencil](https://stenciljs.com/), and raw web components as outputs.

### Integration with Figma

Mitosis integrates with Figma to sync your design systems in Figma to code.

<video
  width="752"
  height="428"
  autoplay
  playsInline
  muted
  loop
  src="https://cdn.builder.io/o/assets%2FYJIGb4i01jvw0SRdL5Bt%2F65d28d32b11d4577b116d6853dd72ce8%2Fcompressed?apiKey=YJIGb4i01jvw0SRdL5Bt&token=65d28d32b11d4577b116d6853dd72ce8&alt=media&optimized=true"
/>

This integration streamlines the design-to-code process, ensuring that your design system remains consistent across all platforms from one singular source of truth. Learn more about our [Figma integration](/docs/figma).

## How does it work

Mitosis uses a static subset of JSX, inspired by [Solid](https://www.solidjs.com/guide#jsx-compilation). This means we can parse it to a simple JSON structure, then easily build serializers that target various frameworks and implementations.

```tsx
export function MyComponent() {
  const state = useStore({
    name: 'Steve',
  });

  return (
    <div>
      <input value={state.name} onChange={(event) => (state.name = event.target.value)} />
    </div>
  );
}
```

becomes:

```json
{
  "@type": "@builder.io/mitosis/component",
  "state": {
    "name": "Steve"
  },
  "nodes": [
    {
      "@type": "@builder.io/mitosis/node",
      "name": "div",
      "children": [
        {
          "@type": "@builder.io/mitosis/node",
          "name": "input",
          "bindings": {
            "value": "state.name",
            "onChange": "state.name = event.target.value"
          }
        }
      ]
    }
  ]
}
```

Which can be reserialized into many languages and frameworks. For example, to support angular, we just make a serializer that loops over the json and produces:

```typescript
@Component({
  template: `
    <div>
      <input [value]="name" (change)="name = $event.target.value" />
    </div>
  `,
})
class MyComponent {
  name = 'Steve';
}
```

Adding framework support is surprisingly easy with the plugin system (docs coming soon).



# Project structure

For a practical example of the below structure, check out [our example project](https://github.com/BuilderIO/mitosis/tree/main/examples/basic/).

Here is how a Mitosis project will be structured:

- `src/` contains your Mitosis source code
- `output/` contains per-target output of the project
  - You will notice `.lite.tsx` files _in_ your output. Those are a human-readable Mitosis components. Think of them as a reference point for you to debug more easily, since the actual JS output is minified and thus difficult to read.
- `mitosis.config.js` contains general and per-target [configuration](/docs/configuration/). It is used by `mitosis build`.
- `overrides/` contains a per-target folder that mimicks the structure of `src`, and will completely swap out any files with identical names.
  - Example: if we have defined `overrides/react-native/src/functions/is-react-native.ts`, it will override `src/functions/is-react-native.ts` in `output/react-native/src/functions/is-react-native.js`.


# Hooks

## useStore and useState

See the [State](/docs/components#state) section for more information on state handling.

## useRef

Use the `useRef` hook to hold a reference to a rendered DOM element.

```tsx
import { Show, useRef, useStore } from '@builder.io/mitosis';

export default function MyComponent() {
  const inputRef = useRef<HTMLInputElement>(null);

  const state = useStore({
    name: 'Steve',
    onBlur() {
      // Maintain focus
      inputRef.focus();
    },
    get lowerCaseName() {
      return state.name.toLowerCase();
    },
  });

  return (
    <div>
      <Show when={props.showInput}>
        <input
          ref={inputRef}
          css={{ color: 'red' }}
          value={state.name}
          onBlur={() => state.onBlur()}
          onChange={(event) => (state.name = event.target.value)}
        />
      </Show>
      Hello {state.lowerCaseName}! I can run in React, Vue, Solid, or Liquid!
    </div>
  );
}
```

> **Note:** Don't name your `useRef` hook "ref" like `const ref = useRef<HTMLInputElement>(null);`.
> This would be a conflict with the `ref` from [Vue](https://vuejs.org/api/reactivity-core.html#ref).

### forwardRef for React

<details>

In React you may need to wrap your component with `forwardRef` to provide direct access to an element (`input` for example). You can do this by using using a `prop` value as the `ref`

_Mitosis input_

```tsx
export default function MyInput(props) {
  return <input ref={props.inputRef} />;
}
```

_Mitosis output_

```tsx
import { forwardRef } from 'react';

export default forwardRef(function MyInput(props, inputRef) {
  return <input ref={inputRef} />;
});
```

<hr />
</details>

## useStyle

The useStyle hook can be used to add extra CSS to your component.

```tsx
import { useStyle } from '@builder.io/mitosis';

export default function MyComponent(props) {
  useStyle(`
    button {
      font-size: 12px;
      outline: 1px solid black;
    }
  `);

  return (
    <button
      css={{
        background: 'blue',
        color: 'white',
      }}
      type="button"
    >
      Button
    </button>
  );
}
```

`useStyle` can also be used outside of the component's body:

```tsx
import { useStyle } from '@builder.io/mitosis';

export default function MyComponent(props) {
  return <button type="button">Button</button>;
}

useStyle(`
  button {
    background: blue;
    color: white;
    font-size: 12px;
    outline: 1px solid black;
  }
`);
```

## onInit

The `onInit` hook is the best place to put custom code to execute before the component mounts. It is executed before the `onMount` hook.

```tsx
import { onInit, onMount } from '@builder.io/mitosis';

export default function MyComponent() {
  onInit(() => {
    alert('First: I have init!');
  });

  onMount(() => {
    alert('Second: I have mounted!');
  });

  return <div>Hello world</div>;
}
```

## onMount

The onMount hook is the best place to put custom code to execute once the component mounts.

```tsx
import { onMount } from '@builder.io/mitosis';

export default function MyComponent() {
  onMount(() => {
    alert('I have mounted!');
  });

  return <div>Hello world</div>;
}
```

## onUnMount

The onUnMount hook is the best place to put any cleanup you need to do when a component is removed

```tsx
import { onUnMount } from '@builder.io/mitosis';

export default function MyComponent() {
  onUnMount(() => {
    alert('I have been removed!');
  });

  return <div>Hello world</div>;
}
```

## onUpdate

The onUpdate hook is the best place to put custom code that will either:

- if no `dependencies` array is provided: execute on every render
- if a non-empty `dependencies` array is provided: execute whenever any value in `dependencies` changes

```tsx
import { onUpdate, useStore } from '@builder.io/mitosis';

export default function OnUpdateWithDeps() {
  const state = useStore({
    a: 'a',
    b: 'b',
  });

  onUpdate(() => {
    console.log('Runs on every update/rerender');
  });

  onUpdate(() => {
    console.log('Runs when a or b changes', state.a, state.b);
  }, [state.a, state.b]);

  return <div />;
}
```

## useDefaultProps

The `useDefaultProps` hook sets default values for a component's props:

```tsx
import { useDefaultProps } from '@builder.io/mitosis';

export default function Button(props) {
  useDefaultProps({
    text: 'default text',
    link: 'https://builder.io/',
    openLinkInNewTab: false,
    onClick: () => {
      console.log('hi');
    },
  });

  return (
    <div>
      <a href={props.link} target={props.openLinkInNewTab ? '_blank' : undefined}>
        {props.text}
      </a>
      <button onClick={(event) => props.onClick(event)} type="button">
        {props.buttonText}
      </button>
    </div>
  );
}
```

You can also use `useDefaultProps` outside of the component body:

```tsx
import { useDefaultProps } from '@builder.io/mitosis';

useDefaultProps({
  text: 'default text',
});

export default function Button(props) {
  return <span>{props.text}</span>;
}
```


## useTarget

The `useTarget` hook returns a variable or runs a function based on the target

### Get variable based on target

```tsx
import { useTarget, useStore } from '@builder.io/mitosis';

export default function MyName() {
  const state = useStore({
    get name() {
      const prefix = useTarget<string | number | boolean>({
        default: 'Default str',
        react: 123,
        angular: true,
        vue: 'v',
      });
      return prefix + 'foo';
    }
  });

  return (
    <div>{state.name}</div>
  );
}
```

`default` target is the fallback if the correct target can't be found in the object you pass into `useTarget`.


### Run function based on target

```tsx
import { onMount, useTarget } from '@builder.io/mitosis';

export default function MyLogger() {
     onMount(() => {
        useTarget({
          react: () => {
            console.log('react');
          },
          qwik: () => {
            console.log('qwik');
          },
          default: () => {
            console.log('the rest');
          },
        });
    });

  return <span></span>;
}
```


# Gotchas and limitations

We have put together ESLint rules that will warn you when encountering these limitations (and many more). The rules themselves are a great source of documentation. Make sure to read up on them [here](https://github.com/BuilderIO/mitosis/tree/main/packages/eslint-plugin/docs/rules)

### Defining variables with the same name as a state property will shadow it

_Mitosis input_

```tsx
export default function MyComponent() {
  const state = useStore({
    foo: 'bar',

    doSomething() {
      const foo = state.foo;
    },
  });
}
```

_Mitosis output_

```tsx
import { useState } from 'react';

export default function MyComponent(props) {
  const [foo, setFoo] = useState(() => 'bar');
  function doSomething() {
    const foo = foo;
  }

  return <></>;
}
```

**Work around**

Use a different variable name

_Mitosis input_

```tsx
export default function MyComponent() {
  const state = useStore({
    foo: 'bar',

    doSomething() {
      const foo_ = state.foo;
    },
  });
}
```

_Mitosis output_

```tsx
import { useState } from 'react';

export default function MyComponent(props) {
  const [foo, setFoo] = useState(() => 'bar');
  function doSomething() {
    const foo_ = foo;
  }

  return <></>;
}
```

### Async methods can't be defined on "state"

_Mitosis input_

```tsx
export default function MyComponent() {
  const state = useStore({
    async doSomethingAsync(event) {
      //  ^^^^^^^^^^^^^^^^^^^^^^^^^
      //  Fails to parse this line
      return;
    },
  });
}
```

**Work around**

You can either:

a. Use promises in this context instead or
b. Use an immediately invoked async function

_Mitosis input_

```tsx
export default function MyComponent() {
  const state = useStore({
    doSomethingAsync(event) {
      void (async function () {
        const response = await fetch(); /* ... */
      })();
    },
  });
}
```

_Mitosis output_

```tsx
export default function MyComponent(props) {
  function doSomethingAsync(event) {
    void (async function () {
      const response = await fetch();
    })();
  }

  return <></>;
}
```

### Can't assign "params" to "state"

JSX lite parsing fails on referencing `props` in a call to `useState`.

_Mitosis input_

```tsx
export default function MyComponent(props) {
  const state = useStore({ text: props.text });
  //                             ^^^^^^^^^^
  //                             Error
}
```

**Work around**

Use _onMount_:

_Mitosis input_

```tsx
export default function MyComponent(props) {
  const state = useStore({ text: null });

  onMount(() => {
    state.text = props.text;
  });
}
```

_Mitosis output_

```tsx
import { useState } from 'react';

export default function MyComponent(props) {
  const [text, setText] = useState(() => null);

  useEffect(() => {
    setText(props.text);
  }, []);

  return <></>;
}
```

### Can't assign function output to "state"

JSX lite parsing fails if a state value isn't valid JSON

If the initial state value is a computed value (whether based on `props` or the output of some function), then you cannot inline it. Instead, use a getter method:

_Mitosis input_

```tsx
import { kebabCase } from 'lodash';

export default function MyComponent(props) {
  const state = useStore({
    name: kebabCase('Steve'),
    //    ^^^^^^^^^
    //    Error
  });

  return (
    <div>
      <h2>Hello, {state.name}</h2>
    </div>
  );
}
```

**Work around**

Use a getter method:

_Mitosis input_

```tsx
import { kebabCase } from 'lodash';

export default function MyComponent(props) {
  const state = useStore({
    get name() {
      return kebabCase('Steve');
    },
  });

  return (
    <div>
      <h2>Hello, {state.name}</h2>
    </div>
  );
}
```

_Mitosis output_

```tsx
import { kebabCase } from 'lodash';

export default function MyComponent(props) {
  function name() {
    return kebabCase('Steve');
  }

  return (
    <div>
      <h2>
        Hello,
        {name()}
      </h2>
    </div>
  );
}
```

### Can't destructure assignment from state

Destructuring assignment from `state` isn't currently supported, and is
ignored by the compiler.

_Mitosis input_

```tsx
export default function MyComponent() {
  const state = useStore({ foo: '1' });

  onMount(() => {
    const { foo } = state;
  });
}
```

_Mitosis output_

```tsx
import { useState } from 'react';

export default function MyComponent(props) {
  const [foo, setFoo] = useState(() => '1');

  useEffect(() => {
    const { foo } = state;
  }, []);

  return <></>;
}
```

**Work around**

Use standard assignment instead for now.

_Mitosis input_

```tsx
export default function MyComponent() {
  const state = useStore({ foo: '1' });

  onMount(() => {
    const foo = state.foo;
  });
}
```

_Mitosis output_

```tsx
import { useState } from 'react';

export default function MyComponent(props) {
  const [foo, setFoo] = useState(() => '1');

  useEffect(() => {
    const foo = foo;
  }, []);

  return <></>;
}
```

### Can't set default props value with destructuring

Setting default props value with destructuring isn't currently supported, and is
ignored by the compiler.

_Mitosis input_

```tsx
export default function MyComponent({ color = 'blue' }) {
  return <div>{color}</div>;
}
```

_Mitosis output_

```tsx
export default function MyComponent(props) {
  return <div>{color}</div>;
}
```

**Work around**

define a local variable

_Mitosis input_

```tsx
const DEFAULT_VALUES = {
  color: 'blue',
};
export default function MyComponent(props) {
  return <div>{props.color || DEFAULT_VALUES.color}</div>;
}
```

_Mitosis output_

```tsx
const DEFAULT_VALUES = {
  color: 'blue',
};
export default function MyComponent(props) {
  return <div>{props.color || DEFAULT_VALUES.color}</div>;
}
```

### Can't destructure props as ...rest

`...rest` props parameter isn't currently supported

_Mitosis input_

```tsx
export default function MyComponent({ children, ...rest }) {
  return <div {...rest}>{children}</div>;
}
```

_Mitosis output_

```tsx
export default function MyComponent(props) {
  return <div {...rest}>{props.children}</div>;
}
```


# Customization

When building Mitosis components, you might sometimes have unique and special needs. If you want to transform your Mitosis-generated output to fit your needs, by doing things like:

- add a special import statement at the top of each mitosis file
- remove a specific style attribute for one given target (for example, if you want your `react-native` output to omit a specific styling attribute that you rley on elsewhere.)
- modify only _some_ of your components to be dynamically imported

This (and much more) is possible thanks to Mitosis' powerful plugin system.

## Plugins

In your directory's `mitosis.config.js`, you can provide a `plugins` array for each code generator. You have many different kinds of plugins:

```tsx
export type Plugin = {
  name?: stirng;
  order?: number; // Sort plugins by number, no matter the position of the array
  build?: {
    // Happens before build
    pre?: (targetContext: TargetContext) => void | Promise<void>;
    // Happens after build
    post?: (
      targetContext: TargetContext,
      files?: {
        componentFiles: OutputFiles[];
        nonComponentFiles: OutputFiles[];
      },
    ) => void | Promise<void>;
  };
  json?: {
    // Happens before any modifiers
    pre?: (json: MitosisComponent) => MitosisComponent | void;
    // Happens after built in modifiers
    post?: (json: MitosisComponent) => MitosisComponent | void;
  };
  code?: {
    // Happens before formatting
    pre?: (code: string, json: MitosisComponent) => string;
    // Happens after formatting
    post?: (code: string, json: MitosisComponent) => string;
  };
};
```

We run plugins at 4 different points:

- preJSON: before any default modifiers run on the Mitosis JSON
- postJSON: after all built-in modifiers run on the Mitosis JSON
- preCode: before any formatting runs on the Mitosis output (we format using `prettier`)
- postCode: after any formatting runs on the Mitosis output (we format using `prettier`)

The JSON plugins receive the Mitosis component's full JSON object as an argument. Similarly, the code plugins receive the code string.

We even use plugins internally to generate Mitosis components! Here's an example of our [react-native plugin](https://github.com/BuilderIO/mitosis/blob/328572740bb3ff2f66924d431dc6360f5f4e0c62/packages/core/src/generators/react-native.ts#L82-L118).

You will see that we traverse the JSON nodes, and for each MitosisNode, we remove `class` and `className` values and bindings. That's because React-Native does not support class-names on mobile.

## useMetadata

What happens if you want a plugin to only apply to a specific set of components?
Or if you'd like to provide some metadata for your plugin,
and that metadata will depend on which component is being compiled?

This is where our `useMetadata` hook comes in handy.
All you need to do is import and use the hook
(you can use it anywhere in your mitosis component file, even at the top root level!):

```tsx
import { useMetadata } from '@builder.io/mitosis';

useMetadata({ mySpecialComponentType: 'ABC' });

export default function SmileReviews(props: SmileReviewsProps) {
  return <div>{/**/}</div>;
}
```

The metadata will be stored in your mitosis component's JSON
, under `json.meta.useMetadata.mySpecialComponentType`.
You can then use it in your JSON pre/post plugins:

```tsx
const plugin = {
  json: {
    pre: (json: MitosisComponent) => {
      const myComponentType = json.meta.useMetadata?.mySpecialComponentType;
      if (myComponentType === 'ABC') {
        //...
      }
    },
  },
};
```

Check the [example](https://github.com/BuilderIO/mitosis/tree/main/examples/metadata/src/components/metadata.lite.tsx) to see a complex `useMetadata` usage.

## Component JSON

The way Mitosis' engine works is:

- you write a `.lite.jsx` or `.lite.tsx` component
- the mitosis JSX parser converts it to a `MitosisComponent` JSON
- that JSON is fed to the generator(s) of your choice, which provide it to the plugins.

For more information on what the JSON contains, check out the documented types:

- [MitosisComponent](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/types/mitosis-component.ts)
- [MitosisNode](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/types/mitosis-node.ts): Each `MitosisComponent` will have multiple `MitosisNode` under `component.children`. Each node represents a DOM/JSX node


## Example

This is an example what you could do with a plugin.
In this example we want to create a documentation for one of our components, based on the target.

The example component `button.docs.lite.tsx`:

````tsx
/* button.docs.lite.tsx */
import { useMetadata } from '@builder.io/mitosis';
import MyButton from './my-button.lite';

useMetadata({
  docs: {
    name: "This is the name of my button"
  },
});

export default function ButtonDocs(props: any) {
  return <MyButton name={props.name}></MyButton>;
}
````

The mitosis config `mitosis.config.cjs`:

````js
/**
 * @type {import('@builder.io/mitosis'.MitosisConfig)}
 */
module.exports = {
  files: 'src/**',
  targets: [
    'angular',
    'react',
    'vue'
  ],
  commonOptions: {
    typescript: true,
    explicitBuildFileExtensions: {
      '.md': /.*(docs\.lite\.tsx)$/g
    },
    plugins: [
      () => ({
        code: {
          post: (code, json) => {
            if (json.meta?.useMetadata?.docs) {
              return (
                `# ${json.name} - ${json.pluginData?.target}\n\n` +
                `${JSON.stringify(json.meta?.useMetadata?.docs)}\n\n` +
                'This is the content:\n' +
                '````\n' +
                code +
                '\n````'
              );
            }

            return code;
          }
        }
      })
    ]
  }
};
````

We generate a new `button.docs.md` with a content based on the target, e.g. `vue`:

````markdown
# ButtonDocs - vue

{"name":"This is the name of my button"}

This is the content:
\````
<template>
  <MyButton :name="name"></MyButton>
</template>

<script setup lang="ts">
  import MyButton from "./my-button.vue";

  const props = defineProps(["name"]);
</script>

\````
````

> **Note:** We use `commonOptions` here to apply the plugin to every target.
>
> We use `explicitBuildFileExtensions` to transform the file extension always to `.md`,
otherwise you would get the default extension for your target. Like `.vue` for vue or `.tsx` for react.


# Context

Mitosis Contexts must be:

- created in their own file
- the file name _must_ end with `context.lite.ts`
- the default export must be a function that returns a context object

Example:

```ts
// simple.context.lite.ts
import { createContext } from '@builder.io/mitosis';

export default createContext({
  foo: 'bar',
  get fooUpperCase() {
    return this.foo.toUpperCase();
  },
  someMethod() {
    return this.fooUpperCase.toLowercase();
  },
  content: null,
  context: {} as any,
  state: {},
});
```

Then you can use it in your components:

```tsx
import { setContext, useContext } from '@builder.io/mitosis';
import Context from './simple.context.lite';

export default function ComponentWithContext(props: { content: string }) {
  // you can access the context using `useContext`
  const foo = useContext(Context);

  // you can use `setContext` to provide a new value for the context
  setContext(Context, {
    foo: 'baz',
    content() {
      return props.content;
    },
  });

  return (
    // you can also use `Context.provider` to provide a new value for the context
    <Context.Provider value={{ bar: 'baz' }}>{foo.value}</Context.Provider>
  );
}
```

# Configuration

## Mitosis Configuration

In the root of the project, from which you run mitosis,
you can add a `mitosis.config.js` file that will be read by Mitosis.
You can also specify a config file by option: `--config=<file>`.
An example might look like this:

````js react-options.cjs
// react-options.cjs

/** @type {import('@builder.io/mitosis').ToReactOptions} */
module.exports = {
	typescript: true
};
````

````js vue-options.cjs
// vue-options.cjs

/** @type {import('@builder.io/mitosis').ToVueOptions} */
module.exports = {
	typescript: true
};
````

````js mitosis-config.cjs
// mitosis-config.cjs
const react = require('./react-options.cjs');
const vue = require('./vue-options.cjs');

/** @type {import('@builder.io/mitosis').MitosisConfig} */
module.exports = {
	files: 'src/**',
	targets: ['vue', 'react'],
	options: {
		react,
		vue
	}
};
````


The `mitosis.config.js` file uses the [MitosisConfig](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/types/config.ts#L22) type:

```tsx
export type MitosisConfig = {
  /**
   * Apply common options to all targets
   */
  commonOptions?: Omit<BaseTranspilerOptions, 'experimental'>;
  /**
   * List of targets to compile to.
   */
  targets: Target[];
  /**
   * The output directory. Defaults to `output`.
   */
  dest?: string;
  /**
   * globs of files to transpile. Defaults to `src/*`.
   */
  files?: string | string[];

  /**
   * Optional list of globs to exclude from transpilation.
   */
  exclude?: string[];
  /**
   * The directory where overrides are stored. The structure of the override directory must match that of the source code,
   * with each target having its own sub-directory: `${overridesDir}/${target}/*`
   * Defaults to `overrides`.
   */
  overridesDir?: string;
  /**
   * Dictionary of per-target configuration. For each target, the available options can be inspected by going to
   * `packages/core/src/generators/xxx/types.ts`.
   *
   * Example:
   *
   * ```js
   * options: {
   *   vue: {
   *     prettier: false,
   *     namePrefix: (path) => path + '-my-vue-code',
   *   },
   *   react: {
   *     stateType: 'builder';
   *     stylesType: 'styled-jsx'
   *     plugins: [myPlugin]
   *   }
   * }
   * ```
*/
options: Partial<GeneratorOptions>;
/**
   * Configure a custom parser function which takes a string and returns MitosisJSON
   * Defaults to the JSXParser of this project (src/parsers/jsx)
*/
parser?: (code: string, path?: string) => MitosisComponent | Promise<MitosisComponent>;

/**
   * Configure a custom function that provides the output path for each target.
   * If you provide this function, you must provide a value for every target yourself.
*/
getTargetPath: ({ target }: { target: Target }) => string;

/**
   * Provide options to the parser.
*/
parserOptions?: {
  jsx: Partial<ParseMitosisOptions> & {
    /**
      * Path to your project's `tsconfig.json` file. Needed for advanced types parsing (e.g. signals).
    */
      tsConfigFilePath?: string;
    };
  };
};
```

### Targets

The `Targets` type can be any one of, or an array of the following strings:

```tsx
type targets =
  | 'alpine'
  | 'angular'
  | 'customElement'
  | 'html'
  | 'mitosis'
  | 'liquid'
  | 'react'
  | 'reactNative'
  | 'solid'
  | 'svelte'
  | 'swift'
  | 'template'
  | 'webcomponent'
  | 'vue'
  | 'stencil'
  | 'qwik'
  | 'marko'
  | 'preact'
  | 'lit'
  | 'rsc'
  | 'taro';
```

> **Note** that you can configure each target generator individually, providing [plugins](/docs/customizability/#plugins) on a case-by-case basis.

### Common options

The type `BaseTranspilerOptions` for `commonOptions` can be an object like this:

````ts

export interface BaseTranspilerOptions {
  /**
   * Runs `prettier` on generated components
   */
  prettier?: boolean;
  /**
   * Mitosis Plugins to run during codegen.
   */
  plugins?: Plugin[];
  /**
   * Enable `typescript` output
   */
  typescript?: boolean;
  /**
   * Preserves explicit filename extensions in import statements.
   */
  explicitImportFileExtension?: boolean;
}
````


### TypeScript configuration

TypeScript includes a full-fledged JSX compiler. Add the following configuration to your tsconfig.json to transpile JSX to mitosis-compatible JavaScript:

```js
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@builder.io/mitosis",
    // other config here
  }
}
```

For an example of TS configuration, look at our [basic example](https://github.com/BuilderIO/mitosis/tree/main/examples/basic/tsconfig.json)'s `tsconfig.json`.

### Overview configurations

There are ``options`` for targets which will affect all components for the generated target.
Furthermore, there are `useMetadata` options which affect only a single component.
For more information check out the `types.ts` file for each generator:

- [alpine](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/alpine/types.ts)
- [angular](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/angular/types.ts)
- [builder](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/builder/types.ts)
- [html](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/html/types.ts)
- [liquid](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/liquid/types.ts)
- [lit](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/lit/types.ts)
- [marko](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/marko/types.ts)
- [mitosis](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/mitosis/types.ts)
- [qwik](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/qwik/types.ts)
- [react](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/react/types.ts)
- [react-native](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/react-native/types.ts)
- [rsc](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/rsc/types.ts)
- [solid](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/solid/types.ts)
- [stencil](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/stencil/types.ts)
- [svelte](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/svelte/types.ts)
- [swift](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/swift/types.ts)
- [taro](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/taro/types.ts)
- [template](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/template/types.ts)
- [vue](https://github.com/BuilderIO/mitosis/blob/main/packages/core/src/generators/vue/types.ts)


# Components

## At a glance

Mitosis is inspired by many modern frameworks. You'll see components that look like React components and use React-like hooks, but have simple mutable state like Vue, use a static form of JSX like Solid, compile away like Svelte, and use a simple, prescriptive structure like Angular.

An example of a Mitosis component showing several features:

```tsx
import { For, Show, useStore } from '@builder.io/mitosis';

export default function MyComponent(props) {
  const state = useStore({
    newItemName: 'New item',
    list: ['hello', 'world'],
    addItem() {
      state.list = [...state.list, state.newItemName];
    },
  });

  return (
    <div>
      <Show when={props.showInput}>
        <input
          value={state.newItemName}
          onChange={(event) => (state.newItemName = event.target.value)}
        />
      </Show>
      <div css={{ padding: '10px' }}>
        <button onClick={() => state.addItem()}>Add list item</button>
        <div>
          <For each={state.list}>{(item) => <div>{item}</div>}</For>
        </div>
      </div>
    </div>
  );
}
```

## Components

Mitosis is component-driven like most modern frontend frameworks. Each Mitosis component should be in its own file and be the single default export. They are simple functions that return JSX elements

```tsx
export default function MyComponent() {
  return <div>Hello world!</div>;
}
```

## State

State is provided by the `useStore` hook. Currently, the name of this value must be `state` like below:

```tsx
export default function MyComponent() {
  const state = useStore({
    name: 'Steve',
  });

  return (
    <div>
      <h2>Hello, {state.name}</h2>
      <input
        onInput={(event) => {
          state.name = event.target.value;
        }}
        value={state.name}
      />
    </div>
  );
}
```

If the initial state value is a computed value (whether based on `props` or the output of some function), then you cannot inline it. Instead, use a getter method:

```tsx
export default function MyComponent(props) {
  const state = useStore({
    _name: '',
    get name() {
      // Use the state value if set, otherwise the prop value if set,
      // otherwise the default value of 'Steve'
      return state._name || props.name || 'Steve';
    },
    setName(name: string) {
      state._name = name;
    },
  });

  return (
    <div>
      <h2>Hello, {state.name}</h2>
      <input onInput={(event) => state.setName(event.target.value)} value={state.name} />
    </div>
  );
}
```

Components automatically update when state values change

### useState

Alternatively, you can use the `useState` hook to create a single piece of state

```tsx
export default function MyComponent() {
  const [name, setName] = useState('Steve');

  return (
    <div>
      <h2>Hello, {name}</h2>
      <input onInput={(event) => setName(event.target.value)} value={name} />
    </div>
  );
}
```

## Methods

The state object can also take methods.

```tsx
export default function MyComponent() {
  const state = useStore({
    name: 'Steve',
    updateName(newName) {
      state.name = newName;
    },
  });

  return (
    <div>
      <h2>Hello, {state.name}</h2>
      <input onInput={(event) => state.updateName(event.target.value)} value={state.name} />
    </div>
  );
}
```

## Styling

### `css-in-js`

Styling is done via the `css` prop on DOM elements and components. It takes CSS properties in `camelCase` (like the `style` object on DOM elements) and properties as valid CSS strings

```tsx
export default function CSSExample() {
  return <div css={{ marginTop: '10px', color: 'red' }} />;
}
```

You can also include media queries as keys, with values as style objects

```tsx
export default function ResponsiveExample() {
  return (
    <div
      css={{
        marginTop: '10px',
        '@media (max-width: 500px)': {
          marginTop: '0px',
        },
      }}
    />
  );
}
```

You can also use the [useStyle](/docs/hooks#usestyle) hook to add styles to a component

### `import .css file`

In general all imports inside a Mitosis component are passed to the generated output file.
Therefore, you can import a `.css` file like this:

````css
/* ./src/my-component/my-component.css */


.my-component{
    margin-top: 10px;
}
````

```tsx
/* ./src/my-component/my-component.lite.tsx */
import "./my-component.css";

export default function CSSExample() {
  return <div class="my-component" />;
}
```

> **Note:** The Mitosis cli will only move `.ts` and `.js` files to the output directory.
> You need to move the `.css` file by your own.

### `headless components`

Another approach is to develop your components without a fixed style inside the Mitosis component, a.k.a. "headless components".

You can do so by loading the styles inside the consuming webapp via a bundler (vite, webpack, etc.) or with a head stylesheet `<link rel="stylesheet" ...`.
You can then use `class` or `data-*` attributes inside your Mitosis component to apply those styles:

```tsx
/* ./src/my-component/my-component.lite.tsx */
export default function CSSExample() {
  return <div class="my-component" />;
}
```

## `class` vs `className`

Mitosis prefers that you use `class` to provide class name strings, but it also allows you to provide `className`. If both are used in the same component, it will attempt to merge the two. We recommend that you only use one (preferrably `class`, as that's what is internally preferred by Mitosis).

## Control flow

Control flow in Builder is static like [Solid](https://github.com/ryansolid/solid). Instead of using freeform javascript like in React, you must use control flow components like `<Show>` and `<For>`

### Show

Use `<Show>` for conditional logic. It takes a single `when` prop for the condition to match. When the condition is truthy, the children will render; otherwise, they will not. You can additionally provide an `else` prop for the content to be rendered in case the condition is falsy.

```tsx
export default function MyComponent(props) {
  return (
    <>
      <Show when={props.showContents} else={<span {...props.attributes}>{props.text}</span>}>
        Hello, I may or may not show!
      </Show>
      ;
    </>
  );
}
```

### For

Use `<For>` for repeating items, for instance mapping over an array. It takes a singular `each` prop for the array to iterate over. This component takes a singular function as a child that it passes the relevant item and index to, like below:

```tsx
export default function MyComponent(props) {
  const state = useStore({
    myArray: [1, 2, 3],
  });
  return <For each={state.myArray}>{(theArrayItem, index) => <div>{theArrayItem}</div>}</For>;
}
```

### Children

We use the standard method for passing children with `props.children`

```tsx
export default function MyComponent(props) {
  return <div>{props.children}</div>;
}
```

<details>
  <summary>For <strong>Web Component</strong> you need to use ShadowDom metadata</summary>

```tsx
import { useMetadata } from '@builder.io/mitosis';

useMetadata({
  isAttachedToShadowDom: true,
});
export default function MyComponent(props) {
  return <div>{props.children}</div>;
}
```

</details>

> **Note**: You cannot directly iterate over the children prop. It is a special property intended for rendering like this:

```jsx
<div>{props.children}</div>
````

Many frameworks do not support manipulating or iterating over it directly, unlike frameworks such as React or Vue.

### Fragment

The `Fragment` component accepts the `key` prop, which is typically used when the `Fragment` is the direct child of a `For` loop component.

````tsx
import { For, Fragment } from '@builder.io/mitosis';

export default function BasicForFragment() {
  return (
    <div>
      <For each={['a', 'b', 'c']}>
        {(option) => (
          <Fragment key={`key-${option}`}>
            <span>{option}</span>
          </Fragment>
        )}
      </For>
    </div>
  );
}

````

### Slot

When you want to register a named slot you do so using a prop.

```tsx
<div>
  <Layout
    top={<NavBar/>}
    left={<Sidebar/>}
    center={<Content/>}
  />
    anything else
  </Layout>
</div>
```

In this example we are registering `top`, `left`, and `center` for the `Layout` component to project.

If the `Layout` component was also a Mitosis component then we simply use the reference in the props.

```tsx
export default function Layout(props) {
  return (
    <div className="layout">
      <div className="top">{props.top}</div>
      <div className="left">{props.left}</div>
      <div className="center">{props.center}</div>
      {props.children}
    </div>
  );
}
```

or use the Slot component provided by component

```tsx
import { Slot } from '@builder.io/mitosis';

export default function Layout(props) {
  return (
    <div className="layout">
      <div className="top">
        <Slot name="top" />
      </div>
      <div className="left">
        <Slot name="left" />
      </div>
      <div className="center">
        <Slot name="center" />
      </div>
      <Slot />
    </div>
  );
}
```

For vue component a `slot` prop will be compiled into named slot

```html
<div class="layout">
  <div class="top"><slot name="top" /></div>
  <div class="left"><slot name="left" /></div>
  <div class="center"><slot name="center" /></div>
  <slot />
</div>
}
```

Mitosis compiles one component at a time and is only concerned with outputting the correct method for each framework. For the two examples above, here are the angular and html outputs.

```html
<div>
  <layout>
    <sidebar left></sidebar>
    <nav-bar top></nav-bar>
    <content center></content>
    anything else
  </layout>
  <div></div>
</div>
```

```tsx
@Component({
  selector: 'layout',
  template: `
    <div class="layout">
      <div class="top">
        <ng-content select="[top]"></ng-content>
      </div>
      <div class="left">
        <ng-content select="[left]"></ng-content>
      </div>
      <div class="center">
        <ng-content select="[center]"></ng-content>
      </div>
      <ng-content></ng-content>
    </div>
  `,
})
class LayoutComponent {}
```

In webcomponent you need to use ShadowDom metadata for named slots

<details>
  <summary>For <strong>Web Component</strong> you need to use ShadowDom metadata named slots</summary>

```tsx
import { useMetadata } from '@builder.io/mitosis';

useMetadata({
  isAttachedToShadowDom: true,
});
export default function Layout(props) {
  return (
    <div className="layout">
      <div className="top">{props.top}</div>
      <div className="left">{props.left}</div>
      <div className="center">{props.center}</div>
      {props.children}
    </div>
  );
}
```

</details>

### Default Slot content

```tsx
import { Slot } from '@builder.io/mitosis';

export default function Layout(props) {
  return (
    <div className="layout">
      <div className="top">
        <Slot name="top">Top default</Slot>
      </div>
      <div className="left">
        <Slot name="left" />
      </div>
      <div className="center">
        <Slot name="center" />
      </div>
      <Slot>Default child</Slot>
    </div>
  );
}
```

# CLI

We currently have two CLI commands: `mitosis build` and `mitosis compile`.

## `mitosis compile`

`mitosis compile` is a relatively straightforward command. It:

- Reads the config in `mitosis.config.js` (also could specify config file by option: `--config=<file>`)
- Receives 1 Mitosis component file as input
- Outputs it to 1 designated target.

You can get more information by running `mitosis --help`

## `mitosis build`

`mitosis build` is meant for entire project/folders, and is therefore more involved. It:

- Reads the config in `mitosis.config.js` (also could specify config file by option: `--config=<file>`)
- Identifies a source folder
- Reads _all_ Mitosis files in the source folder, and
  - Outputs a component for each target in the config or cli options
  - Performs additional transpilation steps on a per-target basis
- Reads _all_ non-Mitosis JS/TS files in the project, and
  - transpiles them as-is to JS
- Performs necessary transformations to both Mitosis & non-Mitosis files so that the output folder is coherent and valid (like renaming all component imports in a Svelte target such that they match the output name, ending in `.svelte`)

### options

|                             Option                              | Description                                           | Example                                                                                           |
| :-------------------------------------------------------------: | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
|       <p style="white-space:nowrap">--config=\<file\></p>       | To specify config file, defaults to mitosis.config.js | none                                                                                              |
|     <p style="white-space:nowrap">--targets=[format...]</p>     | To specify extra build targets                        | `mitosis build --targets react,vue,svelte` will add 'react', 'vue' and 'svelte' to build targets. |
| <p style="white-space:nowrap">--exclude-targets=[format...]</p> | To exclude targets from the targets of config file    | `mitosis build --exclude-targets react,vue` will remove 'react' and 'vue' from build targets      |


# Using Libraries

## JavaScript libraries

You can use any JavaScript library in your Mitosis components just like you would in any
other framework. Here's an example of using `lodash` in a Mitosis component:

```tsx
import { kebabCase } from 'lodash';

export default function MyComponent(props: { name: string }) {
  return <div>{kebabCase(props.name)}</div>;
}
```

## Framework-specific libraries

Because of the cross-framework nature of Mitosis, you cannot use framework-specific libraries
directly in Mitosis code.

For instance a React form library wouldn't make sense in the context of Mitosis, because
Mitosis components are framework-agnostic, so how would it work with Vue or Svelte?

### Focus on web fundamentals

The web platform has come a long way, and you may not need as many libraries as you think.

For example, for form handling, instead of using a library you can use the native `form` element
and its built-in validation:

```tsx
export default function MyComponent() {
  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    if (!form.checkValidity()) {
      alert('Form is invalid');
      return;
    }
    const data = new FormData(form);
    const email = data.get('email');
    console.log(email);
  }

  return (
    <form onSubmit={(event) => handleSubmit(event)}>
      <input type="email" name="email" required />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Use overrides (sparringly)

If you really need to use a framework-specific library, you can use overrides to
provide different implementations for different frameworks.

In the `overrides/` directory of a [Mitosis project](/docs/project-structure/), you can create a file for each
you want to override.

For example, if you have a file in `src/components/foo.lite.tsx` and you need a specific
implementation for Angular, for instance to use a specific library or unique feature, you can
create a file `overrides/angular/src/components.foo.ts` and provide the Angular-specific implementation.

See examples in the [overrides directory](https://github.com/BuilderIO/builder/tree/main/packages/sdks/overrides)
of the builder.io SDK.


# Quickstart

### Create a new project

Start a new Mitosis project by running the following command in your terminal:

```bash
npm create @builder.io/mitosis@latest
```

When prompted, enter a project name and select your desired output. Currently, we support outputs for React, Svelte, and Qwik. After making your selection, navigate to the project folder and install the dependencies.

<video
  width="752"
  height="428"
  autoplay
  playsInline
  muted
  loop
  src="https://cdn.builder.io/o/assets%2FYJIGb4i01jvw0SRdL5Bt%2Fac60d98b072940cabb00bd2f2839a7b9%2Fcompressed?apiKey=YJIGb4i01jvw0SRdL5Bt&token=ac60d98b072940cabb00bd2f2839a7b9&alt=media&optimized=true"
/>

### Explore the project structure

Focus on the `library` folder within your project. In `library/src`, you will find:

- An `autocomplete` component
- A `todo-app` component

Each component is housed in its own folder and written in a `.lite.tsx` file, the standard file format for Mitosis components. Also, explore the `library/packages` folder, which contains starter code for the outputs you selected during setup.

### Run the project

1.  **Start the development server**
    From within the `library` folder, run the following command to start the development server:
    `npm run start`

            This command automatically generates component code in the corresponding output folder. You write code once, and it gets converted into React, Qwik, and Svelte code.

2.  **Add a new component**
    Create a `library/src/greet.lite.tsx` file with the following code:

```tsx
import { useStore } from '@builder.io/mitosis';

export default function Greet() {
  const state = useStore({
    name: '',
  });

  return (
    <div>
      <input
        value={state.name}
        onChange={(event) => (state.name = event.target.value)}
        placeholder="Your name"
      />
      <div>Hello, {state.name}!</div>
    </div>
  );
}
```

3.  **Configure project settings**
    In the root of your project, add a `mitosis.config.js` file to specify the target output. Possible targets include Alpine, Angular, customElement, HTML, Mitosis, Liquid, React, React Native, Solid, Svelte, Swift, Template, Webcomponent, Vue (version 3), Stencil, Qwik, Marko, Preact, Lit, and RSC.

By following these steps, you'll be well on your way to developing with Mitosis, taking advantage of its capability to write once and deploy to multiple frameworks.

See our [CLI documentation](/docs/cli) for more commands you can run for developing and building.

### Verify your components

After generating the component code with Mitosis, the next step is to ensure that your components work as expected. Here's how to verify them using Svelte as the target framework:

1. **Export the components**

   Export the `Greet` component from the `library/src/index.ts` file:

   ```tsx
   export { default as Greet } from './greet.lite';
   ```

2. **Build the library**

   From the `library/packages/svelte` folder, build the Svelte components by running the following command:

   ```bash
   npm run build:watch
   ```

3. **Test in a an application**

   We'll use Svelte for this example, but these same steps work for any other output frameworks.

   - Navigate to the `test-apps/svelte` folder:
     ```bash
     cd test-apps/svelte
     ```
   - Open the `src/routes/+page.svelte` file and import the component:

     ```tsx
     <script lang="ts">
       import { AutoComplete, Todos, Greet } from '@demo-one/library-svelte';
     </script>

     <h1>Welcome to SvelteKit</h1>
     <AutoComplete />
     <Todos />
     <Greet />
     <p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

     ```

4. **Start the dev server**

   Start the development server for your Svelte app with the following command:

   ```bash
   npm run dev
   ```

5. **Verify the component**

   Open [http://localhost:5173](http://localhost:5173/) in your browser. You should see the functioning Greet component along with the other components.

By following these steps, you'll be well on your way to developing with Mitosis, taking advantage of its capability to write once and deploy to multiple frameworks.

<video
  width="752"
  height="428"
  autoplay
  playsInline
  muted
  loop
  src="https://cdn.builder.io/o/assets%2FYJIGb4i01jvw0SRdL5Bt%2F65318cd035a940f88f7c19bfb0844e31%2Fcompressed?apiKey=YJIGb4i01jvw0SRdL5Bt&token=65318cd035a940f88f7c19bfb0844e31&alt=media&optimized=true"
/>

### Next steps

- Read more on writing [Mitosis components](/docs/components)
- Explore the [Figma integration](/docs/figma) for generating Mitosis components from Figma designs