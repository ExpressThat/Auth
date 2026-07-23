# Provider Adapters

Provider and infrastructure adapter implementations live in independently
versioned workspaces below this directory.

Every adapter implements a runtime-neutral contract, declares supported
runtimes and residency capabilities, and runs the owning contract's conformance
suite. Core domain packages must never import an adapter implementation.

Adapters are added only when their contract and implementation task begins; this
directory intentionally contains no placeholder provider logic.
