/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { User } from 'src/users/users.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.authService.login(req.user as User);
  }

  @Post('/register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    const user = await this.authService.register(email, password);
    if (user) {
      return user;
    } else {
      return {
        status: 400,
        error: 'Bad Request',
        message: 'A user with that email already exists',
        code: 'INVALID_EMAIL',
        timestamp: new Date().toUTCString(),
        path: '/auth/register',
      };
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('/logout')
  async logout(@Request() req) {
    return req.logout();
  }
}
