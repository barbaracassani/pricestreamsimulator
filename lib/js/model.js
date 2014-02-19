var app = app || {};

(function(win, a, BR) {

    a.initModel = function(markets) {
        var marketObj = {};

            markets.forEach(function (mk) {

                marketObj[mk.name] = {};
                marketObj[mk.name].value  = mk;
                marketObj[mk.name].configurable = true;
                marketObj[mk.name].writable = true;
                marketObj[mk.name].get = function(val) {return val};
                marketObj[mk.name].set = function(val) {return val};

            }, this);

        var Model = Object.create(Object.prototype, {
            // foo is a regular "value property"
            foo: { writable:true, configurable:true, value: "hello" },
            // bar is a getter-and-setter (accessor) property
            bar: {
                configurable: false,
                get: function() { return 10 },
                set: function(value) { console.log("Setting `o.bar` to", value) }
            }});

    };

}(window, app, Breve));