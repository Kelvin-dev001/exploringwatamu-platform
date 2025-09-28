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
      setHotels(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      window.alert("Failed to load hotels");
      setHotels([]);
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

  if (loading) return <div className="p-8 text-center text-lg">Loading...</div>;

  return (
    <div className="p-8">
      <button className="btn btn-primary mb-4" onClick={() => navigate("/hotels/new")}>Add Hotel</button>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Type</th>
              <th>Stars</th>
              <th>Location</th>
              <th>Popular Facilities</th>
              <th>Room Types</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => (
              <tr key={hotel._id}>
                <td>
                  {hotel.images && hotel.images.length > 0 ? (
                    <img src={hotel.images[0]} alt={hotel.name} className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </td>
                <td>{hotel.name}</td>
                <td>{hotel.type}</td>
                <td>{hotel.stars}</td>
                <td>{hotel.location?.address || hotel.location || <span className="text-gray-400">-</span>}</td>
                <td>
                  {hotel.popularFacilities && hotel.popularFacilities.length > 0
                    ? hotel.popularFacilities.map((fac, idx) => (
                        <span key={idx} className="badge badge-info mr-1">{fac}</span>
                      ))
                    : <span className="text-gray-400">-</span>
                  }
                </td>
                <td>
                  {hotel.roomTypes && hotel.roomTypes.length > 0
                    ? hotel.roomTypes.map((room, idx) =>
                      <span key={idx} className="badge badge-ghost mr-1">
                        {room.name || room}
                      </span>
                    )
                    : <span className="text-gray-400">-</span>
                  }
                </td>
                <td>
                  <button className="btn btn-xs btn-info" onClick={() => navigate(`/hotels/edit/${hotel._id}`)}>Edit</button>
                  <button className="btn btn-xs btn-error ml-2" onClick={() => handleDelete(hotel._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}