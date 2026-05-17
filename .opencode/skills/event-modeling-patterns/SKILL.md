---
name: event-modeling-patterns
description: Event Modeling pattern advice; use when deciding whether something is an event, command, read model, state change, state view, automation, or translation.
---

# Event Modeling Patterns

Use this skill as a compact reference for classifying model elements and answering Event Modeling questions.

## Elements

Event:
A persisted fact that happened in the system. Name events in past tense. Events are what the system remembers after the workflow step is complete.

Command:
A request to do something that may change system state. Name commands in imperative form. A successful command produces one or more events.

Read model:
A projection or query built from stored events. It supplies information to a person, screen, report, or background process. It is not the source of truth.

External event or input:
Information from outside the modeled system boundary, such as an API callback, file import, Kafka record, tool process result, filesystem observation, timer, or human-provided external fact.

Stream:
A consistency boundary and event sequence. In EventCore terms, this is where related events are appended and read for decisions requiring consistency.

Slice:
The smallest useful unit of behavior in the model. A slice should be understandable and testable on its own. When implementing a slice in Eddy, default to proving it as user-visible UI behavior with a black-box Cucumber scenario against the compiled, running program unless the user explicitly narrows the boundary.

## Four Main Patterns

State change:
A person, process, or automation asks the system to change something. The command succeeds by recording one or more events.

Typical shape:
`given prior events -> when command -> then new events`

State view:
Stored events are projected into information that can be seen or queried.

Typical shape:
`given prior events -> then read model displays fields`

Automation:
The system reacts without direct user action. It is usually triggered by an event, timer, or other signal, reads a view or state, and issues a command.

Translation:
Information crosses the system boundary. A translation turns external data into internal events or turns internal events into external messages/actions.

## Naming Guidance

- Events: past tense facts, such as `RepairTicketOpened`, `CustomerNotified`, `PaymentFailed`.
- Commands: imperative actions, such as `OpenRepairTicket`, `NotifyCustomer`, `RecordPaymentFailure`.
- Read models: nouns describing usable information, such as `repair_queue`, `customer_contact_summary`, `cart_items`.
- Slices: user/business phrases, such as `Open a repair ticket`, `Show today's repair queue`.

## Decision Heuristics

If the user says "we need to save/remember that," model an event.

If the user says "someone does/clicks/submits/approves," model a command and ask what fact results.

If the user says "they need to see/know/choose," model a read model and ask what stored facts provide that data.

If the user says "the system notices/automatically sends/periodically checks," model an automation.

If the user says "another system tells us/we import/we receive," model a translation or external input.

If the user states a rule, model at least one concrete scenario.

## Scenario Guidance

Use Given/When/Then for state changes:

- Given: prior events that put the system in a state.
- When: the command being executed.
- Then: expected events or expected rejection/error.

Use Given/Then for state views:

- Given: prior events.
- Then: expected read-model content.

For automations, usually model the trigger and resulting command/event flow, then add scenarios to the state view and state change portions.

For translations, identify the external input, the internal command if any, and the internal event recorded after translation.

When turning any slice into implementation work, translate the modeled scenario into an outer BDD scenario first: launch Eddy as a compiled program, drive the UI/process boundary as a user or external actor would, and assert on visible behavior or process-level effects. Use command/event/read-model tests only as drill-down support beneath that outer scenario.

## Common Corrections

- "Add customer" is not an event. Ask what happened after it succeeded: `CustomerAdded` or `CustomerRegistered`.
- A read model cannot require data that no event has ever captured.
- An event should not describe intent. It should describe a completed fact.
- A command should not be named like a fact. It asks the system to do something.
- A workflow does not need to include all possible branches. Model the main flow first, then model alternate flows separately or as scenarios.
