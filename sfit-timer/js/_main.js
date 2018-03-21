var sfitTimerApp = angular.module(
    'sfitTimerApp',
    [
        'odoo',
        'ui.bootstrap',
    ]
);

sfitTimerApp.controller('mainController', [
	'$scope', '$http', '$window', '$timeout', '$rootScope', '$location', 'jsonRpc',
	function($scope, $http, $window, $timeout, $rootScope, $location, jsonRpc, data){

    /* MAIN CODE */
    $scope.data = {};
    $scope.showloader = true;
    $scope.data.today = new Date();

    $scope.data.host = 'http://your-odoo-url.com';
    $scope.data.database = 'db-name';
    jsonRpc.odoo_server = $scope.data.host;
    $scope.database = $scope.data.database;

    // Check if user is loged in and set user:
    jsonRpc.getSessionInfo().then(function (result) {
        if (result.uid){
            $scope.set_current_user(result.uid);
            $scope.database = result.db;
        }
    });


    //Start timer
    $scope.startTimer = function(){
        storage.setItem("start_time", "mmmmmm");
    }
    // storage.setItem("current_date", "mmmmmm");
    // // // reload current page
    // storage.getItem("current_date", function(current_date) {
    //     if (current_date) {
    //         console.log(current_date);
    //     } else {
    //         console.log('not there');
    //     }
    // });

    //LOGIN
    $scope.login = function() {
        //Check if username and password exists
        if (!$scope.data.username || !$scope.data.password){
             $scope.loginError = 'Username or Password is missing';
        }else {
            jsonRpc
            .login($scope.database, $scope.data.username, $scope.data.password)
            .then(function (response) {
                console.log('res', response);
                $scope.set_current_user(response.uid);
            },function(response){
                $scope.loginError = response.message;
            });
        }
    }

    $scope.logout = function(){
        jsonRpc.logout();
        if (!$scope.as_app){
            $window.location.href = '/web/session/logout?redirect=/web/login';
        }
        //unset user
        $scope.data.user = null;
    }

    $scope.set_current_user = function(id){
        $scope.data.user = false;
        $scope.model = 'res.users';
        $scope.domain = [['id', '=', id]];
        $scope.fields = ['display_name'];
        jsonRpc.searchRead($scope.model, $scope.domain, $scope.fields)
        .then(function(response) {
            $scope.data.user = response.records[0];

            //set default employee id
            if (!$scope.data.selected_employee) {
                $scope.model = 'hr.employee';
                $scope.domain = [['user_id', '=', id]];
                $scope.fields = ['name', 'able_workcenter_ids'];
                jsonRpc.searchRead($scope.model, $scope.domain, $scope.fields)
                .then(function(response) {
                    console.log('set emp', response.records[0])
                    $scope.data.selected_employee = response.records[0];
                }, odoo_failure_function);
            }

            console.log('current user', $scope.data.user);
            $.when(
                // load stuff
                $scope.load_employee_issues()
            ).done(function() {
                console.log('done');
                // $scope.hide_loader();
            });
        },
        odoo_failure_function
        );
    }

    // search able employees
    function search_employee_issues() {
        var model = 'project.issue';
        var domain = [
            ['user_id', '=', $scope.data.user.id],
            ['stage_id.name', 'not in', ['done', 'cancelled']]
        ];
        var fields = [
            'name',
            'user_id',
            'project_id',
            'stage_id'
        ];

        return jsonRpc.searchRead(
            model,
            domain,
            fields
        );
    }

    function process_employee_issues(response, deferred) {
        $scope.data.employee_issues = [];
        angular.forEach(response.records, function (issue) {
            $scope.data.employee_issues.push(issue);
        });
        console.log('emp issues', $scope.data.employee_issues);
        deferred.resolve();
    }

    //LOAD EMPLOYEE ISSUES
    $scope.load_employee_issues = function () {
        var deferred = new $.Deferred();
        search_employee_issues().then(
            // success
            function(response) {
                process_employee_issues(response, deferred);
            },
            odoo_failure_function
        );
        return deferred;
    }

    // generic failure function
    var odoo_failure_function = function(response) {
        $scope.odoo_error = {
            'title': response.fullTrace.message,
            'type': response.fullTrace.data.exception_type,
            'message': response.fullTrace.data.message
        }
        $scope.error = $scope.odoo_error.message;
        // $scope.errorModal();
    }

}]);
