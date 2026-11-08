import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Field, Input, Select, Textarea } from '@/ui';
import { Toggle } from '@/ui/controls';
import { ChipGroup, FormPage, Grid, MoneyInput, Problems, Section, useForm } from '@/forms/kit';
import ImageUploader from '@/forms/ImageUploader';
import useRecord, { required } from './useRecord';

/* Transfers, car hire, vehicles, services and property — same structure, smaller forms. */

function useVehicles() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/vehicles').then((r) => setList(Array.isArray(r.data) ? r.data : [])).catch(() => setList([])); }, []);
  return list;
}

function VehicleSelect({ value, onChange, error, vehicles }) {
  return (
    <Field label="Vehicle" error={error} hint={vehicles && !vehicles.length ? 'Add a vehicle first (Catalogue → Vehicles).' : undefined}>
      <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={!vehicles}>
        <option value="">{vehicles ? 'Choose a vehicle' : 'Loading…'}</option>
        {(vehicles || []).map((v) => <option key={v._id} value={v._id}>{v.name}{v.capacity ? ` · ${v.capacity} seats` : ''}</option>)}
      </Select>
    </Field>
  );
}

const LiveSwitch = ({ form, set }) => (
  <label className="flex items-center gap-2 text-sm font-medium text-ink"><Toggle checked={form.active} onChange={(v) => set('active', v)} label="Live on website" />{form.active ? 'Live on website' : 'Hidden'}</label>
);

/* ---------- Transfer ---------- */
const ROUTES = ['SGR-Watamu', 'Moi International Airport-Watamu', 'Malindi-Watamu', 'Mombasa-Watamu', 'Diani-Watamu'];

export function TransferForm() {
  const f = useForm({ route: '', vehicle: '', price: '', active: true, description: '' });
  const { form, set } = f;
  const vehicles = useVehicles();
  const rec = useRecord({
    noun: 'transfer', done: '/transfers', form: f,
    load: async (id) => { const t = (await api.get(`/transfers/${id}`)).data; return { route: t.route || '', vehicle: t.vehicle?._id || t.vehicle || '', price: t.price ?? '', active: t.active !== false, description: t.description || '' }; },
    save: (v, id) => { const body = { ...v, price: Number(v.price) }; return id ? api.put(`/transfers/${id}`, body) : api.post('/transfers', body); },
  });
  const validate = (v) => { const p = {}; required(p, v, 'route', 'Route'); required(p, v, 'vehicle', 'Vehicle'); required(p, v, 'price', 'Price'); return p; };
  const err = rec.fieldErrors;
  return (
    <FormPage title={rec.isNew ? 'Add transfer' : 'Edit transfer'} subtitle="A transfer route travellers can add to their trip." back="/transfers" backLabel="Transfers"
      loading={rec.loading} saving={rec.saving} error={rec.error} dirty={f.dirty} onSubmit={() => rec.submit(validate)} submitLabel={rec.isNew ? 'Add transfer' : 'Save changes'} side={<LiveSwitch form={form} set={set} />}>
      <Problems errors={err} />
      <Section title="Route & price">
        <Field label="Route" error={err.route}><Select value={form.route} onChange={(e) => set('route', e.target.value)}><option value="">Choose a route</option>{ROUTES.map((r) => <option key={r} value={r}>{r.replace('-', ' → ')}</option>)}</Select></Field>
        <Grid>
          <VehicleSelect value={form.vehicle} onChange={(v) => set('vehicle', v)} error={err.vehicle} vehicles={vehicles} />
          <Field label="Price per vehicle" error={err.price}><MoneyInput value={form.price} onChange={(v) => set('price', v)} /></Field>
        </Grid>
        <Field label="Description" hint="Pick-up details, luggage, waiting time"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
      </Section>
    </FormPage>
  );
}

