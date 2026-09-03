# Free Fabric CI Harness

This directory is a deliberately public, reusable acceptance component for local OpenAI-compatible services.

## What is public here

- `desktop/local_http.py`: loopback-only HTTP transport with proxy and redirect suppression plus malformed-response containment.
- `desktop/combined_acceptance.py`: bounded two-surface acceptance harness for OpenAI Chat and Responses tool-call/tool-result contracts.
- `tests/test_public_harness.py`: cross-platform regressions for endpoint identity, loopback guards, redirects, ambient proxies, malformed chunked bodies, and real two-server tool round trips.

## Security boundary

This project does not checkout any private repository, download private source, or require secrets. CI only tests the public code committed in this directory. Product-specific implementations can consume the same public harness without making their private source part of this repository.

## Run locally

```bash
cd free-fabric-ci-harness
python -m unittest discover -s tests -p 'test_*.py' -v
```

The same command is run by GitHub Actions on both Ubuntu and Windows.
