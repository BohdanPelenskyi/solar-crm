import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../generated/prisma/client';
import { AuthTokenPayload } from '../auth-token-payload';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

type RequestWithUser = {
  headers: {
    authorization?: string;
  };
  method: string;
  user?: AuthTokenPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Потрібна авторизація');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthTokenPayload>(token);

      this.ensureAccessByRole(request.user.role, request.method);

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new UnauthorizedException('Сесія недійсна або завершилась');
    }
  }

  private ensureAccessByRole(role: UserRole, method: string) {
    const normalizedMethod = method.toUpperCase();

    if (role === UserRole.ADMIN) {
      return;
    }

    if (
      normalizedMethod === 'GET' ||
      normalizedMethod === 'HEAD' ||
      normalizedMethod === 'OPTIONS'
    ) {
      return;
    }

    if (role === UserRole.WORKER && normalizedMethod === 'POST') {
      return;
    }

    if (role === UserRole.WORKER) {
      throw new ForbiddenException(
        'Робітник може лише переглядати та додавати нові дані',
      );
    }

    throw new ForbiddenException(
      'Перегляд доступний, але створення, редагування та видалення заборонені',
    );
  }

  private extractToken(request: RequestWithUser) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