/* ---------- Car hire ---------- */
export function CarHireForm() {
  const f = useForm({ vehicle: '', dailyRate: '', active: true, description: '' });
  const { form, set } = f;
  const vehicles = useVehicles();
  const rec = useRecord({
    noun: 'car', done: '/carhire', form: f,
    load: async (id) => { const c = (await api.get(`/carhire/${id}`)).data; return { vehicle: c.vehicle?._id || c.vehicle || '', dailyRate: c.dailyRate ?? '', active: c.active !== false, description: c.description || '' }; },
    save: (v, id) => { const body = { ...v, dailyRate: Number(v.dailyRate) }; return id ? api.put(`/carhire/${id}`, body) : api.post('/carhire', body); },
  });
  const validate = (v) => { const p = {}; required(p, v, 'vehicle', 'Vehicle'); required(p, v, 'dailyRate', 'Daily rate'); return p; };
  const err = rec.fieldErrors;
  return (
    <FormPage title={rec.isNew ? 'Add car for hire' : 'Edit car hire'} back="/carhire" backLabel="Car hire"
      loading={rec.loading} saving={rec.saving} error={rec.error} dirty={f.dirty} onSubmit={() => rec.submit(validate)} submitLabel={rec.isNew ? 'Add car' : 'Save changes'} side={<LiveSwitch form={form} set={set} />}>
      <Problems errors={err} />
      <Section title="Car & rate" description="Photo and seats come from the vehicle.">
        <Grid>
          <VehicleSelect value={form.vehicle} onChange={(v) => set('vehicle', v)} error={err.vehicle} vehicles={vehicles} />
          <Field label="Daily rate" error={err.dailyRate}><MoneyInput value={form.dailyRate} onChange={(v) => set('dailyRate', v)} /></Field>
        </Grid>
        <Field label="Description" hint="Self-drive or with driver, fuel policy, deposit"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
      </Section>
    </FormPage>
  );
}

/* ---------- Vehicle ---------- */
export function VehicleForm() {
  const f = useForm({ name: '', capacity: '', description: '', image: [], file: [] });
  const { form, set } = f;
  const rec = useRecord({
    noun: 'vehicle', done: '/vehicles', form: f,
    load: async (id) => { const v = (await api.get(`/vehicles/${id}`)).data; return { name: v.name || '', capacity: v.capacity ?? '', description: v.description || '', image: v.image ? [v.image] : [], file: [] }; },
    save: (v, id) => {
      const fd = new FormData();
      fd.append('name', v.name);
      fd.append('capacity', v.capacity ?? '');
      fd.append('description', v.description);
      if (v.file[0]) fd.append('image', v.file[0]);
      else if (v.image[0]) fd.append(id ? 'existingImage' : 'image', v.image[0]);
      return id ? api.put(`/vehicles/${id}`, fd) : api.post('/vehicles', fd);
    },
  });
  const validate = (v) => { const p = {}; required(p, v, 'name', 'Name'); return p; };
  const err = rec.fieldErrors;
  return (
    <FormPage title={rec.isNew ? 'Add vehicle' : form.name || 'Edit vehicle'} subtitle="Used by transfers, car hire and experiences." back="/vehicles" backLabel="Vehicles"
      loading={rec.loading} saving={rec.saving} error={rec.error} dirty={f.dirty} onSubmit={() => rec.submit(validate)} submitLabel={rec.isNew ? 'Add vehicle' : 'Save changes'}>
      <Problems errors={err} />
      <Section title="Vehicle">
        <Grid>
          <Field label="Name" error={err.name}><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Toyota Land Cruiser" /></Field>
          <Field label="Seats"><Input type="number" min="1" inputMode="numeric" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} /></Field>
        </Grid>
        <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
      </Section>
      <Section title="Photo">
        <ImageUploader single label="Photo" existing={form.image} onExistingChange={(v) => set('image', v)} files={form.file} onFilesChange={(v) => set('file', v)} />
      </Section>
    </FormPage>
  );
}

/* ---------- Service ---------- */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ServiceForm() {
  const f = useForm({ name: '', description: '', pricingType: 'daily', price: '', availableDays: [], start: '', end: '', active: true, gallery: [], files: [] });
  const { form, set } = f;
  const rec = useRecord({
    noun: 'service', done: '/services', form: f,
    load: async (id) => {
      const s = (await api.get(`/services/${id}`)).data;
      return { name: s.name || '', description: s.description || '', pricingType: s.pricingType || 'daily', price: s.price ?? '', availableDays: s.availableDays || [], start: s.availableHours?.start || '', end: s.availableHours?.end || '', active: s.active !== false, gallery: s.gallery || [], files: [] };
    },
    save: (v, id) => {
      const fd = new FormData();
      ['name', 'description', 'pricingType', 'price'].forEach((k) => fd.append(k, v[k] ?? ''));
      fd.append('availableDays', JSON.stringify(v.availableDays));
      fd.append('availableHours', JSON.stringify({ start: v.start, end: v.end }));
      fd.append('active', String(v.active));
      if (id) fd.append('existingGallery', JSON.stringify(v.gallery));
      v.files.forEach((file) => fd.append('gallery', file));
      return id ? api.put(`/services/${id}`, fd) : api.post('/services', fd);
    },
  });
  const validate = (v) => { const p = {}; required(p, v, 'name', 'Name'); required(p, v, 'description', 'Description'); required(p, v, 'price', 'Price'); return p; };
  const err = rec.fieldErrors;
  return (
    <FormPage title={rec.isNew ? 'Add service' : form.name || 'Edit service'} subtitle="Chefs, guides, wellness and other local services." back="/services" backLabel="Services"
      loading={rec.loading} saving={rec.saving} error={rec.error} dirty={f.dirty} onSubmit={() => rec.submit(validate)} submitLabel={rec.isNew ? 'Add service' : 'Save changes'} side={<LiveSwitch form={form} set={set} />}>
      <Problems errors={err} />
      <Section title="Basics">
        <Field label="Name" error={err.name}><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Private Swahili chef" /></Field>
        <Field label="Description" error={err.description}><Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Grid>
          <Field label="Priced"><Select value={form.pricingType} onChange={(e) => set('pricingType', e.target.value)}><option value="hourly">Per hour</option><option value="daily">Per day</option></Select></Field>
          <Field label="Price" error={err.price}><MoneyInput value={form.price} onChange={(v) => set('price', v)} /></Field>
        </Grid>
      </Section>
      <Section title="Availability">
        <Field label="Days"><ChipGroup options={DAYS.map((d) => ({ id: d, label: d.slice(0, 3) }))} value={form.availableDays} onChange={(v) => set('availableDays', v)} multiple label="Available days" /></Field>
        <Grid>
          <Field label="From"><Input type="time" value={form.start} onChange={(e) => set('start', e.target.value)} /></Field>
          <Field label="Until"><Input type="time" value={form.end} onChange={(e) => set('end', e.target.value)} /></Field>
        </Grid>
      </Section>
      <Section title="Photos">
        <ImageUploader existing={form.gallery} onExistingChange={(v) => set('gallery', v)} files={form.files} onFilesChange={(v) => set('files', v)} max={10} />
      </Section>
    </FormPage>
  );
}

