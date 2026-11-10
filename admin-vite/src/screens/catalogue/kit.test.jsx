// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';

vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal()), api: { patch: vi.fn(), delete: vi.fn() } }));
const { api } = await import('@/lib/api');
const { ToastProvider, useToast } = await import('@/ui');
const { listOf, useQuick } = await import('@/screens/catalogue/kit');

// Quick edits from the lists (publish/hide, price): the change shows at once,
// then the server's answer replaces it — or the list reloads on failure.

const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
const fakeList = () => ({ update: vi.fn(), reload: vi.fn() });

describe('useQuick', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('applies the change straight away, then the saved listing', async () => {
    api.patch.mockResolvedValue({ data: { _id: 't1', active: false, name: 'Snorkel' } });
    const list = fakeList();
    const { result } = renderHook(() => useQuick('tours'), { wrapper });

    let ok;
    await act(async () => { ok = await result.current('t1', { active: false }, list, 'Snorkel hidden'); });

    expect(ok).toBe(true);
    expect(api.patch).toHaveBeenCalledWith('/admin/quick/tours/t1', { active: false });
    expect(list.update.mock.calls).toEqual([['t1', { active: false }], ['t1', { _id: 't1', active: false, name: 'Snorkel' }]]);
    expect(screen.getByText('Snorkel hidden')).toBeTruthy();
  });

  it('reloads the list and says why when the server refuses', async () => {
    api.patch.mockRejectedValue({ response: { data: { error: 'Deposit can’t be more than the full price.' } } });
    const list = fakeList();
    const { result } = renderHook(() => useQuick('grouptrips'), { wrapper });

    let ok;
    await act(async () => { ok = await result.current('g1', { depositAmount: 99999 }, list); });

    expect(ok).toBe(false);
    expect(list.reload).toHaveBeenCalled();
    expect(screen.getByText('Deposit can’t be more than the full price.')).toBeTruthy();
  });
});

describe('listOf', () => {
  it('accepts both list response shapes', () => {
    expect(listOf({ data: [1, 2] })).toEqual([1, 2]);
    expect(listOf({ data: { data: [3], total: 1 } })).toEqual([3]);
    expect(listOf({ data: { error: 'x' } })).toEqual([]);
  });
});

describe('toasts', () => {
  it('keeps a "not emailed" warning on screen longer than a normal confirmation', () => {
    vi.useFakeTimers();
    let toast;
    function Grab() {
      toast = useToast();
      return null;
    }
    render(<ToastProvider><Grab /></ToastProvider>);
    act(() => {
      toast('Changes saved');
      toast('Quote saved. Email isn’t set up on the server, so the traveller was NOT emailed — contact them directly.', 'warn');
    });
    act(() => vi.advanceTimersByTime(4500));
    expect(screen.queryByText('Changes saved')).toBeNull();
    expect(screen.getByText(/NOT emailed/)).toBeTruthy();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText(/NOT emailed/)).toBeNull();
    vi.useRealTimers();
  });
});
