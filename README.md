# Property Praxis

Mapping tool illustrating the impact of speculation on Detroit

## Development

You'll need Docker Compose installed. Copy each of the `envs/*.env.sample` to separate `.env` files of the same name, adding in values for your environment.

Start the necessary containers for the app with Docker Compose:

```
docker compose up
```

One the containers are running, you'll need to provision the development database from the [property-praxis-data](https://github.com/PropertyPraxis/property-praxis-data) repo or from an existing database backup.

You can access the running client at [http://localhost:5173/](http://localhost:5173/)