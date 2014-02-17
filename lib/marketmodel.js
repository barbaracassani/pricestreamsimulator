"use strict";

var events = require('events'),
    util = require('util');

var MarketModel = function(name, data) {

    this.step = data.step || 1.1;
    this.name = name;
    this.id = 'id' + data.id;
    this.buyPrice = data.min + (data.max - data.min) / 2;
    this.spread = data.spread;
    this.sellPrice = this.buyPrice - this.spread;
    this.maxPrice = data.max;
    this.minPrice = data.min;
    this.volatility = data.volatility;
    this.goingUp = true;

    var interval = function () {
        var range = 10500;
        var min = 500;
        var max = range - data.volatility * 10000;
        return Math.random() * (max - min) + min;
    };

    var run = function() {

        var up = this.goingUp = (Math.random() > 0.75);

        setTimeout(function(){
            up = this.goingUp = (Math.random() > 0.75);
            if (up && (this.buyPrice + this.step <= this.maxPrice)) {
                this.buyPrice += this.step;
            } else if (!up && (this.buyPrice -= this.step > this.minPrice)) {
                this.buyPrice -= this.step;
            }
            this.sellPrice = this.buyPrice - this.spread;
            this.emit('priceChange', this);
            run();
        }.bind(this), interval());
    }.bind(this);

    run();

};

util.inherits(MarketModel, events.EventEmitter);
module.exports = MarketModel;