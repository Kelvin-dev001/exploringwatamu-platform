import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Field, Input, Textarea } from '@/ui';
import { Toggle } from '@/ui/controls';
import { FormPage, Grid, ListInput, MoneyInput, Problems, Section, useForm, ChipGroup } from '@/forms/kit';
import ImageUploader from '@/forms/ImageUploader';
import VibeFields, { appendDiscovery, discoveryFrom, emptyDiscovery } from '@/forms/VibeFields';
import useRecord, { required } from './useRecord';
import ItalianFields from '@/forms/ItalianFields';
import { appendItalian, emptyItalian, italianFrom, italianProblems } from '@/forms/italian';

const IT = ['titleIt', 'descriptionIt'];

const EMPTY = {
  name: '', description: '', duration: '', recommendedTimes: '', highlights: [], whatToCarry: [], vehicles: [],
  priceForeignerAdult: '', priceForeignerChild: '', priceResidentAdult: '', priceResidentChild: '', active: true,
  gallery: [], files: [], ...emptyDiscovery, ...emptyItalian(IT),
};

export default function ExperienceForm() {
  const f = useForm(EMPTY);
  const { form, set } = f;
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => { api.get('/vehicles').then((r) => setVehicles(Array.isArray(r.data) ? r.data : [])).catch(() => {}); }, []);

  const rec = useRecord({
    noun: 'experience', done: '/tours', form: f,
    load: async (id) => {
      const t = (await api.get(`/tours/${id}`)).data;
      return {
        ...EMPTY, name: t.name || '', description: t.description || '', duration: t.duration || '', recommendedTimes: t.recommendedTimes || '',
        highlights: t.highlights || [], whatToCarry: t.whatToCarry || [], vehicles: (t.vehicles || []).map((v) => v._id || v),
        priceForeignerAdult: t.priceForeignerAdult ?? '', priceForeignerChild: t.priceForeignerChild ?? '', priceResidentAdult: t.priceResidentAdult ?? '', priceResidentChild: t.priceResidentChild ?? '',
        active: t.active !== false, gallery: t.gallery || [], files: [], ...discoveryFrom(t), ...italianFrom(t, IT),
      };
    },
    save: (v, id) => {
      const fd = new FormData();
      ['name', 'description', 'duration', 'recommendedTimes', 'priceForeignerAdult', 'priceForeignerChild', 'priceResidentAdult', 'priceResidentChild'].forEach((k) => fd.append(k, v[k] ?? ''));
      fd.append('highlights', JSON.stringify(v.highlights));
      fd.append('whatToCarry', JSON.stringify(v.whatToCarry));
      fd.append('vehicles', JSON.stringify(v.vehicles));
      fd.append('active', String(v.active));
      appendDiscovery(fd, v);
      appendItalian(fd, v, IT);
      if (id) fd.append('existingGallery', JSON.stringify(v.gallery));
      v.files.forEach((file) => fd.append('gallery', file));
      return id ? api.put(`/tours/${id}`, fd) : api.post('/tours', fd);
    },
  });

  const validate = (v) => {
    const p = {};
    required(p, v, 'name', 'Name');
    required(p, v, 'description', 'Description');
    ['priceForeignerAdult', 'priceForeignerChild', 'priceResidentAdult', 'priceResidentChild'].forEach((k) => { if (v[k] === '' || v[k] === null) p[k] = 'All four prices are required (use 0 if free)'; });
    return { ...p, ...italianProblems(v, IT) };
  };
  const err = rec.fieldErrors;

  return (
    <FormPage
      title={rec.isNew ? 'Add experience' : form.name || 'Edit experience'}
      subtitle={rec.isNew ? 'A tour or activity travellers can add to their trip.' : 'Changes go live on the website when you save.'}
      back="/tours" backLabel="Experiences"
      loading={rec.loading} saving={rec.saving} error={rec.error} dirty={f.dirty}
      onSubmit={() => rec.submit(validate)} submitLabel={rec.isNew ? 'Add experience' : 'Save changes'}
      side={<label className="flex items-center gap-2 text-sm font-medium text-ink"><Toggle checked={form.active} onChange={(v) => set('active', v)} label="Live on website" />{form.active ? 'Live on website' : 'Hidden'}</label>}
      aside={
        <Section title="Match on the website" description="How this ranks for each visitor’s vibe.">
          <VibeFields form={form} set={set} />
        </Section>
      }
    >
      <Problems errors={err} />
      <Section title="Basics">
        <Field label="Name" error={err.name}><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Marine park snorkel & sandbank lunch" /></Field>
        <Field label="Description" error={err.description} hint="What happens, what’s special, who it’s for. Shown on the experience page.">
          <Textarea rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Grid>
          <Field label="Duration" hint="Shown to travellers, e.g. “Half day” or “3 hours”"><Input value={form.duration} onChange={(e) => set('duration', e.target.value)} /></Field>
          <Field label="Best time" hint="e.g. “Oct – Mar” or “Low tide mornings”"><Input value={form.recommendedTimes} onChange={(e) => set('recommendedTimes', e.target.value)} /></Field>
        </Grid>
      </Section>

      <ItalianFields form={form} set={set} fields={IT} errors={err} english={{ titleIt: form.name, descriptionIt: form.description }} hasPage />

      <Section title="Photos" description="The first photo is the cover on the website.">
        <ImageUploader existing={form.gallery} onExistingChange={(v) => set('gallery', v)} files={form.files} onFilesChange={(v) => set('files', v)} max={10} />
      </Section>

      <Section title="Prices" description="Per person, in KES. Visitors (non-residents) see visitor prices by default.">
        <Grid cols={2}>
          <Field label="Visitor adult" error={err.priceForeignerAdult}><MoneyInput value={form.priceForeignerAdult} onChange={(v) => set('priceForeignerAdult', v)} /></Field>
          <Field label="Visitor child" error={err.priceForeignerChild}><MoneyInput value={form.priceForeignerChild} onChange={(v) => set('priceForeignerChild', v)} /></Field>
          <Field label="Kenya resident adult" error={err.priceResidentAdult}><MoneyInput value={form.priceResidentAdult} onChange={(v) => set('priceResidentAdult', v)} /></Field>
          <Field label="Kenya resident child" error={err.priceResidentChild}><MoneyInput value={form.priceResidentChild} onChange={(v) => set('priceResidentChild', v)} /></Field>
        </Grid>
      </Section>

      <Section title="Details">
        <Field label="Highlights" hint="Short points shown as a checklist"><ListInput value={form.highlights} onChange={(v) => set('highlights', v)} placeholder="e.g. Snorkel with turtles" /></Field>
        <Field label="What to bring"><ListInput value={form.whatToCarry} onChange={(v) => set('whatToCarry', v)} suggestions={['Sunscreen', 'Swimwear', 'Towel', 'Hat', 'Water bottle', 'Camera', 'Cash for tips']} /></Field>
        {vehicles.length > 0 && (
          <Field label="Vehicles used" hint="Optional — which of your vehicles run this experience">
            <ChipGroup options={vehicles.map((v) => ({ id: v._id, label: v.name }))} value={form.vehicles} onChange={(v) => set('vehicles', v)} multiple label="Vehicles" />
          </Field>
        )}
      </Section>
    </FormPage>
  );
}
