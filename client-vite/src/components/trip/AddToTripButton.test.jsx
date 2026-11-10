// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import AddToTripButton from '@/components/trip/AddToTripButton';
import { TripProvider, useTrip } from '@/context/TripContext';
import { VibeProfileProvider } from '@/context/VibeProfileContext';
import { emptyTrip, snapshotFor } from '@/lib/trip';
import { normaliseGroupTrip, normaliseTour } from '@/lib/catalog';

const tour = normaliseTour({ _id: 't1', name: 'Marine park snorkel', description: 'd', durationHours: 4 });
const fullTrip = normaliseGroupTrip({ _id: 'g1', title: 'Reef weekend', slug: 'reef', status: 'full', maxParticipants: 2, confirmedParticipants: 2 });

function Count() {
  const { count, drawerOpen } = useTrip();
  return <p data-testid="trip">{count} items{drawerOpen ? ', drawer open' : ''}</p>;
}

const renderWith = (node) =>
  render(
    <VibeProfileProvider initialRecord={{ version: 1, status: 'skipped', profile: null }}>
      <TripProvider initialTrip={emptyTrip()}>
        {node}
        <Count />
      </TripProvider>
    </VibeProfileProvider>
  );

describe('AddToTripButton', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('adds an experience once, then opens the trip instead', async () => {
    renderWith(<AddToTripButton item={tour} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Add Marine park snorkel to my trip' })));
    expect(screen.getByTestId('trip').textContent).toBe('1 items');

    const inTrip = screen.getByRole('button', { name: /is in your trip/ });
    expect(inTrip.textContent).toContain('In your trip');
    await act(async () => fireEvent.click(inTrip));
    expect(screen.getByTestId('trip').textContent).toBe('1 items, drawer open');
  });

  it('adds stays and services from their snapshot', async () => {
    renderWith(<AddToTripButton snapshot={snapshotFor('service', { _id: 's1', name: 'Private chef', price: 8000 })} label="Add" />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Add Private chef to my trip' })));
    expect(screen.getByTestId('trip').textContent).toBe('1 items');
    expect(JSON.parse(localStorage.getItem('ew.trip.v1')).ideas).toEqual(['service:s1']);
  });

  it('cannot add a group trip that is full', () => {
    renderWith(<AddToTripButton item={fullTrip} />);
    expect(screen.getByRole('button', { name: /Add Reef weekend/ }).disabled).toBe(true);
  });
});
