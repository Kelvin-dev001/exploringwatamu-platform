import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";

export default function VehicleList() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL + "/vehicles");
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      window.alert("Failed to load vehicles");
      setVehicles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete vehicle?")) return;
    try {
      await axios.delete(API_URL + `/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVehicles();
    } catch (err) {
      window.alert("Failed to delete vehicle");
    }
  };

  if (loading) return <div className="p-8 text-center text-lg">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <button className="btn btn-primary" onClick={() => navigate("/vehicles/new")}>Add Vehicle</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Capacity</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-400">No vehicles found.</td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v._id}>
                  <td>
                    {v.image ? (
                      <img src={v.image} alt={v.name} className="w-16 h-12 object-cover rounded" />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </td>
                  <td>{v.name}</td>
                  <td>{v.capacity || "-"}</td>
                  <td className="max-w-xs truncate">{v.description || "-"}</td>
                  <td>
                    <button className="btn btn-xs btn-info" onClick={() => navigate(`/vehicles/${v._id}`)}>Edit</button>
                    <button className="btn btn-xs btn-error ml-2" onClick={() => handleDelete(v._id)}>Delete</button>
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