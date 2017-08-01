from django.views import View
from django.http import HttpResponse
from django.contrib.auth.mixins import LoginRequiredMixin

from django.views.decorators.csrf import csrf_exempt
import json

from .models import Offer

from forex_python.converter import CurrencyRates, CurrencyCodes

RATES = CurrencyRates()
CODES = CurrencyCodes()


def api_response(content):
    serialized = json.dumps(content)
    return HttpResponse(
        serialized,
        content_type="application/json",
    )


class RatesView(LoginRequiredMixin, View):

    def get(self, request):
        rates = RATES.get_rates("eur")
        rates["EUR"] = 1.0
        return api_response({
            "rates": sorted({"code": c, "rate": r, "name": CODES.get_currency_name(c)} for (c, r) in rates.items()),
        })


class OffersView(LoginRequiredMixin, View):

    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super(OffersView, self).dispatch(*args, **kwargs)

    def get(self, request):
        currencies = {}

        total_in_eur = 0

        for o in Offer.objects.all():
            if o.currency not in currencies:
                currencies[o.currency] = {
                    "code": o.currency,
                    "name": CODES.get_currency_name(o.currency),
                    "offers": [],
                    "total": 0,
                }

            info = currencies[o.currency]

            info["offers"].append({
                "user": o.user.email,
                "amount": float(o.amount),
                "currency": o.currency,
            })

            amount_in_eur = o.amount if o.currency == "EUR" else RATES.convert(o.currency, "EUR", o.amount)
            total_in_eur += amount_in_eur
            info["total"] += float(o.amount)

        return api_response({
            "totalEuro": float(total_in_eur),
            "currencies": sorted(currencies.values(), key=lambda c: c["code"]),
        })

    def post(self, request):
        assert request.is_ajax()
        data = json.loads(request.body)

        Offer.objects.create(
            currency=data["cur"],
            amount=data["amount"],
            user=request.user,
        )
        return api_response({
            "created": True,
        })
