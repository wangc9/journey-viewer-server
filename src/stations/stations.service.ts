import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Station } from './stations.entity';
import { Repository, Like } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class StationService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getStationCount(): Promise<number> {
    const cacheKey = 'stations:count';
    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return Number(cache);
    } else {
      const count = await this.stationRepository.count();
      await this.cacheManager.set(cacheKey, count, 3600);

      return count;
    }
  }

  async getAllStations(
    skip: number,
    take: number,
    id = 'ASC',
    name = 'ASC',
    address = 'ASC',
    x = 'ASC',
    y = 'ASC',
    search?: string,
  ): Promise<Station[] | null> {
    const cacheKey = `stations:skip=${skip}&take=${take}&id=${id}&name=${name}&address=${address}&x=${x}&y=${y}&search=${search}`;

    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as Station[] | null;
    } else {
      const result = await this.stationRepository.find({
        skip: skip * take,
        take,
        order: {
          id: id === 'ASC' ? 'ASC' : 'DESC',
          stationName: name === 'ASC' ? 'ASC' : 'DESC',
          stationAddress: address === 'ASC' ? 'ASC' : 'DESC',
          coordinateX: x === 'ASC' ? 'ASC' : 'DESC',
          coordinateY: y === 'ASC' ? 'ASC' : 'DESC',
        },
        where: search
          ? [
              ...(/^[0-9]+$/.test(search) ? [{ id: Number(search) }] : []),
              { stationName: Like(`%${search}%`) },
              { stationAddress: Like(`%${search}%`) },
              { coordinateX: Like(`%${search}%`) },
              { coordinateY: Like(`%${search}%`) },
            ]
          : [],
      });
      await this.cacheManager.set(cacheKey, JSON.stringify(result), 3600);

      return result;
    }
  }

  async getSingleStation(id: number): Promise<{
    station_name: string;
    station_address: string;
    start_count: number;
    return_count: string;
    start_average: number;
    return_average: number;
  } | null> {
    const station: {
      station_name: string;
      station_address: string;
      start_count: number;
      return_count: string;
      start_average: number;
      return_average: number;
    } | null = await this.stationRepository.manager.query(
      `
        SELECT
          s.station_name AS station_name,
          s.station_address AS station_address,
          (
            SELECT
              COUNT(id)
            FROM
              journey
            WHERE
              departure_station_id = ${id}
          ) AS start_count,
          (
            SELECT
              COUNT(id)
            FROM
              journey
            WHERE
              return_station_id = ${id}
          ) AS return_count,
          (
            SELECT
              AVG(distance)
            FROM
              journey
            WHERE
              departure_station_id = ${id}
          ) AS start_average,
          (
            SELECT
              AVG(distance)
            FROM
              journey
            WHERE
              return_station_id = ${id}
          ) AS return_average
        FROM
          station s
        WHERE
          s.id = ${id};
      `,
    );
    return station;
  }
}
