import { Controller, Get, Param, Query } from '@nestjs/common';
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

  @Get('/:id')
  async findSingleStation(@Param('id') id: number) {
    if (typeof id === 'string') {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Id must be a number',
        code: 'INVALID_STATION_ID',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id',
      };
    }
    const station = await this.stationService.getSingleStation(id);
    if (station) {
      return station;
    } else {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Id does not exist',
        code: 'INVALID_STATION_ID',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id',
      };
    }
  }
}
