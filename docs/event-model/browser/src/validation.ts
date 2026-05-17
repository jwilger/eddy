import type { CommandDefinition, EventDefinition, ReadModel, Slice, Stream, ViewDefinition } from './types';

export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssue = {
  severity: ValidationSeverity;
  message: string;
  path: string;
  elementKind?: 'model' | 'stream' | 'event' | 'command' | 'read_model' | 'view' | 'slice' | 'scenario';
  elementName?: string;
};

export type ValidationReport = {
  valid: boolean;
  issues: ValidationIssue[];
};

const REQUIRED_TOP_LEVEL_KEYS = ['name', 'version', 'streams', 'events', 'commands', 'read_models', 'slices'];

export function validateEventModel(model: unknown): ValidationReport {
  const issues: ValidationIssue[] = [];
  if (!isRecord(model)) {
    return {
      valid: false,
      issues: [issue('error', 'model must be a JSON object', '$', 'model')],
    };
  }

  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!(key in model)) {
      issues.push(issue('error', `missing top-level key '${key}'`, `$.${key}`, 'model'));
    }
  }

  const streams = list<Stream>(model.streams, 'streams', issues);
  const events = list<EventDefinition>(model.events, 'events', issues);
  const commands = list<CommandDefinition>(model.commands, 'commands', issues);
  const readModels = list<ReadModel>(model.read_models, 'read_models', issues);
  const views = list<ViewDefinition>(model.views ?? [], 'views', issues, false);
  const slices = list<Slice>(model.slices, 'slices', issues);

  const streamNames = namedSet(streams, 'streams', 'stream', issues);
  const eventNames = namedSet(events, 'events', 'event', issues);
  const commandNames = namedSet(commands, 'commands', 'command', issues);
  const readModelNames = namedSet(readModels, 'read_models', 'read_model', issues);
  const viewNames = namedSet(views, 'views', 'view', issues);

  const eventAttributes = collectAttributes(events);
  const commandInputs = collectCommandInputs(commands);
  const commandReads = collectCommandReads(commands);
  const commandExternalInputs = collectCommandExternalInputs(commands);
  const eventProducers = collectEventProducers(commands, eventNames);

  validateEvents(events, streamNames, eventAttributes, eventProducers, commandInputs, commandReads, commandExternalInputs, issues);
  validateCommands(commands, readModelNames, eventNames, issues);
  validateReadModels(readModels, eventAttributes, issues);
  validateViews(views, readModelNames, eventNames, eventAttributes, issues);
  validateSlices(slices, commandNames, eventNames, readModelNames, viewNames, issues);
  validateBoard(model, commandNames, eventNames, readModelNames, viewNames, issues);

  return { valid: !issues.some((item) => item.severity === 'error'), issues };
}

