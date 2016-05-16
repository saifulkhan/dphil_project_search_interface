/**********************************************************************************************************************
 * Logical AND between selected queries.
 * I/P k-queries
 * query: "key":"a1, a2, ..., an", "type":"", "sizefrom" : "arg2"
 *        Empty means contains all in the range.
 *        Both "from" and "to" can be empty, if one e.g., "from" is not-empty then "to" can not be empty.
 *
 * O/P 1-query
 **********************************************************************************************************************/
function intersectQueries(selectedQueries) {

  console.log("intersectQueries: selectedQueries = ", selectedQueries);

  var space = ' ';

  var mergedQuery = jQuery.extend(true, {}, selectedQueries[0]);
  var tempMerge = {"key": "", "type": "", "sizefrom": "", "sizeto": "", "datefrom": "", "dateto": ""};

  console.log("intersectQueries: selectedQueries[0] = )", mergedQuery);

  for (var i = 0; i < selectedQueries.length; ++i) {
    tempMerge["key"] = mergeStrings(mergedQuery["key"], selectedQueries[i]["key"]);
    tempMerge["type"] = mergeStrings(mergedQuery["type"], selectedQueries[i]["type"]);
    tempMerge["sizefrom"] = mergeSize(mergedQuery["sizefrom"], selectedQueries[i]["sizefrom"], 0);
    tempMerge["sizeto"] = mergeSize(mergedQuery["sizeto"], selectedQueries[i]["sizeto"], 1);
    tempMerge["datefrom"] = mergeDate(mergedQuery["datefrom"], selectedQueries[i]["datefrom"], 0);
    tempMerge["dateto"] = mergeDate(mergedQuery["dateto"], selectedQueries[i]["dateto"], 1);

    mergedQuery = jQuery.extend(true, {}, tempMerge);
  }

  console.log("intersectQueries: final mergedQuery = ", mergedQuery);
  return mergedQuery;


  /**********************************************************************************************************************
   * Merge: keywords and types
   * "str1 str2 ... strn"
   **********************************************************************************************************************/
  function mergeStrings(arg1, arg2) {

    console.log("intersectQueries:mergeStrings(arg1, arg2): ", arg1, arg2);
    /*
     * This logic is mainly for type, size, and date.
     * It takes care of the condition, where "" means universe of discourse.
     */
    if (arg1 == "" || arg2 == "") {
      return (arg1 == "") && (arg2 == "") ? "" : (arg1 == "" ? arg2 : arg1);
    }

    var arrayOfString1 = arg1.split(space);
    var arrayOfString2 = arg2.split(space);

    var mergedArray = intersect(arrayOfString1, arrayOfString2, function (o1, o2) {
      if (!o2) {
        return false;
      }
      if (o1.toLowerCase() !== o2.toLowerCase()) {
        return false;
      }
      return true;
    });

    var mergedString = mergedArray.join(space);

    console.log("result = ", mergedString);
    return mergedString;

  }


  /**********************************************************************************************************************
   * Merge two size ranges
   **********************************************************************************************************************/
  function mergeSize(arg1, arg2, max) {

    console.log("intersectQueries:mergeSize(arg1, arg2): ", arg1, arg2);

    if (arg1 == "" || arg2 == "") {
      return (arg1 == "") && (arg2 == "") ? "" : (arg1 == "" ? arg2 : arg1);
    }

    // Convert all units to byte.
    var bytes = 0;
    if (max) {
      bytes = Math.max(toByte(arg1), toByte(arg2));
      console.log("max: bytes=", bytes);
    } else {
      bytes = Math.min(toByte(arg1), toByte(arg2));
      console.log("min: bytes=", bytes);
    }

    console.log("result = ", bytes);
    return bytesToSize(bytes);
  }


  /**********************************************************************************************************************
   * Merge two date ranges
   * Format: YYYY-MM-dd
   **********************************************************************************************************************/
  function mergeDate(arg1, arg2, max) {

    console.log("intersectQueries:mergeDate(arg1, arg2):", arg1, arg2);

    if (arg1 == "" || arg2 == "") {
      return (arg1 == "") && (arg2 == "") ? "" : (arg1 == "" ? arg2 : arg1);
    }

    var mergedDate;
    if (max) {
      mergedDate = compareDate(arg1, arg2, function (a, b) {
        return a > b ? true : false;
      });
    } else {
      mergedDate = compareDate(arg1, arg2, function (a, b) {
        return a < b ? true : false;
      });
    }
    console.log("result = ", mergedDate);
    return mergedDate;

  }

}

