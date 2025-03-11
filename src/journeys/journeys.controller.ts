import { Controller, Get, Param, Query } from '@nestjs/common';
import { JourneyService } from './journeys.service';

@Controller('journeys')
export class JourneysController {
  constructor(private journeyService: JourneyService) {}

  @Get()
  async findAllJourneys(
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
        path: '/journeys',
      };
    }
    if (!/^[0-9]+$/.test(take)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Take must be a number',
        code: 'INVALID_TAKE',
        timestamp: new Date().toUTCString(),
        path: '/journeys',
      };
    }
    const journeys = await this.journeyService.getAllJourneys(
      Number(skip),
      Number(take),
    );
    if (journeys) {
      return journeys;
    } else {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'No journey found',
        code: 'NO_JOURNEY',
        timestamp: new Date().toUTCString(),
        path: '/journeys',
      };
    }
  }

  @Get('/:id')
  async findSingleJourney(@Param('id') id: string) {
    if (!/^[0-9]+$/.test(id)) {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Id must be a number',
        code: 'INVALID_JOURNEY_ID',
        timestamp: new Date().toUTCString(),
        path: '/journeys/:id',
      };
    }
    const journey = await this.journeyService.getSingleJourney(Number(id));
    if (journey) {
      return journey;
    } else {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'Id does not exist',
        code: 'INVALID_JOURNEY_ID',
        timestamp: new Date().toUTCString(),
        path: '/journeys/:id',
      };
    }
  }
}
