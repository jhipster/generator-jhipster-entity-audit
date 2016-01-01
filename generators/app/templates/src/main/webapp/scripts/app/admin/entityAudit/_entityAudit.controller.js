'use strict';

angular.module('<%=angularAppName%>')
    .controller('EntityAuditController', function ($scope, $filter, $uibModal, $sce, EntityAuditService, AlertService, ObjectDiff) {

        $scope.entities = [];
        $scope.audits = [];
        $scope.limits = [25, 50, 100, 200];
        $scope.limit = 25;

        EntityAuditService.findAllAudited().then(function (data) {
            $scope.entities = data;
        });

        $scope.loading = false;
        $scope.loadChanges = function () {
            $scope.loading = true;
            var entityType = $scope.qualifiedName;
            EntityAuditService.findByEntity(entityType, $scope.limit).then(function (data) {
                $scope.audits = data.map(function(it){
                    it.entityValue = JSON.parse(it.entityValue);
                    return it;
                });
                $scope.loading = false;
            }, function(){
                $scope.loading = false;
            });
        };

        $scope.getEntityName = function (qualifiedName) {
            if (qualifiedName) {
                var splits = qualifiedName.split(".");
                return splits[splits.length - 1];
            }
            else return null;
        };

        $scope.format = function(val){
            if(val)
                return $sce.trustAsHtml(ObjectDiff.objToJsonView(val));
            else return '';
        };

        $scope.isObject = function(val){
            return (val && (typeof val) == 'object');
        };
        $scope.isDate = function(key){
            return (key && key.indexOf("Date") != -1);
        };

        $scope.openChange = function(audit){

            if(audit.commitVersion < 2){
                AlertService.warning("There is no previous version available for this entry.\nThis is the first" +
                    " audit entry captured for this object");
            } else {
                EntityAuditService.getPrevVersion(audit.entityType, audit.entityId, audit.commitVersion).then(function (data) {
                    var previousVersion = JSON.parse(data.entityValue),
                        currentVersion = audit.entityValue;
                    // enable below to have the dates formatted
                    //previousVersion = convertDates(previousVersion);
                    //currentVersion = convertDates(currentVersion);
                    var diff = ObjectDiff.diffOwnProperties(previousVersion, currentVersion);

                    $uibModal.open({
                        templateUrl: 'scripts/app/admin/entityAudit/entityAudit.detail.html',
                        controller: 'AuditDetailModalCtrl',
                        size: 'lg',
                        resolve: {
                            diff: function () {
                                return diff;
                            },
                            audit: function () {
                                return audit;
                            }
                        }
                    });
                });
            }
        };

        function convertDates(obj) {
            for(var key in obj) {
                if (obj.hasOwnProperty(key) && obj[key]) {
                    if (key.indexOf("Date") != -1 && (obj[key] instanceof Date || Object.prototype.toString.call(obj[key]) === '[object Date]' || (new Date(obj[key]) !== "Invalid Date" && !isNaN(new Date(obj[key]))))) {
                        obj[key] = $filter('date')(obj[key]);
                    }
                }
            }
            return obj;
        }

    });
