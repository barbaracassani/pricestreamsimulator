/*
 * priceStreamSimulator
 * kitsch-en.net
 *
 * Copyright (c) 2014 Barbara Cassani
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs'),
    events = require('events'),
    http = require('http'),
    app = http.createServer(handler),
    io = require('socket.io').listen(app),
    util = require('util'),
    uuid = require('node-uuid');

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

var PriceStreamSimulator = function() {},
    MarketModel = function(name, data) {
        var step = 0;
        this.step = data.step || 1.1;
        this.name = name;
        this.price = data.min + (data.max - data.min) / 2;
        this.maxPrice = data.max;
        this.minPrice = data.min;
        this.volatility = data.volatility;
        this.goingUp = true;

        var interval = function () {
            var range = 10001;
            var min = 1;
            var max = range - data.volatility * 1000;
            return Math.random() * (max - min) + min;
        };

        var run = function() {

            var up = this.goingUp = Math.random() > 0.75 ? !this.goingUp : this.goingUp;

            setTimeout(function(){
                if (up && this.price + this.step <= this.maxPrice) {
                    this.price += this.step;
                } else {
                    this.price -= this.step;
                }
                this.emit('priceChange', this);
                run();
            }.bind(this), interval());
        }.bind(this);

        run();

    },
    Markets = function(){
        this.data = []
    },
    market;


util.inherits(MarketModel, events.EventEmitter);
util.inherits(Markets, events.EventEmitter);
util.inherits(PriceStreamSimulator, events.EventEmitter);

var tokens = {},
    dataFolder = './lib/data';

PriceStreamSimulator.prototype.grabDataFiles = function() {

    var _self = this;

    market = new Markets();

    fs.readdir(dataFolder, function(err, files) {

        var l = files.length - 1, file, token;

        files.forEach(function(file) {

            if (file.match(/.*.json$/)) {
                token = uuid.v4();
                tokens[token] = true;
                _self.grabFileContent(dataFolder, file, token);
            }

        }, this);

    });
};

/**
 * Check if all the requests for files have returned. Will start the server on the last one
 */
PriceStreamSimulator.prototype.onFilesRead = function() {
    for (var i in tokens) {
        if (tokens.hasOwnProperty(i) && tokens[i]) {
            return;
        }
    }
    this.startApp();
};

/**
 * Read a configuration file
 * @param folder
 * @param filename
 * @param returnToken
 */
PriceStreamSimulator.prototype.grabFileContent = function(folder, filename, returnToken) {

    var path = folder + '/' + filename,
        that = this;


    fs.readFile(path, function(err, data){

        var obj = JSON.parse(data).quotes, l, method, p, tmp;
        if (!obj) {
            console.warn("File ", path, " is not a valid json file");
        } else {

            Object.keys(obj).forEach(function(val) {
                var mar = new MarketModel(val, obj[val]);
                market.data.push(mar);
                mar.on('priceChange', function (data) {
                    if (this.connected && this.socket) {
                        this.socket.emit('onPrice', data);
                    }
                }.bind(this));
            }, this);

        }
        tokens[returnToken] = false;
        this.onFilesRead();
    }.bind(this));
};

app.listen(1030);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}



PriceStreamSimulator.prototype.startApp = function() {

    this.connected = false;

    io.sockets.on('connection', function (socket) {
        this.connected = true;
        this.socket = socket;
        this.on('priceChange', function(data) {
            socket.emit('onPrice', data);
        }.bind(this));
    }.bind(this));
};

PriceStreamSimulator.prototype.init = function () {
    this.grabDataFiles();
};

new PriceStreamSimulator().init();

exports.PriceStreamSimulator = PriceStreamSimulator;
