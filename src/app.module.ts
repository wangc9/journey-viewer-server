/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { StationsModule } from './stations/stations.module';
import { JourneysModule } from './journeys/journeys.module';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { Keyv } from '@keyv/redis';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        ...(configService.get<string>('ENVIRONMENT') !== 'DEV'
          ? {
              ssl: {
                rejectUnauthorized: true,
                ca: configService.get<string>('DB_SSL_CA'),
              },
            }
          : {}),
        entities: [__dirname + '/**/*.entity{.js,.ts}'],
      }),
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [
            //  Redis Store
            new Keyv(
              new KeyvRedis({
                url: configService.get<string>('REDIS_URL'),
                pingInterval: 60000, // Ping interval (in milliseconds)
                socket: {
                  reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
                  keepAlive: 10000, // Keep-alive timeout (in milliseconds)
                },
              }),
            ),
          ],
        };
      },
    }),
    StationsModule,
    JourneysModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
