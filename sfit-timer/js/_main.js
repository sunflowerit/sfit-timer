
var sfitTimerApp = angular.module(
    'sfitTimerApp',
    [
        'odoo',
        'ngCookies',
        'timer',
        'ui.bootstrap',
        'ngSanitize',
    ]
);

sfitTimerApp.controller('mainController', [
	'$scope', '$cookies', '$http', '$window', '$timeout', '$rootScope', '$location', 'jsonRpc',
	function($scope, $cookies, $http, $window, $timeout, $rootScope, $location, jsonRpc, data){

    $scope.limitRange = [
        {val:'5', opt: '5'},
        {val:'10', opt: '10'},
        {val:'15', opt: '15'},
        {val:'', opt: 'All'}
    ];
    $scope.$watch('allIssues', function() {
        if($scope.allIssues){
            $scope.data.user_id = '';
        }else{
            $scope.data.user_id = $scope.data.user.id;
        }
    });

    $scope.timerRunning = true;
    $scope.startTimer = function (issue){
        $scope.$broadcast('timer-resume');
        $scope.timerRunning = true;
    };
    $scope.stopTimer = function (){
        $scope.$broadcast('timer-stop');
        $scope.timerRunning = false;
    };
    $scope.$on('timer-stopped', function (event, data){
        console.log('Timer Stopped - data = ', data);
    });

    // // // reload current page
    storage.getItem("start_date_time", function(active_timer) {
        if (active_timer) {
            $scope.current_date =  JSON.parse(active_timer);
            $scope.startTimeCount = JSON.parse(active_timer).start_time;
        } else {
            console.log('not there');
        }

    });

    /* MAIN CODE */
    $scope.data = {};
    $scope.showloader = true;
    $scope.data.today = new Date();

    storage.getItem("host_info", function(host_info) {
        if (host_info){
            var host_info = JSON.parse(host_info);
            $scope.data.host = host_info.host;
            $scope.data.database = host_info.database;
            jsonRpc.odoo_server = $scope.data.host;
            
            // Check if user is loged in and set user:
            jsonRpc.getSessionInfo().then(function (result) {
                if (result.uid){
                    $scope.set_current_user(result.uid);
                    $scope.database = result.db;
                }
            });
        }
        
    });

    //Start timer
    $scope.startTimer1 = function(issue){
        var now = moment();
        issue.currentRunning = 1;
        //change icon to active
        chrome.runtime.sendMessage({TimerActive: true});

        //start timer
        $scope.startTimeCount = now;
        $scope.active_timer = now;
        $scope.startTimer();

        // show start/stop buttons on other issues
        var timer_info = {
            'start_time': now,
            'issue_id': issue.id

        }
        $scope.current_date = timer_info;
        storage.setItem('start_date_time', JSON.stringify(timer_info));
        storage.setItem("active_timer_id", issue.id);
    }

    $scope.stopActiveTimer1 = function(){
        storage.getItem("start_date_time", function(time) {
            var startTimeInfo = JSON.parse(time);
            $scope.stopTimer1(startTimeInfo.issue_id);
        });
    }
    //Stop timer
    $scope.stopTimer1 = function(id){
        //change icon to inactive
        chrome.runtime.sendMessage({TimerActive: false});

        //stop timer
        $scope.stopTimer();

        // show start/stop buttons on other issues
        $scope.current_date = false;

        var now = moment();
        var timer_info = {
            'stop_time': now,
            'issue_id': id
        }
        storage.setItem('stop_date_time', JSON.stringify(timer_info));
        storage.getItem("start_date_time", function(time) {
            var startTimeInfo = JSON.parse(time);
            if (startTimeInfo) {

                //get time difference in minutes
                var durationMins = moment.duration(now.diff(startTimeInfo.start_time)).asMinutes();
                var mins = (Math.round((durationMins % 60)/15) * 15);
                var durationInHours = Math.floor(durationMins/60) + mins/60;
                //get current issue
                function getIssue(issue) {
                    return issue.id == id;
                }
                var issue = $scope.data.employee_issues.find(getIssue);

                if ($scope.data.dataSource == 'project.issue'){
                    var analytic_account_id = issue.analytic_account_id;
                    if (!analytic_account_id){
                        var analytic_account_id = issue.project_id.analytic_account_id;
                    }
                    if (!analytic_account_id){
                      $scope.odoo_error =  "No Analytic Account is defined on the project." 
                    }
                    $scope.analytic_journal = null;
                    // Search analytic journal for timesheet
                    $scope.model = 'account.analytic.journal';
                    $scope.domain = [['name', 'ilike', 'Timesheet']];
                    $scope.fields = ['name'];
                    jsonRpc.searchRead($scope.model, $scope.domain, $scope.fields)
                    .then(function(response) {
                        $scope.analytic_journal = response.records[0];
                        if (!$scope.odoo_error){
                            createTimesheet();
                        }
                    }, odoo_failure_function);
                }else{
                    createTaskwork();
                }

                //post to odoo project.task.work, create new task work
                function createTaskwork(){
                    console.log('createTaskwork Called');
                    var args = [{
                        'date': now.format('YYYY-MM-D'),
                        'user_id': $scope.data.user.id,
                        'name': issue.name,
                        'task_id': issue.id,
                        "hours": durationInHours
                    }];
                    var kwargs = {};
                    $scope.args = args;
                    jsonRpc.call(
                        'project.task.work',
                        'create',
                        args,
                        kwargs
                    ).then(function(response) {
                        console.log('response', response);
                    },
                    odoo_failure_function
                    );
                }

                //post to odoo hr.analytic.timesheet, create new time sheet
                function createTimesheet(){
                    var args = [{
                        'date': now.format('YYYY-MM-D'),
                        'user_id': $scope.data.user.id,
                        'name': issue.name+' (#'+issue.id+')',
                        'journal_id': $scope.analytic_journal.id,
                        "account_id": analytic_account_id[0],
                        "unit_amount": durationInHours,
                        "to_invoice": 1,
                        "issue_id": issue.id
                    }];
                    var kwargs = {};
                    $scope.args = args;
                    jsonRpc.call(
                        'hr.analytic.timesheet',
                        'create',
                        args,
                        kwargs
                    ).then(function(response) {
                        console.log('response', response);
                    },
                    odoo_failure_function
                    );
                }
                
            } else {
                console.log('No time info');
            }
        });

        // clear storage
        storage.removeItem("active_timer");
        storage.removeItem("start_date_time");

    }

    //LOGIN
    $scope.login = function() {
        jsonRpc.odoo_server = $scope.data.host;
        $scope.database = $scope.data.database;
        $scope.loginLoading = true;
        //Check if username and password exists
        if (!$scope.data.username || !$scope.data.password){
             $scope.loginError = 'Username or Password is missing';
        }else {
            jsonRpc
            .login($scope.data.database, $scope.data.username, $scope.data.password)
            .then(function (response) {
                var host_info = {
                    'host': $scope.data.host,
                    'database': $scope.data.database
                }
                storage.setItem('host_info', JSON.stringify(host_info));
                $scope.set_current_user(response.uid);
                $scope.loginLoading = false;
            },function(response){
                $scope.loginError = response.message;
            });
        }
    }

    $scope.logout = function(){
        jsonRpc.logout();
        // Delete odoo cookie.
        $cookies.remove('session_id');
        $scope.data.user = null;
        $scope.data.selected_employee = null;
    }

    $scope.set_current_user = function(id){
        $scope.data.user = false;
        $scope.model = 'res.users';
        $scope.domain = [['id', '=', id]];
        $scope.fields = ['display_name'];
        jsonRpc.searchRead($scope.model, $scope.domain, $scope.fields)
        .then(function(response) {
            $scope.data.user = response.records[0];
            $scope.data.user_id = $scope.data.user.id
            //set default employee id
            if (!$scope.data.selected_employee) {
                $scope.model = 'hr.employee';
                $scope.domain = [['user_id', '=', id]];
                $scope.fields = ['name'];
                jsonRpc.searchRead($scope.model, $scope.domain, $scope.fields)
                .then(function(response) {
                    $scope.data.selected_employee = response.records[0];
                }, odoo_failure_function);
            }
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

    $scope.data.dataSource = 'project.issue';
    storage.getItem("dataSource", function(source) {
        if(source){
            $scope.data.dataSource = source;
        }
    });

    // search able employees
    function search_employee_issues() {
        var model = $scope.data.dataSource;
        var domain = [
            ['stage_id.name', 'not in', ['Cancelled', 'On Hold']]
        ];
        var fields = [
            'name',
            'user_id',
            'project_id',
            'stage_id',
            'analytic_account_id'
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
        console.log($scope.data.employee_issues);
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
