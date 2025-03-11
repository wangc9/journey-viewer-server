import { Controller, Get, Param, Query } from '@nestjs/common';
import { StationService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationService: StationService) {}

  @Get()
  async findAllStations(
    @Query('skip') skip: string,
    @Query('take') take: string,
    @Query('id') id: string,
    @Query('name') name: string,
    @Query('address') address: string,
    @Query('x') x: string,
    @Query('y') y: string,
    @Query('search') search: string,
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
    if (id !== undefined && id !== 'ASC' && id !== 'DESC') {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Id order can be only ASC or DESC',
        code: 'INVALID_ID_ORDER',
        timestamp: new Date().toUTCString(),
        path: '/stations',
      };
    }
    if (name !== undefined && name !== 'ASC' && name !== 'DESC') {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Name order can be only ASC or DESC',
        code: 'INVALID_NAME_ORDER',
        timestamp: new Date().toUTCString(),
        path: '/stations',
      };
    }
    if (address !== undefined && address !== 'ASC' && address !== 'DESC') {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Address order can be only ASC or DESC',
        code: 'INVALID_ADDRESS_ORDER',
        timestamp: new Date().toUTCString(),
        path: '/stations',
      };
    }
    if (x !== undefined && x !== 'ASC' && x !== 'DESC') {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'X order can be only ASC or DESC',
        code: 'INVALID_X_ORDER',
        timestamp: new Date().toUTCString(),
        path: '/stations',
      };
    }
    if (y !== undefined && y !== 'ASC' && y !== 'DESC') {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Y order can be only ASC or DESC',
        code: 'INVALID_Y_ORDER',
        timestamp: new Date().toUTCString(),
        path: '/stations',
      };
    }

    const stations = await this.stationService.getAllStations(
      Number(skip),
      Number(take),
      id,
      name,
      address,
      x,
      y,
      search,
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
