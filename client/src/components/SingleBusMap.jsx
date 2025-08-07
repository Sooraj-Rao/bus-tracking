import 'leaflet/dist/leaflet.css';
import{
  useEffect,
  useState,   
} from 'react';

import axios from 'axios';

import{
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from 'react-leaflet';
import {useParams} from 'react-router-dom';


const SingleBusMap = () => {
  const {busId} = useParams();
  const [bus, setBus] = useState(null);

  useEffect(() => {
    const fetchBus = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/buses/${busId}`);
        setBus(res.data);
      } catch (err) {
        console.error("error fetching bus data:", err);
      }
    };
    fetchBus();
    const interval = setInterval(fetchBus, 5000);
    return () => clearInterval(interval);
  }, [busId]);

  if (!bus) return <p>Loading bus Loaction...</p>;
  return (
    <div>
      <h2 style ={{textAlign:'center'}}>Tracking:{bus.busNumber}</h2>
      <MapContainer
        center={[bus.currentLocation.lat, bus.currentLocation.lng]}
        zoom={15}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[bus.currentLocation.lat, bus.currentLocation.lng]}>
          <Popup>
            Bus: {bus.busNumber}<br />
            Location updated:{new Date(bus.currentLocation.timestamp).toLocaleTimeString()}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default SingleBusMap;
