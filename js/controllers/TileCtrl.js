/* global UverseNg, angular */

angular
  .module('uverse.tile', [])

  // Define a tile controller and inject its dependencies
  .controller('TileCtrl', [
      '$scope'
    , '$timeout'
    , 'Entitlement'
    , 'TileResource'

    , function($scope, $timeout, Entitlement, TileResource) {
      $scope.maxSize = 4;
      $scope.perPage = 4;
      $scope.numPages = 0;
      $scope.currentPage = 1;
      $scope.filters = [
          { 'value': '', 'text': 'None'}
        , { 'value': 'TV-MA', 'text': 'TV-MA' }
        , { 'value': 'TV-14', 'text': 'TV-14' }
        , { 'value': 'clip', 'text': 'Clips Only' }
        , { 'value': 'trailer', 'text': 'Trailers Only' }
      ];

      $scope.tileFilter = $scope.filters[0].value;

      $scope.startFrom = function() {
        return ($scope.currentPage - 1) * $scope.perPage;
      };

      // Show control flow (deferred). Mock of a resource service
      var res = TileResource.get(1).then(function(data) {
        $scope.tiles = data;
      });

      res.then(function(){
        watchTiles();
      });

      // Set background image style (easier to position to our specs)
      $scope.tileBg = function() {
        return 'url('+this.tile.imgUrl+')';
      };

      $scope.getDurationInMinutes = function() {
        var start = new Date(this.tile.startTime);
        var end = new Date(this.tile.endTime);

        return start.diff(end, 'minute');
      };

      // Just copies a random tile from the current tiles and sends it to the
      // position specified
      $scope.addRandomTile = function() {
        var position = $scope.tilePosition || 0;

        var rand = getRandom();
        var tile = angular.copy($scope.tiles)[rand];

        tile.justAdded = true;
        // Delete hashKey so we can add duplicates for the sake of example
        delete tile.$$hashKey;

        if (position === -1) {
          $scope.tiles.push(tile);
        } else {
          position = position < -1 ? position + 1 : position;
          $scope.tiles.splice(position, 0, tile);
        }

        $timeout(function(){
          tile.justAdded = false;
          $scope.$apply();
        }, 3000);
      };

      // Shows access to scoped properties in repeater and access to event object
      // for the ngClick this is associated with
      $scope.logIndex = function(e) {
        console.log(e, this.$index);
      };

      // Example of executing parent code from isolate (see paginate directive)
      $scope.pageFromIsolate = function(page) {
        console.log(page);
      };

      // Calculate entitlements
      $scope.isEntitled = function() {
        return Entitlement.isEntitled(this.tile.entitlementLevels);
      };

      function watchTiles() {
        if (!$scope.tiles) return;

        // Watch for changes in number of tiles and update number of pages
        // In other words, this shows a way we can control how often a dynamic
        // property is calculated. (Rather than doing numPages() which would calculate on
        // every $$digest).  This allows to make dirty checking as fast as possible.
        // Obviously this doesn't matter here (for simple math), but it would for other things
        $scope.$watch(function(){
          return $scope.tiles.length;
        }, function(length){
          $scope.numPages = Math.ceil($scope.tiles.length / $scope.perPage);
        });
      }

      function getRandom() {
        return Math.floor(Math.random() * ($scope.tiles.length - 1));
      }
    }
  ])

  // Allow for semantic elements
  .directive('tile', function(){
    return {
      require: ['ngModel']
      , restrict: 'E'
      , replace: true
      , transclude: true
      , templateUrl: 'tile.html'
    };
  });