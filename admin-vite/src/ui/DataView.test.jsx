// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import DataView from '@/ui/DataView';

// The list screen behind every catalogue and booking page: search, filters,
// sorting, paging and in-place updates.

const ROWS = [
  { _id: '1', name: 'Snorkel', price: 6500, active: true },
  { _id: '2', name: 'Dhow sunset', price: 4000, active: false },
  { _id: '3', name: 'Gede Ruins', price: 1500, active: true },
];

function Where() {
  return <p data-testid="url">{useLocation().search}</p>;
}

function List({ rows = ROWS }) {
  const [state, setRows] = useState(rows);
  return (
    <>
      <DataView
        title="Experiences"
        rows={state}
        setRows={setRows}
        search={(r) => r.name}
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'live', label: 'Live' }, { value: 'hidden', label: 'Hidden' }], test: (r, v) => (v === 'live' ? r.active : !r.active) }]}
        columns={[
          { key: 'name', header: 'Name', sort: (r) => r.name, cell: (r) => r.name },
          { key: 'price', header: 'Price', sort: (r) => r.price, cell: (r, api) => <button type="button" onClick={() => api.update(r._id, { price: r.price + 1 })}>{`KES ${r.price}`}</button> },
        ]}
        empty={{ title: 'No experiences yet' }}
      />
      <Where />
    </>
  );
}

const renderList = (props) => render(<MemoryRouter initialEntries={['/tours']}><List {...props} /></MemoryRouter>);
const table = () => screen.getByRole('table');
const names = () => within(table()).getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent);

describe('DataView', () => {
  afterEach(cleanup);

  it('searches (and keeps the search in the URL)', async () => {
    renderList();
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'GEDE' } });
    await act(() => new Promise((r) => setTimeout(r, 300))); // debounce
    expect(names()).toEqual(['Gede Ruins']);
    expect(screen.getByTestId('url').textContent).toBe('?q=GEDE');
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('1 of 3 items');
  });

  it('filters, counts what is shown, and says when nothing matches', async () => {
    renderList();
    const count = () => document.querySelector('[aria-live="polite"]').textContent;
    expect(count()).toBe('3 items');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'hidden' } });
    expect(names()).toEqual(['Dhow sunset']);
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'live' } });
    expect(names()).toEqual(['Snorkel', 'Gede Ruins']);
    expect(count()).toBe('2 of 3 items');

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'kayak' } });
    await act(() => new Promise((r) => setTimeout(r, 300)));
    expect(screen.getByText('Nothing matches')).toBeTruthy();
  });

  it('sorts ascending, then descending, then back to the original order', () => {
    renderList();
    const header = () => screen.getByRole('button', { name: 'Price' });
    fireEvent.click(header());
    expect(names()).toEqual(['Gede Ruins', 'Dhow sunset', 'Snorkel']);
    fireEvent.click(header());
    expect(names()).toEqual(['Snorkel', 'Dhow sunset', 'Gede Ruins']);
    fireEvent.click(header());
    expect(names()).toEqual(['Snorkel', 'Dhow sunset', 'Gede Ruins']);
  });

  it('updates a row in place (quick edits)', () => {
    renderList();
    fireEvent.click(within(table()).getByRole('button', { name: 'KES 1500' }));
    expect(within(table()).getByRole('button', { name: 'KES 1501' })).toBeTruthy();
  });

  it('pages long lists 25 at a time', () => {
    renderList({ rows: Array.from({ length: 30 }, (_, i) => ({ _id: String(i), name: `Item ${String(i).padStart(2, '0')}`, price: i, active: true })) });
    expect(names()).toHaveLength(25);
    expect(screen.getByText('Page 1 of 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(names()).toHaveLength(5);
  });

  it('says so when there is nothing yet', () => {
    renderList({ rows: [] });
    expect(screen.getByText('No experiences yet')).toBeTruthy();
  });
});
