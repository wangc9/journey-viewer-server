import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Station } from './stations.entity';
import { Repository, Like } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SingleStation } from './stations.dto';

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
      await this.cacheManager.set(cacheKey, count, 3.6e8);

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
      await this.cacheManager.set(cacheKey, JSON.stringify(result));

      return result;
    }
  }

  async getSingleStation(id: number): Promise<SingleStation | null> {
    const cacheKey = `station:${id}`;
    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as SingleStation | null;
    } else {
      const station: Array<SingleStation> | null =
        await this.stationRepository.manager.query(
          `
            WITH journey_count AS (
              SELECT
                return_station_id,
                COUNT(*) AS count
              FROM
                journey
              WHERE
                return_station_id = ${id}
                AND return_date_time IS NOT NULL
                AND departure_date_time IS NOT NULL
                AND duration IS NOT NULL
                AND ABS(EXTRACT(EPOCH FROM (return_date_time - departure_date_time)) - duration) >= 300
              GROUP BY
                return_station_id
            )
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
              ) AS return_average,
              ROUND(
                COALESCE(jc.count, 0) * 100.0 /
                NULLIF((
                  SELECT
                    COUNT(id)
                  FROM
                    journey
                  WHERE
                    return_station_id = ${id}
                ), 0),
                2
              ) AS percentage
            FROM
              station s
            LEFT JOIN
              journey_count jc ON jc.return_station_id = ${id}
            WHERE
              s.id = ${id};
          `,
        );
      if (Array.isArray(station) && station.length > 0) {
        const result = station[0];
        await this.cacheManager.set(cacheKey, JSON.stringify(result));
        return result;
      } else return null;
    }
  }

  async getJourneyCountByMonth(
    stationId: string,
    monthStart?: string,
    monthEnd?: string,
  ): Promise<Array<StationJourneyCountByMonth> | null> {
    const cacheKey = `station:${stationId}/journey-count?monthStart=${monthStart}&monthEnd=${monthEnd}`;

    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as Array<StationJourneyCountByMonth> | null;
    } else {
      let where = '';
      if (monthStart) {
        where += `WHERE month >= '${monthStart}'`;
      }
      if (monthEnd) {
        where += where
          ? ` AND month <= '${monthEnd}'`
          : ` WHERE month <= '${monthEnd}'`;
      }
      if (stationId) {
        where += where
          ? ` AND station_id = ${stationId}`
          : ` WHERE station_id = ${stationId}`;
      }
      const result: Array<StationJourneyCountByMonth> | null =
        await this.stationRepository.manager.query(
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
      await this.cacheManager.set(cacheKey, JSON.stringify(result));

      return result;
    }
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
      await this.cacheManager.set(cacheKey, JSON.stringify(result));

      return result;
    }
  }

  async getIrregularJourneyPercentage(
    threshold?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const cacheKey = `stations:irregular_journey_percentage?threshold=${threshold}&startDate=${startDate}&endDate=${endDate}`;
    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as IrregularJourneyPercentage[] | null;
    } else {
      const result: Array<IrregularJourneyPercentage> | null =
        await this.stationRepository.manager.query(
          `
            WITH total_returns AS (
              SELECT
                return_station_id,
                COUNT(*) AS total_journeys
              FROM journey
              WHERE return_date_time IS NOT NULL
              ${startDate ? `AND return_date_time >= ${new Date(startDate).toISOString()}` : ''}
              ${endDate ? `AND return_date_time <= ${new Date(endDate).toISOString()}` : ''}
              GROUP BY return_station_id
            ),
            inconsistent_returns AS (
              SELECT
                return_station_id,
                COUNT(*) AS inconsistent_journeys
              FROM journey
              WHERE
                return_date_time IS NOT NULL
                AND departure_date_time IS NOT NULL
                AND duration IS NOT NULL
                ${startDate ? `AND return_date_time >= ${new Date(startDate).toISOString()}` : ''}
                ${endDate ? `AND return_date_time <= ${new Date(endDate).toISOString()}` : ''}
                AND ABS(EXTRACT(EPOCH FROM (return_date_time - departure_date_time)) - duration) > ${threshold || 300}
              GROUP BY return_station_id
            )
            SELECT
              s.id AS station_id,
              s.station_name,
              ROUND(
                COALESCE(ir.inconsistent_journeys, 0) * 100.0 / tr.total_journeys,
                2
              ) AS percentage
            FROM total_returns tr
            JOIN station s ON s.id = tr.return_station_id
            LEFT JOIN inconsistent_returns ir ON ir.return_station_id = tr.return_station_id
            ORDER BY percentage DESC;
          `,
        );

      await this.cacheManager.set(cacheKey, JSON.stringify(result));

      return result;
    }
  }
}
