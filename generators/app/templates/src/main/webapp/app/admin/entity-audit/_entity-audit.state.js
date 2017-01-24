(function() {
    'use strict';

    angular
        .module('<%=angularAppName%>')
        .config(stateConfig);

    stateConfig.$inject = ['$stateProvider'];

    function stateConfig($stateProvider) {
        $stateProvider.state('entity-audit', {
            parent: 'admin',
            url: '/entity-audits',
            data: {
                authorities: ['ROLE_ADMIN'],
                pageTitle: 'Audits'
            },
            views: {
                'content@': {
                    templateUrl: 'app/admin/entity-audit/entity-audits.html',
                    controller: 'EntityAuditController',
                    controllerAs: 'vm'
                }
            }<% if (enableTranslation) { %>,
            resolve: {
                translatePartialLoader: ['$translate', '$translatePartialLoader', function ($translate, $translatePartialLoader) {
                    $translatePartialLoader.addPart('entity-audit');
                    $translatePartialLoader.addPart('global');
                    return $translate.refresh();
                }]
            }<% } %>
        });
    }
})();
