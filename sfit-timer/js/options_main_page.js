
var sfitTimerAppOptions = angular.module(
    'sfitTimerAppOptions',
    []
);

sfitTimerAppOptions.controller('mainController', ['$scope', '$http', '$timeout', function($scope, $http, $timeout, data){
	$scope.options = {};
	$scope.options.active_page = 'options';
	$scope.options.dataSource = 'project.issue';
    storage.getItem("dataSource", function(source) {
        if(source){
            $scope.options.dataSource = source;
        }
    });
    $timeout( function(){
        $scope.options.dataSource = $scope.options.dataSource;
    }, 0);

	$scope.goToPage = function(page){
		$scope.options.active_page = page;
	}
	$scope.$watch('options.dataSource', function(value) {
	    storage.setItem("dataSource", value);
	});
}]);