function validateBoard(
  model: Record<string, unknown>,
  commandNames: Set<string>,
  eventNames: Set<string>,
  readModelNames: Set<string>,
  viewNames: Set<string>,
  issues: ValidationIssue[],
) {
  if (!isRecord(model.board)) return;
  const lanes = Array.isArray(model.board.lanes) ? model.board.lanes.filter(isRecord) : [];
  const laneNames = new Set(lanes.map((lane) => String(lane.id ?? '')).filter(Boolean));
  const boardSlices = Array.isArray(model.board.slices) ? model.board.slices.filter(isRecord) : [];
  for (const boardSlice of boardSlices) {
    const sliceName = String(boardSlice.name ?? '<unnamed>');
    const elements = Array.isArray(boardSlice.elements) ? boardSlice.elements.filter(isRecord) : [];
    const elementIds = new Set<string>();
    for (const element of elements) {
      const id = String(element.id ?? '');
      const kind = String(element.kind ?? '');
      const name = String(element.name ?? '');
      const lane = String(element.lane ?? '');
      if (!id) {
        issues.push(issue('error', `board slice '${sliceName}' has an element without id`, `$.board.slices.${sliceName}.elements`, 'slice', sliceName));
      } else if (elementIds.has(id)) {
        issues.push(issue('error', `board slice '${sliceName}' has duplicate element id '${id}'`, `$.board.slices.${sliceName}.elements.${id}`, 'slice', sliceName));
      }
      elementIds.add(id);
      if (lane && !laneNames.has(lane)) {
        issues.push(issue('error', `board element '${id}' references unknown lane '${lane}'`, `$.board.slices.${sliceName}.elements.${id}.lane`, 'slice', sliceName));
      }
      if (kind === 'command' && !commandNames.has(name)) {
        issues.push(issue('error', `board element '${id}' references unknown command '${name}'`, `$.board.slices.${sliceName}.elements.${id}.name`, 'slice', sliceName));
      } else if (kind === 'event' && !eventNames.has(name)) {
        issues.push(issue('error', `board element '${id}' references unknown event '${name}'`, `$.board.slices.${sliceName}.elements.${id}.name`, 'slice', sliceName));
      } else if (kind === 'read_model' && !readModelNames.has(name)) {
        issues.push(issue('error', `board element '${id}' references unknown read model '${name}'`, `$.board.slices.${sliceName}.elements.${id}.name`, 'slice', sliceName));
      } else if (kind === 'view' && !viewNames.has(name)) {
        issues.push(issue('error', `board element '${id}' references unknown view '${name}'`, `$.board.slices.${sliceName}.elements.${id}.name`, 'slice', sliceName));
      }
    }
    const connections = Array.isArray(boardSlice.connections) ? boardSlice.connections.filter(isRecord) : [];
    for (const connection of connections) {
      const from = String(connection.from ?? '');
      const to = String(connection.to ?? '');
      if (!elementIds.has(from)) {
        issues.push(issue('error', `board slice '${sliceName}' connection references unknown source '${from}'`, `$.board.slices.${sliceName}.connections`, 'slice', sliceName));
      }
      if (!elementIds.has(to)) {
        issues.push(issue('error', `board slice '${sliceName}' connection references unknown target '${to}'`, `$.board.slices.${sliceName}.connections`, 'slice', sliceName));
      }
    }
  }
}

export function issuesFor(report: ValidationReport, elementKind: ValidationIssue['elementKind'], elementName?: string): ValidationIssue[] {
  return report.issues.filter((item) => item.elementKind === elementKind && (!elementName || item.elementName === elementName));
}

function validateEvents(
  events: EventDefinition[],
  streamNames: Set<string>,
  eventAttributes: Map<string, Set<string>>,
  eventProducers: Map<string, Set<string>>,
  commandInputs: Map<string, Set<string>>,
  commandReads: Map<string, Set<string>>,
  commandExternalInputs: Map<string, Set<string>>,
  issues: ValidationIssue[],
) {
  for (const event of events) {
    if (!event.name) continue;
    if (event.stream && !streamNames.has(event.stream)) {
      issues.push(issue('error', `event '${event.name}' references unknown stream '${event.stream}'`, `$.events.${event.name}.stream`, 'event', event.name));
    }
    if (!eventProducers.has(event.name)) {
      issues.push(issue('error', `event '${event.name}' is not produced by any command`, `$.events.${event.name}`, 'event', event.name));
    }
    for (const attribute of event.attributes ?? []) {
      if (!attribute.name) continue;
      if (!attribute.source) {
        issues.push(issue('error', `event '${event.name}' attribute '${attribute.name}' is missing source`, `$.events.${event.name}.attributes.${attribute.name}`, 'event', event.name));
        continue;
      }
      if (!sourceIsValid(attribute.source, eventProducers.get(event.name) ?? new Set(), commandInputs, commandReads, commandExternalInputs)) {
        issues.push(issue('error', `event '${event.name}' attribute '${attribute.name}' has invalid source '${attribute.source}'`, `$.events.${event.name}.attributes.${attribute.name}.source`, 'event', event.name));
      }
    }
    eventAttributes.set(event.name, eventAttributes.get(event.name) ?? new Set());
  }
}

function validateCommands(commands: CommandDefinition[], readModelNames: Set<string>, eventNames: Set<string>, issues: ValidationIssue[]) {
  for (const command of commands) {
    if (!command.name) continue;
    for (const readName of command.reads ?? []) {
      if (!readModelNames.has(readName)) {
        issues.push(issue('error', `command '${command.name}' reads unknown read model '${readName}'`, `$.commands.${command.name}.reads`, 'command', command.name));
      }
    }
    for (const eventName of command.produces ?? []) {
      if (!eventNames.has(eventName)) {
        issues.push(issue('error', `command '${command.name}' produces unknown event '${eventName}'`, `$.commands.${command.name}.produces`, 'command', command.name));
      }
    }
  }
}

