/* eslint-disable @typescript-eslint/unbound-method */
import { Like, Repository } from 'typeorm';
import { Station } from './stations.entity';
import { StationService } from './stations.service';
import { Cache } from 'cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

type StationWithCount = Station & {
  journey_count: number;
};

const mockStationRepository = {
  find: jest.fn(),
  count: jest.fn(),
  manager: {
    query: jest.fn(),
  },
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockStations: Station[] = [
  {
    id: 1,
    stationName: 'Station 1',
    stationAddress: 'Otaranta 1',
    coordinateX: '24.949564',
    coordinateY: '60.169601',
  },
  {
    id: 2,
    stationName: 'Station 2',
    stationAddress: 'Otaranta 10',
    coordinateX: '24.949564',
    coordinateY: '60.169701',
  },
];

describe('StationService', () => {
  let service: StationService;
  let repository: Repository<Station>;
  let cache: Cache;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StationService,
        {
          provide: getRepositoryToken(Station),
          useValue: mockStationRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<StationService>(StationService);
    repository = module.get<Repository<Station>>(getRepositoryToken(Station));
    cache = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStationCount', () => {
    const defaultCacheKey = 'stations:count';
    const cacheTTL = 3.6e8;

    it('should return station count from cache if available', async () => {
      const cachedData = 2;
      mockCacheManager.get.mockResolvedValue(cachedData.toString());

      const result = await service.getStationCount();

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.count).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should fetch count from repository and set cache if not cache is available', async () => {
      const count = 2;

      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.count.mockResolvedValue(count);

      const result = await service.getStationCount();

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.count).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(defaultCacheKey, count, cacheTTL);
      expect(result).toEqual(count);
    });
  });

  describe('getAllStations', () => {
    const skip = 0;
    const take = 10;
    const defaultCacheKey = `stations:skip=${skip}&take=${take}&id=undefined&name=undefined&address=undefined&x=undefined&y=undefined&search=undefined`;
    const cacheTTL = 3.6e8;

    it('should return stations from cache if available', async () => {
      const cachedData = JSON.stringify(mockStations);
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getAllStations(skip, take);

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.find).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual(mockStations);
    });

    it('should fetch stations from repository and set cache if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.find.mockResolvedValue(mockStations);

      const result = await service.getAllStations(skip, take);

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.find).toHaveBeenCalledWith({
        skip: skip * take,
        take: take,
        order: {
          id: undefined,
          stationName: undefined,
          stationAddress: undefined,
          coordinateX: undefined,
          coordinateY: undefined,
        },
        where: [],
      });
      expect(cache.set).toHaveBeenCalledWith(
        defaultCacheKey,
        JSON.stringify(mockStations),
        cacheTTL,
      );
      expect(result).toEqual(mockStations);
    });

    it('should handle pagination correctly', async () => {
      const testSkip = 2;
      const testTake = 5;
      const cacheKey = `stations:skip=${testSkip}&take=${testTake}&id=undefined&name=undefined&address=undefined&x=undefined&y=undefined&search=undefined`;

      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.find.mockResolvedValue(mockStations);

      await service.getAllStations(testSkip, testTake);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: testSkip * testTake, take: testTake }),
      );
    });

    it('should return all stations with take = -1', async () => {
      const testSkip = 2;
      const testTake = -1;
      const cacheKey = `stations:skip=${testSkip}&take=${testTake}&id=undefined&name=undefined&address=undefined&x=undefined&y=undefined&search=undefined`;

      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.find.mockResolvedValue(mockStations);

      await service.getAllStations(testSkip, testTake);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: testSkip * testTake, take: undefined }),
      );
      expect(cache.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockStations),
        cacheTTL,
      );
    });

    it('should apply sorting parameters correctly', async () => {
      const sortName = 'DESC';
      const sortAddress = 'ASC';
      const cacheKey = `stations:skip=${skip}&take=${take}&id=undefined&name=${sortName}&address=${sortAddress}&x=undefined&y=undefined&search=undefined`;

      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.find.mockResolvedValue(mockStations);

      await service.getAllStations(
        skip,
        take,
        undefined,
        sortName,
        sortAddress,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: {
            id: undefined,
            stationName: 'DESC',
            stationAddress: 'ASC',
            coordinateX: undefined,
            coordinateY: undefined,
          },
        }),
      );
    });

    it('should apply text search parameter correctly', async () => {
      const search = 'Station 1';
      const cacheKey = `stations:skip=${skip}&take=${take}&id=undefined&name=undefined&address=undefined&x=undefined&y=undefined&search=${search}`;

      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.find.mockResolvedValue(mockStations);

      await service.getAllStations(
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
            { stationName: Like(`%${search}%`) },
            { stationAddress: Like(`%${search}%`) },
            { coordinateX: Like(`%${search}%`) },
            { coordinateY: Like(`%${search}%`) },
          ],
        }),
      );
    });

    it('should apply numeric search parameter correctly', async () => {
      const search = '123';
      const cacheKey = `stations:skip=${skip}&take=${take}&id=undefined&name=undefined&address=undefined&x=undefined&y=undefined&search=${search}`;

      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.find.mockResolvedValue(mockStations);

      await service.getAllStations(
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
            { stationName: Like(`%${search}%`) },
            { stationAddress: Like(`%${search}%`) },
            { coordinateX: Like(`%${search}%`) },
            { coordinateY: Like(`%${search}%`) },
          ],
        }),
      );
    });
  });

  describe('getSingleStation', () => {
    const id = 1;
    const defaultCacheKey = `station:${id}`;
    const cacheTTL = 3.6e8;
    const station = {
      station_name: 'Station 1',
      station_address: 'Address 1',
      start_count: '10',
      return_count: '20',
      start_average: '71.2',
      return_average: '71.5',
      percentage: '0.05',
    };

    it('should return station from cache if available', async () => {
      const cachedData = JSON.stringify(station);
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getSingleStation(id);
      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.manager.query).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch station from repository and set cache if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue([station]);

      const result = await service.getSingleStation(id);

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(
        defaultCacheKey,
        JSON.stringify(station),
        cacheTTL,
      );
      expect(result).toEqual(station);
    });

    it('should return null if station is not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue([]);

      const result = await service.getSingleStation(id);

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if query return null', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(null);

      const result = await service.getSingleStation(id);

      expect(cache.get).toHaveBeenCalledWith(defaultCacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getJourneyCountByMonth', () => {
    const stationId = '1';
    const monthStart = '2023-01';
    const monthEnd = '2023-03';
    const cacheTTL = 3.6e8;

    const mockJourneyCountData: Array<StationJourneyCountByMonth> = [
      {
        station_id: stationId,
        month: new Date('2023-01-01T00:00:00.000Z'),
        departure_count: 50,
        arrival_count: 40,
      },
      {
        station_id: stationId,
        month: new Date('2023-01-02T00:00:00.000Z'),
        departure_count: 60,
        arrival_count: 50,
      },
      {
        station_id: stationId,
        month: new Date('2023-01-03T00:00:00.000Z'),
        departure_count: 70,
        arrival_count: 60,
      },
    ];

    it('should return journey count data from cache if available', async () => {
      const cacheKey = `station:${stationId}/journey-count?monthStart=${monthStart}&monthEnd=${monthEnd}`;
      const cachedData = JSON.stringify(mockJourneyCountData);
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getJourneyCountByMonth(
        stationId,
        monthStart,
        monthEnd,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual(
        mockJourneyCountData.map((item) => ({
          ...item,
          month: item.month.toISOString(),
        })),
      );
    });

    it('should fetch journey count data from repository and cache if not available', async () => {
      const cacheKey = `station:${stationId}/journey-count?monthStart=${monthStart}&monthEnd=${monthEnd}`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(
        mockJourneyCountData,
      );

      const result = await service.getJourneyCountByMonth(
        stationId,
        monthStart,
        monthEnd,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockJourneyCountData),
        cacheTTL,
      );
      expect(result).toEqual(mockJourneyCountData);
    });

    it('should handle missing monthStart parameter', async () => {
      const cacheKey = `station:${stationId}/journey-count?monthStart=undefined&monthEnd=${monthEnd}`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(
        mockJourneyCountData,
      );

      await service.getJourneyCountByMonth(stationId, undefined, monthEnd);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });

    it('should handle missing monthEnd parameter', async () => {
      const cacheKey = `station:${stationId}/journey-count?monthStart=${monthStart}&monthEnd=undefined`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(
        mockJourneyCountData,
      );

      await service.getJourneyCountByMonth(stationId, monthStart);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });

    it('should handle missing month parameters', async () => {
      const cacheKey = `station:${stationId}/journey-count?monthStart=undefined&monthEnd=undefined`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(
        mockJourneyCountData,
      );

      await service.getJourneyCountByMonth(stationId);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });

    it('should return null if query return null', async () => {
      const cacheKey = `station:${stationId}/journey-count?monthStart=${monthStart}&monthEnd=${monthEnd}`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(null);

      const result = await service.getJourneyCountByMonth(
        stationId,
        monthStart,
        monthEnd,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(cacheKey, 'null', cacheTTL);
      expect(result).toBeNull();
    });

    it('should return empty array if query return empty array', async () => {
      const cacheKey = `station:${stationId}/journey-count?monthStart=${monthStart}&monthEnd=${monthEnd}`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue([]);

      const result = await service.getJourneyCountByMonth(
        stationId,
        monthStart,
        monthEnd,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify([]),
        cacheTTL,
      );
      expect(result).toEqual([]);
    });
  });

  describe('getPopularDestinations', () => {
    const id = 1;
    const skip = 0;
    const take = 2;
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';
    const cacheTTL = 3.6e8;

    const mockPopularDestinationData: Array<StationWithCount> = [
      {
        id: 2,
        stationName: 'Station 2',
        stationAddress: 'Address 2',
        coordinateX: '123.456',
        coordinateY: '456.789',
        journey_count: 100,
      },
      {
        id: 3,
        stationName: 'Station 3',
        stationAddress: 'Address 3',
        coordinateX: '123.456',
        coordinateY: '456.789',
        journey_count: 500,
      },
    ];

    it('should return popular station data from cache if available', async () => {
      const cacheKey = `stations:popular_destination?id=${id}&startDate=${startDate}&endDate=${endDate}`;
      const cachedData = JSON.stringify(mockPopularDestinationData);
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getPopularDestinations(
        skip,
        take,
        id,
        startDate,
        endDate,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual(mockPopularDestinationData);
    });

    it('should fetch popular destination data from repository and cache if not available', async () => {
      const cacheKey = `stations:popular_destination?id=${id}&startDate=${startDate}&endDate=${endDate}`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(
        mockPopularDestinationData,
      );

      const result = await service.getPopularDestinations(
        skip,
        take,
        id,
        startDate,
        endDate,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockPopularDestinationData),
        cacheTTL,
      );
      expect(result).toEqual(mockPopularDestinationData);
    });

    it('should handle missing startDate parameter', async () => {
      const cacheKey = `stations:popular_destination?id=${id}&startDate=undefined&endDate=${endDate}`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(
        mockPopularDestinationData,
      );

      await service.getPopularDestinations(skip, take, id, undefined, endDate);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });

    it('should handle missing endDate parameter', async () => {
      const cacheKey = `stations:popular_destination?id=${id}&startDate=${startDate}&endDate=undefined`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(
        mockPopularDestinationData,
      );

      await service.getPopularDestinations(skip, take, id, startDate);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });

    it('should handle missing date parameters', async () => {
      const cacheKey = `stations:popular_destination?id=${id}&startDate=undefined&endDate=undefined`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(
        mockPopularDestinationData,
      );

      await service.getPopularDestinations(skip, take, id);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });

    it('should return null if query return null', async () => {
      const cacheKey = `stations:popular_destination?id=${id}&startDate=${startDate}&endDate=${endDate}`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(null);

      const result = await service.getPopularDestinations(
        skip,
        take,
        id,
        startDate,
        endDate,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(cacheKey, 'null', cacheTTL);
      expect(result).toBeNull();
    });

    it('should return empty array if query return empty array', async () => {
      const cacheKey = `stations:popular_destination?id=${id}&startDate=${startDate}&endDate=${endDate}`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue([]);

      const result = await service.getPopularDestinations(
        skip,
        take,
        id,
        startDate,
        endDate,
      );

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify([]),
        cacheTTL,
      );
      expect(result).toEqual([]);
    });
  });

  describe('getIrregularJourneyPercentage', () => {
    const threshold = 1000;
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';
    const cacheTTL = 3.6e8;
    const mockIrregularJourneyPercentageData: Array<IrregularJourneyPercentage> =
      [
        {
          station_id: '1',
          station_name: 'Station 1',
          percentage: '25.00',
        },
        {
          station_id: '2',
          station_name: 'Station 2',
          percentage: '50.00',
        },
      ];
    it('should return irregular journey percentage data from cache if available', async () => {
      const cacheKey = `stations:irregular_journey_percentage?threshold=${threshold}&startDate=${startDate}&endDate=${endDate}`;
      const cachedData = JSON.stringify(mockIrregularJourneyPercentageData);
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getIrregularJourneyPercentage(
        threshold,
        startDate,
        endDate,
      );
      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual(mockIrregularJourneyPercentageData);
    });
    it('should fetch irregular journey percentage data from repository and cache if not available', async () => {
      const cacheKey = `stations:irregular_journey_percentage?threshold=${threshold}&startDate=${startDate}&endDate=${endDate}`;
      mockCacheManager.get.mockResolvedValue(null);
      mockStationRepository.manager.query.mockResolvedValue(
        mockIrregularJourneyPercentageData,
      );

      const result = await service.getIrregularJourneyPercentage(
        threshold,
        startDate,
        endDate,
      );
      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.manager.query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockIrregularJourneyPercentageData),
        cacheTTL,
      );
      expect(result).toEqual(mockIrregularJourneyPercentageData);
    });
  });
});
