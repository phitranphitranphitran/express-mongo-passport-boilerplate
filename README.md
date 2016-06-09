## express-mongo-passport-boilerplate

Based on https://github.com/sahat/hackathon-starter

Features:
- Express server
- MongoDB + Mongoose for database
- Passport authentication with Facebook, Twitter, Google+, Github strategies
- User options to change email, name, password with validation
- Gravatar profile pictures
- Gulp + Sass
- eslint configured
- Test suite using Mocha, Chai, Supertest

### Notes

Node-inspector debugging address: http://localhost:8080/?port=5858

`npm run test --watch` initially produces a MongoError E1100 (duplicate key).
Not quite sure why, but the tests work normally after saving a .js file.
