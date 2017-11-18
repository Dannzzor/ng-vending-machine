angular.module(MODULE_NAME)
.controller(CONTROLLER_NAME, function VendingMachineCtrl($scope, $filter) {
  'use strict';

  $scope.inventory = {
    cola: ['cola', 'cherry cola', 'diet cola', 'flat cola', 'root beer', 'liter cola'],
    candy: ['snickers', 'snickers', 'snickers', 'snickers', 'snickers', 'snickers', 'snickers'],
    chips: ['potato chips', 'fiery cheetoes']
  };
  $scope.credit = 0;
  $scope.coinReturn = [];
  $scope.vendSlot = [];
  $scope.insertedCoins = {
    quarters: [],
    nickels: [],
    dimes: []
  };
  $scope.coinInventory = {
    quarters: [
      { size: 24.26, weight: 5.670, value: 0.25, name: 'quarter'},
      { size: 24.26, weight: 5.670, value: 0.25, name: 'quarter'},
      { size: 24.26, weight: 5.670, value: 0.25, name: 'quarter'}
    ],
    nickels: [
      { size: 21.21, weight: 5.000, value: 0.05, name: 'nickel' },
      { size: 21.21, weight: 5.000, value: 0.05, name: 'nickel' }
    ],
    dimes: [
      { size: 17.91, weight: 2.268, value: 0.10, name: 'dime' },
      { size: 17.91, weight: 2.268, value: 0.10, name: 'dime' }
    ]

  };
  $scope.display = 'INSERT COIN';

  // replicating vending machine coin determination:
  // 1. filters coins by size, smallest to largest
  // 2. after being filtered by size, they are then
  //    weighed to make sure they are real, which I
  //    assume would allow for a margin for error.

  // coin sizes (mm) and weight (g)
  $scope.coinData = {
    quarter: { size: 24.26, weight: 5.670, value: 25 },
    dime: { size: 17.91, weight: 2.268, value: 10 },
    nickel: { size: 21.21, weight: 5.000, value: 5 }
  };

  $scope.inventoryData = {
    cola: { cost: 100 },
    candy: { cost: 65 },
    chips: { cost: 50 }
  }

  $scope.addCredits = function(coin) {

    // filter coins by size
    if (coin.size < 18) {
      // this should only allow dimes
      $scope.checkCoin(coin, 'dime');
    } else if (coin.size < 22) {
      // this should only allow nickels
      $scope.checkCoin(coin, 'nickel');
    } else {
      // anything larger should only be quarters
      $scope.checkCoin(coin, 'quarter');
    }
  };

  $scope.checkCoin = function(coin, expectedCoinName) {
    var expectedCoin = $scope.coinData[expectedCoinName];
    if ($scope.checkCoinWeight(coin.weight, expectedCoin.weight)) {
      $scope.insertedCoins[expectedCoinName + 's'].push(coin);
      $scope.credit += expectedCoin.value;
    } else {
      $scope.coinReturn.push(coin);
    }
    $scope.checkDisplay();
  };

  $scope.checkCoinWeight = function(coinWeight, expectedWeight) {
    // 2% margin of error seems decent
    var marginOfError = 0.02;

    // calculate outter bounds for acceptable coin weight based on margin of error
    var minWeight = expectedWeight - (expectedWeight * marginOfError);
    var maxWeight = expectedWeight + (expectedWeight * marginOfError);

    return !!(coinWeight > minWeight && coinWeight < maxWeight);
  };

  $scope.selectItem = function(itemType) {
    // 1. check credits
    //   a. if sufficient credits :GOTO 2
    //   b. if insufficient credits display cost, and request additional credits.

    // 2. check inventory
    //   a. if insufficient inventory, tell user to make another selection
    //   b. if sufficient inventory, vend item, then return any remaining credit, and display 'thank you'

    var itemCost = $scope.inventoryData[itemType].cost;
    var itemInventory = $scope.inventory[itemType];

    if ($scope.credit >= itemCost) {
      if (itemInventory.length > 0) {
        $scope.vendSlot.push(itemInventory.pop());
        $scope.checkDisplay('THANK YOU');
        $scope.credit -= itemCost;
        $scope.moveInsertedCoinsToInventory();
        if ($scope.credit > 0) {
          $scope.payout();
        }
      } else {
        // tell user to pick something else
        $scope.checkDisplay('SOLD OUT');
      }
    } else {
      // tell user to add more money / or just the price
      if($scope.credit > 0) {
        $scope.checkDisplay('PRICE ' + itemCost - $scope.credit);
      } else {
        $scope.checkDisplay();
      }
    }

  };

  $scope.checkDisplay = function(msg) {
    $scope.display = msg ||
                     ($scope.credit > 0 ?
                      $scope.credit :
                      ($scope.haveChange() ? 'INSERT COIN' : 'EXACT CHANGE ONLY'));
  };

  $scope.refund = function() {
    $scope.coinReturn = $scope.coinReturn.concat(
      $scope.insertedCoins.quarters,
      $scope.insertedCoins.nickels,
      $scope.insertedCoins.dimes
    );
    $scope.insertedCoins.quarters = [];
    $scope.insertedCoins.nickels = [];
    $scope.insertedCoins.dimes = [];

    $scope.checkDisplay();
  };

  $scope.payout = function() {
    if ($scope.credit >= $scope.coinData.quarter.value && $scope.coinInventory.quarters.length > 0) {
      $scope.coinReturn.push($scope.coinInventory.quarters.pop());
      $scope.credit -= $scope.coinData.quarter.value;
    } else if ($scope.credit >= $scope.coinData.dime.value && $scope.coinInventory.dimes.length > 0) {
      $scope.coinReturn.push($scope.coinInventory.dimes.pop());
      $scope.credit -= $scope.coinData.dime.value;
    } else if ($scope.credit >= $scope.coinData.nickel.value && $scope.coinInventory.nickels.length > 0) {
      $scope.coinReturn.push($scope.coinInventory.nickels.pop());
      $scope.credit -= $scope.coinData.nickel.value;
    }

    if($scope.credit > 0 && $scope.haveSufficientCoinage($scope.credit)) {
      $scope.payout();
    }
  };

  $scope.haveSufficientCoinage = function(amnt) {
    // check to see if we have enough coin inventory to make change
    var total = ($scope.coinInventory.quarters.length * $scope.coinData.quarter.value) +
                ($scope.coinInventory.dimes.length * $scope.coinData.dime.value) +
                ($scope.coinInventory.nickels.length * $scope.coinData.nickel.value);

    return !!(total >= amnt);
  };

  $scope.haveChange = function() {
    // to make change for any of the items, we should only need minimum one nickel and 1 dime, or two nickels
    return !!(($scope.coinInventory.dimes.length >= 1 &&
               $scope.coinInventory.nickels.length >= 1) ||
               $scope.coinInventory.nickels.length >= 2);
  };

  $scope.moveInsertedCoinsToInventory = function() {
    $scope.coinInventory.quarters = $scope.coinInventory.quarters.concat($scope.insertedCoins.quarters);
    $scope.coinInventory.dimes = $scope.coinInventory.dimes.concat($scope.insertedCoins.dimes);
    $scope.coinInventory.nickels = $scope.coinInventory.nickels.concat($scope.insertedCoins.nickels);
    $scope.insertedCoins.quarters = [];
    $scope.insertedCoins.dimes = [];
    $scope.insertedCoins.nickels = [];
  };

  $scope.takeChange = function() {
    $scope.coinReturn = [];
  };

  $scope.takeItem = function() {
    $scope.vendSlot = [];
  };

  $scope.checkDisplay();

});
