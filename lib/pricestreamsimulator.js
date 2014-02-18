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
    when = require('when'),
    nodefn = require('when/node/function'),
    app = http.createServer(handler),
    io = require('socket.io').listen(app),
    util = require('util'),
    uuid = require('node-uuid'),
    MarketModel = require('./MarketModel');


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

    var files = nodefn.call(fs.readdir, dataFolder);

    market = new Markets();

    when.map(files, function(file) {
        nodefn.call(fs.readFile, file)
            .then(_self.grabFileContent(dataFolder, file));
    }).then(_self.startApp.bind(_self));

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
            return false;
        } else {

            Object.keys(obj).forEach(function(val) {
                this.createMarket(val, obj[val]);
            }, this);
            return true;

        }

    }.bind(this));
};

app.listen(1030);

function handler (req, res) {
    if (!req.url.indexOf('/css/') || !req.url.indexOf('/js/')) {
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
