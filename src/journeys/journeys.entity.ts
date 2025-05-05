import { Station } from '../stations/stations.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'journey' })
export class Journey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'departure_date_time',
    comment: 'Journey start timestamp',
  })
  departureDateTime?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'return_date_time',
    comment: 'Journey end timestamp',
  })
  returnDateTime?: Date;

  @ManyToOne(() => Station, (station) => station.id)
  @JoinColumn({ name: 'departure_station_id' })
  departureStationId: number;

  @ManyToOne(() => Station, (station) => station.id)
  @JoinColumn({ name: 'return_station_id' })
  returnStationId: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Journey start timestamp',
  })
  distance?: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Journey start timestamp',
  })
  duration?: number;
}
