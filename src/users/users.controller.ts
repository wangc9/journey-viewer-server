// import { Controller, Get, Param, Query } from '@nestjs/common';
// import { JourneyService } from './journeys.service';

// @Controller('journeys')
// export class JourneysController {
//   constructor(private journeyService: JourneyService) {}

//   @Get()
//   async findAllJourneys(
//     @Query('skip') skip: string,
//     @Query('take') take: string,
//     @Query('id') id: string,
//     @Query('dTime') dTime: string,
//     @Query('rTime') rTime: string,
//     @Query('distance') distance: string,
//     @Query('duration') duration: string,
//     @Query('search') search: string,
//   ) {
//     if (!/^[0-9]+$/.test(skip)) {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'Skip must be a number',
//         code: 'INVALID_SKIP',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys',
//       };
//     }
//     if (!/^[0-9]+$/.test(take)) {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'Take must be a number',
//         code: 'INVALID_TAKE',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys',
//       };
//     }
//     if (id !== undefined && id !== 'ASC' && id !== 'DESC') {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'Id order can be only ASC or DESC',
//         code: 'INVALID_ID_ORDER',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys',
//       };
//     }
//     if (dTime !== undefined && dTime !== 'ASC' && dTime !== 'DESC') {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'dTime order can be only ASC or DESC',
//         code: 'INVALID_DTIME_ORDER',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys',
//       };
//     }
//     if (rTime !== undefined && rTime !== 'ASC' && rTime !== 'DESC') {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'rTime order can be only ASC or DESC',
//         code: 'INVALID_RTIME_ORDER',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys',
//       };
//     }
//     if (distance !== undefined && distance !== 'ASC' && distance !== 'DESC') {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'distance order can be only ASC or DESC',
//         code: 'INVALID_DISTANCE_ORDER',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys',
//       };
//     }
//     if (duration !== undefined && duration !== 'ASC' && duration !== 'DESC') {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'duration order can be only ASC or DESC',
//         code: 'INVALID_DURATION_ORDER',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys',
//       };
//     }

//     const journeys = await this.journeyService.getAllJourneys(
//       Number(skip),
//       Number(take),
//       id,
//       dTime,
//       rTime,
//       distance,
//       duration,
//       search,
//     );

//     if (journeys) {
//       return journeys;
//     } else {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'No journey found',
//         code: 'NO_JOURNEY',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys',
//       };
//     }
//   }

//   @Get('/count')
//   async getJourneyCount() {
//     const count = await this.journeyService.getJourneyCount();

//     return { count };
//   }

//   @Get('/:id')
//   async findSingleJourney(@Param('id') id: string) {
//     if (!/^[0-9]+$/.test(id)) {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'Id must be a number',
//         code: 'INVALID_JOURNEY_ID',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys/:id',
//       };
//     }
//     const journey = await this.journeyService.getSingleJourney(Number(id));
//     if (journey) {
//       return journey;
//     } else {
//       return {
//         status: 400,
//         error: 'Bad Request',
//         message: 'Id does not exist',
//         code: 'INVALID_JOURNEY_ID',
//         timestamp: new Date().toUTCString(),
//         path: '/journeys/:id',
//       };
//     }
//   }
// }
