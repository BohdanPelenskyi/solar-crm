import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthTokenPayload } from '../auth-token-payload';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

type RequestWithUser = {
  headers: {
    authorization?: string;
  };
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

      return true;
    } catch {
      throw new UnauthorizedException('Сесія недійсна або завершилась');
    }
  }

  private extractToken(request: RequestWithUser) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
