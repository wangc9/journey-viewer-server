## Description

This is the server section of a full-stack project visualising bicycle usage around the Helsinki Metropolitan Area. The data used for this project is owned by **City Bike Finland**. The [dataset](https://opendata.arcgis.com/datasets/726277c507ef4914b0aec3cbcfcbfafc_0.csv) for the city bike stations is provided by [HSL](https://www.hsl.fi/en/hsl) under [this license](https://www.avoindata.fi/data/en/dataset/hsl-n-kaupunkipyoraasemat/resource/a23eef3a-cc40-4608-8aa2-c730d17e8902)

## Project setup

This project has been developed and tested under Node.js 22.

For the server setup, use the following command:

```bash
yarn install
```

For database setup, use the following command:

```bash
docker compose up --build --renew-anon-volumes -d
```

## Compile and run the project

```bash
# development
$ yarn run start

# production mode
$ yarn run start:prod
```

Once the server is spinning successfully, you can access the REST API through [http://localhost:3000](http://localhost:3000)

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Stay in touch

- Author - [Chen Wang](https://www.linkedin.com/in/msc-chen-wang/)

## License

This project uses Nest, which is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
