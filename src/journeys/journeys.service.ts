import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Journey } from './journeys.entity';
import { Like, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class JourneyService {
  constructor(
    @InjectRepository(Journey)
    private journeyRepository: Repository<Journey>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getJourneyCount(): Promise<number> {
    const cacheKey = 'journeys:count';
    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return Number(cache);
    } else {
      const count = await this.journeyRepository.count();
      await this.cacheManager.set(cacheKey, count, 3.6e8);

      return count;
    }
  }

  async getAllJourneys(
    skip: number,
    take: number,
    id?: 'ASC' | 'DESC',
    dTime?: 'ASC' | 'DESC',
    rTime?: 'ASC' | 'DESC',
    distance?: 'ASC' | 'DESC',
    duration?: 'ASC' | 'DESC',
    search?: string,
  ): Promise<Journey[] | null> {
    const cacheKey = `journeys:skip=${skip}&take=${take}&id=${id}&dTime=${dTime}&rTime=${rTime}&distance=${distance}&duration=${duration}&search=${search}`;

    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as Journey[] | null;
    } else {
      const result = await this.journeyRepository.find({
        skip: skip * take,
        take: take === -1 ? undefined : take,
        order: {
          id: id === 'ASC' ? 'ASC' : id === 'DESC' ? 'DESC' : undefined,
          departureDateTime:
            dTime === 'ASC' ? 'ASC' : dTime === 'DESC' ? 'DESC' : undefined,
          returnDateTime:
            rTime === 'ASC' ? 'ASC' : rTime === 'DESC' ? 'DESC' : undefined,
          distance:
            distance === 'ASC'
              ? 'ASC'
              : distance === 'DESC'
                ? 'DESC'
                : undefined,
          duration:
            duration === 'ASC'
              ? 'ASC'
              : duration === 'DESC'
                ? 'DESC'
                : undefined,
        },
        relations: ['departureStationId', 'returnStationId'],
        where: search
          ? [
              ...(/^[0-9]+$/.test(search) ? [{ id: Number(search) }] : []),
              { departureDateTime: Like(new Date(search)) },
              { returnDateTime: Like(new Date(search)) },
              ...(/^[0-9]+$/.test(search)
                ? [{ distance: Number(search) }]
                : []),
              ...(/^[0-9]+$/.test(search)
                ? [{ duration: Number(search) }]
                : []),
            ]
          : [],
      });
      await this.cacheManager.set(cacheKey, JSON.stringify(result), 3.6e8);

      return result;
    }
  }

  async getSingleJourney(id: number): Promise<Journey | null> {
    const cacheKey = `journey:${id}`;
    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as Journey | null;
    } else {
      const result = await this.journeyRepository.findOne({ where: { id } });
      if (result) {
        await this.cacheManager.set(cacheKey, JSON.stringify(result), 3.6e8);
      }

      return result;
    }
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
