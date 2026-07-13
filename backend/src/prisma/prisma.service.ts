import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const url = process.env.DATABASE_URL || '';
    if (!url) {
      this.logger.error('DATABASE_URL is not set. Check Render environment variables.');
      return;
    }
    if (url.startsWith('"') || url.endsWith('"')) {
      this.logger.warn('DATABASE_URL contains surrounding quotes — they will be stripped.');
    }
    try {
      await this.$connect();
      this.logger.log('Connected to database');
    } catch (err: any) {
      if (err?.code === 'P1013') {
        this.logger.error(
          `Invalid DATABASE_URL format. Common causes:\n` +
          `  1. Password contains special characters (@ : / %) — URL-encode them\n` +
          `  2. Value includes literal double-quotes from .env copy-paste\n` +
          `  3. Whitespace/newline in the value\n` +
          `  Current value starts with: ${url.substring(0, 30)}...`,
        );
      }
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
