import { Controller, Get, Param, Query } from '@nestjs/common';
import { StationService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationService: StationService) {}

  @Get()
  async findAllStations(
    @Query('skip') skip: string,
    @Query('take') take: string,
  ) {
    if (!/^[0-9]+$/.test(skip)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Skip must be a number',
        code: 'INVALID_SKIP',
        timestamp: new Date().toUTCString(),
        path: '/stations',
      };
    }
    if (!/^[0-9]+$/.test(take)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Take must be a number',
        code: 'INVALID_TAKE',
        timestamp: new Date().toUTCString(),
        path: '/stations',
      };
    }
    const stations = await this.stationService.getAllStations(
      Number(skip),
      Number(take),
    );
    if (stations) {
      return stations;
    } else {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'No station found',
        code: 'NO_STATION',
        timestamp: new Date().toUTCString(),
        path: '/stations',
      };
    }
  }

  @Get('/:id')
  async findSingleStation(@Param('id') id: string) {
    if (!/^[0-9]+$/.test(id)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Id must be a number',
        code: 'INVALID_STATION_ID',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id',
      };
    }
    const station = await this.stationService.getSingleStation(Number(id));
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
