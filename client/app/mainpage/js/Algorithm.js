/*
 * Compare two arrays
 *
 * Attach the .equals method to Array's prototype to call it on any array
 * [1, 2, [3, 4]].equals([1, 2, [3, 2]]) === false;
 * [1, "2,3"].equals([1, 2, 3]) === false;
 * [1, 2, [3, 4]].equals([1, 2, [3, 4]]) === true;
 * [1, 2, 1, 2].equals([1, 2, 1, 2]) === true;
 */

Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array)
    return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length)
    return false;

  for (var i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i]))
        return false;
    }
    else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}


function intersect(a1, a2, predEquals) {

  var output = [];
  for (var m = 0; m < a1.length; ++m) {
    for (var n = 0; n < a2.length; ++n) {
      if (predEquals(a1[m], a2[n])) {
        output.push(a1[m]);
        break;
      }
    }
  }
  return output;
}

/*
 * order of the argument is important (a1 - a2)
 */

function diff(a1, a2, predEquals) {
  var output = [];

  for (var m = 0; m < a1.length; ++m) {
    var diff = true;
    for (var n = 0; n < a2.length; ++n) {
      if (predEquals(a1[m], a2[n])) {
        diff = false;
        break;
      }
    }
    if (diff) {
      output.push(a1[m]);
    }
  }
  return output;
}
