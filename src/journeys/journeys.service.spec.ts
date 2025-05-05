/* eslint-disable @typescript-eslint/unbound-method */
import { Like, Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Journey } from './journeys.entity';
import { JourneyService } from './journeys.service';

const mockJourneyRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockJourneys: Journey[] = [
  {
    id: 1,
    departureStationId: 1,
    returnStationId: 2,
    departureDateTime: new Date('2023-01-01T08:00:00.000Z'),
    returnDateTime: new Date('2023-01-01T09:00:00.000Z'),
    distance: 100,
    duration: 100,
  },
  {
    id: 1,
    departureStationId: 2,
    returnStationId: 3,
    departureDateTime: new Date('2023-01-01T09:00:00.000Z'),
    returnDateTime: new Date('2023-01-01T10:00:00.000Z'),
    distance: 100,
    duration: 100,
  },
];

describe('JourneyService', () => {
  let service: JourneyService;
  let repository: Repository<Journey>;
  let cache: Cache;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JourneyService,
        {
          provide: getRepositoryToken(Journey),
          useValue: mockJourneyRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<JourneyService>(JourneyService);
    repository = module.get<Repository<Journey>>(getRepositoryToken(Journey));
    cache = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getJourneyCount', () => {
    const defaultCacheKey = 'journeys:count';
    const cacheTTL = 3.6e8;

    it('should return journey count from cache if available', async () => {
      const cachedData = 2;
      mockCacheManager.get.mockResolvedValue(cachedData.toString());

      const result = await service.getJourneyCount();

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.count).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should fetch count from repository and set cache if not cache is available', async () => {
      const count = 2;

      mockCacheManager.get.mockResolvedValue(null);
      mockJourneyRepository.count.mockResolvedValue(count);

      const result = await service.getJourneyCount();

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.count).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(defaultCacheKey, count, cacheTTL);
      expect(result).toEqual(count);
    });
  });

  describe('getAllJourneys', () => {
    const skip = 0;
    const take = 10;
    const defaultCacheKey = `journeys:skip=${skip}&take=${take}&id=undefined&dTime=undefined&rTime=undefined&distance=undefined&duration=undefined&search=undefined`;
    const cacheTTL = 3.6e8;

    it('should return journeys from cache if available', async () => {
      const cachedData = JSON.stringify(mockJourneys);
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getAllJourneys(skip, take);

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.find).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual(
        mockJourneys.map((item) => ({
          ...item,
          departureDateTime: item.departureDateTime?.toISOString(),
          returnDateTime: item.returnDateTime?.toISOString(),
        })),
      );
    });

    it('should fetch journeys from repository and set cache if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockJourneyRepository.find.mockResolvedValue(mockJourneys);

      const result = await service.getAllJourneys(skip, take);

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: skip * take,
          take: take,
          order: {
            id: undefined,
            departureDateTime: undefined,
            returnDateTime: undefined,
            distance: undefined,
            duration: undefined,
          },
          where: [],
        }),
      );
      expect(cache.set).toHaveBeenCalledWith(
        defaultCacheKey,
        JSON.stringify(mockJourneys),
        cacheTTL,
      );
      expect(result).toEqual(mockJourneys);
    });

    it('should handle pagination correctly', async () => {
      const testSkip = 2;
      const testTake = 5;
      const cacheKey = `journeys:skip=${testSkip}&take=${testTake}&id=undefined&dTime=undefined&rTime=undefined&distance=undefined&duration=undefined&search=undefined`;

      mockCacheManager.get.mockResolvedValue(null);
      mockJourneyRepository.find.mockResolvedValue(mockJourneys);

      await service.getAllJourneys(testSkip, testTake);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: testSkip * testTake, take: testTake }),
      );
    });

    it('should return all journeys with take = -1', async () => {
      const testSkip = 2;
      const testTake = -1;
      const cacheKey = `journeys:skip=${testSkip}&take=${testTake}&id=undefined&dTime=undefined&rTime=undefined&distance=undefined&duration=undefined&search=undefined`;

      mockCacheManager.get.mockResolvedValue(null);
      mockJourneyRepository.find.mockResolvedValue(mockJourneys);

      await service.getAllJourneys(testSkip, testTake);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: testSkip * testTake, take: undefined }),
      );
      expect(cache.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockJourneys),
        cacheTTL,
      );
    });

    it('should apply sorting parameters correctly', async () => {
      const sortDistance = 'DESC';
      const sortDuration = 'ASC';
      const cacheKey = `journeys:skip=${skip}&take=${take}&id=undefined&dTime=undefined&rTime=undefined&distance=${sortDistance}&duration=${sortDuration}&search=undefined`;

      mockCacheManager.get.mockResolvedValue(null);
      mockJourneyRepository.find.mockResolvedValue(mockJourneys);

      await service.getAllJourneys(
        skip,
        take,
        undefined,
        undefined,
        undefined,
        sortDistance,
        sortDuration,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: {
            id: undefined,
            departureDateTime: undefined,
            returnDateTime: undefined,
            distance: 'DESC',
            duration: 'ASC',
          },
        }),
      );
    });

    it('should apply text search parameter correctly', async () => {
      const search = 'Journey 1';
      const cacheKey = `journeys:skip=${skip}&take=${take}&id=undefined&dTime=undefined&rTime=undefined&distance=undefined&duration=undefined&search=${search}`;

      mockCacheManager.get.mockResolvedValue(null);
      mockJourneyRepository.find.mockResolvedValue(mockJourneys);

      await service.getAllJourneys(
        skip,
        take,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        search,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { departureDateTime: Like(new Date(search)) },
            { returnDateTime: Like(new Date(search)) },
          ],
        }),
      );
    });

    it('should apply numeric search parameter correctly', async () => {
      const search = '123';
      const cacheKey = `journeys:skip=${skip}&take=${take}&id=undefined&dTime=undefined&rTime=undefined&distance=undefined&duration=undefined&search=${search}`;

      mockCacheManager.get.mockResolvedValue(null);
      mockJourneyRepository.find.mockResolvedValue(mockJourneys);

      await service.getAllJourneys(
        skip,
        take,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        search,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { id: Number(search) },
            { departureDateTime: Like(new Date(search)) },
            { returnDateTime: Like(new Date(search)) },
            { distance: Number(search) },
            { duration: Number(search) },
          ],
        }),
      );
    });
  });

  describe('getSingleJourney', () => {
    const id = 1;
    const defaultCacheKey = `journey:${id}`;
    const cacheTTL = 3.6e8;
    const journey = {
      departureDateTime: new Date('2023-01-01T08:00:00.000Z'),
      returnDateTime: new Date('2023-01-01T09:00:00.000Z'),
      departureStationId: 1,
      returnStationId: 2,
      distance: 100,
      duration: 100,
    };

    it('should return journey from cache if available', async () => {
      const cachedData = JSON.stringify(journey);
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getSingleJourney(id);
      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch journey from repository and set cache if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockJourneyRepository.findOne.mockResolvedValue(journey);

      const result = await service.getSingleJourney(id);

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.findOne).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(
        defaultCacheKey,
        JSON.stringify(journey),
        cacheTTL,
      );
      expect(result).toEqual(journey);
    });

    it('should return null if station is not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockJourneyRepository.findOne.mockResolvedValue(null);

      const result = await service.getSingleJourney(id);

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.findOne).toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
