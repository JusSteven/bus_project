import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, MapPin, Users, MessageCircle, X, CheckCircle, Navigation } from 'lucide-react';
import './App.css';

export default function BusDriverApp() {
  // API URL - uses environment variable for production
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // State Management
  const [activeTab, setActiveTab] = useState('schedules');
  const [drivers, setDrivers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [passengerName, setPassengerName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [driverLoginModal, setDriverLoginModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverUpdateForm, setDriverUpdateForm] = useState({
    currentLocation: '',
    departureTime: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    route: '',
    busNumber: '',
  });

  // Thika Superhighway stages
  const thikaStages = [
    'Nairobi Central',
    'Roysambu',
    'Kasarani',
    'Ruiru',
    'Thika Town',
    'Garissa Lodge',
    'Murang\'a Road',
  ];

  // Hardcoded schedules - Initial data
  const hardcodedSchedules = [
    { id: 'sched-001', driverId: 'driver-001', driverName: 'John Mbugua', busNumber: 'KCC 456', stage: 'Nairobi Central', departureTime: '06:00', phone: '+254712345678', route: 'Nairobi - Thika' },
    { id: 'sched-002', driverId: 'driver-002', driverName: 'Peter Kariuki', busNumber: 'KCA 789', stage: 'Roysambu', departureTime: '07:30', phone: '+254723456789', route: 'Nairobi - Thika' },
    { id: 'sched-003', driverId: 'driver-003', driverName: 'David Mwangi', busNumber: 'KCC 123', stage: 'Kasarani', departureTime: '08:15', phone: '+254734567890', route: 'Nairobi - Thika' },
    { id: 'sched-004', driverId: 'driver-004', driverName: 'Samuel Kipchoge', busNumber: 'KCB 234', stage: 'Ruiru', departureTime: '09:00', phone: '+254745678901', route: 'Nairobi - Thika' },
    { id: 'sched-005', driverId: 'driver-005', driverName: 'James Ochieng', busNumber: 'KCC 567', stage: 'Thika Town', departureTime: '10:30', phone: '+254756789012', route: 'Nairobi - Thika' },
  ];

  // Initialize App - Load data from backend
  useEffect(() => {
    loadDrivers();
    setSchedules(hardcodedSchedules);
    loadBookings();
  }, []);

  // ========================= API CALLS =========================

  /**
   * Load all registered drivers from backend
   */
  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_URL}/drivers`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  /**
   * Load all bookings from backend
   */
  const loadBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  /**
   * Register a new driver
   */
  const handleRegisterDriver = async () => {
    if (!formData.name || !formData.phone || !formData.route || !formData.busNumber) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newDriver = await response.json();
        setDrivers([...drivers, newDriver]);
        
        // Add registered driver to schedules
        const newSchedule = {
          id: `sched-${newDriver.id}`,
          driverId: newDriver.id,
          driverName: newDriver.name,
          busNumber: newDriver.busNumber,
          stage: 'Nairobi Central',
          departureTime: '08:00',
          phone: newDriver.phone,
          route: newDriver.route,
        };
        setSchedules([...schedules, newSchedule]);
        
        setFormData({ name: '', phone: '', route: '', busNumber: '' });
        alert('Driver registered and added to schedules!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error registering driver');
    }
  };

  /**
   * Open driver management modal
   */
  const openDriverManagement = (driverId) => {
    const driver = schedules.find(s => s.driverId === driverId);
    setSelectedDriver(driver);
    setDriverUpdateForm({ currentLocation: driver.stage || '', departureTime: driver.departureTime || '' });
    setDriverLoginModal(true);
  };

  /**
   * Update driver location and departure time
   */
  const handleDriverUpdate = async () => {
    if (!driverUpdateForm.currentLocation || !driverUpdateForm.departureTime) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/update-driver-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: selectedDriver.driverId,
          driverName: selectedDriver.driverName,
          busNumber: selectedDriver.busNumber,
          currentLocation: driverUpdateForm.currentLocation,
          departureTime: driverUpdateForm.departureTime,
          route: selectedDriver.route,
          phone: selectedDriver.phone,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const updatedSchedules = schedules.map(s =>
          s.driverId === selectedDriver.driverId
            ? { ...s, stage: driverUpdateForm.currentLocation, departureTime: driverUpdateForm.departureTime }
            : s
        );
        setSchedules(updatedSchedules);
        setDriverLoginModal(false);
        setSelectedDriver(null);
        alert('Updated successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating driver status');
    }
  };

  /**
   * Create a new booking
   */
  const handleCreateBooking = async () => {
    if (!passengerName || !seatNumber) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
          driverId: selectedSchedule.driverId,
          driverName: selectedSchedule.driverName,
          busNumber: selectedSchedule.busNumber,
          stage: selectedSchedule.stage,
          departureTime: selectedSchedule.departureTime,
          passengerName,
          seatNumber,
          phone: selectedSchedule.phone,
          bookingDate: new Date().toISOString(),
          status: 'active',
        }),
      });

      if (response.ok) {
        const newBooking = await response.json();
        setBookings([...bookings, newBooking]);
        setBookingModal(false);
        setPassengerName('');
        setSeatNumber('');
        setSelectedSchedule(null);
        alert('Booking confirmed!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating booking');
    }
  };

  /**
   * Cancel a booking
   */
  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/delete-booking/${bookingId}`, { method: 'DELETE' });
      if (response.ok) {
        setBookings(bookings.filter(b => b.id !== bookingId));
        alert('Booking cancelled!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error cancelling booking');
    }
  };

  /**
   * Open booking modal for a schedule
   */
  const openBookingModal = (schedule) => {
    setSelectedSchedule(schedule);
    setBookingModal(true);
  };

  /**
   * Open WhatsApp with pre-filled message
   */
  const handleBookScheduleWhatsApp = (schedule) => {
    const message = `Hi, I would like to book a seat on the bus departing from ${schedule.stage} at ${schedule.departureTime}. Bus number: ${schedule.busNumber}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${schedule.phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // ========================= JSX RENDER =========================

  return (
    <div className="app-container">
      <div className="mobile-phone">
        {/* Header */}
        <div className="header">
          <h1>Bus Booking</h1>
          <p>Thika Superhighway Routes</p>
        </div>

        {/* Main Content */}
        <div className="content">

          {/* ========== SCHEDULES TAB ========== */}
          {activeTab === 'schedules' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Available Buses</h2>
                <p>Nairobi to Thika Route</p>
              </div>
              {schedules.map((schedule) => (
                <div key={schedule.id} className="bus-card">
                  <div className="card-header">
                    <div>
                      <h3>{schedule.driverName}</h3>
                      <p>🚌 {schedule.busNumber}</p>
                    </div>
                    <div className="time-box">
                      <p className="time">{schedule.departureTime}</p>
                      <p>Departs</p>
                    </div>
                  </div>
                  <div className="stage-info">
                    <p><MapPin size={14} /> <strong>{schedule.stage}</strong></p>
                    <p className="route">Nairobi - Thika</p>
                  </div>
                  <div className="button-group">
                    <button onClick={() => openBookingModal(schedule)} className="btn btn-primary">Quick Book</button>
                    <button onClick={() => handleBookScheduleWhatsApp(schedule)} className="btn btn-whatsapp"><MessageCircle size={14} /> WhatsApp</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========== BOOKINGS TAB ========== */}
          {activeTab === 'bookings' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>My Bookings</h2>
                <p>{bookings.length} Active Booking(s)</p>
              </div>
              {bookings.length === 0 ? (
                <div className="empty-state">
                  <p>No active bookings</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <div>
                        <p><CheckCircle size={14} /> <strong>Booking Confirmed</strong></p>
                        <p className="small">Passenger: {booking.passengerName}</p>
                      </div>
                      <button onClick={() => handleCancelBooking(booking.id)} className="btn-delete"><X size={16} /></button>
                    </div>
                    <div className="booking-details">
                      <p><strong>Driver:</strong> {booking.driverName}</p>
                      <p><strong>Bus:</strong> {booking.busNumber}</p>
                      <p><strong>Seat:</strong> {booking.seatNumber}</p>
                      <p><MapPin size={12} /> {booking.stage}</p>
                      <p><Clock size={12} /> {booking.departureTime} Departure</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========== DRIVER MANAGEMENT TAB ========== */}
          {activeTab === 'driver-manage' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Driver Management</h2>
                <p>Update location & departure time</p>
              </div>

              {/* Active Drivers Section */}
              <div className="driver-list">
                <h3>Active Drivers</h3>
                {schedules.length === 0 ? (
                  <div className="empty-state">
                    <p>No active drivers</p>
                  </div>
                ) : (
                  schedules.map((schedule) => (
                    <div key={schedule.driverId} className="driver-item">
                      <div>
                        <h4>{schedule.driverName}</h4>
                        <p>🚌 {schedule.busNumber}</p>
                        <p><MapPin size={12} /> {schedule.stage}</p>
                      </div>
                      <p className="time-small">{schedule.departureTime}</p>
                      <button onClick={() => openDriverManagement(schedule.driverId)} className="btn btn-secondary"><Navigation size={12} /> Update</button>
                    </div>
                  ))
                )}
              </div>

              {/* Registered Drivers Section */}
              <div className="driver-list">
                <h3>Registered Drivers</h3>
                {drivers.length === 0 ? (
                  <div className="empty-state">
                    <p>No registered drivers</p>
                  </div>
                ) : (
                  drivers.map((driver) => {
                    // Find the schedule for this driver
                    const driverSchedule = schedules.find(s => s.driverId === driver.id);
                    return (
                      <div key={driver.id} className="driver-item">
                        <div>
                          <h4>{driver.name}</h4>
                          <p>📞 {driver.phone}</p>
                          <p>🚌 {driver.busNumber}</p>
                          <p>📍 {driver.route}</p>
                          {driverSchedule && (
                            <>
                              <p><MapPin size={12} /> {driverSchedule.stage}</p>
                              <p><Clock size={12} /> {driverSchedule.departureTime}</p>
                            </>
                          )}
                        </div>
                        {driverSchedule && (
                          <button onClick={() => openDriverManagement(driver.id)} className="btn btn-secondary"><Navigation size={12} /> Update</button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========== REGISTER TAB ========== */}
          {activeTab === 'register' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Register New Driver</h2>
              </div>
              <div className="form-section">
                <label>Driver Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter driver name" className="input" />
                <label>Phone Number</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="254712345678" className="input" />
                <label>Route</label>
                <input type="text" value={formData.route} onChange={(e) => setFormData({ ...formData, route: e.target.value })} placeholder="e.g., Nairobi - Thika" className="input" />
                <label>Bus Number</label>
                <input type="text" value={formData.busNumber} onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })} placeholder="e.g., KCC 123" className="input" />
                <button onClick={handleRegisterDriver} className="btn btn-primary full-width"><Plus size={14} /> Register Driver</button>
              </div>
            </div>
          )}
        </div>

        {/* ========== BOOKING MODAL ========== */}
        {bookingModal && (
          <div className="modal">
            <div className="modal-content">
              <button onClick={() => { setBookingModal(false); setPassengerName(''); setSeatNumber(''); }} className="close-btn"><X size={20} /></button>
              <h3>Complete Booking</h3>
              {selectedSchedule && (
                <div className="modal-info">
                  <p><strong>Bus:</strong> {selectedSchedule.busNumber}</p>
                  <p><strong>Stage:</strong> {selectedSchedule.stage}</p>
                  <p><strong>Time:</strong> {selectedSchedule.departureTime}</p>
                </div>
              )}
              <label>Passenger Name</label>
              <input type="text" value={passengerName} onChange={(e) => setPassengerName(e.target.value)} placeholder="Your name" className="input" />
              <label>Seat Number</label>
              <input type="text" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} placeholder="e.g., A1, A2" className="input" />
              <div className="button-group">
                <button onClick={() => { setBookingModal(false); setPassengerName(''); setSeatNumber(''); }} className="btn btn-secondary">Cancel</button>
                <button onClick={handleCreateBooking} className="btn btn-success">Confirm Booking</button>
              </div>
            </div>
          </div>
        )}

        {/* ========== DRIVER UPDATE MODAL ========== */}
        {driverLoginModal && (
          <div className="modal">
            <div className="modal-content">
              <button onClick={() => { setDriverLoginModal(false); setSelectedDriver(null); }} className="close-btn"><X size={20} /></button>
              <h3>Update Driver Status</h3>
              {selectedDriver && (
                <div className="modal-info">
                  <p><strong>Driver:</strong> {selectedDriver.driverName}</p>
                  <p><strong>Bus:</strong> {selectedDriver.busNumber}</p>
                  <p><strong>Route:</strong> {selectedDriver.route}</p>
                </div>
              )}
              <label>Current Location (Stage)</label>
              <select value={driverUpdateForm.currentLocation} onChange={(e) => setDriverUpdateForm({ ...driverUpdateForm, currentLocation: e.target.value })} className="input">
                <option value="">-- Select Stage --</option>
                {thikaStages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <label>Departure Time</label>
              <input type="time" value={driverUpdateForm.departureTime} onChange={(e) => setDriverUpdateForm({ ...driverUpdateForm, departureTime: e.target.value })} className="input" />
              <div className="button-group">
                <button onClick={() => { setDriverLoginModal(false); setSelectedDriver(null); }} className="btn btn-secondary">Cancel</button>
                <button onClick={handleDriverUpdate} className="btn btn-primary">Update Status</button>
              </div>
            </div>
          </div>
        )}

        {/* ========== BOTTOM NAVIGATION ========== */}
        <div className="bottom-nav">
          <button onClick={() => setActiveTab('schedules')} className={`nav-btn ${activeTab === 'schedules' ? 'active' : ''}`}><Clock size={18} /> Schedules</button>
          <button onClick={() => setActiveTab('bookings')} className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}><CheckCircle size={18} /> Bookings {bookings.length > 0 && <span className="badge">{bookings.length}</span>}</button>
          <button onClick={() => setActiveTab('driver-manage')} className={`nav-btn ${activeTab === 'driver-manage' ? 'active' : ''}`}><Navigation size={18} /> Driver Mgmt</button>
          <button onClick={() => setActiveTab('register')} className={`nav-btn ${activeTab === 'register' ? 'active' : ''}`}><Plus size={18} /> Register</button>
        </div>
      </div>
    </div>
  );
}