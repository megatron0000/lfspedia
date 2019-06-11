const minimatch = require('minimatch')
const lfsModule = angular.module('LFSDatabaseModule', [])

lfsModule.controller('DatabaseFilterController', ($scope, $http) => {
  $scope.packages = []
  $scope.resourceNames = ['programs', 'headers', 'libraries', 'modules', 'directories', 'scripts']
  $scope.identity = x => x

  $scope.namefilterFunction = package =>
    (!$scope.namefilter || package.name.match(new RegExp($scope.namefilter, 'i'))) &&
    (!$scope.resourcefilter || $scope.resourceNames.some(resourceName =>
      package[resourceName].some(resource => resource.match(new RegExp($scope.resourcefilter, 'i')) ||
        minimatch(resource, $scope.resourcefilter))
    ))


  $scope.resourceFilterFunction = resource => resource.match(new RegExp($scope.resourcefilter, 'i')) ||
    minimatch(resource, $scope.resourcefilter)

  $http.get('/database').then(result => result.data).then(databaseObj => {
    $scope.packages = databaseObj
  })
})