/**********************************************************************************************************************
 * File size related
 **********************************************************************************************************************/


// Convert all units to byte.
// TODO arg empty exception
function toByte(arg) {

  var sizeScale = d3.scale.ordinal()
    .domain(["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB"])
    .range([1, Math.pow(2, 10), Math.pow(2, 20), Math.pow(2, 30), Math.pow(2, 40), Math.pow(2, 50), Math.pow(2, 60), Math.pow(2, 70)]);
  var bytes = 0;
  //console.log("toByte:arg = ", arg);
  if(arg) {
    var token = arg.split(" ");
    //console.log("toByte:token = ", token);
    bytes = token[0] * sizeScale(token[1]);
  }

  return bytes;
}


// Reconvert back to units
function bytesToSize(bytes) {
  if (bytes == 0) {
    return '0 B';
  }
  var k = 1000;
  var sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(0) + ' ' + sizes[i];
}

// checks if arg1 is g.t.e. to arg2
function isGreaterSize(arg1, arg2) {
  return toByte(arg1) >= toByte(arg2);
}


/**********************************************************************************************************************
 * File date related
 **********************************************************************************************************************/

function compareDate(arg1, arg2, comparator) {
  var token1 = arg1.split("-");
  var token2 = arg2.split("-");

  if (token1[0] != token2[0]) {
    return comparator(token1[0], token2[0]) ? arg1 : arg2;
  } else if (token1[1] != token2[1]) {
    return comparator(token1[1], token2[1]) ? arg1 : arg2;
  } else if (token1[2] != token2[2]) {
    return comparator(token1[2], token2[2]) ? arg1 : arg2;
  } else {
    // If both the dates are same.
    return arg1;
  }
}

// checks if arg1 is g.t.e. to arg2
function isGreaterDate(arg1, arg2) {
    var token1 = arg1.split("-");
    var token2 = arg2.split("-");

    if (token1[0] != token2[0]) {
      return token1[0] > token2[0];
    } else if (token1[1] != token2[1]) {
      return token1[1] > token2[1];
    } else if (token1[2] != token2[2]) {
      return token1[2] > token2[2];
    } else {
      // If both the dates are same.
      return true;
    }
  }
