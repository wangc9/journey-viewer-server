import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journey } from './journeys.entity';
import { JourneyService } from './journeys.service';
import { JourneysController } from './journeys.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Journey])],
  providers: [JourneyService],
  controllers: [JourneysController],
  exports: [TypeOrmModule],
})
export class JourneysModule {}
