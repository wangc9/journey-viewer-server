import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station } from './stations.entity';
import { StationService } from './stations.service';
import { StationsController } from './stations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Station])],
  providers: [StationService],
  controllers: [StationsController],
  exports: [TypeOrmModule],
})
export class StationsModule {}
