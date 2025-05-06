/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

describe('JourneysController', () => {
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

  describe('/journeys', () => {
    it('should return an array of journeys with default pagination', async () => {
      const response = await request(app.getHttpServer()).get(
        '/journeys?skip=0&take=10',
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.length).toBeLessThanOrEqual(10);
      expect(response.body[0]).toHaveProperty('departureDateTime');
    });

    it('should return error for invalid skip parameter', async () => {
      const response = await request(app.getHttpServer()).get(
        '/journeys?skip=abc&take=10',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Skip must be a number',
        code: 'INVALID_SKIP',
        timestamp: expect.any(String),
        path: '/journeys',
      });
    });

    it('should return error for invalid take parameter', async () => {
      const response = await request(app.getHttpServer()).get(
        '/journeys?skip=0&take=abc',
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Take must be a number',
        code: 'INVALID_TAKE',
        timestamp: expect.any(String),
        path: '/journeys',
      });
    });

    it('should return error for invalid id parameter', async () => {
      const response = await request(app.getHttpServer()).get(
        '/journeys?skip=0&take=10&id=999999',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Id order can be only ASC or DESC',
        code: 'INVALID_ID_ORDER',
        timestamp: expect.any(String),
        path: '/journeys',
      });
    });
  });

  describe('/journeys/count', () => {
    it('should return the count of journeys', async () => {
      const response = await request(app.getHttpServer()).get(
        '/journeys/count',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('/journeys/:id', () => {
    const existingJourneyId = 1;

    it('should return a single journey for a valid ID', async () => {
      const response = await request(app.getHttpServer()).get(
        `/journeys/${existingJourneyId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('departureDateTime');
    });

    it('should return error for a non-existing ID', async () => {
      const response = await request(app.getHttpServer()).get(
        `/journeys/99999999`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Id does not exist',
        code: 'INVALID_JOURNEY_ID',
        timestamp: expect.any(String),
        path: '/journeys/:id',
      });
    });

    it('should return error for an invalid ID format', async () => {
      const response = await request(app.getHttpServer()).get(`/journeys/abc`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 400,
        error: 'Bad Request',
        message: 'Id must be a number',
        code: 'INVALID_JOURNEY_ID',
        timestamp: expect.any(String),
        path: '/journeys/:id',
      });
    });
  });
});
