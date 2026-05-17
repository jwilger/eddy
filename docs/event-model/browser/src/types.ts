export type NamedRef = string | { name: string };

export type Attribute = {
  name: string;
  type?: string;
  source?: string;
  description?: string;
};

export type Stream = {
  name: string;
  id_pattern?: string;
  purpose?: string;
};

export type EventDefinition = {
  name: string;
  stream?: string;
  description?: string;
  attributes?: Attribute[];
};

export type CommandDefinition = {
  name: string;
  description?: string;
  inputs?: string[];
  reads?: string[];
  external_inputs?: string[];
  produces?: string[];
};

export type ReadModel = {
  name: string;
  description?: string;
  fields?: Attribute[];
};

export type ViewDefinition = {
  name: string;
  description?: string;
  uses_read_models?: string[];
  uses_events?: string[];
  wireframe?: string;
  fields?: Attribute[];
};

export type Scenario = {
  name?: string;
  given?: string[];
  when?: string | string[];
  then?: string[];
};

export type Slice = {
  type?: string;
  name: string;
  commands?: string[];
  events?: string[];
  read_models?: string[];
  views?: string[];
  trigger?: string;
  external_event?: string;
  given?: string[];
  when?: string;
  then?: string[];
  scenarios?: Scenario[];
};

export type BoardElementKind = 'view' | 'automation' | 'command' | 'read_model' | 'query' | 'event' | 'external_event';

export type BoardLane = {
  id: string;
  name: string;
};

export type BoardElement = {
  id: string;
  kind: BoardElementKind;
  name: string;
  lane: string;
};

export type BoardConnection = {
  from: string;
  to: string;
};

export type BoardSlice = {
  name: string;
  type?: string;
  elements?: BoardElement[];
  connections?: BoardConnection[];
};

export type EventModelBoard = {
  lanes?: BoardLane[];
  slices?: BoardSlice[];
};

export type EventModel = {
  name: string;
  version?: string;
  description?: string;
  scope?: string;
  notes?: string[];
  open_questions?: string[];
  streams?: Stream[];
  events?: EventDefinition[];
  commands?: CommandDefinition[];
  read_models?: ReadModel[];
  views?: ViewDefinition[];
  board?: EventModelBoard;
  slices?: Slice[];
};

export type BrowserIndex = {
  generated_at: string;
  workflows: Array<{
    name: string;
    path: string;
    description?: string;
  }>;
};
