var sfitTimerAppOptions = angular.module(
    'sfitTimerAppOptions',
    [
        'odoo',
        'ngCookies',
        'ngSanitize',
    ]
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


sfitTimerAppOptions.controller('mainController', [
    '$scope', '$cookies', '$http', '$window', '$timeout', '$rootScope', '$location', 'jsonRpc',
    function ($scope, $cookies, $http, $window, $timeout, $rootScope, $location, jsonRpc, data) {
    $scope.options = {};
    $scope.options.active_page = 'options';

    $scope.goToPage = function (page) {
        $scope.options.active_page = page;
    }

    $scope.add_remote_host = function () {
        $scope.remote_error = "";
        $('.remote-error').removeClass('alert alert-error');
        if ($scope.data) {
            if (('remote_host' in $scope.data && $scope.data.remote_host !== '') &&
                ('remote_database' in $scope.data && $scope.data.remote_database !== '')) {
                var remote_host = {
                    'url': $scope.data.remote_host,
                    'database': $scope.data.remote_database,
                    'datasrc': $scope.data.remote_datasrc,
                    'state': 'Inactive'
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

    // Remove hosts and any sessions stored
    $scope.remove_remotes_hosts = function () {
        storage.getItem('current_host', function (host) {
            jsonRpc.odoo_server = host || 'https://sunflower.1systeem.nl';
            // Clear the default odoo sessions store in browser
            // NB: Odoo v8 doesn't give the url
            jsonRpc.getSessionInfo().then(async function (result) {
                if (result.session_id) {
                    var url = result['web.base.url'] || 'https://sunflower.1systeem.nl'
                    var cookies = await browser.cookies.getAll(
                        {'name': 'session_id', 'url': url});
                    cookies.forEach(async (cookie)=>{
                        var res = await browser.cookies.remove({
                            'name': cookie.name,
                            'storeId': cookie.storeId,
                            'url': url || 'https://' + cookie.domain
                        });
                        console.log(res);
                    });
                }
            });
        })
        storage.getItem("remote_host_info", function (remotes) {
            if (remotes) {
                for (let remote of remotes) {
                    remote = JSON.parse(remote);
                    storage.removeItem(remote['database']);
                }
            }
        });
        storage.removeItem('remote_host_info');
        document.cookie  = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        alert.show("Host list removed successfully!");
    }
}]);