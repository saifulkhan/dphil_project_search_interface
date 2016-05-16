'use strict';

var testWithoutQP = false;

var fs = require('fs');
var Search = require('./search.module');

if (!testWithoutQP) {
  var queryProcessorAddon = require("/home/search-engine/install/lib/QueryProcessorAddon");
  var obj = new queryProcessorAddon.QueryProcessorWrapper();
}

/*************************************************************************************************************
 * Request C++ QueryProcessor
 * Send x, y, width, height of the treemap UI space
 * send treemap the coordinates and receive the json data in 'data'
 *************************************************************************************************************/

exports.treemapBuild = function (req, res) {
  console.log("--treemapBuild, req:", req.body);

  if (testWithoutQP) {

    var treemapBuild = fs.readFileSync('test_data/treemapBuild.json', 'utf8');
    res.end(treemapBuild);
    //res.writeHead(200, { 'Content-Type': 'application/json' });
    //res.json(JSON.parse(treemapBuild));

  } else {

    obj.treemapBuild(req.body.x, req.body.y, req.body.w, req.body.h, function (data) {
      console.log("Server returning treemapBuild data.");
      res.end(data);
      //res.json(data);
      //res.writeHead(200, { 'Content-Type': 'application/json' });
      //res.json(JSON.parse(data));
    });
  }
}

/*************************************************************************************************************
 * Request C++ QueryProcessor
 * Request for treemap data for depth 'k'
 *************************************************************************************************************/

exports.treemapData = function (req, res) {
  console.log('--treemapData--');

  /*
   obj.treemapData(req.body.depth, function(data) {
   console.log("Server returning treemapData for a depth.");
   res.json(data);
   });
   */
}


/*************************************************************************************************************
 * Request C++ QueryProcessor
 * Send the search query
 *************************************************************************************************************/

exports.search = function (req, res) {

  var queryString = JSON.stringify(req.body);
  console.log('--search--', queryString);

  if (testWithoutQP) {
    var result = fs.readFileSync('test_data/result.json', 'utf8');
    res.end(result); // return text

  } else {

    obj.search(queryString, function (data) {
      console.log("Server returning search query result.");
      res.end(data);
    });
  }
}


/*************************************************************************************************************
 * Request C++ QueryProcessor
 * Send the relavance feedback / id of the file clicked.
 *************************************************************************************************************/

exports.feedback = function (req, res) {
  console.log("--feedback invoked--");
  obj.feedback("feedbackMsg", function (data) {
    //console.log("Server returning search query result.");
    res.end(data);
  });

}



/*************************************************************************************************************
 * Request C++ QueryProcessor
 * Send End-of-session notification
 *************************************************************************************************************/

exports.savesession = function (req, res) {
  console.log("--session saved--");
  obj.saveSession("saveSessionMsg", function (data) {
    //console.log("Server returning search query result.");
    res.end(data);
  });

}
