# Event-Model Slice Implementation

When the user asks to implement, complete, plan, or describe a slice from an event model, default to a full user-facing vertical slice through the UI unless the user explicitly narrows the scope.

The outer RED for an event-model slice is a black-box BDD Cucumber scenario that drives the compiled, running program through its UI/process boundary. For Eddy's TUI, that means launching the built binary in an isolated workspace, interacting through a real pseudo-terminal, and asserting only on user-visible terminal state or process-level effects.

Do not substitute handler, protocol, projection, or component tests for the slice's outer RED. Those lower-level tests are drill-down tests: add them only after the black-box Cucumber scenario exists and its failure identifies an internal decision point that needs narrower feedback.

If a requested slice might not be user-facing, ask whether the slice should start from the black-box UI BDD boundary or from a narrower process/API boundary before writing the plan or test.
