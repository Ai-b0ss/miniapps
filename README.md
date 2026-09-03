# miniapps

Public utility projects and testable components.

## Free Fabric CI Harness

`free-fabric-ci-harness/` is a real public software component: a loopback-only acceptance harness used to validate local OpenAI-compatible Chat and Responses surfaces, plus its transport/privacy boundary. It is intentionally self-contained and contains no private repository checkout, provider credentials, session state, or production data.

The repository's GitHub Actions workflow tests the public code committed here on standard Ubuntu and Windows GitHub-hosted runners. This keeps the CI activity directly related to the software project in this repository rather than using the repository as an opaque proxy for unrelated private workloads.

The public harness is suitable for:

- validating two distinct local services;
- exact tool-call/tool-result round trips;
- bounded soak behavior;
- loopback-only networking;
- proxy and redirect rejection;
- malformed local HTTP containment;
- endpoint alias de-duplication.

Private product-specific code and secrets stay outside this repository. Only components deliberately published as reusable public tooling belong here.
