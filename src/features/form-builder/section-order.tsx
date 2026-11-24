import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../shared/components/ui/button';
import type { Section } from '../tickets/model';

function Row({
  id,
  index,
  count,
  move,
}: {
  id: Section;
  index: number;
  count: number;
  move: (from: number, to: number) => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-1 border-b border-input bg-background pr-1 last:border-b-0"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`${t('drag')}: ${t(id)}`}
        className="flex min-h-11 min-w-11 cursor-grab touch-none items-center justify-center bg-transparent text-secondary focus-visible:outline-2 focus-visible:outline-ring"
      >
        <GripVertical size={18} aria-hidden="true" />
      </button>
      <span className="flex-1 text-sm">
        <span className="mr-2 text-secondary">{index + 1}</span>
        {t(id)}
      </span>
      <Button
        type="button"
        variant="icon"
        disabled={index === 0}
        onClick={() => move(index, index - 1)}
        aria-label={`${t('moveUp')}: ${t(id)}`}
      >
        <ChevronUp size={18} aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="icon"
        disabled={index === count - 1}
        onClick={() => move(index, index + 1)}
        aria-label={`${t('moveDown')}: ${t(id)}`}
      >
        <ChevronDown size={18} aria-hidden="true" />
      </Button>
    </li>
  );
}
export function SectionOrder({
  value,
  onChange,
}: {
  value: Section[];
  onChange: (value: Section[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function move(from: number, to: number) {
    onChange(arrayMove(value, from, to));
  }
  function end(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const from = value.indexOf(event.active.id as Section);
    const to = value.indexOf(event.over.id as Section);
    if (from >= 0 && to >= 0) move(from, to);
  }
  return (
    <DndContext sensors={sensors} onDragEnd={end}>
      <SortableContext items={value} strategy={verticalListSortingStrategy}>
        <ol className="overflow-hidden rounded-lg border border-field-border">
          {value.map((id, index) => (
            <Row
              key={id}
              id={id}
              index={index}
              count={value.length}
              move={move}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
