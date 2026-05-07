import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import mongoose from 'mongoose';
import { ensureDefaultRolePermissions } from './services/permission.service';
import { InstitutionModel } from './models/institution.model';
import { AcademicUnitModel } from './models/academic-unit.model';
import { PersonModel } from './models/person.model';
import { EnrollmentModel } from './models/enrollment.model';

describe('Session Lifecycle Integration', () => {
  let app: ReturnType<typeof createApp>;
  let sessionId;
  let qrToken;
  let authToken: string;
  let testInstitutionId: string;
  let testUnitId: string;

  beforeAll(async () => {
    app = createApp();
    try {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://attendance:attendance_dev_password@localhost:27017/app_attendance?authSource=admin');
      await ensureDefaultRolePermissions();
    } catch (e) {
      console.error('DB Connection Error:', e);
    }

    const institution = await InstitutionModel.findOneAndUpdate(
      { code: 'TEST' },
      {
        code: 'TEST',
        name: 'Test Institution',
        context: 'sena',
        labels: { role: 'Rol', unit: 'Ficha', person: 'Persona', people: 'Personas' },
        theme: { primary: '#1864ab', secondary: '#0f2439', accent: '#04c', officialColorsConfirmed: true, note: 'Test' },
        qr: { ttlMinutes: 10 },
        active: true
      },
      { upsert: true, new: true }
    );
    testInstitutionId = institution._id.toString();

    const unit = await AcademicUnitModel.findOneAndUpdate(
      { institutionId: institution._id, code: 'TEST-01' },
      {
        institutionId: institution._id,
        code: 'TEST-01',
        name: 'Test Unit',
        type: 'ficha',
        active: true
      },
      { upsert: true, new: true }
    );
    testUnitId = unit._id.toString();

    await PersonModel.findOneAndUpdate(
      { institutionId: institution._id, documento: '1079606375' },
      {
        institutionId: institution._id,
        documento: '1079606375',
        nombre: 'Instructor Test',
        matricula: 'INST-TEST',
        roles: ['INSTRUCTOR'],
        password: '1079606375',
        active: true
      },
      { upsert: true, new: true }
    );

    await PersonModel.findOneAndUpdate(
      { institutionId: institution._id, documento: '12345678' },
      {
        institutionId: institution._id,
        documento: '12345678',
        nombre: 'Aprendiz Test',
        matricula: 'APR-TEST',
        roles: ['APRENDIZ'],
        password: '12345678',
        active: true
      },
      { upsert: true, new: true }
    );

    const student = await PersonModel.findOne({ institutionId: institution._id, documento: '12345678' }).lean();
    if (student) {
      await EnrollmentModel.findOneAndUpdate(
        { institutionId: institution._id, unitId: unit._id, personId: student._id },
        {
          institutionId: institution._id,
          unitId: unit._id,
          personId: student._id,
          active: true
        },
        { upsert: true, new: true }
      );
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should complete the full session lifecycle', async () => {
    // 1. Authenticate as an instructor to use the protected /api endpoints.
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ documento: '1079606375', password: '1079606375' });
    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.data.token;

    // 2. Create Session (Draft)
    const createRes = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        institutionId: testInstitutionId,
        unitId: testUnitId,
        qrTtlMinutes: 10
      });
    
    expect(createRes.status).toBe(201);
    sessionId = createRes.body.data.id;
    expect(createRes.body.data.status).toBe('draft');

    // 3. Activate Session
    const activateRes = await request(app)
      .post(`/api/sessions/${sessionId}/activate`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(activateRes.status).toBe(200);
    qrToken = activateRes.body.data.qrToken;
    expect(qrToken).toBeDefined();
    expect(activateRes.body.data.status).toBe('active');

    // 4. Register Attendance (Valid Person) must require authentication.
    const unauthorizedRes = await request(app)
      .post(`/public/attendance/${qrToken}/register`)
      .send({ documento: '12345678' });
    expect(unauthorizedRes.status).toBe(401);

    const registerRes = await request(app)
      .post(`/public/attendance/${qrToken}/register`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ documento: '12345678' });
    
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.message).toContain('Asistencia registrada');

    // 4. Close Session
    const closeRes = await request(app)
      .post(`/api/sessions/${sessionId}/close`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('closed');

    // 5. Attempt registration after close (Should fail)
    const failRes = await request(app)
      .post(`/public/attendance/${qrToken}/register`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ documento: '12345678' });
    
    expect(failRes.status).toBe(409);
    expect(failRes.body.data.code).toBe('SESSION_CLOSED');
  });
});