# Change Fragments

Add one Markdown fragment for every externally observable or release-relevant
task. Name it `<task-id-lowercase>-<short-slug>.md`, copy `TEMPLATE.md`, and
complete every field.

Fragments are written while behavior is implemented. They are folded into
`CHANGELOG.md` by release preparation and removed in the release commit.
Embargoed vulnerability details never belong here.

Valid categories are `added`, `changed`, `deprecated`, `removed`, `fixed`,
`security`, `migration`, and `internal`. A fragment can name several comma-
separated audiences or surfaces. Breaking and migration fields must be
explicit even when false or none.

Internal-only tasks can use `category: internal`. If a task truly has no
release impact, its completion evidence must explain why no fragment exists.
