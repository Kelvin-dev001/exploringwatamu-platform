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
    const res = await axios.get(process.env.REACT_APP_API_URL + `/transfers?search=${srch}&page=${pg}&limit=10`);
    setTransfers(res.data.data);
    setPage(res.data.page);
    setTotalPages(res.data.totalPages);
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
    await axios.delete(process.env.REACT_APP_API_URL + `/transfers/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTransfers(page, search);
  };

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate("/transfers/new")}>Add Transfer Option</button>
      <input type="text" placeholder="Search transfers..." value={search} onChange={handleSearch} style={{ marginBottom: 16, width: "300px" }} />
      <table style={{ width: "100%", marginTop: 8 }}>
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
          {transfers.map(t => (
            <tr key={t._id}>
              <td>
                {t.vehicle && t.vehicle.image &&
                  <img src={t.vehicle.image} alt={t.vehicle.name} style={{ width: 64, height: 40, objectFit: "cover" }} />
                }
              </td>
              <td>{t.route}</td>
              <td>{t.vehicle ? t.vehicle.name : "-"}</td>
              <td>${t.price}</td>
              <td>{t.active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => navigate(`/transfers/${t._id}`)}>Edit</button>
                <button onClick={() => handleDelete(t._id)} style={{ color: "red", marginLeft: 8 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16 }}>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span style={{ margin: "0 12px" }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}