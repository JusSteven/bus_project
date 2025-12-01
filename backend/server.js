const express = require('express');
const cors = require('cors');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Redis client setup
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.log('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

redisClient.on('ready', () => {
  console.log('Redis is ready');
});

(async () => {
  await redisClient.connect();
})();

// ==================== REGISTER DRIVER ====================
app.post('/register-driver', async (req, res) => {
  try {
    const { name, phone, route, busNumber } = req.body;
    
    if (!name || !phone || !route || !busNumber) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const driverId = uuidv4();
    const driver = {
      id: driverId,
      name,
      phone,
      route,
      busNumber,
      currentLocation: 'Nairobi Central',
      departureTime: '08:00',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Store driver in Redis
    await redisClient.hSet(`driver:${driverId}`, driver);
    // Also store in drivers list for quick retrieval
    await redisClient.lPush('drivers', driverId);

    res.json(driver);
  } catch (error) {
    console.error('Error registering driver:', error);
    res.status(500).json({ error: 'Error registering driver' });
  }
});

// ==================== GET ALL DRIVERS ====================
app.get('/drivers', async (req, res) => {
  try {
    const driverIds = await redisClient.lRange('drivers', 0, -1);
    const drivers = [];

    for (const id of driverIds) {
      const driverData = await redisClient.hGetAll(`driver:${id}`);
      if (Object.keys(driverData).length > 0) {
        drivers.push(driverData);
      }
    }

    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Error fetching drivers' });
  }
});

// ==================== UPDATE DRIVER STATUS ====================
app.post('/update-driver-status', async (req, res) => {
  try {
    const { driverId, driverName, busNumber, currentLocation, departureTime, route, phone } = req.body;

    if (!driverId || !currentLocation || !departureTime) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const driverStatus = {
      driverId,
      driverName,
      busNumber,
      currentLocation,
      departureTime,
      route,
      phone,
      status: 'updated',
      updatedAt: new Date().toISOString(),
    };

    // Store/Update driver status in Redis
    await redisClient.hSet(`driver-status:${driverId}`, driverStatus);
    // Add to driver status list for tracking
    await redisClient.lPush('driver-updates', driverId);

    res.json(driverStatus);
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ error: 'Error updating driver status' });
  }
});

// ==================== GET DRIVER STATUS ====================
app.get('/driver-status/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const statusData = await redisClient.hGetAll(`driver-status:${driverId}`);

    if (Object.keys(statusData).length === 0) {
      return res.status(404).json({ error: 'Driver status not found' });
    }

    res.json(statusData);
  } catch (error) {
    console.error('Error fetching driver status:', error);
    res.status(500).json({ error: 'Error fetching driver status' });
  }
});

// ==================== ADD SCHEDULE ====================
app.post('/add-schedule', async (req, res) => {
  try {
    const { driverId, stage, departureTime } = req.body;

    if (!driverId || !stage || !departureTime) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const scheduleId = uuidv4();
    const schedule = {
      id: scheduleId,
      driverId,
      stage,
      departureTime,
      createdAt: new Date().toISOString(),
    };

    // Store schedule in Redis
    await redisClient.hSet(`schedule:${scheduleId}`, schedule);
    // Add to schedules list
    await redisClient.lPush('schedules', scheduleId);
    // Also store under driver's schedules
    await redisClient.lPush(`driver:${driverId}:schedules`, scheduleId);

    res.json(schedule);
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ error: 'Error adding schedule' });
  }
});

// ==================== GET ALL SCHEDULES ====================
app.get('/schedules', async (req, res) => {
  try {
    const scheduleIds = await redisClient.lRange('schedules', 0, -1);
    const schedules = [];

    for (const id of scheduleIds) {
      const scheduleData = await redisClient.hGetAll(`schedule:${id}`);
      if (Object.keys(scheduleData).length > 0) {
        schedules.push(scheduleData);
      }
    }

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Error fetching schedules' });
  }
});

// ==================== CREATE BOOKING ====================
app.post('/create-booking', async (req, res) => {
  try {
    const {
      scheduleId,
      driverId,
      driverName,
      busNumber,
      stage,
      departureTime,
      passengerName,
      seatNumber,
      phone,
      bookingDate,
      status,
    } = req.body;

    if (!passengerName || !seatNumber || !scheduleId) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const bookingId = uuidv4();
    const booking = {
      id: bookingId,
      scheduleId,
      driverId,
      driverName,
      busNumber,
      stage,
      departureTime,
      passengerName,
      seatNumber,
      phone,
      bookingDate,
      status,
      createdAt: new Date().toISOString(),
    };

    // Store booking in Redis
    await redisClient.hSet(`booking:${bookingId}`, booking);
    // Add to bookings list
    await redisClient.lPush('bookings', bookingId);
    // Also store under driver's bookings
    await redisClient.lPush(`driver:${driverId}:bookings`, bookingId);

    res.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Error creating booking' });
  }
});

// ==================== GET ALL BOOKINGS ====================
app.get('/bookings', async (req, res) => {
  try {
    const bookingIds = await redisClient.lRange('bookings', 0, -1);
    const bookings = [];

    for (const id of bookingIds) {
      const bookingData = await redisClient.hGetAll(`booking:${id}`);
      if (Object.keys(bookingData).length > 0) {
        bookings.push(bookingData);
      }
    }

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// ==================== DELETE BOOKING ====================
app.delete('/delete-booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await redisClient.hGetAll(`booking:${bookingId}`);

    // Delete booking
    await redisClient.del(`booking:${bookingId}`);
    // Remove from bookings list
    await redisClient.lRem('bookings', 0, bookingId);
    // Remove from driver's bookings
    if (booking.driverId) {
      await redisClient.lRem(`driver:${booking.driverId}:bookings`, 0, bookingId);
    }

    res.json({ message: 'Booking deleted' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Error deleting booking' });
  }
});

// ==================== DELETE SCHEDULE ====================
app.delete('/delete-schedule/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await redisClient.hGetAll(`schedule:${scheduleId}`);

    // Delete schedule
    await redisClient.del(`schedule:${scheduleId}`);
    // Remove from schedules list
    await redisClient.lRem('schedules', 0, scheduleId);
    // Remove from driver's schedules
    if (schedule.driverId) {
      await redisClient.lRem(`driver:${schedule.driverId}:schedules`, 0, scheduleId);
    }

    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Error deleting schedule' });
  }
});

// ==================== DELETE DRIVER ====================
app.delete('/delete-driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;

    // Delete driver
    await redisClient.del(`driver:${driverId}`);
    // Delete driver status
    await redisClient.del(`driver-status:${driverId}`);
    // Remove from drivers list
    await redisClient.lRem('drivers', 0, driverId);
    // Delete driver schedules
    const scheduleIds = await redisClient.lRange(`driver:${driverId}:schedules`, 0, -1);
    for (const scheduleId of scheduleIds) {
      await redisClient.del(`schedule:${scheduleId}`);
      await redisClient.lRem('schedules', 0, scheduleId);
    }
    await redisClient.del(`driver:${driverId}:schedules`);

    res.json({ message: 'Driver deleted' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Error deleting driver' });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Bus App Backend Server`);
  console.log(`========================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Redis URL: ${process.env.REDIS_URL ? 'Connected' : 'Local'}`);
  console.log(`========================================`);
});