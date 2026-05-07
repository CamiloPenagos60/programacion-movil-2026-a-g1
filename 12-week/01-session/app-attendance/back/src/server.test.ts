import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import mongoose from 'mongoose';

describe('Backend Smoke Tests', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    app = createApp();
    // Intentamos conectar a la DB para el test de /ready
    // En un entorno de CI/CD esto usaría una DB de test
    try {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://attendance:attendance_dev_password@localhost:27017/app_attendance?authSource=admin');
    } catch (e) {
      console.error('Warning: MongoDB connection failed for smoke tests. /ready might fail.');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return OK for /health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
  });

  it('should return READY for /ready endpoint when DB is connected', async () => {
    const response = await request(app).get('/ready');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ready');
    expect(response.body).toHaveProperty('mongo', 'connected');
  });
});