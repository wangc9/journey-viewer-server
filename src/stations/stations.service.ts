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

  getAllStations(skip: number, take: number): Promise<Station[]> {
    return this.stationRepository.find({ skip: skip * take, take });
  }
}
