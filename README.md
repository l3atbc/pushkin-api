# Pushkin-API

![](http://i.imgur.com/ncRJMJ5.png)

# Overview

API Server is a light express server that defines the routes accessable to the client.

# Core Features
- All routes are listed in `server.js` 
- Remote Procedure calls are wrapped in a Promise
- RPC api is a javascript object with a method to be called, and the arguments that you want passed to it.
- All errors are logged using winston
## Routes Table


| URL                     | Method | Body                                                | Description                                                                                                                                                                        |
| ----------------------- | ------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/response`         | POST   | { choiceId, userId, questionId }                    | Saves a user’s response in the DB, returns the next question                                                                                                                       |
| `/api/users/:id`        | PUT    | {}                                                  | Updates a user with any information sent                                                                                                                                           |
| `/api/trials`           | GET    | n/a                                                 | Returns an array of all the Trials available                                                                                                                                       |
| `/api/initialQuestions` | GET    | n/a                                                 | Calls the `initialQuestions` method in pushkin worker, returns the response                                                                                                        |
| `/api/languages`        | GET    | n/a                                                 | returns an Array of all the Languages on the server                                                                                                                                |
| `/api/users/:userId`    | GET    | n/a                                                 | Gets all the results for that specific user                                                                                                                                        |
| `/api/users`            | GET    | n/a                                                 | An array of all users in system                                                                                                                                                    |
| `/api/comments`         | POST   | `{ userId, primaryLanguages[], nativeLanguages[] }` | Updates the user, sets their primary and nativeLanguages                                                                                                                           |
| `/api/admincsv`         | GET    |                                                     | Requires basic HTTP Auth based on usernames and passwords stored in admin.txt, Returns a CSV dump of response data. Customize `Worker#getResponseCsv`  to change the data returned |
| `/api/results/:userId`  | GET    |                                                     | Returns the top languages for a specific user, returns the results of `Worker#getResults` .                                                                                        |



# Get started

Clone the parent repo with the docker-compose file, insure that DB tables and seeds have been ran.

- to run the seeds, use `docker ps` get the process id for `pushkin_db` and execute `docker exec -it PROCESS_ID node seeder.js` 
- remember you can shell into a docker container at any time

Make a request to `localhost/api/initialQuestions` to test this api.

# Extension
- Feel free to modify the logging mechanism
- Build and define new express routes.

