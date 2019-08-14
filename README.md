# Geocode

API for autocompleting addresses, converting zipcodes and house numbers to addresses and finding addresses
close to lat/lon coordinates.

## Development

- Node >= 12.7.0
- Docker & Docker-Compose

```bash
$ yarn
$ docker-compose up -d
$ yarn run:seeder
$ yarn run:api
```

**Commands**:

- `$ yarn build`: Create a minified bundle for all entrypoints
- `$ yarn build:api`: Build and bundle the api
- `$ yarn run:api`: Run the api
- `$ yarn build:seeder`: Build and bundle the seeder
- `$ yarn run:seeder`: Run the seeder
- `$ yarn lint`: Run Eslint and Prettier
- `$ yarn lint:fix`: Fix Eslint and Prettier problems
- `$ yarn test`: Run tests
- `$ yarn test:e2e`: Run tests and end-2-end tests. Needs database to run
- `$ docker-compose up -d`: Start an Postgres instance
- `$ docker-compose down`: Stop the Postgres instance

## Seeder

The seeder uses the BAG data from [nlextract](https://nlextract.nl/), specifically
[bag/csv](https://data.nlextract.nl/bag/csv/). BAG stands for Basic registration of Addresses and Buildings.
It contains all addresses with latitude and longitude information in the Netherlands.

The seeder will start with removing any existing tables in the database and creating a basic table called
`bag_info`. Then after downloading and extracting the file, all unnecessary columns are removed and it is
imported. Then some indices and a materialized view is added. And finally all files are cleaned up.

## API

The API contains the necessary routes for suggesting and converting addresses.

Common responses (all response bodies are a JSON object):

- 500: Something is wrong on the server
- 400: Something is wrong with the parameter values, please check the message in the response body.

#### Suggest

All suggest routes only accept query parameters, and are available with both GET and POST requests

**/suggest/city?city=[CityPrefix]**:

- Parameters:

  - city: A city name prefix

- Responses:
  - 200: `{ cities: ["Utrecht"] }` -> A list of possible cities, can be 0-length

**/suggest/street?city=[City]&street=[StreetPrefix]**:

- Parameters:

  - city: A valid city name
  - street: A street name prefix

- Responses:
  - 200: `{ streets: ["Domplein"] }` -> A list of possible streets in the provided city, can be 0-length

**/suggest/number?city=[City]&street=[Street]**:

- Parameters:

  - city: A valid city name
  - street: A valid street name

- Responses:
  - 200: `{ numbers: [1,2]}` -> A list of possible numbers in the city and street, can be 0-length

#### Convert

All convert routes are only accepting POST requests with a JSON body

**/convert/address**:

- Parameters:

  - zip: `string` -> A valid Dutch zipcode with uppercase letters and without spaces.
  - number: `string|number` -> A number or string representation of a number
  - addition?: `string` -> Optional addition, default empty string

- Responses:

  - 200:

    ```json
    {
      "city": "Utrecht",
      "street": "Stationsplein",
      "streetnumber": 32,
      "addition": "",
      "zip": "3511ED",
      "lat": "52.0916239700314",
      "lon": "5.1097562832579"
    }
    ```

    -> All info, for the searched object, if no item is found this will return 400

**/convert/address/batch**:

- Parameters:

  - batch: Array of objects with keys zip, number, addition. See /convert/address for more info on them.

- Responses:

  - 200:

  ```json
  {
    "batch": [
      {
        "city": "Utrecht",
        "street": "Stationsplein",
        "streetnumber": 32,
        "addition": "",
        "zip": "3511ED",
        "lat": "52.0916239700314",
        "lon": "5.1097562832579"
      },
      {
        "...": "..."
      }
    ]
  }
  ```

  -> Note that this will only return the found items.

**/convert/closest**:

This route is pretty slow right now. Some ways to improve this are:

- Optimizing the query as defined in `src/services/bag.ts#bagConvertClosest`
- Use Postgis Postgres extension.

This route is still a Proof of Concept and may not exist in the future.

- Parameters:

  - lat: `string|number` -> If a string it should be representing a valid number
  - lon: `string|number` -> If a string it should be representing a valid number
  - distance: `number|string` -> Search distance in kilometers. Default: 2, max: 15
  - skip: `number|string` -> Skip results. Default: 0
  - take: `number|string` -> Take a number of results. Default: 10, max: 100

- Responses:

  - 200:

  ```json
  {
    "list": [
      {
        "city": "Utrecht",
        "street": "Stationsplein",
        "streetnumber": 32,
        "addition": "",
        "zip": "3511ED",
        "lat": "52.0916239700314",
        "lon": "5.1097562832579",
        "distance": 0.01
      },
      {
        "...": "..."
      }
    ]
  }
  ```

## Deploying

Deploying should be pretty straight forward:

- Build the Docker image
- Prepare database
- Update .env file
- Run seeder
- Run the Docker container behind a reverse proxy that provides a https certificate.
- Done ;)

## LICENSE

The code in this repository is developed and distributed under the MIT license. See [LICENSE](./LICENSE.md) for details.
