import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiCookieAuth } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private userService: UserService) {}

  @ApiCookieAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllUsers() {
    const users = await this.userService.getAllUsers(0, 10);

    return users;
  }

  // @Get('/count')
  // async getJourneyCount() {
  //   const count = await this.journeyService.getJourneyCount();

  //   return { count };
  // }

  // @Get('/:id')
  // async findSingleJourney(@Param('id') id: string) {
  //   if (!/^[0-9]+$/.test(id)) {
  //     return {
  //       status: 400,
  //       error: 'Bad Request',
  //       message: 'Id must be a number',
  //       code: 'INVALID_JOURNEY_ID',
  //       timestamp: new Date().toUTCString(),
  //       path: '/journeys/:id',
  //     };
  //   }
  //   const journey = await this.journeyService.getSingleJourney(Number(id));
  //   if (journey) {
  //     return journey;
  //   } else {
  //     return {
  //       status: 400,
  //       error: 'Bad Request',
  //       message: 'Id does not exist',
  //       code: 'INVALID_JOURNEY_ID',
  //       timestamp: new Date().toUTCString(),
  //       path: '/journeys/:id',
  //     };
  //   }
  // }
}
