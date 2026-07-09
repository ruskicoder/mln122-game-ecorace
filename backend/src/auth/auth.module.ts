import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'super-secret-key-change-in-production'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    ConfigModule,
  ],
  providers: [AdminGuard],
  exports: [AdminGuard, JwtModule],
})
export class AuthModule {}
