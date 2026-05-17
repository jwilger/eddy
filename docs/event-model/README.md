# Event Model

Eddy uses Event Modeling as the source of truth for server behavior, but the model is built from real workflow modeling sessions rather than speculative examples.

Workflow models live in `docs/event-model/workflows/` as `*.eventmodel.json` files. Each file should describe one coherent workflow or use case. Generated HTML belongs in `docs/event-model/generated/` and should be treated as derived output.

Use the project-local opencode `event-modeler` agent to facilitate new modeling sessions. That agent keeps the discussion in business language, creates workflow JSON after the behavior is understood, and validates information completeness before the model is treated as ready.

Validate workflow models with:

```sh
just event-model-validate
```

Generate the event model browser with:

```sh
just event-model-generate
```

Do not add placeholder workflows or invented event vocabularies just to populate this directory. If a workflow has not been modeled with the user, leave it absent.
