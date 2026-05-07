import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/app-error';
import { assertPermission } from '../services/permission.service';

export interface AuthRequest extends Request {
  user?: { id: string; institutionId: string; documento: string; nombre: string; roles: string[] };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Token de autenticación no proporcionado'));
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = AuthService.verifyToken(token);

  if (!decoded) {
    next(new AppError(401, 'UNAUTHORIZED', 'Token inválido o expirado'));
    return;
  }

  req.user = decoded;
  next();
};

export function authorizeRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRoles = req.user?.roles ?? [];
    const hasRole = roles.some((r) => userRoles.includes(r));
    if (!req.user || !hasRole) {
      next(new AppError(403, 'FORBIDDEN', 'No tiene permisos suficientes para esta acción'));
      return;
    }
    next();
  };
}

export function authorizePermission(resource: string, action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    assertPermission(req.user, resource, action, { institutionId: req.user?.institutionId })
      .then(() => next())
      .catch(next);
  };
}