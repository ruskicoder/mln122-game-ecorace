"import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const type = context.getType();
    
    if (type === 'http') {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('Không tìm thấy token xác thực');
      }
      
      const parts = authHeader.split(' ');
      if (parts.length !== 2) {
        throw new UnauthorizedException('Định dạng token không hợp lệ (Bearer token)');
      }
      
      const [tokenType, token] = parts;
      if (tokenType !== 'Bearer' || !token) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('JWT_SECRET', 'super-secret-key-change-in-production'),
        });
        if (!payload.isAdmin) {
          throw new UnauthorizedException('Yêu cầu quyền quản trị (Admin)');
        }
        request.user = payload;
        return true;
      } catch (err) {
        throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
      }
    } else if (type === 'ws') {
      const client = context.switchToWs().getClient();
      const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization;
      if (!token) {
        return false;
      }

      // Handle both "Bearer <token>" and raw "<token>"
      const actualToken = token.startsWith('Bearer ') ? token.substring(7) : token;

      try {
        co
<truncated 398 bytes>