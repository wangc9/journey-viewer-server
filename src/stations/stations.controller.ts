/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { StationService } from './stations.service';
import { DateTime } from 'luxon';
import { ApiOkResponse } from '@nestjs/swagger';
import { Station } from './stations.entity';
import { SingleStation } from './stations.dto';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationService: StationService) {}

  @Get()
  @ApiOkResponse({ isArray: true, type: Station })
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
    if (take && !/^[0-9]+$/.test(take)) {
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
      take ? Number(take) : -1,
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

  @Get('/count')
  async getStationCount() {
    const count = await this.stationService.getStationCount();

    return { count };
  }

  @Get('/:id')
  @ApiOkResponse({ isArray: true, type: SingleStation })
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

  @Get('/:id/journey-count')
  async getJourneyCountByMonth(
    @Param('id') id: string,
    @Query('monthStart') monthStart: string,
    @Query('monthEnd') monthEnd: string,
  ) {
    if (!/^[0-9]+$/.test(id)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Id must be a number',
        code: 'INVALID_STATION_ID',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id/journey-count',
      };
    }
    if (
      monthStart !== undefined &&
      !/^[0-9]{4}-[0-9]{2}-01$/.test(monthStart)
    ) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Month start must be in format YYYY-MM-01',
        code: 'INVALID_MONTH_START',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id/journey-count',
      };
    }
    if (monthEnd !== undefined && !/^[0-9]{4}-[0-9]{2}-01$/.test(monthEnd)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Month end must be in format YYYY-MM-01',
        code: 'INVALID_MONTH_END',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id/journey-count',
      };
    }
    if (
      monthStart !== undefined &&
      monthEnd !== undefined &&
      new Date(monthStart).getTime() > new Date(monthEnd).getTime()
    ) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Month start must be before month end',
        code: 'INVALID_MONTH_RANGE',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id/journey-count',
      };
    }

    return await this.stationService.getJourneyCountByMonth(
      id,
      monthStart,
      monthEnd,
    );
  }

  @Get('/:id/destinations')
  async getPopularDestinations(
    @Param('id') id: string,
    @Query('skip') skip: string,
    @Query('take') take: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!/^[0-9]+$/.test(id)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Id must be a number',
        code: 'INVALID_STATION_ID',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id/destinations',
      };
    }
    if (!/^[0-9]+$/.test(skip)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Skip must be a number',
        code: 'INVALID_SKIP',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id/destinations',
      };
    }
    if (take && !/^[0-9]+$/.test(take)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Take must be a number',
        code: 'INVALID_TAKE',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id/destinations',
      };
    }
    if (startDate !== undefined) {
      try {
        const parsedStartDate = DateTime.fromISO(startDate);
        if (!parsedStartDate.isValid) {
          return {
            status: 400,
            error: 'Bad Request',
            message: 'startDate is in incorrect format',
            code: 'INVALID_STARTDATE',
            timestamp: new Date().toUTCString(),
            path: '/stations/:id/destinations',
          };
        }
      } catch (e) {
        return {
          status: 400,
          error: 'Bad Request',
          message: 'startDate is in incorrect format',
          code: 'INVALID_STARTDATE',
          timestamp: new Date().toUTCString(),
          path: '/stations/:id/destinations',
        };
      }
    }
    if (endDate !== undefined) {
      try {
        const parsedEndDate = DateTime.fromISO(endDate);
        if (!parsedEndDate.isValid) {
          return {
            status: 400,
            error: 'Bad Request',
            message: 'endDate is in incorrect format',
            code: 'INVALID_ENDDATE',
            timestamp: new Date().toUTCString(),
            path: '/stations/:id/destinations',
          };
        }
      } catch (e) {
        return {
          status: 400,
          error: 'Bad Request',
          message: 'endDate is in incorrect format',
          code: 'INVALID_ENDDATE',
          timestamp: new Date().toUTCString(),
          path: '/stations/:id/destinations',
        };
      }
    }
    const station = await this.stationService.getPopularDestinations(
      skip ? Number(skip) : -1,
      take ? Number(take) : -1,
      Number(id),
      startDate,
      endDate,
    );
    if (station && station.length > 0) {
      return station;
    } else {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Id does not exist',
        code: 'INVALID_STATION_ID',
        timestamp: new Date().toUTCString(),
        path: '/stations/:id/destinations',
      };
    }
  }
}
