import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Station } from './stations.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StationService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async getAllStations(
    skip: number,
    take: number,
    id = 'ASC',
    name = 'ASC',
    address = 'ASC',
    x = 'ASC',
    y = 'ASC',
  ): Promise<Station[] | null> {
    return await this.stationRepository.find({
      skip: skip * take,
      take,
      order: {
        id: id === 'ASC' ? 'ASC' : 'DESC',
        stationName: name === 'ASC' ? 'ASC' : 'DESC',
        stationAddress: address === 'ASC' ? 'ASC' : 'DESC',
        coordinateX: x === 'ASC' ? 'ASC' : 'DESC',
        coordinateY: y === 'ASC' ? 'ASC' : 'DESC',
      },
    });
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
