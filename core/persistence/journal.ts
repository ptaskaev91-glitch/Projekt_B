import type {
  PersistedEvent,
  PersistedTrace,
  PersistenceCheckpoint,
  PersistenceJournalSnapshot,
  PersistenceOperation,
  PersistencePlan,
} from "./types";

export type PersistenceJournalOptions = {
  maxEvents?: number;
};

export type PersistenceJournal = {
  applyPlan: (plan: PersistencePlan) => PersistenceJournalSnapshot;
  getSnapshot: () => PersistenceJournalSnapshot;
  clear: () => void;
  subscribe: (listener: (snapshot: PersistenceJournalSnapshot) => void) => () => void;
};

function cloneCheckpoint(checkpoint: PersistenceCheckpoint | null): PersistenceCheckpoint | null {
  if (!checkpoint) return null;
  return { ...checkpoint };
}

function cloneTrace(trace: PersistedTrace): PersistedTrace {
  return { ...trace };
}

function cloneEvent(event: PersistedEvent): PersistedEvent {
  return {
    ...event,
    details: event.details ? { ...event.details } : undefined,
  };
}

export function createPersistenceJournal(
  options: PersistenceJournalOptions = {},
  initial: PersistenceJournalSnapshot | null = null,
): PersistenceJournal {
  const maxEvents = options.maxEvents ?? 2000;
  const traces = new Map<string, PersistedTrace>();
  let events: PersistedEvent[] = [];
  let checkpoint: PersistenceCheckpoint | null = null;
  const listeners = new Set<(snapshot: PersistenceJournalSnapshot) => void>();

  if (initial) {
    for (const trace of initial.traces) {
      traces.set(trace.traceId, cloneTrace(trace));
    }
    events = initial.events.map(cloneEvent);
    checkpoint = cloneCheckpoint(initial.checkpoint);
  }

  const getSnapshot = (): PersistenceJournalSnapshot => ({
    traces: [...traces.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(cloneTrace),
    events: events.map(cloneEvent),
    checkpoint: cloneCheckpoint(checkpoint),
  });

  const emit = () => {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const applyOperation = (operation: PersistenceOperation) => {
    if (operation.type === "trace/upsert") {
      traces.set(operation.trace.traceId, cloneTrace(operation.trace));
      return;
    }
    if (operation.type === "event/append") {
      events.push(cloneEvent(operation.event));
      if (events.length > maxEvents) {
        events = events.slice(events.length - maxEvents);
      }
      return;
    }
    checkpoint = cloneCheckpoint(operation.checkpoint);
  };

  return {
    applyPlan: (plan) => {
      for (const operation of plan.operations) {
        applyOperation(operation);
      }
      emit();
      return getSnapshot();
    },
    getSnapshot,
    clear: () => {
      traces.clear();
      events = [];
      checkpoint = null;
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

