(function(win, document, io) {

    var stopped;

    var socket = io.connect('http://localhost:1030'),
        formatter = function(num) {
            return(num.toFixed(2));
        };

    socket.on('connected', function(data) {
        var el = document.querySelector('.flex-container.one');
        el.innerHTML = '';
        data.forEach(function (market) {
            el.innerHTML +=
                ('<li class="flex-item '+ market.id +'"><div class="market-name"><span>' +
                    market.name + '</span></div><button data-id="' + market.id +'" class="stop">Stop</button><div class="flex-container">' +
                    '<div data-id="' + market.id +'" class="back sell price">' + formatter(market.sellPrice) +
                    '</div><div data-id="' + market.id +'" class="back buy price"> ' + formatter(market.buyPrice) + '</div></div></li>');

        })
    });

    socket.on('onPrice', function (data) {

        if ( data.id === stopped) {
            return;
        }

        var elSell = document.querySelector('.flex-container.one .' + data.id + ' .sell');
        var elBuy = document.querySelector('.flex-container.one .' + data.id + ' .buy');

        elBuy.classList.remove('back');
        elSell.classList.remove('back');

        elSell.classList.toggle('up', data.goingUp);
        elSell.classList.toggle('down', !data.goingUp);

        elBuy.classList.toggle('up', data.goingUp);
        elBuy.classList.toggle('down', !data.goingUp);

        elSell.innerHTML = formatter(data.sellPrice);
        elBuy.innerHTML = formatter(data.buyPrice);

        win.setTimeout(function () {
            elBuy.classList.add('back');
            elSell.classList.add('back');
        }, 0);
    });

    document.addEventListener('click', function(e) {
        var target = e.target, btnId;
        if (target.tagName.toLowerCase() === 'button') {
            if (stopped === target.getAttribute('data-id')) {
                stopped = '';
                target.innerHTML = 'Stop';
                target.classList.remove('stopped');
            } else {
                stopped = target.getAttribute('data-id');
                [].forEach.call(document.querySelectorAll('button.stop'),
                    function (el) {
                        el.innerHTML = 'Stop';
                        el.classList.remove('stopped');
                    }
                );
                target.innerHTML = 'Play';
                target.classList.add('stopped');
            }
        }
        return false;
    }, false);

}(window, document, io));