import {
  Accordion,
  Alert,
  AppShell,
  Badge,
  Box,
  Button,
  Card,
  Code,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowRight,
  IconBook,
  IconBolt,
  IconDatabase,
  IconForms,
  IconRoute,
  IconSparkles,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type {
  Attribute,
  BoardElement,
  BoardSlice,
  BrowserIndex,
  CommandDefinition,
  EventDefinition,
  EventModel,
  ReadModel,
  Scenario,
  Slice,
  ViewDefinition,
} from './types';
import { catppuccin } from './theme';
import { issuesFor, validateEventModel, type ValidationIssue, type ValidationReport } from './validation';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; index: BrowserIndex; model: EventModel; selectedPath: string }
  | { status: 'error'; message: string };

type Selection = {
  kind: 'command' | 'event' | 'read_model' | 'view';
  name: string;
};

const tabForKind: Record<Selection['kind'], string> = {
  command: 'definitions',
  event: 'definitions',
  read_model: 'definitions',
  view: 'views',
};

const boardLayout = {
  labelWidth: 170,
  subColumnWidth: 240,
  headerHeight: 104,
  laneHeights: {
    ux: 190,
    actions: 260,
    events: 190,
  } as Record<string, number>,
  fallbackLaneHeight: 210,
  stickyWidth: 190,
  stickyHeight: 116,
  stickyGap: 16,
  lanePadding: 32,
};

const kindColors = {
  command: catppuccin.yellow,
  event: catppuccin.peach,
  read_model: catppuccin.green,
  view: catppuccin.blue,
  automation: catppuccin.mauve,
  query: catppuccin.yellow,
  external_event: catppuccin.red,
};

const kindLabels = {
  command: 'Command',
  event: 'Event',
  read_model: 'Read Model',
  view: 'View',
  automation: 'Automation',
  query: 'Query',
  external_event: 'External Event',
};

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function scenarioList(slice: Slice): Scenario[] {
  if (slice.scenarios?.length) {
    return slice.scenarios;
  }
  if ('given' in slice || 'when' in slice || 'then' in slice) {
    return [{ name: 'Example', given: slice.given, when: slice.when, then: slice.then }];
  }
  return [];
}

