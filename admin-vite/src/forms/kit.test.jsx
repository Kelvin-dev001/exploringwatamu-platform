// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { Link, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { ChipGroup, FormPage, ListInput, apiFieldErrors, useForm } from '@/forms/kit';

afterEach(cleanup);

describe('useForm', () => {
  it('sets nested fields without touching the rest, and tracks unsaved changes', () => {
    const { result } = renderHook(() => useForm({ name: '', location: { address: '', coordinates: { lat: '' } }, tags: ['a'] }));
    expect(result.current.dirty).toBe(false);

    act(() => result.current.set('location.coordinates.lat', '-3.35'));
    act(() => result.current.set('tags', (t) => [...t, 'b']));
    expect(result.current.form).toEqual({ name: '', location: { address: '', coordinates: { lat: '-3.35' } }, tags: ['a', 'b'] });
    expect(result.current.dirty).toBe(true);

    act(() => result.current.reset({ name: 'Loaded' }));
    expect(result.current).toMatchObject({ form: { name: 'Loaded' }, dirty: false });
  });
});

describe('apiFieldErrors', () => {
  it('maps zod issues and upload errors to fields (first message wins)', () => {
    const err = { response: { data: { issues: [{ path: 'title', message: 'Title is required' }, { path: 'title', message: 'second' }, { path: 'maxParticipants', message: 'There are already 2 confirmed travellers.' }] } } };
    expect(apiFieldErrors(err)).toEqual({ title: 'Title is required', maxParticipants: 'There are already 2 confirmed travellers.' });
    expect(apiFieldErrors({ response: { data: { error: '"gallery" is too large', field: 'gallery' } } })).toEqual({ gallery: '"gallery" is too large' });
    expect(apiFieldErrors(new Error('offline'))).toEqual({});
  });
});

describe('ListInput', () => {
  it('adds on Enter or tap, ignores duplicates, and removes', () => {
    const onChange = vi.fn();
    const { rerender } = render(<ListInput value={['Sunscreen']} onChange={onChange} suggestions={['Sunscreen', 'Hat']} />);
    const input = screen.getByPlaceholderText('Type and press Enter');

    fireEvent.change(input, { target: { value: '  Towel ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(['Sunscreen', 'Towel']);

    onChange.mockClear();
    fireEvent.change(input, { target: { value: 'Sunscreen' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();

    expect(screen.queryByRole('button', { name: '+ Sunscreen' })).toBeNull(); // only unused suggestions
    fireEvent.click(screen.getByRole('button', { name: '+ Hat' }));
    expect(onChange).toHaveBeenLastCalledWith(['Sunscreen', 'Hat']);

    rerender(<ListInput value={['Sunscreen', 'Hat']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Sunscreen' }));
    expect(onChange).toHaveBeenLastCalledWith(['Hat']);
  });
});

describe('ChipGroup', () => {
  const options = [{ id: 'ocean', label: 'Ocean' }, { id: 'slow', label: 'Slow' }, { id: 'culture', label: 'Culture' }];

  it('toggles in multi mode and respects the maximum', () => {
    const onChange = vi.fn();
    render(<ChipGroup options={options} value={['ocean', 'slow']} onChange={onChange} multiple max={2} label="Vibes" />);
    expect(screen.getByRole('button', { name: 'Ocean' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Culture' }));
    expect(onChange).not.toHaveBeenCalled(); // already at max
    fireEvent.click(screen.getByRole('button', { name: 'Ocean' }));
    expect(onChange).toHaveBeenLastCalledWith(['slow']);
  });

  it('works as a single choice that can be cleared', () => {
    const onChange = vi.fn();
    render(<ChipGroup options={options} value="slow" onChange={onChange} label="Pace" />);
    fireEvent.click(screen.getByRole('button', { name: 'Slow' }));
    expect(onChange).toHaveBeenLastCalledWith('');
  });
});

describe('FormPage unsaved-changes guard', () => {
  function renderForm({ dirty }) {
    const router = createMemoryRouter(
      [
        {
          path: '/tours/1',
          element: (
            <FormPage title="Edit experience" back="/tours" backLabel="Experiences" dirty={dirty} onSubmit={() => {}}>
              <Link to="/dashboard">Dashboard</Link>
            </FormPage>
          ),
        },
        { path: '/dashboard', element: <p>Dashboard page</p> },
        { path: '/tours', element: <p>Experiences list</p> },
      ],
      { initialEntries: ['/tours/1'] }
    );
    render(<RouterProvider router={router} />);
    return router;
  }

  it('asks before leaving with unsaved changes, and stays if the admin cancels', async () => {
    const router = renderForm({ dirty: true });
    await act(async () => fireEvent.click(screen.getByText('Dashboard')));
    const dialog = screen.getByRole('dialog', { name: 'Leave without saving?' });
    expect(router.state.location.pathname).toBe('/tours/1');

    await act(async () => fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' })));
    expect(router.state.location.pathname).toBe('/tours/1');
  });

  it('leaves when the admin confirms', async () => {
    const router = renderForm({ dirty: true });
    await act(async () => fireEvent.click(screen.getByText('Dashboard')));
    const dialog = screen.getByRole('dialog', { name: 'Leave without saving?' });
    await act(async () => fireEvent.click(within(dialog).getByRole('button', { name: 'Leave' })));
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('lets the admin go without asking when nothing changed', async () => {
    const router = renderForm({ dirty: false });
    await act(async () => fireEvent.click(screen.getByText('Experiences')));
    expect(router.state.location.pathname).toBe('/tours');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
