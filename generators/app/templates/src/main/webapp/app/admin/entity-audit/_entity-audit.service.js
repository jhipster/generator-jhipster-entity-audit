(function() {
    'use strict';

    angular
        .module('<%=angularAppName%>')
        .factory('EntityAuditService', EntityAuditService);

    EntityAuditService.$inject = ['$http'];

    function EntityAuditService ($http) {

        var service = {
            findAllAudited: findAllAudited,
            findByEntity: findByEntity,
            getPrevVersion: getPrevVersion
        };

        return service;

        function findAllAudited() {
            return $http.get('api/audits/entity/all').then(function (response) {
                return response.data;
            });
        }

        function findByEntity(entityType, limit) {
            return $http.get('api/audits/entity/changes', {
                params: {
                    entityType: entityType,
                    limit: limit
                }
            }).then(function (response) {
                return response.data;
            });
        }

        function getPrevVersion(qualifiedName, entityId, commitVersion) {
            return $http.get('api/audits/entity/changes/version/previous', {
                params: {
                    qualifiedName: qualifiedName,
                    entityId: entityId,
                    commitVersion: commitVersion
                }
            }).then(function (response) {
                return response.data;
            });
        }
    }
})();
