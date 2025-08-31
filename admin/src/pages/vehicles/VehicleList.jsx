import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete vehicle?")) return;
    await axios.delete(process.env.REACT_APP_API_URL + `/vehicles/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setVehicles(vehicles.filter(v => v._id !== id));
  };

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate("/vehicles/new")}>Add Vehicle</button>
      <table style={{ width: "100%", marginTop: 24 }}>
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
          {vehicles.map(v => (
            <tr key={v._id}>
              <td>{v.image && <img src={v.image} alt={v.name} style={{ width: 64, height: 40, objectFit: "cover" }} />}</td>
              <td>{v.name}</td>
              <td>{v.capacity || "-"}</td>
              <td>{v.description || "-"}</td>
              <td>
                <button onClick={() => navigate(`/vehicles/${v._id}`)}>Edit</button>
                <button onClick={() => handleDelete(v._id)} style={{ color: "red", marginLeft: 8 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}