/* ---------- Property ---------- */
export function PropertyForm() {
  const f = useForm({ type: 'villa', name: '', description: '', location: '', price: '', active: true, pictures: [], pictureFiles: [], documents: [], documentFiles: [] });
  const { form, set } = f;
  const rec = useRecord({
    noun: 'property', done: '/properties', form: f,
    load: async (id) => {
      const p = (await api.get(`/properties/${id}`)).data;
      return { type: p.type || 'villa', name: p.name || '', description: p.description || '', location: p.location || '', price: p.price ?? '', active: p.active !== false, pictures: p.pictures || [], pictureFiles: [], documents: p.documents || [], documentFiles: [] };
    },
    save: (v, id) => {
      const fd = new FormData();
      ['type', 'name', 'description', 'location', 'price'].forEach((k) => fd.append(k, v[k] ?? ''));
      fd.append('active', String(v.active));
      if (id) { fd.append('existingPictures', JSON.stringify(v.pictures)); fd.append('existingDocuments', JSON.stringify(v.documents)); }
      v.pictureFiles.forEach((file) => fd.append('pictures', file));
      v.documentFiles.forEach((file) => fd.append('documents', file));
      return id ? api.put(`/properties/${id}`, fd) : api.post('/properties', fd);
    },
  });
  const validate = (v) => { const p = {}; required(p, v, 'name', 'Name'); required(p, v, 'description', 'Description'); required(p, v, 'location', 'Location'); required(p, v, 'price', 'Asking price'); return p; };
  const err = rec.fieldErrors;
  return (
    <FormPage title={rec.isNew ? 'Add property' : form.name || 'Edit property'} subtitle="Villas, apartments and land for sale." back="/properties" backLabel="Property"
      loading={rec.loading} saving={rec.saving} error={rec.error} dirty={f.dirty} onSubmit={() => rec.submit(validate)} submitLabel={rec.isNew ? 'Add property' : 'Save changes'} side={<LiveSwitch form={form} set={set} />}>
      <Problems errors={err} />
      <Section title="Basics">
        <Grid>
          <Field label="Type"><Select value={form.type} onChange={(e) => set('type', e.target.value)}><option value="villa">Villa</option><option value="apartment">Apartment</option><option value="land">Land</option></Select></Field>
          <Field label="Asking price" error={err.price}><MoneyInput value={form.price} onChange={(v) => set('price', v)} /></Field>
        </Grid>
        <Field label="Name" error={err.name}><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Location" error={err.location}><Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Mida Creek, Watamu" /></Field>
        <Field label="Description" error={err.description}><Textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
      </Section>
      <Section title="Photos">
        <ImageUploader existing={form.pictures} onExistingChange={(v) => set('pictures', v)} files={form.pictureFiles} onFilesChange={(v) => set('pictureFiles', v)} max={10} />
      </Section>
      <Section title="Documents" description="Title deeds, site plans… uploaded as images (photos or scans).">
        <ImageUploader label="Documents" existing={form.documents} onExistingChange={(v) => set('documents', v)} files={form.documentFiles} onFilesChange={(v) => set('documentFiles', v)} max={10} />
      </Section>
    </FormPage>
  );
}
