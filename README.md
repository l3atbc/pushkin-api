![Pushkin Logo](http://i.imgur.com/ncRJMJ5.png)

# Overview
API Server is a light express server that defines the routes accessable to the client.

# Core Features

* All routes are listed in `server.js`
* Remote Procedure calls are wrapped in a Promise
* RPC api is a javascript object with a method to be called, and the arguments that you want passed to it.
* All errors are logged using winston


## Routes Table



# Get started
Clone the parent repo with the docker-compose file, insure that DB tables and seeds have been ran.
hit `localhost/api/initialQuestions` to test this api.



# Extension

* Feel free to modify the logging mechanism
* Build and define new express routes.