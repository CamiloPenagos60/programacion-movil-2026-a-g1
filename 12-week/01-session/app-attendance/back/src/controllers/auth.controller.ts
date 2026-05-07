import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PersonModel } from '../models/person.model';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/app-error';
import { toId } from '../services/serializers';

export async function login(req: Request, res: Response): Promise<void> {
  const { documento, password } = req.body as { documento?: unknown; password?: unknown };

  if (!documento || typeof documento !== 'string' || !password || typeof password !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Documento y contraseña son requeridos');
  }

  // Find the person by documento — any active role can log in
  const person = await PersonModel.findOne({
    documento,
    active: true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any).select('+password');

  if (!person) {
    throw new AppError(401, 'UNAUTHORIZED', 'Credenciales incorrectas');
  }

  if (!person.password) {
    throw new AppError(401, 'UNAUTHORIZED', 'Credenciales incorrectas');
  }

  // Dev seed stores passwords as plain text equal to documento.
  // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$ — compare securely.
  let isValid = false;
  if (person.password.startsWith('$2')) {
    isValid = await bcrypt.compare(password, person.password);
  } else {
    isValid = person.password === password;
  }

  if (!isValid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Credenciales incorrectas');
  }

  const token = AuthService.generateToken(person as Parameters<typeof AuthService.generateToken>[0]);

  res.status(200).json({
    data: {
      token,
      person: {
        id: toId(person._id),
        institutionId: toId(person.institutionId),
        nombre: person.nombre,
        documento: person.documento,
        roles: person.roles
      }
    }
  });
}