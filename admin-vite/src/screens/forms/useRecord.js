import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/ui';
import { apiFieldErrors } from '@/forms/kit';

/*
 * Shared load/save plumbing for add/edit forms.
 * load(id) -> form values; save(form, id) -> axios promise; done -> list path.
 */
export default function useRecord({ load, save, done, noun, form }) {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    load(id)
      .then((values) => alive && form.reset(values))
      .catch((err) => alive && setError(errorMessage(err, `Couldn’t load this ${noun}.`)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (validate) => {
    const problems = validate ? validate(form.form) : {};
    setFieldErrors(problems);
    if (Object.keys(problems).length) {
      setError('Some fields need attention.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await save(form.form, isNew ? null : id);
      form.setClean();
      toast(isNew ? `${noun[0].toUpperCase()}${noun.slice(1)} added` : 'Changes saved');
      setTimeout(() => navigate(done), 0);
    } catch (err) {
      setFieldErrors(apiFieldErrors(err));
      setError(errorMessage(err, `Couldn’t save this ${noun}.`));
    }
    setSaving(false);
  };

  return { id, isNew, loading, saving, error, fieldErrors, submit };
}

/** Number or undefined from an input string. */
export const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v));
export const required = (problems, form, key, label) => { if (!String(form[key] ?? '').trim()) problems[key] = `${label} is required`; };
