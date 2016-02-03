'use strict';

angular.module('<%=angularAppName%>')
    .controller('AuditDetailModalCtrl', function ($scope, $uibModalInstance, ObjectDiff, diff, audit) {

        $scope.diffValue = ObjectDiff.toJsonView(diff);
        $scope.diffValueChanges = ObjectDiff.toJsonDiffView(diff);
        $scope.audit = audit;
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });
