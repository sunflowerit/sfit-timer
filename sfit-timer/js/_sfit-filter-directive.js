screenApp.directive('sfitFilter', function() {
   return {
	   scope: true,
       template:
            '<span class="truncateSelector label label-warning" ng-click="clearData()" ng-show="data">'+
                '<span>{[{data}]}</span>'+
              	'<a href="#" class="" data-dismiss="alert" aria-label="close">'+
              		'<span>&times;</span>'+
              	'</a>'+
            '</span>'
       ,
       // transclude: true,
       restrict: 'E',
       scope: {
         data: '=',
         clearData: '&',
       },
   }
});