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

Remember to make new API keys for every project!

Node-inspector debugging address: http://localhost:8080/?port=5858

`npm run test:watch` seems to initially throw an error, but after saving any .js file, the tests seem to work normally. Not quite sure why; to be figure out.

To send flash messages:

`req.flash("success", { msg: "Something was successful!" })`
`req.flash("error", { msg: "Something went wrong!" })`

Places to change project name from "express-mongo-passport-boilerplate":  
- README.md  
- views: home, layout, footer, header
