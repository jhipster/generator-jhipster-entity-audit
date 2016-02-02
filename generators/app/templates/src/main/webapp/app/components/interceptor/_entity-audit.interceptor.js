'use strict';

angular.module('<%=angularAppName%>')
.factory('entityAuditInterceptor', ['$q', '$injector', function($q, $injector) {
    var requestInterceptor = {
        request: function(config) {
            var deferred = $q.defer();
            // set createdBy | lastModifiedBy for all POST | PUT request
            if (config.method === 'POST' || config.method === 'PUT') {
                var obj = config.data;
                var Principal = $injector.get('Principal');
                Principal.identity().then(function(identity) {
                    if (obj !== undefined && obj !== null && !(typeof obj === 'string' || obj instanceof String)) {
                        if (config.method === 'POST') {
                            obj['createdBy'] = identity.login;
                        } else {
                            obj['lastModifiedBy'] = identity.login;
                            obj['lastModifiedDate'] = new Date();
                        }
                    }
                    deferred.resolve(config);
                }, function() {
                    deferred.resolve(config);
                });
            } else {
                deferred.resolve(config);
            }
            return deferred.promise;
        }
    };
    return requestInterceptor;
}]);
