var sfitTimerAppOptions = angular.module(
    'sfitTimerAppOptions',
    []
);

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}


sfitTimerAppOptions.controller('mainController', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout, data) {
    $scope.options = {};
    $scope.options.active_page = 'options';
    $scope.options.dataSource = 'project.issue';
    storage.getItem("dataSource", function (source) {
        if (source) {
            $scope.options.dataSource = source;
        }
    });
    $timeout(function () {
        $scope.options.dataSource = $scope.options.dataSource;
    }, 0);

    $scope.goToPage = function (page) {
        $scope.options.active_page = page;
    }
    $scope.$watch('options.dataSource', function (value) {
        storage.setItem("dataSource", value);
    });

    $scope.add_remote_host = function () {
        $scope.remote_error = "";
        $('.remote-error').removeClass('alert alert-error');
        if ($scope.data) {
            if (('remote_host' in $scope.data && $scope.data.remote_host !== '') &&
                ('remote_database' in $scope.data && $scope.data.remote_database !== '')) {
                var remote_host = {
                    'url': $scope.data.remote_host,
                    'database': $scope.data.remote_database,
                }
                // Check if url is valid for storage.
                if (validURL($scope.data.remote_host)) {
                    // Check existing remotes
                    storage.getItem("remote_host_info", function (remotes) {
                        if (remotes && remotes.length) {
                            // Check if a duplicate remote already exists
                            if (checkDupRemotes(remote_host, remotes))
                                return alert.show(remote_host.url + " and "
                                    + remote_host.database +
                                    " already exist no duplicates allowed");
                            else {
                                // Add new remote
                                remotes.push(JSON.stringify(
                                    remote_host));
                                // store new updated list of remotes
                                storage.setItem('remote_host_info', remotes);
                                alert.show("Host [" + remote_host.url +"] " +
                                    "added to the list Successfully. Logout to" +
                                    " check");
                            }

                        } else {
                            // Create a new Remote if cache/storage cleared.
                            var remotes_lst = [JSON.stringify(
                                remote_host)];
                            storage.setItem('remote_host_info', remotes_lst);
                            alert.show("Host [" + remote_host.url +"] " +
                                "created successfully. Logout to check");
                        }
                        // clear fields
                        $('#remote-host').val('');
                        $('#remote-database').val('');
                    });
                } else {
                    alert.show("ERROR: Invalid URL syntax")
                }
            } else {
                alert.show("ERROR: Fields cannot be empty");
            }
        } else {
            alert.show("ERROR: Fields cannot be empty");
        }
    }

    function checkDupRemotes(new_remote, remotes) {
        for (let remote of remotes) {
            let rem = JSON.parse(remote);
            if (rem.url === new_remote.url &&
                rem.database === new_remote.database)
                return true;
        }
        return false;
    }

    $scope.remove_remotes_hosts = function () {
        storage.removeItem('remote_host_info');
        alert.show("Host list removed successfully!");
    }
}]);