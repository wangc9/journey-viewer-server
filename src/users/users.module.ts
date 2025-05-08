import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { JourneysController } from './journeys.controller';
import { User } from './users.entity';
import { UserService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService],
  // controllers: [JourneysController],
  exports: [TypeOrmModule, UserService],
})
export class UsersModule {}
