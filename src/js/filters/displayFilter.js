var angular = require('angular');

angular.module('vendingMachine').filter('displayFilter', display);

function display() {
  return function(msg) {
    return msg = typeof(msg) === 'number' ? formatMoney(msg) : msg;
  };
}

// quick money number format -- doesn't handle thousands, but neither should our vending machine.
function formatMoney(num) {
  num = '' + num;
  switch (num.length) {
    case 1:
      return '$0.0' + num;
    case 2:
      return '$0.' + num;
    default:
      return '$' + num.substr(0, num.length -2) + '.' + num.substr(-2);
  }
}