
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
    function ($scope, $cookies, $http, $window, $timeout, $rootScope, $location, jsonRpc, data) {

        $scope.limitRange = [
            {val:'5', opt: '5'},
            {val:'10', opt: '10'},
            {val:'15', opt: '15'},
            {val:'', opt: 'All'},
        ];
        $scope.$watch('allIssues', function () {
            if (!$scope.allIssues && $scope.data.user) {
                $scope.data.user_id = $scope.data.user.id;
            } else {
                $scope.data.user_id = '';
            }
        });

        $scope.timerRunning = true;
        $scope.startTimer = function (issue) {
            $scope.$broadcast('timer-resume');
            $scope.timerRunning = true;
        };
        $scope.stopTimer = function () {
            $scope.$broadcast('timer-stop');
            $scope.timerRunning = false;
        };
        $scope.$on('timer-stopped', function (event, data) {
            console.log('Timer Stopped - data = ', data);
        });

        //-----------------------------------
        /* MAIN CODE */
        storage.getItem("start_date_time", function (start_date_time) {
            if (start_date_time) {
                $scope.current_date = JSON.parse(start_date_time);
                $scope.startTimeCount = $scope.current_date.start_time;
            } else {
                console.log('no active timer found');
            }
        });

        $scope.data = {};
        $scope.data.today = new Date();

        storage.getItem("active_timer_id", function (active_timer_id) {
            if (active_timer_id) {
                $scope.data.active_timer_id = active_timer_id;
            } else {
                console.log('no active issue found');
            }
        });

        storage.getItem("host_info", function (host_info_json) {
            var default_host_info = {
                'host': 'https://sunflower.1systeem.nl',
                'database': 'sunflowerdatabase'
            }
            if (!host_info_json) {
                storage.setItem('host_info', JSON.stringify(host_info));
                host_info = default_host_info;
            } else {
                var host_info = JSON.parse(host_info_json);
            }
            $scope.data.host = host_info.host;
            $scope.data.database = host_info.database;
            jsonRpc.odoo_server = $scope.data.host;
            $scope.trySession();
        });

        $scope.trySession = function() {
            // Check if user is logged in and set user:
            jsonRpc.getSessionInfo().then(function (result) {
                if (result.uid) {
                    $scope.set_current_user(result.uid);
                    $scope.database = result.db;
                    $scope.loginLoading = false;
                } else {
                    $scope.loginError = 'Automatic login failed';
                    $scope.to_login();
                }
            }, function() {
                $scope.loginError = 'Automatic login failed';
                $scope.to_login();
            });
        };
        //-----------------------------------

        // Start timer
        $scope.startTimer1 = function (issue) {
            $scope.odoo_error = '';
            var now = moment();
            issue.currentRunning = 1;
            // Change icon to active
            browser.runtime.sendMessage({TimerActive: true});

            // Start timer
            $scope.startTimeCount = now;
            $scope.active_timer = now;
            $scope.startTimer();

            // Show start/stop buttons on other issues
            var timer_info = {
                'start_time': now,
                'issue_id': issue.id,
            };
            $scope.current_date = timer_info;
            storage.setItem('start_date_time', JSON.stringify(timer_info));
            storage.setItem("active_timer_id", issue.id);
            $('')
        };

        $scope.stopActiveTimer1 = function () {
            storage.getItem("start_date_time", function (time) {
                var startTimeInfo = JSON.parse(time);
                $scope.stopTimer1(startTimeInfo.issue_id);
            });
        };
        // Stop timer
        $scope.stopTimer1 = function (id) {
            console.log('stopping time...');

            // Change icon to inactive
            browser.runtime.sendMessage({TimerActive: false});

            // Stop timer
            $scope.stopTimer();

            // Show start/stop buttons on other issues
            $scope.current_date = false;

            var now = moment();
            var timer_info = {
                'stop_time': now,
                'issue_id': id,
            };
            storage.setItem('stop_date_time', JSON.stringify(timer_info));
            storage.getItem("start_date_time", function (time) {
                var startTimeInfo = JSON.parse(time);
                if (startTimeInfo) {
                    // Get time difference in minutes
                    var durationMins = moment.duration(
                        now.diff(startTimeInfo.start_time)).asMinutes();
                    var mins = Math.round(durationMins % 60/15) * 15;
                    var durationInHours = Math.floor(durationMins/60) + mins/60;
                    var issue = $scope.data.employee_issues.find(
                        function(o) {return o.id == id});
                    if (!issue) {
                        $scope.odoo_error = "Issue " + id + " not found";
                        $scope.$apply();
                        return;
                    }
                    if ($scope.data.dataSource == 'project.issue') {
                        var analytic_account_id = issue.analytic_account_id;
                        if (!analytic_account_id) {
                            var project = $scope.data.projects.find(
                                function (o) {return o.id == issue.project_id[0];}
                            );
                            if (!project) {
                                $scope.odoo_error = "Project not found.";
                                $scope.$apply();
                                return; 
                            }
                            analytic_account_id = project.analytic_account_id;
                        }
                        if (!analytic_account_id) {
                            $scope.odoo_error = "No Analytic Account is defined on the project.";
                            $scope.$apply();
                            return; 
                        }
                        $scope.analytic_journal = null;
                        // Search analytic journal for timesheet
                        $scope.model = 'account.analytic.journal';
                        $scope.domain = [['name', 'ilike', 'Timesheet']];
                        $scope.fields = ['name'];
                        jsonRpc.searchRead($scope.model, $scope.domain, $scope.fields)
                            .then(function (response) {
                                $scope.analytic_journal = response.records[0];
                                createTimesheet();
                            }, odoo_failure_function);
                    } else {
                        createTaskwork().then(function(response) {
                            console.log('task.work created');
                        }, function(response) {
                            createAnalyticLine();
                            console.log('creating analytic line');
                        });
                    }

                    // Post to odoo project.task.work, create new task work
                    function createAnalyticLine() {
                        var deferred = new $.Deferred();
                        console.log('creating analytic line');
                        var project = $scope.data.projects.find(
                            function (o) {return o.id == issue.project_id[0];}
                        );
                        if (!project) {
                            console.log('project not found');
                            deferred.reject();
                        }
                        jsonRpc.call(
                            'account.analytic.line',
                            'default_get',
                            ['invoice_discount_id'],
                            {} 
                        ).then(function (response) {
                            var args = [{
                                'invoice_discount_id': response.invoice_discount_id,
                                'date': now.format('YYYY-MM-D'),
                                'user_id': $scope.data.user.id,
                                'name': issue.name,
                                'task_id': issue.id,
                                'project_id': project.id,
                                'unit_amount': durationInHours,
                            }];
                            jsonRpc.call(
                                'account.analytic.line',
                                'create',
                                args,
                                {}
                            ).then(function (response) {
                                console.log('response', response);
                                deferred.resolve();
                            }).catch(function(res){
                                console.log(res);
                                $scope.odoo_error = res.title + '\n' +
                                    res.message;
                            });
                        }, deferred.reject);
                        return deferred;
                    }

                    // Post to odoo project.task.work, create new task work
                    function createTaskwork () {
                        var deferred = new $.Deferred();
                        console.log('createTaskwork Called');
                        var args = [{
                            'date': now.format('YYYY-MM-D'),
                            'user_id': $scope.data.user.id,
                            'name': issue.name,
                            'task_id': issue.id,
                            "hours": durationInHours,
                        }];
                        var kwargs = {};
                        jsonRpc.call(
                            'project.task.work',
                            'create',
                            args,
                            kwargs
                        ).then(function (response) {
                            console.log('response', response);
                            deferred.resolve();
                        }, function(response) {
                            console.log('rejecting');
                            deferred.reject();
                        });
                        return deferred;
                    }

                    // Post to odoo hr.analytic.timesheet, create new time sheet
                    function createTimesheet () {
                        console.log('createTimeSheet Called');
                        var args = [{
                            'date': now.format('YYYY-MM-D'),
                            'user_id': $scope.data.user.id,
                            'name': issue.name+' (#'+issue.id+')',
                            'journal_id': $scope.analytic_journal.id,
                            "account_id": analytic_account_id[0],
                            "unit_amount": durationInHours,
                            "to_invoice": 1,
                            "issue_id": issue.id,
                        }];
                        var kwargs = {};
                        console.log("ARGS");
                        console.log(args);
                        jsonRpc.call(
                            'hr.analytic.timesheet',
                            'create',
                            args,
                            kwargs
                        ).then(function (response) {
                            console.log('response', response);
                        },
                        odoo_failure_function
                        );
                    }

                } else {
                    console.log('No time info');
                }
            });

            // Clear storage
            console.log('stopped time...');
            storage.removeItem("active_timer_id");
            storage.removeItem("start_date_time");
        };

        // LOGIN
        $scope.login = function () {
            jsonRpc.odoo_server = $scope.data.host;
            $scope.database = $scope.data.database;
            $scope.loginLoading = true;
            if ($scope.data.useExistingSession) {
                $scope.trySession();
            }
            else if (!$scope.data.username || !$scope.data.password) {
                $scope.loginLoading = false; 
                $scope.loginError = 'Username or Password is missing';
            }
            else {
                jsonRpc
                    .login($scope.data.database, $scope.data.username, $scope.data.password)
                    .then(function (response) {
                        var host_info = {
                            'host': $scope.data.host,
                            'database': $scope.data.database,
                        };
                        storage.setItem('host_info', JSON.stringify(host_info));
                        $scope.set_current_user(response.uid);
                        $scope.loginLoading = false;
                    }, function (response) {
                        $scope.loginLoading = false;
                        $scope.loginError = response.message;
                    });
            }
        };

        $scope.to_main = function () {
            $("#wrapper").removeClass("hide");
            $("#loader-container").addClass("hide");
            $("#login").addClass("hide");
        };

        $scope.to_login = function () {
            $("#login").removeClass("hide");
            $("#loader-container").addClass("hide");
            $("#wrapper").addClass("hide");
        };

        $scope.logout = function () {
            jsonRpc.logout();
            // Delete odoo cookie.
            $cookies.remove('session_id');
            $scope.data.user = null;
            $scope.to_login();
            console.log('logged out');
        };

        $scope.set_current_user = function (id) {
            $scope.data.user = false;
            $scope.model = 'res.users';
            $scope.domain = [['id', '=', id]];
            $scope.fields = ['display_name'];
            jsonRpc.searchRead(
                $scope.model, $scope.domain, $scope.fields
            ).then(function (response) {
                $scope.data.user = response.records[0];
                $scope.data.user_id = $scope.data.user.id;
                storage.getItem("users_issues", function (issues) {
                    if (issues) {
                        $scope.data.employee_issues = JSON.parse(issues);
                        $scope.to_main();
                        console.log('loaded existing issues');
                    }
                    $scope.load_projects().then(function() {
                        console.log('loaded projects');
                    });
                    $scope.load_employee_issues().then(function() {
                        var users_issues = $scope.data.employee_issues;
                        storage.setItem('users_issues', JSON.stringify(users_issues));
                        $scope.to_main();
                        console.log('loaded new issues');
                    }, function() {
                        $scope.to_main();
                        console.log('no issues found');
                    });
                });
            });
        };

        $scope.data.dataSource = 'project.issue';
        storage.getItem("dataSource", function (source) {
            if (source) {
                $scope.data.dataSource = source;
            }
        });

        function search_employee_issues () {
            var model = $scope.data.dataSource;
            var domain = [
                '|',
                ['id', '=', $scope.data.active_timer_id],
                '&',
                ['stage_id.name', 'not ilike', '%Done%'],
                '&',
                ['stage_id.name', 'not ilike', '%Cancel%'],
                ['stage_id.name', 'not ilike', '%Hold%'],
            ];
            var fields = [
                'name',
                'user_id',
                'project_id',
                'stage_id',
                'analytic_account_id',
            ];
            return jsonRpc.searchRead(
                model,
                domain,
                fields
            );
        }

        function search_projects() {
            var model = 'project.project';
            var domain = [];
            var fields = [
                'analytic_account_id',
            ];
            return jsonRpc.searchRead(
                model,
                domain,
                fields
            );
        }

        function process_employee_issues (response) {
            $scope.data.employee_issues = [];
            angular.forEach(response.records, function (issue) {
                $scope.data.employee_issues.push(issue);
            });
            var users_issues = $scope.data.employee_issues;
            storage.setItem('users_issues', JSON.stringify(users_issues));
        }

        function process_projects (response) {
            $scope.data.projects = [];
            angular.forEach(response.records, function (project) {
                $scope.data.projects.push(project);
            });
        }

        $scope.load_employee_issues = function () {
            var deferred = new $.Deferred();
            search_employee_issues().then(function (response) {
                process_employee_issues(response);
                deferred.resolve();
            }, function(response) {
                deferred.reject();
            });
            return deferred;
        };

        $scope.load_projects = function () {
            var deferred = new $.Deferred();
            search_projects().then(function (response) {
                process_projects(response);
                deferred.resolve();
            }, function() {
                deferred.reject();
            });
            return deferred;
        };

        // Generic failure function
        var odoo_failure_function = function (response) {
            $scope.odoo_error = {
                'title': response.fullTrace.message,
                'type': response.fullTrace.data.exception_type,
                'message': response.fullTrace.data.message,
            };
            $scope.error = $scope.odoo_error.message;
        };

    }]);
