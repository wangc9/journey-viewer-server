import { Station } from '../stations/stations.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
    unique: true,
    comment: 'User email',
  })
  email: string;

  @Column({
    type: 'text',
    comment: 'User password',
  })
  password: string;

  @ManyToMany(() => Station)
  @JoinTable({ name: 'user_saved_stations' })
  savedStations: Station[];

  @Column({
    type: 'timestamp with time zone',
    name: 'registration_date',
    comment: 'Registration date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  registrationDate: Date;

  @Column({
    type: 'timestamp with time zone',
    name: 'last_login_date',
    comment: 'Most recent login date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastLoginDate: Date;
}
