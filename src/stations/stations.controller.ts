import { Controller, Get, Query } from '@nestjs/common';
import { StationService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationService: StationService) {}

  @Get()
  async findAllStations(
    @Query('skip') skip: number,
    @Query('take') take: number,
  ) {
    return await this.stationService.getAllStations(skip, take);
  }
}
