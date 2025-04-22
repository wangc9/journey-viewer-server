import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTable1745340603057 implements MigrationInterface {
  name = 'AddUserTable1745340603057';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" text NOT NULL, "password" text NOT NULL, "registration_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "last_login_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")); COMMENT ON COLUMN "user"."email" IS 'User email'; COMMENT ON COLUMN "user"."password" IS 'User password'; COMMENT ON COLUMN "user"."registration_date" IS 'Registration date'; COMMENT ON COLUMN "user"."last_login_date" IS 'Most recent login date'`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_saved_stations" ("userId" integer NOT NULL, "stationId" integer NOT NULL, CONSTRAINT "PK_e4458fd7b1a34e52c3a60a65a12" PRIMARY KEY ("userId", "stationId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8c68a5fc5ee2c0db083882a128" ON "user_saved_stations" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b511aba94923f17b52059cf1db" ON "user_saved_stations" ("stationId") `,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "station"."station_name" IS 'Name of the station'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "station"."station_address" IS 'Address of the station'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "station"."coordinate_x" IS 'X coordinate of the station'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "station"."coordinate_y" IS 'Y coordinate of the station'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "journey"."departure_date_time" IS 'Journey start timestamp'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "journey"."return_date_time" IS 'Journey end timestamp'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "journey"."distance" IS 'Journey start timestamp'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "journey"."duration" IS 'Journey start timestamp'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_saved_stations" ADD CONSTRAINT "FK_8c68a5fc5ee2c0db083882a1283" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_saved_stations" ADD CONSTRAINT "FK_b511aba94923f17b52059cf1db0" FOREIGN KEY ("stationId") REFERENCES "station"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_saved_stations" DROP CONSTRAINT "FK_b511aba94923f17b52059cf1db0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_saved_stations" DROP CONSTRAINT "FK_8c68a5fc5ee2c0db083882a1283"`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "journey"."duration" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "journey"."distance" IS NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "journey"."return_date_time" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "journey"."departure_date_time" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "station"."coordinate_y" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "station"."coordinate_x" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "station"."station_address" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "station"."station_name" IS NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b511aba94923f17b52059cf1db"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c68a5fc5ee2c0db083882a128"`,
    );
    await queryRunner.query(`DROP TABLE "user_saved_stations"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
