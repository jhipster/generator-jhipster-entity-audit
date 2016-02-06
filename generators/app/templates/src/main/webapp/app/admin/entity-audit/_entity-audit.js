'use strict';

angular.module('<%=angularAppName%>')
    .config(function ($stateProvider) {
        $stateProvider
            .state('entity-audit', {
                parent: 'admin',
                url: '/entity-audits',
                data: {
                    roles: ['ROLE_ADMIN'],
                    pageTitle: 'Audits'
                },
                views: {
                    'content@': {
                        templateUrl: 'app/admin/entity-audit/entity-audits.html',
                        controller: 'EntityAuditController'
                    }
                },
                resolve: { }
            });
    });
