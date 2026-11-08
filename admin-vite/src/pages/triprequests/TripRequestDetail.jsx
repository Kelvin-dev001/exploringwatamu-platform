import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";
import { parseApiError } from "../../apiError.js";
import FormError from "../../components/FormError";
import { statusBadge, kes, fmtDate } from "./shared";

const VIBE_LABEL = { ocean: "Ocean & Reef", slow: "Slow & Soulful", adventure: "Adventure", culture: "Culture & History", romance: "Romance", social: "Social & Nightlife" };

/** Suggested quote lines from the itinerary: listed adult price x adults. Admin edits before sending. */
function suggestLines(r) {
  const all = [...(r.days || []).flatMap((d) => d.items || []), ...(r.ideas || [])];
  return all.map((it) => ({
    label: `${it.title}${it.listedPrice ? ` (${r.adults} adult${r.adults === 1 ? "" : "s"}${r.children ? `, ${r.children} child${r.children === 1 ? "" : "ren"}` : ""})` : ""}`,
    amount: it.listedPrice ? String(it.listedPrice * r.adults) : "",
  }));
}

function inDays(n) {
  const d = new Date(Date.now() + n * 86400000);
  return d.toISOString().slice(0, 10);
}

export default function TripRequestDetail() {
  const { id } = useParams();
  const { token } = useAdminAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [r, setR] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [lines, setLines] = useState([]);
  const [message, setMessage] = useState("");
  const [validUntil, setValidUntil] = useState(inDays(14));
  const [adminNotes, setAdminNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/trip-requests/${id}`, { headers });
      const data = res.data;
      setR(data);
      setAdminNotes(data.adminNotes || "");
      if (data.quote?.lines?.length) {
        setLines(data.quote.lines.map((l) => ({ label: l.label, amount: String(l.amount) })));
        setMessage(data.quote.message || "");
        if (data.quote.validUntil) setValidUntil(String(data.quote.validUntil).slice(0, 10));
      } else {
        setLines(suggestLines(data));
        setMessage(`Hi ${data.contact?.name?.split(" ")[0] || ""},\n\nThank you for planning your Watamu trip with us. Here's the price for everything in your itinerary.`);
      }
    } catch (err) {
      setLoadError(err?.response?.data?.error || "Could not load this trip request.");
    }
  }, [id, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const setLine = (i, patch) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const sendQuote = async () => {
    if (!window.confirm(`Email this quote (${kes(total)}) to ${r.contact.email}?`)) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await axios.put(
        `${API_URL}/trip-requests/${id}/quote`,
        { lines: lines.filter((l) => l.label.trim()).map((l) => ({ label: l.label.trim(), amount: Number(l.amount) || 0 })), message, validUntil, adminNotes },
        { headers }
      );
      setR(res.data);
      setFlash("Quote sent. The traveller will receive it by email shortly.");
    } catch (err) {
      setFormError(parseApiError(err, "Could not send the quote."));
    }
    setBusy(false);
  };

  const setStatus = async (status) => {
    const notify = status !== "new" && window.confirm(`Mark as ${status}. Email the traveller about it?`);
    setBusy(true);
    setFormError(null);
    try {
      const res = await axios.put(`${API_URL}/trip-requests/${id}/status`, { status, notify }, { headers });
      setR(res.data);
      setFlash(`Marked as ${status}.`);
    } catch (err) {
      setFormError(parseApiError(err, "Could not update the status."));
    }
    setBusy(false);
  };

  const saveNotes = async () => {
    try {
      await axios.put(`${API_URL}/trip-requests/${id}/notes`, { adminNotes }, { headers });
      setFlash("Notes saved.");
    } catch (err) {
      setFormError(parseApiError(err, "Could not save notes."));
    }
  };

  if (loadError) return <div className="p-6"><div className="alert alert-error">{loadError}</div></div>;
  if (!r) return <div className="p-10 text-center"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link to="/trip-requests" className="link text-sm">← All trip requests</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold">{r.reference}</h1>
        <span className={statusBadge(r.status)}>{r.status}</span>
        <span className="text-sm opacity-60">received {fmtDate(r.createdAt)}</span>
      </div>
      {flash && <div className="alert alert-success mt-4">{flash}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Traveller + itinerary */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Traveller</h2>
              <p className="font-semibold">{r.contact.name}</p>
              <p><a className="link" href={`mailto:${r.contact.email}`}>{r.contact.email}</a></p>
              {r.contact.phone && <p><a className="link" href={`tel:${r.contact.phone}`}>{r.contact.phone}</a></p>}
              {r.contact.country && <p className="opacity-70">From {r.contact.country}</p>}
              <div className="divider my-1" />
              <p>{r.adults} adult{r.adults === 1 ? "" : "s"}{r.children ? `, ${r.children} child${r.children === 1 ? "" : "ren"}` : ""}</p>
              <p>{r.arrival ? `${fmtDate(r.arrival)} – ${fmtDate(r.departure)}` : `${(r.days || []).length} days, dates flexible`}</p>
              <p className="text-sm opacity-70">Saw {r.residency === "resident" ? "Kenya-resident" : "visitor"} prices{r.estimate?.total ? ` · website estimate ${kes(r.estimate.total)}` : ""}</p>
              {r.profile?.vibes?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.profile.vibes.map((v) => <span key={v} className="badge badge-outline">{VIBE_LABEL[v] || v}</span>)}
                  {r.profile.companions && <span className="badge badge-outline">{r.profile.companions}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Itinerary</h2>
              {(r.days || []).map((d, i) => (
                <div key={i} className="mb-2">
                  <p className="font-semibold">{d.label || `Day ${i + 1}`}</p>
                  {d.items.length === 0 ? (
                    <p className="text-sm opacity-60">Free day</p>
                  ) : (
                    <ul className="ml-5 list-disc text-sm">
                      {d.items.map((it, j) => (
                        <li key={j}>{it.title}{it.hours ? <span className="opacity-60"> · {it.hours}h</span> : null}{it.listedPrice ? <span className="opacity-60"> · listed {kes(it.listedPrice)}</span> : null}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {(r.ideas || []).length > 0 && (
                <div>
                  <p className="font-semibold">Stays, extras &amp; unscheduled</p>
                  <ul className="ml-5 list-disc text-sm">{r.ideas.map((it, j) => <li key={j}>{it.title}</li>)}</ul>
                </div>
              )}
              {r.notes && (
                <div className="mt-2 rounded-lg bg-base-200 p-3 text-sm">
                  <p className="font-semibold">Traveller notes</p>
                  <p className="whitespace-pre-line">{r.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">History</h2>
              <ul className="text-sm">
                {(r.history || []).map((h, i) => (
                  <li key={i}>{fmtDate(h.at)} — <span className={statusBadge(h.status)}>{h.status}</span> by {h.by}{h.note ? ` · ${h.note}` : ""}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Quote builder */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">{r.quote?.sentAt ? "Quote (sent " + fmtDate(r.quote.sentAt) + ")" : "Build the quote"}</h2>
              <p className="text-sm opacity-70">Lines are pre-filled from the itinerary using listed adult prices. Adjust for children, transfers, availability and any package discount.</p>
              <div className="mt-2 space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input input-bordered input-sm flex-1" value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} placeholder="Description" />
                    <input className="input input-bordered input-sm w-32 text-right" type="number" min="0" value={l.amount} onChange={(e) => setLine(i, { amount: e.target.value })} placeholder="KES" />
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} aria-label="Remove line">✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setLines((ls) => [...ls, { label: "", amount: "" }])}>+ Add line</button>
              </div>
              <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span>{kes(total)}</span>
              </div>
              <label className="form-control mt-3">
                <span className="label-text mb-1 font-semibold">Message to the traveller</span>
                <textarea className="textarea textarea-bordered" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
              </label>
              <label className="form-control mt-2 w-48">
                <span className="label-text mb-1 font-semibold">Valid until</span>
                <input type="date" className="input input-bordered input-sm" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </label>
              <FormError error={formError} />
              <button type="button" className={`btn btn-primary mt-3 ${busy ? "loading" : ""}`} disabled={busy || r.status === "cancelled" || total <= 0} onClick={sendQuote}>
                {r.quote?.sentAt ? "Send updated quote" : "Send quote"}
              </button>
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Outcome</h2>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-success btn-sm" disabled={busy || r.status !== "quoted"} onClick={() => setStatus("accepted")}>Traveller accepted</button>
                <button className="btn btn-sm" disabled={busy || r.status !== "quoted"} onClick={() => setStatus("declined")}>Traveller declined</button>
                <button className="btn btn-error btn-outline btn-sm" disabled={busy || r.status === "cancelled"} onClick={() => setStatus("cancelled")}>Cancel request</button>
                {["cancelled", "declined"].includes(r.status) && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setStatus("new")}>Reopen</button>}
              </div>
              <label className="form-control mt-4">
                <span className="label-text mb-1 font-semibold">Internal notes (never shown to the traveller)</span>
                <textarea className="textarea textarea-bordered" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
              </label>
              <button type="button" className="btn btn-sm mt-2 w-fit" onClick={saveNotes}>Save notes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
