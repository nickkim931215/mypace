"use client";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { RoundCard } from "./round-card";
import { useTimerStore } from "@/store/timer-store";
import type { Routine } from "@/lib/types";

interface Props {
  routine: Routine;
}

export function RoundList({ routine }: Props) {
  const updateRound = useTimerStore((s) => s.updateRound);
  const duplicateRound = useTimerStore((s) => s.duplicateRound);
  const removeRound = useTimerStore((s) => s.removeRound);
  const reorderRounds = useTimerStore((s) => s.reorderRounds);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = routine.rounds.findIndex((r) => r.id === active.id);
    const newIdx = routine.rounds.findIndex((r) => r.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    reorderRounds(routine.id, oldIdx, newIdx);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={routine.rounds.map((r) => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {routine.rounds.map((round) => (
            <RoundCard
              key={round.id}
              round={round}
              onChange={(patch) => updateRound(routine.id, round.id, patch)}
              onDuplicate={() => duplicateRound(routine.id, round.id)}
              onRemove={() => removeRound(routine.id, round.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
