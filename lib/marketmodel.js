"use strict";

var events = require('events'),
    util = require('util');

var MarketModel = function(name, data) {

    this.step = data.step || 1.1;
    this.name = name;
    this.price = data.min + (data.max - data.min) / 2;
    this.maxPrice = data.max;
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

};

util.inherits(MarketModel, events.EventEmitter);
module.exports = MarketModel;