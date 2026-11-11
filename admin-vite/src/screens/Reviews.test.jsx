// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal()), api: { get: vi.fn(), put: vi.fn() } }));
const { api } = await import('@/lib/api');
const { ToastProvider } = await import('@/ui');
const { default: Reviews } = await import('./Reviews');

// The moderation queue: tabs by status, the review in full, and approve /
// hide / reply — each sent to the API exactly once, with what was typed.

const row = {
  _id: 'r1', listingType: 'tour', listingId: 't1', listingTitle: 'Marine park snorkel', displayName: 'Ada L.', rating: 4,
  text: 'The reef was alive with turtles.', photos: ['https://res.cloudinary.com/demo/image/upload/v1/reviews/reef.jpg'],
  status: 'pending', booking: { type: 'tripRequest', id: 'b1', reference: 'EW-ABC234' }, createdAt: '2027-01-15T10:00:00Z',
};
const detail = { ...row, user: { name: 'Ada Lovelace', email: 'ada@example.com' }, bookingDetails: { type: 'tripRequest', id: 'b1', reference: 'EW-ABC234', status: 'accepted' } };

function renderScreen(path = '/reviews') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Reviews />
      </MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockImplementation(async (url) => {
    if (url === '/reviews/admin') return { data: { data: [row], total: 1, totalPages: 1, counts: { pending: 1, approved: 3, hidden: 0 } } };
    if (url === '/reviews/admin/r1') return { data: detail };
    throw new Error(`unexpected ${url}`);
  });
});
afterEach(cleanup);

async function openReview() {
  renderScreen();
  fireEvent.click(await screen.findByRole('button', { name: /Marine park snorkel/ }));
  return within(await screen.findByRole('dialog'));
}

describe('Reviews (moderation)', () => {
  it('opens on the reviews waiting, with counts per status', async () => {
    renderScreen();
    expect(await screen.findByText('The reef was alive with turtles.')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/reviews/admin', { params: { status: 'pending', q: undefined, page: 1, limit: 20 } });
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toEqual(['Waiting1', 'Approved3', 'Hidden0', 'All4']);
  });

  it('shows the whole review with the traveller, booking and photos', async () => {
    const sheet = await openReview();
    expect(await sheet.findByText('Ada Lovelace · ada@example.com')).toBeTruthy();
    expect(sheet.getByRole('link', { name: 'EW-ABC234' }).getAttribute('href')).toBe('/trip-requests/b1');
    expect(sheet.getByRole('link', { name: 'Marine park snorkel' }).getAttribute('href')).toBe('/tours/t1');
    expect(sheet.getByRole('img', { name: 'Photo 1' }).getAttribute('src')).toContain('c_limit,w_320/');
    expect(sheet.getByText('Verified booking')).toBeTruthy();
  });

  it('approves with an optional note, then refreshes the queue', async () => {
    api.put.mockResolvedValueOnce({ data: { review: { ...detail, status: 'approved' }, listingStats: { average: 4.5, count: 4 } } });
    const sheet = await openReview();
    fireEvent.change(await sheet.findByPlaceholderText('e.g. Checked with the guide'), { target: { value: 'Checked with the guide' } });
    await act(async () => fireEvent.click(sheet.getByRole('button', { name: 'Approve' })));
    expect(api.put).toHaveBeenCalledTimes(1);
    expect(api.put).toHaveBeenCalledWith('/reviews/admin/r1/status', { status: 'approved', note: 'Checked with the guide' });
    expect(await screen.findByText(/Approved — it’s on the website. Rating now 4.5 from 4/)).toBeTruthy();
    await waitFor(() => expect(api.get.mock.calls.filter(([u]) => u === '/reviews/admin')).toHaveLength(2));
    expect(sheet.queryByRole('button', { name: 'Approve' })).toBeNull();
  });

  it('hides a review', async () => {
    api.put.mockResolvedValueOnce({ data: { review: { ...detail, status: 'hidden' }, listingStats: { average: 0, count: 0 } } });
    const sheet = await openReview();
    await act(async () => fireEvent.click(await sheet.findByRole('button', { name: 'Hide' })));
    expect(api.put).toHaveBeenCalledWith('/reviews/admin/r1/status', { status: 'hidden', note: undefined });
    expect(await screen.findByText(/Hidden — it isn’t shown and doesn’t count/)).toBeTruthy();
  });

  it('writes, then removes, the team’s reply', async () => {
    api.put
      .mockResolvedValueOnce({ data: { review: { reply: { text: 'Asante, Ada!', by: 'ops@example.com', updatedAt: '2027-01-16T00:00:00Z' } } } })
      .mockResolvedValueOnce({ data: { review: {} } });
    const sheet = await openReview();
    const box = await sheet.findByRole('textbox', { name: 'Reply' });
    expect(sheet.getByRole('button', { name: 'Save reply' }).disabled).toBe(true);
    fireEvent.change(box, { target: { value: '  Asante, Ada!  ' } });
    await act(async () => fireEvent.click(sheet.getByRole('button', { name: 'Save reply' })));
    expect(api.put).toHaveBeenLastCalledWith('/reviews/admin/r1/reply', { text: 'Asante, Ada!' });
    await act(async () => fireEvent.click(await sheet.findByRole('button', { name: 'Remove reply' })));
    expect(api.put).toHaveBeenLastCalledWith('/reviews/admin/r1/reply', { text: '' });
  });

  it('says when an action fails, and changes nothing', async () => {
    api.put.mockRejectedValueOnce({ response: { status: 400, data: { error: 'Validation failed', issues: [{ message: 'Invalid option' }] } } });
    const sheet = await openReview();
    await act(async () => fireEvent.click(await sheet.findByRole('button', { name: 'Approve' })));
    expect(await screen.findByText('Invalid option')).toBeTruthy();
    expect(sheet.getByRole('button', { name: 'Approve' })).toBeTruthy();
  });
});
