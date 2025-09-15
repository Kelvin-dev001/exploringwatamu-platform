import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function TransferList() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const fetchTransfers = async (pg = 1, srch = "") => {
    setLoading(true);
    try {
      const res = await axios.get(
        process.env.REACT_APP_API_URL + `/transfers?search=${srch}&page=${pg}&limit=10`
      );
      setTransfers(Array.isArray(res.data.data) ? res.data.data : []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setTransfers([]);
      setPage(1);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransfers(page, search);
    // eslint-disable-next-line
  }, [page]);

  const handleSearch = e => {
    setSearch(e.target.value);
    fetchTransfers(1, e.target.value);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete transfer?")) return;
    try {
      await axios.delete(process.env.REACT_APP_API_URL + `/transfers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTransfers(page, search);
    } catch {
      window.alert("Failed to delete transfer.");
    }
  };

  return (
    <div className="p-8">
      <button className="btn btn-primary mb-4" onClick={() => navigate("/transfers/new")}>Add Transfer Option</button>
      <input
        type="text"
        placeholder="Search transfers..."
        value={search}
        onChange={handleSearch}
        className="input input-bordered mb-4 w-72"
      />
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Image</th>
              <th>Route</th>
              <th>Vehicle</th>
              <th>Price</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">Loading...</td>
              </tr>
            ) : (
              transfers.map(t => (
                <tr key={t._id}>
                  <td>
                    {t.vehicle && t.vehicle.image &&
                      <img src={t.vehicle.image} alt={t.vehicle.name} className="w-16 h-10 object-cover rounded" />
                    }
                  </td>
                  <td>{t.route}</td>
                  <td>{t.vehicle ? t.vehicle.name : "-"}</td>
                  <td>${t.price}</td>
                  <td>{t.active ? "Yes" : "No"}</td>
                  <td>
                    <button className="btn btn-xs btn-info" onClick={() => navigate(`/transfers/${t._id}`)}>Edit</button>
                    <button className="btn btn-xs btn-error ml-2" onClick={() => handleDelete(t._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center mt-4 gap-4">
        <button className="btn btn-outline btn-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn btn-outline btn-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}