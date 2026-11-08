import { Field, Input, Select } from '@/ui';
import { ChipGroup, Grid } from './kit';

/* Ids must match backend/src/constants/discovery.js and the website's lib/vibes.js. */
export const VIBES = [
  { id: 'ocean', label: 'Ocean & Reef' }, { id: 'slow', label: 'Slow & Soulful' }, { id: 'adventure', label: 'Adventure' },
  { id: 'culture', label: 'Culture & History' }, { id: 'romance', label: 'Romance' }, { id: 'social', label: 'Social & Nightlife' },
];
export const SUITS = [{ id: 'solo', label: 'Solo' }, { id: 'couple', label: 'Couples' }, { id: 'friends', label: 'Friends' }, { id: 'family', label: 'Families' }];
export const ENERGY = [{ id: 'easy', label: 'Easy' }, { id: 'moderate', label: 'Moderate' }, { id: 'active', label: 'Active' }];

export const emptyDiscovery = { vibes: [], suits: [], energy: '', durationHours: '' };
export const discoveryFrom = (d = {}) => ({ vibes: d.vibes || [], suits: d.suits || [], energy: d.energy || '', durationHours: d.durationHours ?? '' });
export function appendDiscovery(fd, f) {
  fd.append('vibes', JSON.stringify(f.vibes || []));
  fd.append('suits', JSON.stringify(f.suits || []));
  fd.append('energy', f.energy || '');
  fd.append('durationHours', f.durationHours === '' || f.durationHours == null ? '' : String(f.durationHours));
}

/** "How should this be matched on the website?" */
export default function VibeFields({ form, set }) {
  return (
    <>
      <Field label="Vibes" hint="Pick up to 3. Visitors who chose these vibes see this first.">
        <ChipGroup options={VIBES} value={form.vibes} onChange={(v) => set('vibes', v)} multiple max={3} label="Vibes" />
      </Field>
      <Field label="Great for">
        <ChipGroup options={SUITS} value={form.suits} onChange={(v) => set('suits', v)} multiple label="Great for" />
      </Field>
      <Grid>
        <Field label="Energy level">
          <Select value={form.energy} onChange={(e) => set('energy', e.target.value)}>
            <option value="">Not set</option>
            {ENERGY.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Length in hours" hint="e.g. 4 for a half day — used for “Half day / Full day” filters">
          <Input type="number" min="0.5" step="0.5" inputMode="decimal" value={form.durationHours} onChange={(e) => set('durationHours', e.target.value)} />
        </Field>
      </Grid>
    </>
  );
}
