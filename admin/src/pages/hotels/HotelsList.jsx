import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function HotelsList() {
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await axios.get(process.env.REACT_APP_API_URL + "/hotels");
      setHotels(res.data);
    } catch (err) {
      window.alert("Failed to load hotels");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete hotel?")) return;
    try {
      await axios.delete(process.env.REACT_APP_API_URL + `/hotels/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHotels();
    } catch (err) {
      window.alert("Failed to delete hotel");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate("/hotels/new")}>Add Hotel</button>
      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Type</th>
            <th>Stars</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map((hotel) => (
            <tr key={hotel._id}>
              <td>
                {hotel.images && hotel.images.length > 0 ? (
                  <img src={hotel.images[0]} alt={hotel.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }} />
                ) : (
                  <span style={{ color: "#aaa" }}>No image</span>
                )}
              </td>
              <td>{hotel.name}</td>
              <td>{hotel.type}</td>
              <td>{hotel.stars}</td>
              <td>{hotel.location}</td>
              <td>
                <button onClick={() => navigate(`/hotels/${hotel._id}`)}>Edit</button>
                <button onClick={() => handleDelete(hotel._id)} style={{ marginLeft: 8, color: "red" }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}