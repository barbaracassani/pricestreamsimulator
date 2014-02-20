
var pss = angular.module('pss', []);

pss.factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    }});


pss.controller('pssCtrl', function($scope, socket) {

    $scope.markets = [];
    $scope.stopped = null;

    $scope.stopTicking = function($event) {
        if ($scope.stopped === this.market.id) {
            $scope.stopped = null;
            $event.target.innerHTML = 'Stop';
        } else  {
            $scope.stopped = this.market.id;
            $event.target.innerHTML = 'Play';
        }
    };

    socket.on('onPrice', function(data) {
        var id = data.id;
        if (id === $scope.stopped) {
            return;
        }
        $scope.markets.some(function (market) {
            if (market.id === id) {
                market.buyPrice = data.buyPrice;
                market.sellPrice = data.sellPrice;
                return true;
            }
            return false;
        });
    });

    socket.on('connected', function(data) {
         $scope.markets = data;
     });
});