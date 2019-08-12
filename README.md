# Geocode

API for finding Dutch addresses and converting between address and lat/lon info. Also fast endpoints for
suggesting Dutch cities, streets and corresponding house numbers.


## Development

- Node >= 12.7.0
- Docker & Docker-Compose

```bash
$ yarn
$ yarn run:api
```

**Commands**:
- `$ yarn build`: Create a minified bundle for all entrypoints
- `$ yarn build:api`: Build and bundle the api
- `$ yarn run:api`: Run the api in development mode
- `$ yarn lint`: Run Eslint and Prettier
- `$ yarn lint:fix`: Fix Eslint and Prettier problems
- `$ yarn test`: Run tests
- `$ docker-compose up -d`: Start an Postgres instance
- `$ docker-compose down`: Stop the Postgres instance
