# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: button.spec.ts >> button is rendered correctly
- Location: tests\button.spec.ts:3:1

# Error details

```
Error: browserContext.close: Protocol error (Browser.removeBrowserContext): can't access property "_maybeDontRestoreTabs", this._windows[aWindow.__SSi] is undefined
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "Svelte — @expressthat-auth/ui" [level=1] [ref=e4]
  - button "Hello from Svelte" [ref=e5]
```