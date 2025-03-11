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

  async getAllStations(skip: number, take: number): Promise<Station[] | null> {
    return await this.stationRepository.find({ skip: skip * take, take });
  }

  async getSingleStation(id: number): Promise<Station | null> {
    return await this.stationRepository.findOne({ where: { id } });
  }
}
