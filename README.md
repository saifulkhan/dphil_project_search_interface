
# About 
This is a research prototype of (a) an Enterprise Search Engine (C++) and (b) a Search Interface (Qt and Angular, d3). 

This repository contains the  Search Interface (front-end code).
Entire version of the prototype (part of my DPhil) is not open sourced. This code contains minimal comments and test cases.
The [Enterprise Search Engine](https://github.com/saifulkhan/Enterprise-Search-Engine) can be found in an another repository. 

Search interface support two mazor functionalities (a) search result and search space visualization for rapid interpretation of search results and (b) search collaboration. 

 
# Prerequisites : Web-tools

Nodejs version:
MongoDB version:

# Dependencies : Search Engine Backend


# Install and Development

To install this project in your local machine and begin developping, you need to follow these steps:
- `sudo apt-get install nodejs`
- `sudo npm install -g grunt-cli bower forever`
- clone https://github.com/saifulkhan/Search-Interface.git
-`cd search-interface`
- `sudo npm install`
- `bower install`
- Run this project in development mode: `grunt serve`


## Testing

Running `grunt test` will run the client and server unit tests with karma and mocha.
Use `grunt test:server` to only run server tests.
Use `grunt test:client` to only run client tests.

**Protractor tests**

 
