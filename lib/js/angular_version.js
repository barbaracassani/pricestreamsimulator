
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
    $scope.market = {
        sellPrice : 1,
        buyPrice : 2
    };
    console.info(arguments)
    socket.on('onPrice', function(data) {
        console.info('data', data)
    });
    socket.on('connected', function(data) {
     console.warn('data', data)
     });
});