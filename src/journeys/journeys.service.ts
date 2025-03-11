import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Journey } from './journeys.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JourneyService {
  constructor(
    @InjectRepository(Journey)
    private journeyRepository: Repository<Journey>,
  ) {}

  async getAllJourneys(
    skip: number,
    take: number,
    id = 'ASC',
    dTime = 'ASC',
    rTime = 'ASC',
    search?: string,
  ): Promise<Journey[] | null> {
    return await this.journeyRepository.find({
      skip: skip * take,
      take,
      order: {
        id: id === 'ASC' ? 'ASC' : 'DESC',
        departureDateTime: dTime === 'ASC' ? 'ASC' : 'DESC',
        returnDateTime: rTime === 'ASC' ? 'ASC' : 'DESC',
      },
      relations: ['departureStationId', 'returnStationId'],
      where: search
        ? [
            ...(/^[0-9]+$/.test(search) ? [{ id: Number(search) }] : []),
            { departureDateTime: new Date(search) },
            { returnDateTime: new Date(search) },
          ]
        : [],
    });
  }

  async getSingleJourney(id: number): Promise<Journey | null> {
    return await this.journeyRepository.findOne({ where: { id } });
  }

  async getJourneysFromStation(
    id: number,
    skip: number,
    take: number,
  ): Promise<Journey[] | null> {
    return await this.journeyRepository.find({
      where: { departureStationId: id },
      take,
      skip: skip * take,
    });
  }

  async getJourneysToStation(
    id: number,
    skip: number,
    take: number,
  ): Promise<Journey[] | null> {
    return await this.journeyRepository.find({
      where: { returnStationId: id },
      take,
      skip: skip * take,
    });
  }
}
