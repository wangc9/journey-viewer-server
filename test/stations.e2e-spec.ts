/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

describe('StationController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/stations', () => {
    it('should return an array of stations with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/stations?skip=0')
        .expect(200);
      if (response.body.code === 'NO_STATION') {
        expect(response.body).toEqual({
          status: 400,
          error: 'Bad Request',
          message: 'No station found',
          code: 'NO_STATION',
          timestamp: expect.any(String),
          path: '/stations',
        });
      } else {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('should return an error object for invalud skip parameter', async () => {
      const response = await request(app.getHttpServer()).get(
        '/stations?skip=abc',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Skip must be a number',
        code: 'INVALID_SKIP',
        timestamp: expect.any(String),
        path: '/stations',
      });
    });

    it('should return an error object for invalud take parameter', async () => {
      const response = await request(app.getHttpServer()).get(
        '/stations?skip=0&take=abc',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Take must be a number',
        code: 'INVALID_TAKE',
        timestamp: expect.any(String),
        path: '/stations',
      });
    });

    it('should return an error object for invalud id parameter', async () => {
      const response = await request(app.getHttpServer()).get(
        '/stations?skip=0&take=10&id=abc',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Id order can be only ASC or DESC',
        code: 'INVALID_ID_ORDER',
        timestamp: expect.any(String),
        path: '/stations',
      });
    });
  });

  describe('/stations/count', () => {
    it('should return the count of stations', async () => {
      const response = await request(app.getHttpServer()).get(
        '/stations/count',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('/stations/:id', () => {
    const existingStationId = 503;
    const nonExistentStationId = 999999;

    it('should return a single station with a valid ID', async () => {
      const response = await request(app.getHttpServer()).get(
        `/stations/${existingStationId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('station_name', 'Keilalahti');
    });

    it('should return error for non-existent station ID', async () => {
      const response = await request(app.getHttpServer()).get(
        `/stations/${nonExistentStationId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Id does not exist',
        code: 'INVALID_STATION_ID',
        timestamp: expect.any(String),
        path: '/stations/:id',
      });
    });

    it('should return error for invalid station ID format', async () => {
      const response = await request(app.getHttpServer()).get('/stations/abc');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Id must be a number',
        code: 'INVALID_STATION_ID',
        timestamp: expect.any(String),
        path: '/stations/:id',
      });
    });
  });

  describe('/stations/:id/journey-count', () => {
    const stationId = 503;

    it('should return journey counts for a valid station', async () => {
      const response = await request(app.getHttpServer()).get(
        `/stations/${stationId}/journey-count`,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('departure_count');
    });

    it('should return error for invalid months', async () => {
      const response = await request(app.getHttpServer()).get(
        `/stations/${stationId}/journey-count?monthStart=2021-05&monthEnd=2021-07-01`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Month start must be in format YYYY-MM-01',
        code: 'INVALID_MONTH_START',
        timestamp: expect.any(String),
        path: `/stations/:id/journey-count`,
      });
    });
  });

  describe('/stations/:id/destinations', () => {
    const stationId = 503;

    it('should return popular destinations for a valid station', async () => {
      const response = await request(app.getHttpServer()).get(
        `/stations/${stationId}/destinations?skip=0&take=5`,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return an error object for invalud skip parameter', async () => {
      const response = await request(app.getHttpServer()).get(
        `/stations/${stationId}/destinations?skip=abc&take=5`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Skip must be a number',
        code: 'INVALID_SKIP',
        timestamp: expect.any(String),
        path: '/stations/:id/destinations',
      });
    });

    it('should return an error object for invalud take parameter', async () => {
      const response = await request(app.getHttpServer()).get(
        `/stations/${stationId}/destinations?skip=0&take=abc`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Take must be a number',
        code: 'INVALID_TAKE',
        timestamp: expect.any(String),
        path: '/stations/:id/destinations',
      });
    });

    it('should return an error object for invalud id parameter', async () => {
      const response = await request(app.getHttpServer()).get(
        `/stations/999999/destinations?skip=0&take=5`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Id does not exist',
        code: 'INVALID_STATION_ID',
        timestamp: expect.any(String),
        path: '/stations/:id/destinations',
      });
    });
  });
});
