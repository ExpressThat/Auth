# Shared TypeScript Configuration

All first-party TypeScript projects extend one of these root-owned profiles.

| Profile | Use |
| --- | --- |
| `base.json` | Runtime-neutral strictness and portable module behavior |
| `library.json` | Composite runtime-neutral packages and declaration contracts |
| `node.json` | Node.js applications, adapters, and tests |
| `workers.json` | Workers applications and portable runtime packages |
| `react.json` | Vite and React browser applications |
| `tooling.json` | Repository automation, generators, and quality tools |

The base profile deliberately enables strict nullability, implicit-any checks,
unchecked indexed access, exact optional properties, unknown catch variables,
unused code checks, implicit-return checks, side-effect import checks, index
signature access restrictions, override checks, switch fallthrough checks,
isolated modules, erasable syntax, and verbatim ESM syntax.

Projects may add required libraries and ambient type packages. They must not
disable a base strictness rule without a reviewed ADR and a narrower replacement
control.
