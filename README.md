# Search-Interface

The search (user) interface and visualization of search-related information

  AngularJS powered HTML5 Web application. It uses the MEAN stack (MongoDB will be used in future, Express as the web framework, 
  AngularJS as the frontend framework, and Node.js as the server platform)

### Prerequisites

Nodejs version:
MongoDB version:

### Install and Development

To install this project in your local machine and begin developping, you need to follow these steps:
- `sudo apt-get install nodejs`
- `sudo npm install -g grunt-cli bower forever`
- clone https://github.com/saifulkhan/Search-Interface.git
-`cd search-interface`
- `sudo npm install`
- `bower install`
- Run this project in development mode: `grunt serve`


### Testing

Running `grunt test` will run the client and server unit tests with karma and mocha.
Use `grunt test:server` to only run server tests.
Use `grunt test:client` to only run client tests.

**Protractor tests**