function humanizeName(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('slices');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const index = await loadJson<BrowserIndex>('data/index.json');
        const firstWorkflow = index.workflows[0];
        if (!firstWorkflow) {
          throw new Error('No event model workflows were found in data/index.json.');
        }
        const model = await loadJson<EventModel>(firstWorkflow.path);
        if (!cancelled) {
          setLoadState({ status: 'ready', index, model, selectedPath: firstWorkflow.path });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function selectWorkflow(path: string | null) {
    if (!path || loadState.status !== 'ready') {
      return;
    }
    setLoadState({ status: 'loading' });
    setSelection(null);
    setActiveTab('slices');
    try {
      const model = await loadJson<EventModel>(path);
      setLoadState({ status: 'ready', index: loadState.index, model, selectedPath: path });
    } catch (error) {
      setLoadState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }

  if (loadState.status === 'loading') {
    return <LoadingShell />;
  }

  if (loadState.status === 'error') {
    return <ErrorShell message={loadState.message} />;
  }

  const { index, model, selectedPath } = loadState;
  const validationReport = validateEventModel(model);
  const workflowOptions = index.workflows.map((workflow) => ({
    value: workflow.path,
    label: workflow.name,
  }));

  function selectElement(nextSelection: Selection) {
    setSelection(nextSelection);
    setActiveTab(tabForKind[nextSelection.kind]);
    window.setTimeout(() => {
      document.getElementById(elementId(nextSelection.kind, nextSelection.name))?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 80);
  }

  return (
    <AppShell header={{ height: 72 }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="xl" justify="space-between">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" color="lavender">
              <IconSparkles size={20} />
            </ThemeIcon>
            <Box>
              <Title order={3}>Eddy Event Model Browser</Title>
              <Text size="sm" c="dimmed">
                Workflow JSON, timelines, scenarios, commands, events, and projections
              </Text>
            </Box>
          </Group>
          <Select
            aria-label="Workflow"
            data={workflowOptions}
            value={selectedPath}
            onChange={selectWorkflow}
            w={320}
          />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container fluid px="xl">
          <Stack gap="xl">
            <Hero model={model} validationReport={validationReport} />
            <TimelineBoard model={model} validationReport={validationReport} onSelect={selectElement} />
            <Tabs value={activeTab} onChange={setActiveTab} color="lavender" variant="pills">
              <Tabs.List>
                <Tabs.Tab value="slices">Slices & Scenarios</Tabs.Tab>
                <Tabs.Tab value="definitions">Definitions</Tabs.Tab>
                <Tabs.Tab value="views">Views</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="slices" pt="lg">
                <SliceBrowser model={model} validationReport={validationReport} onSelect={selectElement} />
              </Tabs.Panel>
              <Tabs.Panel value="definitions" pt="lg">
                <DefinitionBrowser model={model} validationReport={validationReport} selection={selection} onSelect={selectElement} />
              </Tabs.Panel>
              <Tabs.Panel value="views" pt="lg">
                <ViewBrowser model={model} validationReport={validationReport} />
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

function LoadingShell() {
  return (
    <CenterShell>
      <Loader color="lavender" size="lg" />
      <Text c="dimmed">Loading event models…</Text>
    </CenterShell>
  );
}

function ErrorShell({ message }: { message: string }) {
  return (
    <CenterShell>
      <Alert color="red" icon={<IconAlertCircle />} title="Could not load the event model browser">
        {message}
      </Alert>
    </CenterShell>
  );
}

function CenterShell({ children }: { children: React.ReactNode }) {
  return (
    <Box mih="100vh" bg={catppuccin.base} c={catppuccin.text} className="grid place-items-center p-8">
      <Stack align="center" gap="md">
        {children}
      </Stack>
    </Box>
  );
}

function Hero({ model, validationReport }: { model: EventModel; validationReport: ValidationReport }) {
  return (
    <Card p="xl" mt="md">
      <Group justify="space-between" align="flex-start">
        <Box maw={860}>
          <Group mb="xs">
            <Badge color="lavender" variant="light">{model.version ?? 'unversioned'}</Badge>
            {asArray(model.open_questions).length === 0 ? (
              <Badge color="green" variant="light">No open questions</Badge>
            ) : (
              <Badge color="yellow" variant="light">{model.open_questions?.length} open questions</Badge>
            )}
            {validationReport.valid ? (
              <Badge color="green" variant="light">Valid model</Badge>
            ) : (
              <Badge color="red" variant="light">{validationReport.issues.length} validation issues</Badge>
            )}
          </Group>
          <Title order={1}>{model.name}</Title>
          {model.description && (
            <Text mt="md" size="lg" c="dimmed">
              {model.description}
            </Text>
          )}
        </Box>
      </Group>
      {model.scope && (
        <Paper mt="lg" p="md" radius="md" bg="rgba(17, 17, 27, 0.42)">
          <Text size="sm" fw={700} c="lavender.2" mb={4}>Scope</Text>
          <Text size="sm" c="dimmed">{model.scope}</Text>
        </Paper>
      )}
      {!validationReport.valid && (
        <Alert mt="lg" color="red" icon={<IconAlertCircle />} title="Validation issues">
          <Stack gap={4}>
            {validationReport.issues.map((item) => (
              <Text key={`${item.path}-${item.message}`} size="sm">
                <Code>{item.path}</Code> {item.message}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}
      {model.notes?.length ? (
        <Accordion mt="lg" variant="contained">
          <Accordion.Item value="notes">
            <Accordion.Control>Modeling notes</Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                {model.notes.map((note) => (
                  <Text key={note} size="sm">• {note}</Text>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      ) : null}
    </Card>
  );
}

function TimelineBoard({ model, validationReport, onSelect }: { model: EventModel; validationReport: ValidationReport; onSelect: (selection: Selection) => void }) {
  const lanes = model.board?.lanes ?? [
    { id: 'ux', name: 'UX / Automations' },
    { id: 'actions', name: 'Commands, Projections, Queries' },
    { id: 'events', name: 'Event Streams' },
  ];
  const boardSlices = model.board?.slices ?? asArray(model.slices).map(sliceToBoardSlice);

  return (
    <Card p="lg">
      <Group justify="space-between" mb="md">
        <Box>
          <Title order={2}>Workflow timeline</Title>
          <Text size="sm" c="dimmed">
            Left-to-right slices. Click a node to inspect its definition.
          </Text>
        </Box>
        <Group gap="xs">
          <Legend kind="command" />
          <Legend kind="event" />
          <Legend kind="read_model" />
          <Legend kind="view" />
        </Group>
      </Group>
      <Box className="overflow-x-auto rounded-2xl border border-[#45475a] bg-[#f2f2f2] p-0 text-[#1a1a1a]">
        <div className="flex min-w-max">
          <div style={{ width: boardLayout.labelWidth }}>
            <div className="border-b border-r border-[#c6c6c6] bg-[#efefef]" style={{ height: boardLayout.headerHeight }} />
            {lanes.map((lane) => (
              <div
                key={lane.id}
                className="flex items-center justify-center border-b border-r border-[#c6c6c6] bg-[#f7f7f7] p-3 text-center text-sm font-bold leading-tight"
                style={{ height: laneHeight(lane.id) }}
              >
                <span className="[writing-mode:vertical-rl] rotate-180">{lane.name}</span>
              </div>
            ))}
          </div>
          {boardSlices.map((slice, index) => (
            <BoardSliceColumn
              key={slice.name}
              index={index}
              slice={slice}
              lanes={lanes}
              issues={issuesFor(validationReport, 'slice', slice.name)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </Box>
    </Card>
  );
}

function BoardSliceColumn({
  index,
  slice,
  lanes,
  issues,
  onSelect,
}: {
  index: number;
  slice: BoardSlice;
  lanes: Array<{ id: string; name: string }>;
  issues: ValidationIssue[];
  onSelect: (selection: Selection) => void;
}) {
  const columns = boardSubcolumns(slice);
  const width = Math.max(columns.length, 1) * boardLayout.subColumnWidth;
  const totalHeight = lanes.reduce((sum, lane) => sum + laneHeight(lane.id), 0);
  const positions = boardGridPositions(columns, lanes);
  return (
    <div className="border-r border-[#c6c6c6]" style={{ width }}>
      <div className="border-b border-[#c6c6c6] bg-[#efefef] p-4" style={{ height: boardLayout.headerHeight }}>
        <Text size="md" fw={800} lh={1.2}>{humanizeName(slice.name)}</Text>
        <Text size="sm" c="dimmed">{index + 1}. {humanizeName(slice.type ?? 'slice')}</Text>
        <IssueList issues={issues} />
      </div>
      <div className="relative bg-[#f8f8f8]" style={{ height: totalHeight }}>
        <svg className="pointer-events-none absolute inset-0 z-30" width={width} height={totalHeight}>
          <defs>
            <marker id={`board-arrow-${index}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#333333" />
            </marker>
          </defs>
          {asArray(slice.connections).map((connection, connectionIndex) => {
            const from = positions.get(connection.from);
            const to = positions.get(connection.to);
            if (!from || !to) return null;
            const line = simpleBoardArrow(from, to);
            return (
              <line
                key={`${connection.from}-${connection.to}-${connectionIndex}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#333333"
                strokeWidth="2.5"
                markerEnd={`url(#board-arrow-${index})`}
              />
            );
          })}
        </svg>
        <div
          className="grid relative z-20"
          style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, ${boardLayout.subColumnWidth}px)` }}
        >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="border-r border-dashed border-[#d6d6d6] last:border-r-0">
            {lanes.map((lane) => {
              const element = column.find((candidate) => candidate.lane === lane.id);
              return (
                <div
                  key={`${columnIndex}-${lane.id}`}
                  className="flex items-center justify-center border-b border-[#c6c6c6] p-4"
                  style={{ height: laneHeight(lane.id) }}
                >
                  {element ? <BoardSticky element={element} onSelect={onSelect} /> : null}
                </div>
              );
            })}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

function boardSubcolumns(slice: BoardSlice) {
  const ordered = orderElementsByConnections(asArray(slice.elements), slice.connections);
  return ordered.map((element) => [element]);
}

type GridPoint = { x: number; y: number };

function boardGridPositions(columns: BoardElement[][], lanes: Array<{ id: string; name: string }>) {
  const result = new Map<string, GridPoint>();
  columns.forEach((column, columnIndex) => {
    column.forEach((element) => {
      result.set(element.id, {
        x: columnIndex * boardLayout.subColumnWidth + boardLayout.subColumnWidth / 2,
        y: laneTop(lanes, element.lane) + laneHeight(element.lane) / 2,
      });
    });
  });
  return result;
}

function laneTop(lanes: Array<{ id: string; name: string }>, laneId: string) {
  let top = 0;
  for (const lane of lanes) {
    if (lane.id === laneId) return top;
    top += laneHeight(lane.id);
  }
  return top;
}

function simpleBoardArrow(from: GridPoint, to: GridPoint) {
  const start = rectangleIntersection(from, to);
  const end = rectangleIntersection(to, from);
  return {
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
  };
}

function rectangleIntersection(boxCenter: GridPoint, toward: GridPoint): GridPoint {
  const dx = toward.x - boxCenter.x;
  const dy = toward.y - boxCenter.y;
  if (dx === 0 && dy === 0) return boxCenter;

  const halfWidth = boardLayout.stickyWidth / 2;
  const halfHeight = boardLayout.stickyHeight / 2;
  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(dx);
  const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);

  return {
    x: boxCenter.x + dx * scale,
    y: boxCenter.y + dy * scale,
  };
}

function orderElementsByConnections(elements: BoardElement[], connections: BoardSlice['connections']) {
  const ordered = [...elements];
  for (const connection of asArray(connections)) {
    const fromIndex = ordered.findIndex((element) => element.id === connection.from);
    const toIndex = ordered.findIndex((element) => element.id === connection.to);
    if (fromIndex >= 0 && toIndex >= 0 && fromIndex > toIndex) {
      const [from] = ordered.splice(fromIndex, 1);
      ordered.splice(toIndex, 0, from);
    }
  }
  return ordered;
}

function laneHeight(laneId: string) {
  return boardLayout.laneHeights[laneId] ?? boardLayout.fallbackLaneHeight;
}

function BoardSticky({ element, onSelect }: { element: BoardElement; onSelect: (selection: Selection) => void }) {
  const color = kindColors[element.kind];
  const selectable = isSelectableKind(element.kind);
  const selection = boardElementSelection(element);
  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={() => selection && onSelect(selection)}
      className="min-h-[116px] w-[190px] whitespace-normal break-words rounded-sm px-4 py-3 text-center text-base font-semibold leading-tight shadow-md transition hover:-translate-y-0.5 disabled:cursor-default"
      style={{ background: color, color: '#1a1a1a' }}
      title={`${kindLabels[element.kind]}: ${element.name}`}
    >
      {humanizeName(element.name)}
    </button>
  );
}

function boardElementSelection(element: BoardElement): Selection | null {
  if (!isSelectableKind(element.kind)) return null;
  return { kind: element.kind, name: element.name };
}

function sliceToBoardSlice(slice: Slice): BoardSlice {
  return {
    name: slice.name,
    type: slice.type,
    elements: [
      ...asArray(slice.views).map((name) => ({ id: `view-${name}`, kind: 'view' as const, name, lane: 'ux' })),
      ...asArray(slice.commands).map((name) => ({ id: `command-${name}`, kind: 'command' as const, name, lane: 'actions' })),
      ...asArray(slice.read_models).map((name) => ({ id: `read-model-${name}`, kind: 'read_model' as const, name, lane: 'actions' })),
      ...asArray(slice.events).map((name) => ({ id: `event-${name}`, kind: 'event' as const, name, lane: 'events' })),
    ],
    connections: [],
  };
}

function isSelectableKind(kind: string): kind is Selection['kind'] {
  return kind === 'command' || kind === 'event' || kind === 'read_model' || kind === 'view';
}

function Legend({ kind }: { kind: Selection['kind'] }) {
  return (
    <Badge variant="outline" style={{ borderColor: kindColors[kind], color: kindColors[kind] }}>
      {kindLabels[kind]}
    </Badge>
  );
}

function SliceBrowser({ model, validationReport, onSelect }: { model: EventModel; validationReport: ValidationReport; onSelect: (selection: Selection) => void }) {
  return (
    <Stack gap="lg">
      {asArray(model.slices).map((slice, index) => {
        const sliceIssues = issuesFor(validationReport, 'slice', slice.name);
        return (
        <Card key={slice.name} p="lg" style={{ borderColor: sliceIssues.length ? catppuccin.red : undefined }}>
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="xs" mb="xs">
                <Badge color="lavender" variant="light">{slice.type ?? 'slice'}</Badge>
                {slice.trigger && <Badge color="blue" variant="light">trigger: {slice.trigger}</Badge>}
              </Group>
              <Title order={3}>{index + 1}. {slice.name}</Title>
            </Box>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 4 }} mt="md">
            <RefColumn title="Commands" kind="command" values={slice.commands} onSelect={onSelect} />
            <RefColumn title="Events" kind="event" values={slice.events} onSelect={onSelect} />
            <RefColumn title="Read Models" kind="read_model" values={slice.read_models} onSelect={onSelect} />
            <RefColumn title="Views" kind="view" values={slice.views} onSelect={onSelect} />
          </SimpleGrid>
          <IssueList issues={sliceIssues} />
          <ScenarioCards scenarios={scenarioList(slice)} />
        </Card>
      );})}
    </Stack>
  );
}

function RefColumn({
  title,
  kind,
  values,
  onSelect,
}: {
  title: string;
  kind: Selection['kind'];
  values?: string[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <Paper p="md" radius="md" bg="rgba(17, 17, 27, 0.34)">
      <Text size="xs" fw={800} tt="uppercase" c="dimmed" mb="xs">{title}</Text>
      <Stack gap="xs">
        {asArray(values).length ? asArray(values).map((value) => (
          <Button
            key={value}
            variant="light"
            color="lavender"
            rightSection={<IconArrowRight size={14} />}
            justify="space-between"
            fullWidth
            onClick={() => onSelect({ kind, name: value })}
            title={value}
            styles={{ root: { minHeight: 48, height: 'auto' }, label: { whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset', textAlign: 'left', lineHeight: 1.2 }, inner: { justifyContent: 'space-between' } }}
          >
            {humanizeName(value)}
          </Button>
        )) : <Text size="sm" c="dimmed">None</Text>}
      </Stack>
    </Paper>
  );
}

function ScenarioCards({ scenarios }: { scenarios: Scenario[] }) {
  if (!scenarios.length) {
    return null;
  }
  return (
    <Stack gap="sm" mt="lg">
      <Text size="sm" fw={800} tt="uppercase" c="lavender.2">Scenarios</Text>
      {scenarios.map((scenario, index) => (
        <Paper key={scenario.name ?? index} p="md" radius="md" bg="rgba(24, 24, 37, 0.72)" withBorder>
        <Text fw={700} mb="sm">{scenario.name ?? `Scenario ${index + 1}`}</Text>
          <Table withTableBorder withColumnBorders>
            <Table.Tbody>
              <ScenarioRow label="Given" value={scenario.given} />
              {'when' in scenario && <ScenarioRow label="When" value={scenario.when} />}
              <ScenarioRow label="Then" value={scenario.then} />
            </Table.Tbody>
          </Table>
        </Paper>
      ))}
    </Stack>
  );
}

function ScenarioRow({ label, value }: { label: string; value?: string | string[] }) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <Table.Tr>
      <Table.Th w={96}>{label}</Table.Th>
      <Table.Td>
        {values.length ? (
          <Stack gap={4}>
            {values.map((item) => <Text key={item} size="sm">{humanizeScenarioText(item)}</Text>)}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">Nothing recorded yet.</Text>
        )}
      </Table.Td>
    </Table.Tr>
  );
}

function DefinitionBrowser({
  model,
  validationReport,
  selection,
  onSelect,
}: {
  model: EventModel;
  validationReport: ValidationReport;
  selection: Selection | null;
  onSelect: (selection: Selection) => void;
}) {
  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
      <Stack gap="lg">
        {asArray(model.commands).map((command) => (
          <CommandCard key={command.name} command={command} issues={issuesFor(validationReport, 'command', command.name)} selected={selection?.kind === 'command' && selection.name === command.name} onSelect={onSelect} />
        ))}
        {asArray(model.read_models).map((readModel) => (
          <ReadModelCard key={readModel.name} readModel={readModel} issues={issuesFor(validationReport, 'read_model', readModel.name)} selected={selection?.kind === 'read_model' && selection.name === readModel.name} onSelect={onSelect} />
        ))}
      </Stack>
      <Stack gap="lg">
        {asArray(model.events).map((event) => (
          <EventCard key={event.name} event={event} issues={issuesFor(validationReport, 'event', event.name)} selected={selection?.kind === 'event' && selection.name === event.name} onSelect={onSelect} />
        ))}
      </Stack>
    </SimpleGrid>
  );
}

function CommandCard({ command, issues, selected, onSelect }: { command: CommandDefinition; issues: ValidationIssue[]; selected: boolean; onSelect: (selection: Selection) => void }) {
  return (
    <DefinitionCard title={command.name} kind="command" issues={issues} selected={selected} onClick={() => onSelect({ kind: 'command', name: command.name })}>
      {command.description && <Text size="sm" c="dimmed">{command.description}</Text>}
      <DefinitionList title="Inputs" items={command.inputs} />
      <DefinitionList title="Reads" items={command.reads} />
      <DefinitionList title="External Inputs" items={command.external_inputs} />
      <DefinitionList title="Produces" items={command.produces} />
    </DefinitionCard>
  );
}

function EventCard({ event, issues, selected, onSelect }: { event: EventDefinition; issues: ValidationIssue[]; selected: boolean; onSelect: (selection: Selection) => void }) {
  return (
    <DefinitionCard title={event.name} kind="event" issues={issues} selected={selected} onClick={() => onSelect({ kind: 'event', name: event.name })}>
      {event.description && <Text size="sm" c="dimmed">{event.description}</Text>}
      {event.stream && <Badge mt="sm" color="gray" variant="light">stream: {event.stream}</Badge>}
      <AttributeTable attributes={event.attributes} />
    </DefinitionCard>
  );
}

function ReadModelCard({ readModel, issues, selected, onSelect }: { readModel: ReadModel; issues: ValidationIssue[]; selected: boolean; onSelect: (selection: Selection) => void }) {
  return (
    <DefinitionCard title={readModel.name} kind="read_model" issues={issues} selected={selected} onClick={() => onSelect({ kind: 'read_model', name: readModel.name })}>
      {readModel.description && <Text size="sm" c="dimmed">{readModel.description}</Text>}
      <AttributeTable attributes={readModel.fields} title="Field Sources" />
    </DefinitionCard>
  );
}

function ViewBrowser({ model, validationReport }: { model: EventModel; validationReport: ValidationReport }) {
  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
      {asArray(model.views).map((view) => (
        <ViewCard key={view.name} view={view} issues={issuesFor(validationReport, 'view', view.name)} />
      ))}
    </SimpleGrid>
  );
}

function ViewCard({ view, issues }: { view: ViewDefinition; issues: ValidationIssue[] }) {
  return (
    <DefinitionCard title={view.name} kind="view" issues={issues}>
      {view.description && <Text size="sm" c="dimmed">{view.description}</Text>}
      <DefinitionList title="Uses Read Models" items={view.uses_read_models} />
      <DefinitionList title="Uses Events" items={view.uses_events} />
      {view.wireframe && (
        <Box mt="md">
          <Text size="xs" fw={800} tt="uppercase" c="dimmed" mb={6}>Screen sketch</Text>
          <Code block bg={catppuccin.crust} c={catppuccin.text}>{view.wireframe}</Code>
        </Box>
      )}
      <AttributeTable attributes={view.fields} title="Visible Fields" />
    </DefinitionCard>
  );
}

function DefinitionCard({
  title,
  kind,
  selected = false,
  issues = [],
  onClick,
  children,
}: {
  title: string;
  kind: Selection['kind'];
  selected?: boolean;
  issues?: ValidationIssue[];
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card
      id={elementId(kind, title)}
      p="lg"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderColor: issues.length ? catppuccin.red : selected ? kindColors[kind] : catppuccin.surface1,
        boxShadow: selected ? `0 0 0 2px ${kindColors[kind]}55` : undefined,
      }}
    >
      <Group justify="space-between" align="flex-start">
        <Title order={3}>{title}</Title>
        <Badge style={{ color: kindColors[kind], borderColor: kindColors[kind] }} variant="outline">
          {kindLabels[kind]}
        </Badge>
      </Group>
      <Divider my="md" />
      <IssueList issues={issues} />
      <Stack gap="md">{children}</Stack>
    </Card>
  );
}

function elementId(kind: Selection['kind'], name: string) {
  return `${kind}-${name.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
}

function IssueList({ issues }: { issues: ValidationIssue[] }) {
  if (!issues.length) return null;
  return (
    <Alert color="red" icon={<IconAlertCircle size={18} />} mb="md" title="Validation issues">
      <Stack gap={4}>
        {issues.map((item) => (
          <Text key={`${item.path}-${item.message}`} size="sm">
            <Code>{item.path}</Code> {item.message}
          </Text>
        ))}
      </Stack>
    </Alert>
  );
}

function DefinitionList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) {
    return null;
  }
  return (
    <Box>
      <Text size="xs" fw={800} tt="uppercase" c="dimmed" mb={6}>{title}</Text>
      <Group gap="xs">
        {items.map((item) => <Badge key={item} color="lavender" variant="light" title={item}>{humanizeName(item)}</Badge>)}
      </Group>
    </Box>
  );
}

function humanizeScenarioText(value: string): string {
  if (!/^[A-Za-z0-9_./ -]+$/.test(value) || value.includes(' ')) return value;
  return humanizeName(value);
}

function AttributeTable({ attributes, title = 'Attributes' }: { attributes?: Attribute[]; title?: string }) {
  if (!attributes?.length) {
    return null;
  }
  const showType = attributes.some((attribute) => attribute.type);
  const showDescription = attributes.some((attribute) => attribute.description);
  return (
    <Box>
      <Text size="xs" fw={800} tt="uppercase" c="dimmed" mb={6}>{title}</Text>
      <ScrollArea>
        <Table withTableBorder withColumnBorders miw={showDescription ? 760 : 520}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              {showType && <Table.Th>Type</Table.Th>}
              <Table.Th>Source</Table.Th>
              {showDescription && <Table.Th>Description</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {attributes.map((attribute) => (
              <Table.Tr key={attribute.name}>
                <Table.Td><Code>{attribute.name}</Code></Table.Td>
                {showType && <Table.Td>{attribute.type ? <Badge variant="light">{attribute.type}</Badge> : null}</Table.Td>}
                <Table.Td>{attribute.source ? <Code>{attribute.source}</Code> : <Text c="dimmed">—</Text>}</Table.Td>
                {showDescription && <Table.Td><Text size="sm">{attribute.description}</Text></Table.Td>}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  );
}

export default App;
