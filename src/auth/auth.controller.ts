/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Request,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { User } from 'src/users/users.entity';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req, @Res({ passthrough: true }) response: Response) {
    const domain = this.configService.get<string>('SERVER_DOMAIN');
    const environment = this.configService.get<string>('ENVIRONMENT');
    const result = await this.authService.login(req.user as User);
    response.cookie('access_token', result.access_token, {
      domain,
      sameSite: environment === 'PROD' ? 'none' : 'lax',
      path: '/',
      secure: environment === 'PROD',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 5,
    });

    return result.user;
  }

  @UseInterceptors(ClassSerializerInterceptor)
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
