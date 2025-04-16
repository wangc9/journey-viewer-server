import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Station } from './stations.entity';
import { Repository, Like } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

type StationWithCount = Station & {
  journey_count: number;
};

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
    id?: 'ASC' | 'DESC',
    name?: 'ASC' | 'DESC',
    address?: 'ASC' | 'DESC',
    x?: 'ASC' | 'DESC',
    y?: 'ASC' | 'DESC',
    search?: string,
  ): Promise<Station[] | null> {
    const cacheKey = `stations:skip=${skip}&take=${take}&id=${id}&name=${name}&address=${address}&x=${x}&y=${y}&search=${search}`;

    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as Station[] | null;
    } else {
      const result = await this.stationRepository.find({
        skip: skip * take,
        take: take === -1 ? undefined : take,
        order: {
          id: id === 'ASC' ? 'ASC' : id === 'DESC' ? 'DESC' : undefined,
          stationName:
            name === 'ASC' ? 'ASC' : name === 'DESC' ? 'DESC' : undefined,
          stationAddress:
            address === 'ASC' ? 'ASC' : address === 'DESC' ? 'DESC' : undefined,
          coordinateX: x === 'ASC' ? 'ASC' : x === 'DESC' ? 'DESC' : undefined,
          coordinateY: y === 'ASC' ? 'ASC' : y === 'DESC' ? 'DESC' : undefined,
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
    start_count: string;
    return_count: string;
    start_average: string;
    return_average: string;
  } | null> {
    const station: Array<{
      station_name: string;
      station_address: string;
      start_count: string;
      return_count: string;
      start_average: string;
      return_average: string;
    }> | null = await this.stationRepository.manager.query(
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
    if (Array.isArray(station)) return station[0];
    else return null;
  }

  async getJourneyCountByMonth(
    month?: string,
    stationId?: string,
  ): Promise<{
    month: Date;
    station_id: string;
    departure_count: number;
    arrival_count: number;
  } | null> {
    let where = '';
    if (month) {
      where += `WHERE month = '${month}'`;
    }
    if (stationId) {
      where += where
        ? ` AND station_id = ${stationId}`
        : ` WHERE station_id = ${stationId}`;
    }
    const result: {
      month: Date;
      station_id: string;
      departure_count: number;
      arrival_count: number;
    } | null = await this.stationRepository.manager.query(
      `
        SELECT 
            month,
            station_id,
            SUM(departure_count) AS departure_count,
            SUM(arrival_count) AS arrival_count
        FROM (
            SELECT 
                DATE_TRUNC('month', departure_date_time) AS month,
                departure_station_id AS station_id,
                COUNT(*) AS departure_count,
                0 AS arrival_count
            FROM Journey
            GROUP BY month, station_id

            UNION ALL

            SELECT 
                DATE_TRUNC('month', return_date_time) AS month,
                return_station_id AS station_id,
                0 AS departure_count,
                COUNT(*) AS arrival_count
            FROM Journey
            GROUP BY month, station_id
        ) AS combined_counts
        ${where}
        GROUP BY month, station_id
        ORDER BY month, station_id;
      `,
    );

    return result;
  }

  async getPopularDestinations(
    skip: number,
    take: number,
    id: number,
    startDate?: string,
    endDate?: string,
  ) {
    const cacheKey = `stations:popular_destination?id=${id}&startDate=${startDate}&endDate=${endDate}`;

    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as StationWithCount[] | null;
    } else {
      const result: Array<StationWithCount> | null =
        await this.stationRepository.manager.query(
          `
          SELECT
            j.return_station_id AS id,
            dest.station_name AS station_name,
            dest.station_address AS station_address,
            dest.coordinate_x AS coordinate_x,
            dest.coordinate_y AS coordinate_y,
            COUNT(*) AS journey_count
          FROM journey j
          JOIN station dest ON j.return_station_id = dest.id
          WHERE j.departure_station_id = ${id}
          AND (
            (${startDate ? new Date(startDate).toISOString() : null} IS NULL OR j.departure_date_time >= ${startDate ? new Date(startDate).toISOString() : null})
            AND (${endDate ? new Date(endDate).toISOString() : null} IS NULL OR j.departure_date_time <= ${endDate ? new Date(endDate).toISOString() : null})
          )
          GROUP BY j.return_station_id, dest.station_name, dest.station_address, dest.coordinate_x, dest.coordinate_y
          ORDER BY journey_count DESC
          LIMIT ${take === -1 ? 'NULL' : take}
          OFFSET ${skip === -1 ? 'NULL' : skip};
        `,
        );
      await this.cacheManager.set(cacheKey, JSON.stringify(result), 3600);

      return result;
    }
  }
}
