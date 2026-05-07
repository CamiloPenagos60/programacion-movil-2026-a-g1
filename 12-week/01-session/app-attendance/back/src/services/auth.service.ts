import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { Person } from '../models/person.model';
import type { Types } from 'mongoose';

export interface JwtPayload {
  id: string;
  institutionId: string;
  documento: string;
  nombre: string;
  roles: string[];
}

export class AuthService {
  static generateToken(person: Person & { _id: Types.ObjectId }): string {
    const payload: JwtPayload = {
      id: String(person._id),
      institutionId: String(person.institutionId),
      documento: person.documento,
      nombre: person.nombre,
      roles: Array.isArray(person.roles) ? person.roles : []
    };

    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
  }

  static verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }
}