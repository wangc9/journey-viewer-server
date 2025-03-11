import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'station' })
export class Station {
  @PrimaryColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'station_name',
    comment: 'Name of the station',
  })
  stationName: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'station_address',
    comment: 'Address of the station',
  })
  stationAddress: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'coordinate_x',
    comment: 'X coordinate of the station',
  })
  coordinateX: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'coordinate_y',
    comment: 'Y coordinate of the station',
  })
  coordinateY: string;
}
