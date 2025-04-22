import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
config();

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT') || 5432,
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  ssl: {
    rejectUnauthorized: true,
    ca: configService.get<string>('DB_SSL_CA'),
  },
  entities: ['src/**/*.entity{.js,.ts}'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsRun: false,
  logging: true,
});

export default AppDataSource;