function validateReadModels(readModels: ReadModel[], eventAttributes: Map<string, Set<string>>, issues: ValidationIssue[]) {
  for (const readModel of readModels) {
    if (!readModel.name) continue;
    for (const field of readModel.fields ?? []) {
      if (!field.name) continue;
      if (!field.source) {
        issues.push(issue('error', `read model '${readModel.name}' field '${field.name}' is missing source`, `$.read_models.${readModel.name}.fields.${field.name}`, 'read_model', readModel.name));
        continue;
      }
      if (!eventAttributeExists(field.source, eventAttributes)) {
        issues.push(issue('error', `read model '${readModel.name}' field '${field.name}' references unknown event attribute '${field.source}'`, `$.read_models.${readModel.name}.fields.${field.name}.source`, 'read_model', readModel.name));
      }
    }
  }
}

function validateViews(
  views: ViewDefinition[],
  readModelNames: Set<string>,
  eventNames: Set<string>,
  eventAttributes: Map<string, Set<string>>,
  issues: ValidationIssue[],
) {
  for (const view of views) {
    if (!view.name) continue;
    for (const readModelName of view.uses_read_models ?? []) {
      if (!readModelNames.has(readModelName)) {
        issues.push(issue('error', `view '${view.name}' uses unknown read model '${readModelName}'`, `$.views.${view.name}.uses_read_models`, 'view', view.name));
      }
    }
    for (const eventName of view.uses_events ?? []) {
      if (!eventNames.has(eventName)) {
        issues.push(issue('error', `view '${view.name}' uses unknown event '${eventName}'`, `$.views.${view.name}.uses_events`, 'view', view.name));
      }
    }
    for (const field of view.fields ?? []) {
      if (field.source && !eventAttributeExists(field.source, eventAttributes)) {
        issues.push(issue('error', `view '${view.name}' field '${field.name}' references unknown event attribute '${field.source}'`, `$.views.${view.name}.fields.${field.name}.source`, 'view', view.name));
      }
    }
  }
}

function validateSlices(
  slices: Slice[],
  commandNames: Set<string>,
  eventNames: Set<string>,
  readModelNames: Set<string>,
  viewNames: Set<string>,
  issues: ValidationIssue[],
) {
  for (const slice of slices) {
    if (!slice.name) continue;
    validateRefs(slice.commands, commandNames, 'command', slice.name, issues);
    validateRefs(slice.events, eventNames, 'event', slice.name, issues);
    validateRefs(slice.read_models, readModelNames, 'read_model', slice.name, issues);
    validateRefs(slice.views, viewNames, 'view', slice.name, issues);

    const scenarios = slice.scenarios?.length ? slice.scenarios : scenarioFallback(slice);
    if (slice.type === 'state_change') {
      validateScenarioKeys(slice.name, scenarios, ['given', 'when', 'then'], issues);
    } else if (slice.type === 'state_view') {
      validateScenarioKeys(slice.name, scenarios, ['given', 'then'], issues);
    }
  }
}

function validateRefs(values: string[] | undefined, knownNames: Set<string>, kind: 'command' | 'event' | 'read_model' | 'view', sliceName: string, issues: ValidationIssue[]) {
  for (const value of values ?? []) {
    if (!knownNames.has(value)) {
      issues.push(issue('error', `slice '${sliceName}' references unknown ${kind.replace('_', ' ')} '${value}'`, `$.slices.${sliceName}.${kind}`, 'slice', sliceName));
    }
  }
}

function validateScenarioKeys(sliceName: string, scenarios: Record<string, unknown>[], requiredKeys: string[], issues: ValidationIssue[]) {
  if (!scenarios.length) {
    issues.push(issue('error', `slice '${sliceName}' has no scenarios`, `$.slices.${sliceName}.scenarios`, 'slice', sliceName));
    return;
  }
  scenarios.forEach((scenario, index) => {
    for (const key of requiredKeys) {
      if (!(key in scenario) || (key !== 'given' && isEmpty(scenario[key]))) {
        issues.push(issue('error', `slice '${sliceName}' scenario '${String(scenario.name ?? index)}' is missing '${key}'`, `$.slices.${sliceName}.scenarios.${index}.${key}`, 'slice', sliceName));
      }
    }
  });
}

