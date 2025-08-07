import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react'; 
import axios from 'axios';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl:'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const MapComponent = () => {
  const [buses, setBuses] = useState([]);
  useEffect(() => {
    const fetchBuses = async () => {
      try{
        const res = await axios.get('http://localhost:5000/api/buses');
        setBuses(res.data);
      }catch (err) {
        console.error("Error fetching bus data:", err);
      }
    };
    fetchBuses();
    const interval = setInterval(fetchBuses, 5000);
    return()=> clearInterval(interval);
  }, []);
  return (
    <MapContainer
      center={[28.6139, 77.2090]} // Default center of India
      zoom={13}
      style={{ height: '100vh', width: '100%' }}
    >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    />
    {buses.map(bus => (
      <Marker
        key={bus._id}
        position={[bus.currentLocation.lat, bus.currentLocation.lng]}
      >
        <Popup>
          <strong>{bus.busNumber}</strong><br />
          Lat: {bus.currentLocation.lat.toFixed(4)}<br/>
          Lng: {bus.currentLocation.lng.toFixed(4)}<br/>
        </Popup>
      </Marker>
    ))}
   </MapContainer>
  );
};
export default MapComponent;
