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
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { Cacheable, CacheableMemory } from 'cacheable';

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
        ssl: {
          rejectUnauthorized: true,
          ca: configService.get<string>('DB_SSL_CA'),
        },
        entities: [__dirname + '/**/*.entity{.js,.ts}'],
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const secondary = new KeyvRedis('redis://localhost:6379', {
          namespace: 'redis',
        });
        return {
          stores: [
            //  Redis Store
            new Keyv({
              store: new Cacheable({ secondary, nonBlocking: true }),
            }),

            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
          ],
        };
      },
    }),
    StationsModule,
    JourneysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
