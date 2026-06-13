import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';

describe('Auth API - Registration', () => {
  beforeAll(async () => {
    // Wait for the app to initialize MongoDB connection if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/habitflow_test');
    }
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should reject registration if user is under 10 years old', async () => {
    const today = new Date();
    const nineYearsAgo = new Date(today.getFullYear() - 9, today.getMonth(), today.getDate());

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Child',
        email: 'child@example.com',
        password: 'password123',
        dob: nineYearsAgo.toISOString().split('T')[0]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('You must be at least 10 years old');
  });

  it('should allow registration if user is 10 years old or older', async () => {
    const today = new Date();
    const twelveYearsAgo = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Teen',
        email: 'teen@example.com',
        password: 'password123',
        dob: twelveYearsAgo.toISOString().split('T')[0]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });
});
