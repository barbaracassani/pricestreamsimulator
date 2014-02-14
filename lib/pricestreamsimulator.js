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
    uuid = require('node-uuid'),
    MarketModel = require('./MarketModel');

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
    Markets = function(){
        this.data = []
    },
    market;

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

    var path = folder + '/' + filename;


    fs.readFile(path, function(err, data){

        var obj = JSON.parse(data).quotes;
        if (!obj) {
            console.warn("File ", path, " is not a valid json file");
        } else {

            Object.keys(obj).forEach(function(val) {
                this.createMarket(val, obj[val]);
            }, this);

        }
        tokens[returnToken] = false;
        this.onFilesRead();
    }.bind(this));
};

app.listen(1030);

function handler (req, res) {
    if (!req.url.indexOf('/css/')) {
        fs.readFile(__dirname + req.url, function (err, data) {
            res.writeHead(200);
            res.end(data);
        });
        return;
    }
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

PriceStreamSimulator.prototype.createMarket = function(name, val) {
    var mar = new MarketModel(name, val);
    market.data.push(mar);
    mar.on('priceChange', function (data) {
        if (this.connected && this.socket) {
            this.socket.emit('onPrice', data);
        }
    }.bind(this));
};

PriceStreamSimulator.prototype.startApp = function() {

    this.connected = false;

    io.sockets.on('connection', function (socket) {
        this.connected = true;
        this.socket = socket;
        socket.emit('connected', market.data); // snapshot
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
