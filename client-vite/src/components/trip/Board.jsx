import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, GripVertical, Lightbulb, Plane, Trash2, Clock } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import { BUSY_HOURS, dayHours, dayLabel, laneId, laneItems, laneOf } from '@/lib/trip';
import { VIBES, byId } from '@/lib/vibes';
import { cn } from '@/lib/utils';

/* ---------- Item ---------- */

function ItemBody({ snap, dragging, handleProps, onRemove, moveSelect }) {
  const vibe = byId(VIBES, snap.vibe);
  const Icon = snap.kind === 'transfer' ? Plane : vibe?.icon;
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-2xl border bg-white p-3 transition-shadow',
        snap.kind === 'transfer' ? 'border-lagoon-200 bg-lagoon-50' : 'border-sand-200',
        dragging ? 'shadow-lift ring-2 ring-coral-400' : 'shadow-soft'
      )}
    >
      <button
        type="button"
        {...handleProps}
        aria-label={`Drag ${snap.title}`}
        className="mt-0.5 cursor-grab touch-none rounded-lg p-1 text-ocean-900/35 hover:bg-sand-100 hover:text-ocean-900 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      {Icon && (
        <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-full', snap.kind === 'transfer' ? 'bg-lagoon-500 text-white' : 'bg-ocean-900 text-lagoon-300')}>
          <Icon className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {snap.href ? (
          <Link to={snap.href} className="block font-semibold leading-snug text-ocean-900 hover:underline">
            {snap.title}
          </Link>
        ) : (
          <p className="font-semibold leading-snug text-ocean-900">{snap.title}</p>
        )}
        {snap.lengthLabel && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ocean-900/55">
            <Clock className="size-3" /> {snap.lengthLabel}
          </p>
        )}
        {moveSelect}
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${snap.title}`} className="rounded-full p-1.5 text-ocean-900/35 hover:bg-coral-50 hover:text-coral-600">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}

/** "Move to…" select: the keyboard/touch-friendly alternative to dragging. */
function MoveSelect({ itemKey }) {
  const { trip, move } = useTrip();
  const current = laneOf(trip, itemKey);
  return (
    <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-ocean-900/55">
      <span className="sr-only">Move to</span>
      <select
        value={current || ''}
        onChange={(e) => move(itemKey, e.target.value)}
        className="rounded-full border border-sand-300 bg-white px-2 py-1 text-xs font-semibold text-ocean-900"
      >
        <option value="ideas">Not scheduled</option>
        {trip.days.map((_, i) => (
          <option key={i} value={laneId(i)}>
            {dayLabel(trip, i)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortableItem({ itemKey }) {
  const { trip, remove } = useTrip();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: itemKey });
  const snap = trip.items[itemKey];
  if (!snap) return null;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
    >
      <ItemBody
        snap={snap}
        handleProps={{ ...attributes, ...listeners }}
        onRemove={() => remove(itemKey)}
        moveSelect={<MoveSelect itemKey={itemKey} />}
      />
    </li>
  );
}

/* ---------- Lanes ---------- */

function Lane({ id, children, className, empty }) {
  const { trip } = useTrip();
  const { setNodeRef, isOver } = useDroppable({ id });
  const keys = laneItems(trip, id);
  return (
    <SortableContext id={id} items={keys} strategy={verticalListSortingStrategy}>
      <ul
        ref={setNodeRef}
        className={cn(
          'min-h-24 space-y-2 rounded-2xl p-2 transition-colors',
          isOver ? 'bg-coral-50 outline-2 outline-dashed outline-coral-300' : '',
          className
        )}
      >
        {keys.map((k) => (
          <SortableItem key={k} itemKey={k} />
        ))}
        {keys.length === 0 && <li className="grid min-h-20 place-items-center px-3 text-center text-sm text-ocean-900/45">{empty}</li>}
      </ul>
    </SortableContext>
  );
}

function DayCard({ index }) {
  const { trip } = useTrip();
  const hours = dayHours(trip, index);
  const busy = hours > BUSY_HOURS;
  const pct = Math.min(100, (hours / BUSY_HOURS) * 100);
  return (
    <section aria-label={dayLabel(trip, index)} className="rounded-[var(--radius-card)] border border-sand-200 bg-sand-100/70 p-3">
      <header className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
        <h3 className="font-display text-lg text-ocean-900">{dayLabel(trip, index)}</h3>
        <span className={cn('text-xs font-semibold', busy ? 'text-coral-600' : 'text-ocean-900/50')}>
          {hours ? `${Math.round(hours * 10) / 10} h planned` : 'Free day'}
        </span>
      </header>
      <div className="mx-2 mb-2 h-1 overflow-hidden rounded-full bg-sand-200" aria-hidden="true">
        <div className={cn('h-full rounded-full transition-all', busy ? 'bg-coral-500' : 'bg-lagoon-500')} style={{ width: `${pct}%` }} />
      </div>
      {busy && (
        <p className="mx-2 mb-2 flex items-center gap-1.5 rounded-xl bg-coral-50 px-3 py-2 text-xs font-semibold text-coral-700">
          <AlertTriangle className="size-3.5" /> A full day — consider moving something
        </p>
      )}
      <Lane id={laneId(index)} empty="Drop experiences here — or keep it free for the beach" />
    </section>
  );
}

/* ---------- Board ---------- */

export default function Board() {
  const { trip, move } = useTrip();
  const [activeKey, setActiveKey] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const laneFor = (id) => (id === 'ideas' || String(id).startsWith('day-') ? id : laneOf(trip, id));

  const onDragOver = ({ active, over }) => {
    if (!over) return;
    const from = laneOf(trip, active.id);
    const to = laneFor(over.id);
    if (!from || !to || from === to) return;
    const target = laneItems(trip, to);
    const overIndex = target.indexOf(over.id);
    move(active.id, to, overIndex === -1 ? target.length : overIndex);
  };

  const onDragEnd = ({ active, over }) => {
    setActiveKey(null);
    if (!over) return;
    const lane = laneFor(over.id);
    const list = laneItems(trip, lane);
    const from = list.indexOf(active.id);
    const to = list.indexOf(over.id);
    if (from !== -1 && to !== -1 && from !== to) move(active.id, lane, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveKey(active.id)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveKey(null)}
    >
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <section aria-label="Not scheduled yet" className="rounded-[var(--radius-card)] border border-dashed border-sand-300 bg-white/60 p-3">
            <header className="flex items-center gap-2 px-2 pb-2 pt-1">
              <Lightbulb className="size-4 text-ochre-500" />
              <h3 className="font-display text-lg text-ocean-900">Not scheduled yet</h3>
            </header>
            <Lane id="ideas" empty="Added experiences wait here until you drag them onto a day" />
          </section>
        </aside>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {trip.days.map((_, i) => (
            <DayCard key={i} index={i} />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeKey && trip.items[activeKey] ? <ItemBody snap={trip.items[activeKey]} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
