'use strict';

angular.module('<%=angularAppName%>')
    .controller('AuditDetailModalCtrl', function ($scope, $uibModalInstance, $sce, ObjectDiff, diff, audit) {

        $scope.diffValue = $sce.trustAsHtml(ObjectDiff.toJsonView(diff));
        $scope.diffValueChanges = $sce.trustAsHtml(ObjectDiff.toJsonDiffView(diff));
        $scope.audit = audit;
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });
