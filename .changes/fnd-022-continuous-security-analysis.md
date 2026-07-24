---
task: FND-022
category: security
audiences: developers, operators
surfaces: ci, source, dependencies, containers, deployment
breaking: false
migration: none
security: continuous-fail-closed-analysis
---

Added continuous typed, static, dependency, credential, artifact, deployment,
and container security analysis with severity gates, exact expiring
suppressions, weekly scheduled scans, and retained SARIF and minimized JSON
reports.
