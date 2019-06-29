
sfitTimerApp.directive('hmRead', function () {
    return {
        restrict:'AE',
        scope:{
            hmtext : '@',
            hmlimit : '@',
            hmrecord : '@',
            hmsource: '@',
            hmhost : '@',
            hmfulltext:'@',
            hmMoreText:'@',
            hmLessText:'@',
            hmMoreClass:'@',
            hmLessClass:'@',
        },
        templateUrl: '/js/readmore-template.html',
        controller : function ($scope) {
            $scope.toggleValue=function () {

                if ($scope.hmfulltext == true) {
                    $scope.hmfulltext=false;
                } else if ($scope.hmfulltext == false) {
                    $scope.hmfulltext=true;
                } else {
                    $scope.hmfulltext=true;
                }
            };
        },
    };
});
