# BusTicker-NodeServer

A Node.js server which provides a simpler interface to the MCTS realtime bus API.

## API Endpoints
### GET /routes
#### Possible Responses
- `[{"route":"21","direction":"EAST"},{"route":"21","direction":"WEST"}]`
- - -
### GET /stop/{route}/{direction}
where `route` is the name of the route and `direction` is the direction in which the line is travelling.
#### Example
`/stop/21/EAST/`
#### Possible Responses

- `[{"stopID":3635,"stopName":"BOOTH + MEINECKE","lat":43.061874090673,"lon":-87.904081093253},{"stopID":3634,"stopName":"BOOTH + NORTH AVENUE","lat":43.060466434188,"lon":-87.904090728836}]`
- - -
### GET /stop/{route}/{direction}/{latitude}/{longitude}
where `route` is the name of the route, `direction` is the direction in which the line is travelling, and `latitude` and `longitude` correspond to the user's current location. This will return the stops nearest to the user.
#### Example
`/stop/21/EAST/43.061874090673/-87.904081093253`
#### Possible Responses

-`[{"stopID":3635,"stopName":"BOOTH + MEINECKE","lat":43.061874090673,"lon":-87.904081093253},{"stopID":3634,"stopName":"BOOTH + NORTH AVENUE","lat":43.060466434188,"lon":-87.904090728836}]`
- - -
### GET /predictions/{stopID}
where `stopID` is a 4-digit numeric id.
#### Possible Responses

- `Error: No service scheduled`
- `Error: No arrival times`
- `[{"age":0,"prediction":"2014-04-27T4:22-05:00","delayed":false,"route":"21","direction":"EAST"},{"age":0,"prediction":"2014-04-27T4:42-05:00","delayed":false,"route":"21","direction":"EAST"}]`
- - -
### GET /predictions/nearest/{latitude}/{longitude}
where `latitude` and `longitude` correspond to the user's current location. This will return the predictions for the stop nearest to the user.
#### Example
`/predictions/nearest/43.061874090673/-87.904081093253`
#### Possible Responses
- `[{"age":0,"prediction":"2014-05-11T4:49-05:00","delayed":false,"route":"21","direction":"EAST"},{"age":0,"prediction":"2014-05-11T5:09-05:00","delayed":false,"route":"21","direction":"EAST"}]`

## How To Use
Node.js must be installed on your system. Then,

1. Install the project dependencies by running `npm install` in a terminal from the root of the project.
2. Run the server by executing `node app.js`.