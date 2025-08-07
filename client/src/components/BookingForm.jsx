import{
  useState,
  useEffect,
} from 'react';
import axios from 'axios';


const BookingForm = () => {
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState({ userName: '', busId: '', contact: '',email:'' });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/buses').then(res=>{
      setBuses(res.data);
    });
  }, []);
// alla use data elli untu?login admele
  const handlesubmit = async (e) => {
    e.preventDefault();
    const res=await axios.post('http://localhost:5000/api/bookings', form);
    setSuccess(
      <p>Booking Confirmed! Track here{''}
      <a
        href={`http://localhost:5173/track/bus/${res.data.booking.busId}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'blue' ,textDecoration: 'underline'}}
      >
        http://localhost:5173/track/bus/${res.data.booking.busId}
      </a>
      </p>
    );
  };
  return (
    <div>
      <h3>Book Your Bus</h3>
      <form onSubmit={handlesubmit}>
        <input
          type="text"
          placeholder="Your Name"
          value={form.userName}
          onChange={e => setForm({ ...form, userName: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Contact Number"
          value={form.contact}
          onChange={e => setForm({ ...form, contact: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email ID"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />
        <select
          value={form.busId}
          onChange={e => setForm({ ...form, busId: e.target.value })}
          required
        >
          <option value="">Select Bus</option>
          {buses.map(bus => (
            <option key={bus._id} value={bus._id}>
              {bus.busNumber}
            </option>
          ))}
        </select>
        <button type="submit">Book&Track</button>
      </form>
      {success && <p>{success}</p>}
    </div>
  );
};

export default BookingForm;
