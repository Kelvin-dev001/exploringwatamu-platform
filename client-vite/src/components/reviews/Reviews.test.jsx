// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
const axios = (await import('axios')).default;
const { default: ReviewsSection } = await import('@/components/reviews/ReviewsSection');
const { default: ReviewForm, StarInput } = await import('@/components/reviews/ReviewForm');
const { RatingBadge, RatingStars } = await import('@/components/reviews/Rating');

// Public reviews (loading, empty, error, paging) and writing one (validation,
// what is sent, and a photo failure that leaves the review in place).

const review = (n, extra = {}) => ({ _id: `r${n}`, displayName: `Traveller ${n}`, rating: 4, text: `Review number ${n}`, photos: [], verified: true, reply: null, createdAt: '2027-01-15T00:00:00Z', ...extra });
const page = (data, { page = 1, totalPages = 1, total = data.length, summary = { average: 4, count: total } } = {}) => ({ data: { data, page, totalPages, total, summary } });

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('ReviewsSection', () => {
  it('shows a loading state, then the approved reviews with the summary', async () => {
    let resolve;
    axios.get.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    render(<ReviewsSection listingType="tour" listingId="t1" />);
    expect(screen.getByRole('status', { name: 'Loading reviews' })).toBeTruthy();
    await act(async () => resolve(page([review(1, { reply: { text: 'Asante!' } }), review(2, { verified: false })], { summary: { average: 4.5, count: 2 } })));
    expect(screen.getByText('Review number 1')).toBeTruthy();
    expect(screen.getByText('Asante!')).toBeTruthy();
    expect(screen.getAllByText('Verified trip')).toHaveLength(1);
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/reviews$/), { params: { listingType: 'tour', listingId: 't1', page: 1, limit: 5 } });
  });

  it('explains where reviews come from when there are none', async () => {
    axios.get.mockResolvedValueOnce(page([], { total: 0, summary: { average: 0, count: 0 } }));
    render(<ReviewsSection listingType="stay" listingId="h1" />);
    expect(await screen.findByText('No reviews yet')).toBeTruthy();
    expect(screen.getByText(/only from travellers who did this stay with us/)).toBeTruthy();
  });

  it('offers a retry when loading fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(page([review(1)]));
    render(<ReviewsSection listingType="tour" listingId="t1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Review number 1')).toBeTruthy();
  });

  it('loads more five at a time', async () => {
    axios.get
      .mockResolvedValueOnce(page([1, 2, 3, 4, 5].map((n) => review(n)), { totalPages: 2, total: 7 }))
      .mockResolvedValueOnce(page([review(6), review(7)], { page: 2, totalPages: 2, total: 7 }));
    render(<ReviewsSection listingType="tour" listingId="t1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Show more reviews (2 more)' }));
    expect(await screen.findByText('Review number 7')).toBeTruthy();
    expect(screen.getAllByText(/^Review number/)).toHaveLength(7);
    expect(screen.queryByRole('button', { name: /Show more/ })).toBeNull();
    expect(axios.get).toHaveBeenLastCalledWith(expect.any(String), { params: { listingType: 'tour', listingId: 't1', page: 2, limit: 5 } });
  });
});

describe('ratings on cards', () => {
  it('show nothing without approved reviews, and a labelled rating with them', () => {
    const { container } = render(<RatingBadge stats={{ average: 0, count: 0 }} />);
    expect(container.textContent).toBe('');
    render(<RatingBadge stats={{ average: 4.75, count: 12 }} />);
    expect(screen.getByLabelText('Rated 4.8 out of 5 from 12 reviews')).toBeTruthy();
    render(<RatingStars value={3} />);
    expect(screen.getByRole('img', { name: 'Rated 3.0 out of 5' })).toBeTruthy();
  });

  it('fills stars to the nearest half, never rounding 4.5 up to 5', () => {
    const fills = (v) => [...render(<RatingStars value={v} />).container.querySelectorAll('[data-fill]')].map((s) => Number(s.dataset.fill));
    expect(fills(4.5)).toEqual([1, 1, 1, 1, 0.5]);
    expect(fills(4.2)).toEqual([1, 1, 1, 1, 0]);
    expect(fills(4.8)).toEqual([1, 1, 1, 1, 1]);
    expect(fills(0)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe('writing a review', () => {
  const item = { listingType: 'tour', listingId: 't1', listingTitle: 'Snorkel', booking: { type: 'tripRequest', id: 'b1', reference: 'EW-ABC234' } };
  const fill = (text) => fireEvent.change(screen.getByLabelText('Your review'), { target: { value: text } });

  it('picks a rating with real radio buttons', () => {
    const onChange = vi.fn();
    render(<StarInput name="r" value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /^4 stars/ }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('needs a rating and enough words before it can be sent, then sends exactly that', async () => {
    const onDone = vi.fn();
    axios.post.mockResolvedValueOnce({ data: { review: { _id: 'new', status: 'pending', rating: 5 } } });
    render(<ReviewForm item={item} token="tok" inviteToken="inv" onDone={onDone} />);
    const send = screen.getByRole('button', { name: 'Send my review' });
    expect(send.disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: /^5 stars/ }));
    fill('Too short');
    expect(send.disabled).toBe(true);
    fill('  The reef was alive with turtles and the guide was patient.  ');
    expect(send.disabled).toBe(false);
    await act(async () => fireEvent.click(send));
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/reviews$/),
      { listingType: 'tour', listingId: 't1', bookingType: 'tripRequest', bookingId: 'b1', rating: 5, text: 'The reef was alive with turtles and the guide was patient.', inviteToken: 'inv' },
      { headers: { Authorization: 'Bearer tok' } }
    );
    expect(onDone).toHaveBeenCalledWith({ _id: 'new', status: 'pending', rating: 5 });
  });

  it('shows the server’s reason when a review is refused', async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 409, data: { error: 'You’ve already reviewed this for this trip.' } } });
    render(<ReviewForm item={item} token="tok" onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: /^3 stars/ }));
    fill('Nice enough but very crowded at noon.');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Send my review' })));
    expect(screen.getByRole('alert').textContent).toMatch(/already reviewed/);
  });

  it('keeps the review when the photos fail, and lets the traveller retry or skip them', async () => {
    const onDone = vi.fn();
    axios.post
      .mockResolvedValueOnce({ data: { review: { _id: 'new', status: 'pending', rating: 4 } } })
      .mockRejectedValueOnce({ response: { status: 502, data: { error: 'Image upload failed' } } });
    render(<ReviewForm item={item} token="tok" onDone={onDone} />);
    fireEvent.click(screen.getByRole('radio', { name: /^4 stars/ }));
    fill('Lovely boat trip, great snorkelling spots.');
    const photo = new File(['x'], 'reef.png', { type: 'image/png' });
    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [photo] } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Send my review' })));

    expect(screen.getByRole('alert').textContent).toMatch(/Your review is in, but the photos couldn’t be added: Image upload failed/);
    expect(onDone).not.toHaveBeenCalled();
    expect(axios.post.mock.calls[1][0]).toMatch(/\/reviews\/new\/photos$/);
    fireEvent.click(screen.getByRole('button', { name: 'Skip the photos' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith({ _id: 'new', status: 'pending', rating: 4 }));
  });
});
