import {
  useState,
  useEffect,
} from 'react';

import axios from 'axios';

const AdminAddBus = () => {
  const [form, setForm] = useState({
    busNumber: '',
    busName: '',
    routeName: '',
    contact: '',
    lat: 28.6139,
    lng: 77.2090,
  });
  const [buses, setBuses] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd= async (e) => {
    e.preventDefault();
    const busData = {
      busNumber: form.busNumber,
      busName: form.busName,
      routeName: form.routeName,
      contact: form.contact,
      currentLocation: {
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
      },
      route: [],
    };
    await axios.post('http://localhost:5000/api/buses', busData);
      alert('Bus added successfully');
      setForm({
        busNumber: '',busName: '', routeName: '', contact: '', lat: 28.6139, lng: 77.2090,})
      fetchBuses();
  };

  const fetchBuses = async () => {
    const res=await axios.get('http://localhost:5000/api/buses');
    setBuses(res.data);
  };
  useEffect(() => {
    fetchBuses();
  }, []);

  return (
    <div style={{padding: '20px'}}>
      <h3>Add New Bus (Admin Panel)</h3>
      <form onSubmit={handleAdd}>
        <input
          type="text"
          name="busNumber"
          placeholder="Bus Number"
          value={form.busNumber}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="busName"
          placeholder="Bus Name"
          value={form.busName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="routeName"
          placeholder="Route Name"
          value={form.routeName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="contact"
          placeholder="Contact Number"
          value={form.contact}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="lat"
          placeholder="Latitude"
          value={form.lat}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="lng"
          placeholder="Longitude"
          value={form.lng}
          onChange={handleChange}
          required
        />
        <button type="submit">Add Bus</button>
      </form>
      <h3 style={{marginTop: '30px'}}>All Added Buses</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Number</th>
            <th>Name</th>
            <th>Route</th>
            <th>Contact</th>
            <th>Lat</th>
            <th>Lng</th>
          </tr>
        </thead>
        <tbody>
          {buses.map((bus) => (
            <tr key={bus._id}>
              <td>{bus.busNumber}</td>
              <td>{bus.busName}</td>
              <td>{bus.routeName}</td>
              <td>{bus.contact}</td>
              <td>{bus.currentLocation?.lat?.toFixed(4)}</td>
              <td>{bus.currentLocation?.lng?.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminAddBus;