function scenarioFallback(slice: Slice): Record<string, unknown>[] {
  if ('given' in slice || 'when' in slice || 'then' in slice) {
    return [{ given: slice.given, when: slice.when, then: slice.then }];
  }
  return [];
}

function collectAttributes(events: EventDefinition[]): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  for (const event of events) {
    if (!event.name) continue;
    result.set(event.name, new Set((event.attributes ?? []).map((attribute) => attribute.name).filter(Boolean)));
  }
  return result;
}

function collectCommandInputs(commands: CommandDefinition[]): Map<string, Set<string>> {
  return new Map(commands.filter((command) => command.name).map((command) => [command.name, new Set(command.inputs ?? [])]));
}

function collectCommandReads(commands: CommandDefinition[]): Map<string, Set<string>> {
  return new Map(commands.filter((command) => command.name).map((command) => [command.name, new Set(command.reads ?? [])]));
}

function collectCommandExternalInputs(commands: CommandDefinition[]): Map<string, Set<string>> {
  return new Map(commands.filter((command) => command.name).map((command) => [command.name, new Set(command.external_inputs ?? [])]));
}

function collectEventProducers(commands: CommandDefinition[], eventNames: Set<string>): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  for (const command of commands) {
    if (!command.name) continue;
    for (const eventName of command.produces ?? []) {
      if (!eventNames.has(eventName)) continue;
      if (!result.has(eventName)) result.set(eventName, new Set());
      result.get(eventName)!.add(command.name);
    }
  }
  return result;
}

function sourceIsValid(
  source: string,
  producerNames: Set<string>,
  commandInputs: Map<string, Set<string>>,
  commandReads: Map<string, Set<string>>,
  commandExternalInputs: Map<string, Set<string>>,
): boolean {
  if (source.startsWith('generated.') && source.length > 'generated.'.length) return true;
  if (source.startsWith('command.')) {
    const inputName = source.slice('command.'.length).split('.')[0];
    return [...producerNames].some((commandName) => commandInputs.get(commandName)?.has(inputName));
  }
  if (source.startsWith('external.')) {
    const externalName = source.slice('external.'.length).split('.')[0];
    return [...producerNames].some((commandName) => commandExternalInputs.get(commandName)?.has(externalName));
  }
  if (source.startsWith('read_model.')) {
    const readModelName = source.slice('read_model.'.length).split('.')[0];
    return [...producerNames].some((commandName) => commandReads.get(commandName)?.has(readModelName));
  }
  return false;
}

function eventAttributeExists(source: string, eventAttributes: Map<string, Set<string>>): boolean {
  const normalized = source.startsWith('event.') ? source.slice('event.'.length) : source;
  const [eventName, attributeName] = normalized.split('.', 2);
  return Boolean(eventName && attributeName && eventAttributes.get(eventName)?.has(attributeName));
}

function namedSet<T extends { name?: string }>(items: T[], listName: string, elementKind: ValidationIssue['elementKind'], issues: ValidationIssue[]): Set<string> {
  const names = new Set<string>();
  items.forEach((item, index) => {
    if (!item.name) {
      issues.push(issue('error', `${listName}[${index}] is missing a non-empty name`, `$.${listName}.${index}.name`, elementKind));
      return;
    }
    if (names.has(item.name)) {
      issues.push(issue('error', `${listName} contains duplicate name '${item.name}'`, `$.${listName}.${item.name}`, elementKind, item.name));
    }
    names.add(item.name);
  });
  return names;
}

function list<T>(value: unknown, key: string, issues: ValidationIssue[], required = true): T[] {
  if (value === undefined && !required) return [];
  if (!Array.isArray(value)) {
    issues.push(issue('error', `top-level key '${key}' must be a list`, `$.${key}`, 'model'));
    return [];
  }
  return value as T[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function issue(severity: ValidationSeverity, message: string, path: string, elementKind?: ValidationIssue['elementKind'], elementName?: string): ValidationIssue {
  return { severity, message, path, elementKind, elementName };
}
