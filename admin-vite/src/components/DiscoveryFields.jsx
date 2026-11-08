import React from "react";

/*
 * "How should this be matched?" — discovery tags for tours and group trips.
 * Ids must match backend/src/constants/discovery.js and the client's
 * client-vite/src/lib/vibes.js. Visitors who pick these vibes on the website
 * see tagged listings first, with a "Great match" badge.
 */
export const VIBE_OPTIONS = [
  { id: "ocean", label: "Ocean & Reef" },
  { id: "slow", label: "Slow & Soulful" },
  { id: "adventure", label: "Adventure" },
  { id: "culture", label: "Culture & History" },
  { id: "romance", label: "Romance" },
  { id: "social", label: "Social & Nightlife" },
];
export const SUITS_OPTIONS = [
  { id: "solo", label: "Solo" },
  { id: "couple", label: "Couples" },
  { id: "friends", label: "Friends" },
  { id: "family", label: "Families" },
];
export const ENERGY_OPTIONS = [
  { id: "easy", label: "Easy" },
  { id: "moderate", label: "Moderate" },
  { id: "active", label: "Active" },
];

export const EMPTY_DISCOVERY = { vibes: [], suits: [], energy: "", durationHours: "" };

/** Pull discovery values off a listing loaded from the API. */
export function discoveryFrom(item = {}) {
  return {
    vibes: Array.isArray(item.vibes) ? item.vibes : [],
    suits: Array.isArray(item.suits) ? item.suits : [],
    energy: item.energy || "",
    durationHours: item.durationHours ?? "",
  };
}

/** Add discovery values to a multipart FormData body. */
export function appendDiscovery(data, form) {
  data.append("vibes", JSON.stringify(form.vibes || []));
  data.append("suits", JSON.stringify(form.suits || []));
  data.append("energy", form.energy || "");
  data.append("durationHours", form.durationHours === "" || form.durationHours == null ? "" : String(form.durationHours));
}

function ToggleGroup({ options, value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => toggle(o.id)}
          className={`btn btn-sm rounded-full ${value.includes(o.id) ? "btn-primary" : "btn-outline"}`}
          aria-pressed={value.includes(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function DiscoveryFields({ value, onChange }) {
  const v = { ...EMPTY_DISCOVERY, ...value };
  return (
    <fieldset className="mb-4 rounded-lg border border-base-300 p-4">
      <legend className="px-2 font-semibold">Matching on the website</legend>
      <p className="mb-3 text-sm opacity-70">
        Visitors who choose these vibes see this listing first. Untagged listings still show, just lower down.
      </p>

      <label className="mb-1 block text-sm font-semibold">Vibes (pick up to 3)</label>
      <div className="mb-4">
        <ToggleGroup options={VIBE_OPTIONS} value={v.vibes} onChange={(next) => onChange("vibes", next.slice(0, 3))} />
      </div>

      <label className="mb-1 block text-sm font-semibold">Great for</label>
      <div className="mb-4">
        <ToggleGroup options={SUITS_OPTIONS} value={v.suits} onChange={(next) => onChange("suits", next)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="form-control">
          <span className="mb-1 text-sm font-semibold">Energy level</span>
          <select className="select select-bordered" value={v.energy} onChange={(e) => onChange("energy", e.target.value)}>
            <option value="">Not set</option>
            {ENERGY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="mb-1 text-sm font-semibold">Length (hours)</span>
          <input
            type="number"
            min="0.5"
            step="0.5"
            className="input input-bordered"
            placeholder="e.g. 4 for half a day"
            value={v.durationHours}
            onChange={(e) => onChange("durationHours", e.target.value)}
          />
        </label>
      </div>
    </fieldset>
  );
}
