RATES = null;

function getRates(callback) {
    url = "/api/rates/";

    $.getJSON(url, function(data) {
        RATES = data.rates;
        callback();
    });
}

function convertToEuro(cur, amount) {
    var converted = 0;
    RATES.forEach(function(rate) {
        if (rate.code == cur) {
            converted = amount / rate.rate;
        }
    });
    return converted.toFixed(2);
}

function getCurrentOffer() {
    var offer = {
        "cur": $("select[name=currency]").val(),
        "amount": $("input[name=amount]").val(),
    };
    if (offer.cur && offer.amount) {
        offer.amountEuro = convertToEuro(offer.cur, offer.amount);
    }
    return offer;
}

function offerPage() {
    function updateConversion() {
        var offer = getCurrentOffer();
        var submit = $("[name=offer]");
        var txt = "Offer ";
        var rate;

        if (offer.amountEuro) {
            submit.removeAttr("disabled");
            submit.addClass("btn-success");

            txt += offer.amount + " " + offer.cur;

            txt += " ( " + parseFloat(offer.amountEuro).toFixed(2) + " EUR )";
            
            submit.text(txt);
        } else {
            submit.attr("disabled", "disabled");
            submit.removeClass("btn-success");
        }
    }

    function submitOffer() {
        var offer = getCurrentOffer();
        var url = "/api/offers/";

        $.ajax(url, {
            type: "POST",
            data: JSON.stringify(offer),
            success: function(response) {
                window.location = "/request";
            },
            dataType: "json",
            contentType: "application/json"
        });
    }

    function updateCurrencies() {
        var select = $("select[name=currency]");

        $("<option value=''>-- select your currency --</option>").appendTo(select);

        RATES.forEach(function(rate) {
            $("<option value=" + rate.code + ">" + rate.code + ": " + rate.name + "</option>").appendTo(select);
        });

        select.change(updateConversion);
        $("[name=amount]")
            .change(updateConversion)
            .keyup(function() { $(this).change(); });

        $("[name=offer]").click(function(event) {
            event.preventDefault();
            submitOffer();
            return false;
        });

    }

    getRates(updateCurrencies);
}

function requestPage() {
    var currencies;

    function startRequest(code) {
        var info = null;

        currencies.forEach(function(currency) {
            if (currency.code == code) {
                info = currency;
            }
        });

        info.offers.forEach(function(offer) {
            $(".request tbody").append(
                "<tr><td>" + offer.user + "</td><td>" + offer.amount +
                "</td><td><input max='" + offer.amount + "' class='amount' placeholder='0.0' type='number' step='0.01' name='amount'></input></td><td><span class='amount-euro'></span></td></tr>"
            );
        });

        $(".request input.amount").change(function() {
            var totalEl = $(".request .total");
            var total = 0;
            var amount = parseFloat($(this).val());
            $(this).closest("tr").find(".amount-euro").val(convertToEuro(code, amount));
            $(".request input.amount").each(function(el) {
                if ($(this).val()) {
                    total += parseFloat($(this).val());
                }
            });
            totalEl.val(total.toFixed(2));
        });

        $(".request .currency").text(code);

        
        $(".request").show();
    }

    function onRequest() {
        var code = $($(this).closest("tr").find("td")[1]).text();
        $(".currency-list").hide();
        startRequest(code);
    }

    function updateOffers(data) {
        currencies = data.currencies;

        $(".stats .stats-list").append("<p>&euro;" + data.totalEuro.toFixed(2) + " available across all currencies</p>");
        $(".total-offer").html("&euro;" + data.totalEuro.toFixed(2));
        $(".stats").show();

        currencies.forEach(function(currency) {
            $(".currency-list tbody").append(
                "<tr><td><button class='btn btn-success request'>Request</button></td><td>" + currency.code + "</td><td>" + currency.name + "</td><td>" + currency.total.toFixed(2) + "</td><td>" + convertToEuro(currency.code, currency.total) + "</td></tr>"
            );
        });

        $(".currency-list").show().find(".request").click(onRequest);
    }

    getRates(function() {
        $.getJSON("/api/offers/", updateOffers);
    });
}
