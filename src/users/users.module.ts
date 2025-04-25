import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JourneyService } from './journeys.service';
import { JourneysController } from './journeys.controller';
import { User } from './users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [JourneyService],
  controllers: [JourneysController],
  exports: [TypeOrmModule],
})
export class UsersModule {}
