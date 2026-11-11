import { api } from '@/lib/api';
import { kes } from '@/lib/utils';
import { Field, Input, Select, Textarea } from '@/ui';
import { FormPage, Grid, ListInput, MoneyInput, Problems, Repeater, Section, useForm } from '@/forms/kit';
import ImageUploader from '@/forms/ImageUploader';
import VibeFields, { appendDiscovery, discoveryFrom, emptyDiscovery } from '@/forms/VibeFields';
import useRecord, { required } from './useRecord';

const EMPTY = {
  title: '', shortDescription: '', fullDescription: '', startDate: '', endDate: '', balanceDueDate: '', meetingPoint: '',
  accommodationDetails: '', maxParticipants: '', fullPrice: '', depositAmount: '', status: 'draft',
  itinerary: [], includes: [], excludes: [], hero: [], heroFile: [], gallery: [], files: [], confirmed: 0, ...emptyDiscovery,
};
const day = (d) => (d ? String(d).slice(0, 10) : '');

export default function GroupTripForm() {
  const f = useForm(EMPTY);
  const { form, set } = f;
  const rec = useRecord({
    noun: 'group trip', done: '/grouptrips', form: f,
    load: async (id) => {
      const t = (await api.get(`/group-trips/admin/${id}`)).data; // 404 "Group trip not found." if it's gone
      return {
        ...EMPTY, title: t.title || '', shortDescription: t.shortDescription || '', fullDescription: t.fullDescription || '',
        startDate: day(t.startDate), endDate: day(t.endDate), balanceDueDate: day(t.balanceDueDate), meetingPoint: t.meetingPoint || '',
        accommodationDetails: t.accommodationDetails || '', maxParticipants: t.maxParticipants ?? '', fullPrice: t.fullPrice ?? '', depositAmount: t.depositAmount ?? '',
        status: t.status || 'draft', itinerary: (t.itinerary || []).map((d) => ({ title: d.title || '', activities: d.activities || [] })),
        includes: t.includes || [], excludes: t.excludes || [], hero: t.heroImage ? [t.heroImage] : [], heroFile: [], gallery: t.gallery || [], files: [],
        confirmed: t.confirmedParticipants || 0, ...discoveryFrom(t),
      };
    },
    save: (v, id) => {
      const fd = new FormData();
      ['title', 'shortDescription', 'fullDescription', 'startDate', 'endDate', 'meetingPoint', 'accommodationDetails', 'maxParticipants', 'fullPrice', 'depositAmount', 'status'].forEach((k) => fd.append(k, v[k] ?? ''));
      if (v.balanceDueDate) fd.append('balanceDueDate', v.balanceDueDate);
      fd.append('itinerary', JSON.stringify(v.itinerary.map((d, i) => ({ day: i + 1, title: d.title, activities: d.activities }))));
      fd.append('includes', JSON.stringify(v.includes));
      fd.append('excludes', JSON.stringify(v.excludes));
      appendDiscovery(fd, v);
      if (v.heroFile[0]) fd.append('heroImage', v.heroFile[0]);
      else if (v.hero[0]) fd.append('heroImage', v.hero[0]);
      if (id) fd.append('existingGallery', JSON.stringify(v.gallery));
      v.files.forEach((file) => fd.append('gallery', file));
      return id ? api.put(`/group-trips/${id}`, fd) : api.post('/group-trips', fd);
    },
  });

  const validate = (v) => {
    const p = {};
    required(p, v, 'title', 'Title');
    required(p, v, 'shortDescription', 'Short description');
    required(p, v, 'startDate', 'Start date');
    required(p, v, 'endDate', 'End date');
    required(p, v, 'maxParticipants', 'Seats');
    required(p, v, 'fullPrice', 'Full price');
    required(p, v, 'depositAmount', 'Deposit');
    if (v.startDate && v.endDate && v.endDate < v.startDate) p.endDate = 'End date can’t be before the start date';
    if (Number(v.depositAmount) > Number(v.fullPrice)) p.depositAmount = 'Deposit can’t be more than the full price';
    if (v.maxParticipants && Number(v.maxParticipants) < v.confirmed) p.maxParticipants = `${v.confirmed} travellers are already confirmed`;
    v.itinerary.forEach((d, i) => { if (!d.title.trim()) p[`itinerary.${i}.title`] = `Day ${i + 1} needs a title`; });
    return p;
  };
  const err = rec.fieldErrors;
  const balance = Number(form.fullPrice || 0) - Number(form.depositAmount || 0);

  return (
    <FormPage
      title={rec.isNew ? 'Add group trip' : form.title || 'Edit group trip'}
      subtitle={rec.isNew ? 'A scheduled trip travellers can request to join.' : form.confirmed ? `${form.confirmed} traveller${form.confirmed === 1 ? '' : 's'} confirmed` : undefined}
      back="/grouptrips" backLabel="Group trips"
      loading={rec.loading} saving={rec.saving} error={rec.error} dirty={f.dirty}
      onSubmit={() => rec.submit(validate)} submitLabel={rec.isNew ? 'Add group trip' : 'Save changes'}
      side={
        <Select value={form.status} onChange={(e) => set('status', e.target.value)} className="h-10 w-40" aria-label="Status">
          <option value="draft">Draft</option><option value="published">Published</option><option value="full">Full</option><option value="closed">Closed</option>
        </Select>
      }
      aside={<Section title="Match on the website"><VibeFields form={form} set={set} /></Section>}
    >
      <Problems errors={err} />
      <Section title="Basics">
        <Field label="Title" error={err.title}><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Reef & Rhythm weekend" /></Field>
        <Field label="Short description" error={err.shortDescription} hint="One or two lines — shown on cards and link previews"><Textarea rows={2} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} /></Field>
        <Field label="Full description"><Textarea rows={6} value={form.fullDescription} onChange={(e) => set('fullDescription', e.target.value)} /></Field>
      </Section>

      <Section title="Photos">
        <Field label="Hero photo" error={err.heroImage} hint="Large banner at the top of the trip page and in WhatsApp previews">
          <ImageUploader single label="Hero photo" existing={form.hero} onExistingChange={(v) => set('hero', v)} files={form.heroFile} onFilesChange={(v) => set('heroFile', v)} />
        </Field>
        <Field label="Gallery" error={err.gallery}>
          <ImageUploader existing={form.gallery} onExistingChange={(v) => set('gallery', v)} files={form.files} onFilesChange={(v) => set('files', v)} max={10} />
        </Field>
      </Section>

      <Section title="Dates & place">
        <Grid cols={3}>
          <Field label="Starts" error={err.startDate}><Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
          <Field label="Ends" error={err.endDate}><Input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => set('endDate', e.target.value)} /></Field>
          <Field label="Balance due by" error={err.balanceDueDate}><Input type="date" value={form.balanceDueDate} max={form.startDate || undefined} onChange={(e) => set('balanceDueDate', e.target.value)} /></Field>
        </Grid>
        <Field label="Meeting point"><Input value={form.meetingPoint} onChange={(e) => set('meetingPoint', e.target.value)} placeholder="e.g. Watamu Beach, opposite Turtle Bay" /></Field>
        <Field label="Accommodation"><Textarea rows={2} value={form.accommodationDetails} onChange={(e) => set('accommodationDetails', e.target.value)} placeholder="Where everyone stays, room sharing, etc." /></Field>
      </Section>

      <Section title="Seats & price" description={form.fullPrice && form.depositAmount ? `Balance after deposit: ${kes(balance)} per person` : undefined}>
        <Grid cols={3}>
          <Field label="Seats" error={err.maxParticipants}><Input type="number" min="1" inputMode="numeric" value={form.maxParticipants} onChange={(e) => set('maxParticipants', e.target.value)} /></Field>
          <Field label="Full price per person" error={err.fullPrice}><MoneyInput value={form.fullPrice} onChange={(v) => set('fullPrice', v)} /></Field>
          <Field label="Deposit" error={err.depositAmount}><MoneyInput value={form.depositAmount} onChange={(v) => set('depositAmount', v)} /></Field>
        </Grid>
      </Section>

      <Section title="Day by day" description="Shown as a timeline on the trip page.">
        <Repeater
          items={form.itinerary}
          onChange={(v) => set('itinerary', v)}
          numbered="Day"
          empty="No days yet — add the first day of the trip."
          addLabel="Add day"
          make={() => ({ title: '', activities: [] })}
          render={(d, patch, i) => (
            <div className="space-y-3">
              <Field label="Title" error={err[`itinerary.${i}.title`]}><Input value={d.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Reef, sandbank and dhow party" /></Field>
              <Field label="Activities"><ListInput value={d.activities} onChange={(activities) => patch({ activities })} placeholder="e.g. Marine park snorkel" /></Field>
            </div>
          )}
        />
      </Section>

      <Section title="What’s included">
        <Grid>
          <Field label="Included"><ListInput value={form.includes} onChange={(v) => set('includes', v)} suggestions={['Boat trips', 'Guide', 'Lunch', 'Park fees', 'Transport in Watamu']} /></Field>
          <Field label="Not included"><ListInput value={form.excludes} onChange={(v) => set('excludes', v)} suggestions={['Flights', 'Drinks', 'Travel insurance', 'Tips']} /></Field>
        </Grid>
      </Section>
    </FormPage>
  );
}
