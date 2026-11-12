import { api } from '@/lib/api';
import { Field, Input, Select, Textarea } from '@/ui';
import { FormPage, Grid, ListInput, MoneyInput, Problems, Repeater, Section, useForm, ChipGroup } from '@/forms/kit';
import ImageUploader from '@/forms/ImageUploader';
import useRecord, { required } from './useRecord';
import ItalianFields from '@/forms/ItalianFields';
import { appendItalian, emptyItalian, italianFrom, italianProblems } from '@/forms/italian';

const IT = ['descriptionIt'];

const EMPTY = {
  name: '', type: 'hotel', stars: '', description: '', pricePerNight: '',
  location: { address: '', mapUrl: '', coordinates: { lat: '', lng: '' } },
  facilities: [], popularFacilities: [], roomTypes: [], faqs: [], houseRules: [], contact: { whatsapp: '', email: '' },
  images: [], files: [], ...emptyItalian(IT),
};
const FACILITIES = ['Wi-Fi', 'Pool', 'Beachfront', 'Air conditioning', 'Restaurant', 'Bar', 'Parking', 'Airport shuttle', 'Spa', 'Kitchen', 'Garden', 'Family rooms'];

export default function StayForm() {
  const f = useForm(EMPTY);
  const { form, set } = f;
  const rec = useRecord({
    noun: 'stay', done: '/hotels', form: f,
    load: async (id) => {
      const h = (await api.get(`/hotels/${id}`)).data;
      return {
        ...EMPTY, name: h.name || '', type: h.type || 'hotel', stars: h.stars ?? '', description: h.description || '', pricePerNight: h.pricePerNight ?? '',
        location: { address: h.location?.address || '', mapUrl: h.location?.mapUrl || '', coordinates: { lat: h.location?.coordinates?.lat ?? '', lng: h.location?.coordinates?.lng ?? '' } },
        facilities: h.facilities || [], popularFacilities: h.popularFacilities || [],
        roomTypes: (h.roomTypes || []).map((r) => ({ name: r.name || '', price: r.price ?? '', description: r.description || '' })),
        faqs: (h.faqs || []).map((q) => ({ question: q.question || '', answer: q.answer || '' })),
        houseRules: h.houseRules || [], contact: { whatsapp: h.contact?.whatsapp || '', email: h.contact?.email || '' },
        images: h.images || [], files: [], ...italianFrom(h, IT),
      };
    },
    save: (v, id) => {
      const fd = new FormData();
      fd.append('name', v.name);
      fd.append('type', v.type);
      fd.append('stars', v.stars ?? '');
      fd.append('description', v.description);
      if (v.pricePerNight !== '') fd.append('pricePerNight', v.pricePerNight);
      const lat = v.location.coordinates.lat; const lng = v.location.coordinates.lng;
      fd.append('location', JSON.stringify({ address: v.location.address, mapUrl: v.location.mapUrl, ...(lat !== '' && lng !== '' ? { coordinates: { lat: Number(lat), lng: Number(lng) } } : {}) }));
      fd.append('facilities', JSON.stringify(v.facilities));
      fd.append('popularFacilities', JSON.stringify(v.popularFacilities));
      fd.append('roomTypes', JSON.stringify(v.roomTypes.filter((r) => r.name.trim()).map((r) => ({ ...r, price: r.price === '' ? undefined : Number(r.price) }))));
      fd.append('faqs', JSON.stringify(v.faqs.filter((q) => q.question.trim())));
      fd.append('houseRules', JSON.stringify(v.houseRules));
      fd.append('contact', JSON.stringify(v.contact));
      appendItalian(fd, v, IT);
      // Kept photos as a JSON list (an empty list removes them all), then new uploads as files.
      if (id) fd.append('existingImages', JSON.stringify(v.images));
      v.files.forEach((file) => fd.append('images', file));
      return id ? api.put(`/hotels/${id}`, fd) : api.post('/hotels', fd);
    },
  });

  const validate = (v) => {
    const p = {};
    required(p, v, 'name', 'Name');
    if (v.contact.email && !/^\S+@\S+\.\S+$/.test(v.contact.email)) p.email = 'Enter a valid email address';
    return { ...p, ...italianProblems(v, IT) };
  };
  const err = rec.fieldErrors;

  return (
    <FormPage
      title={rec.isNew ? 'Add stay' : form.name || 'Edit stay'}
      subtitle="Hotels, villas and Airbnbs travellers can add to their trip."
      back="/hotels" backLabel="Stays"
      loading={rec.loading} saving={rec.saving} error={rec.error} dirty={f.dirty}
      onSubmit={() => rec.submit(validate)} submitLabel={rec.isNew ? 'Add stay' : 'Save changes'}
      aside={
        <Section title="Contact" description="Shown to travellers as WhatsApp / email buttons.">
          <Field label="WhatsApp"><Input type="tel" value={form.contact.whatsapp} onChange={(e) => set('contact.whatsapp', e.target.value)} placeholder="+254 7…" /></Field>
          <Field label="Email" error={err.email}><Input type="email" value={form.contact.email} onChange={(e) => set('contact.email', e.target.value)} /></Field>
        </Section>
      }
    >
      <Problems errors={err} />
      <Section title="Basics">
        <Field label="Name" error={err.name}><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Grid cols={3}>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => set('type', e.target.value)}><option value="hotel">Hotel</option><option value="villa">Villa</option><option value="airbnb">Airbnb</option></Select>
          </Field>
          <Field label="Stars"><Select value={form.stars} onChange={(e) => set('stars', e.target.value)}><option value="">Unrated</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}</Select></Field>
          <Field label="From, per night" hint="Shown on the website"><MoneyInput value={form.pricePerNight} onChange={(v) => set('pricePerNight', v)} /></Field>
        </Grid>
        <Field label="Description"><Textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
      </Section>

      <ItalianFields form={form} set={set} fields={IT} errors={err} english={{ descriptionIt: form.description }} />

      <Section title="Photos" description="The first photo is the cover.">
        <ImageUploader existing={form.images} onExistingChange={(v) => set('images', v)} files={form.files} onFilesChange={(v) => set('files', v)} max={10} />
      </Section>

      <Section title="Location">
        <Field label="Address"><Input value={form.location.address} onChange={(e) => set('location.address', e.target.value)} placeholder="e.g. Turtle Bay Road, Watamu" /></Field>
        <Field label="Google Maps link" hint="Open the place in Google Maps → Share → Copy link"><Input type="url" value={form.location.mapUrl} onChange={(e) => set('location.mapUrl', e.target.value)} /></Field>
        <Grid>
          <Field label="Latitude"><Input inputMode="decimal" value={form.location.coordinates.lat} onChange={(e) => set('location.coordinates.lat', e.target.value)} placeholder="-3.354" /></Field>
          <Field label="Longitude"><Input inputMode="decimal" value={form.location.coordinates.lng} onChange={(e) => set('location.coordinates.lng', e.target.value)} placeholder="40.019" /></Field>
        </Grid>
      </Section>

      <Section title="Facilities">
        <Field label="Highlighted facilities" hint="The few that matter most — shown first"><ChipGroup options={FACILITIES.map((x) => ({ id: x, label: x }))} value={form.popularFacilities} onChange={(v) => set('popularFacilities', v)} multiple label="Highlighted facilities" /></Field>
        <Field label="All facilities"><ListInput value={form.facilities} onChange={(v) => set('facilities', v)} suggestions={FACILITIES} /></Field>
      </Section>

      <Section title="Room types">
        <Repeater items={form.roomTypes} onChange={(v) => set('roomTypes', v)} numbered="Room" empty="No room types yet." addLabel="Add room type" make={() => ({ name: '', price: '', description: '' })}
          render={(r, patch) => (
            <div className="space-y-3">
              <Grid><Field label="Name"><Input value={r.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Ocean-view double" /></Field><Field label="Price per night"><MoneyInput value={r.price} onChange={(price) => patch({ price })} /></Field></Grid>
              <Field label="Description"><Textarea rows={2} value={r.description} onChange={(e) => patch({ description: e.target.value })} /></Field>
            </div>
          )} />
      </Section>

      <Section title="House rules & FAQs">
        <Field label="House rules"><ListInput value={form.houseRules} onChange={(v) => set('houseRules', v)} suggestions={['Check-in from 2pm', 'Check-out by 10am', 'No smoking indoors', 'No parties']} /></Field>
        <Repeater items={form.faqs} onChange={(v) => set('faqs', v)} numbered="FAQ" addLabel="Add question" make={() => ({ question: '', answer: '' })}
          render={(q, patch) => (
            <div className="space-y-3">
              <Field label="Question"><Input value={q.question} onChange={(e) => patch({ question: e.target.value })} /></Field>
              <Field label="Answer"><Textarea rows={2} value={q.answer} onChange={(e) => patch({ answer: e.target.value })} /></Field>
            </div>
          )} />
      </Section>
    </FormPage>
  );
}
