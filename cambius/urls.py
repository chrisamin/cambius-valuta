from django.conf.urls import url
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required

from .views import RatesView, OffersView

urlpatterns = [
    url(r'^$', login_required(TemplateView.as_view(template_name="home.html")), name="home"),
    url(r'^rates$', login_required(TemplateView.as_view(template_name="rates.html")), name="rates"),
    url(r'^offer$', login_required(TemplateView.as_view(template_name="offer.html")), name="offer"),
    url(r'^request$', login_required(TemplateView.as_view(template_name="request.html")), name="request"),
    url(r'^api/rates/$', RatesView.as_view(), name="rates-api"),
    url(r'^api/offers/$', OffersView.as_view(), name='offers-api'),
]
