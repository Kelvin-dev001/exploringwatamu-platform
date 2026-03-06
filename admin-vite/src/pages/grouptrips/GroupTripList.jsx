import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";

const STATUS_BADGE = {
  draft: "badge badge-ghost",
  published: "badge badge-success",
  full: "badge badge-error",
  closed: "badge badge-warning",
};

export default function GroupTripList() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL + "/group-trips/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setTrips([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line
  }, []);

  const handlePublish = async (id) => {
    try {
      await axios.put(API_URL + `/group-trips/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTrips();
    } catch (err) {
      window.alert(err?.response?.data?.error || "Failed to publish trip.");
    }
  };

  const handleClose = async (id) => {
    try {
      await axios.put(API_URL + `/group-trips/${id}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTrips();
    } catch (err) {
      window.alert(err?.response?.data?.error || "Failed to close trip.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this group trip? This cannot be undone.")) return;
    try {
      await axios.delete(API_URL + `/group-trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTrips();
    } catch (err) {
      window.alert(err?.response?.data?.error || "Failed to delete trip.");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Group Trips</h2>
        <button className="btn btn-primary" onClick={() => navigate("/grouptrips/new")}>
          Add New Group Trip
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Max</th>
              <th>Confirmed</th>
              <th>Remaining</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-8">Loading...</td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-400">No group trips found.</td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip._id}>
                  <td className="font-medium">{trip.title}</td>
                  <td>
                    <span className={STATUS_BADGE[trip.status] || "badge badge-ghost"}>
                      {trip.status}
                    </span>
                  </td>
                  <td>{trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "-"}</td>
                  <td>{trip.endDate ? new Date(trip.endDate).toLocaleDateString() : "-"}</td>
                  <td>{trip.maxParticipants}</td>
                  <td>{trip.confirmedParticipants ?? 0}</td>
                  <td>{trip.slotsRemaining ?? (trip.maxParticipants - (trip.confirmedParticipants ?? 0))}</td>
                  <td className="flex flex-wrap gap-1">
                    <button
                      className="btn btn-xs btn-info"
                      onClick={() => navigate(`/grouptrips/${trip._id}`)}
                    >
                      Edit
                    </button>
                    {trip.status === "draft" && (
                      <button
                        className="btn btn-xs btn-success"
                        onClick={() => handlePublish(trip._id)}
                      >
                        Publish
                      </button>
                    )}
                    {trip.status === "published" && (
                      <button
                        className="btn btn-xs btn-warning"
                        onClick={() => handleClose(trip._id)}
                      >
                        Close
                      </button>
                    )}
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => navigate(`/grouptripbookings/${trip._id}`)}
                    >
                      Bookings
                    </button>
                    <button
                      className="btn btn-xs btn-error"
                      onClick={() => handleDelete(trip._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
