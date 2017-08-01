from __future__ import unicode_literals

from django.db import models

# Create your models here.


class Offer(models.Model):
    currency = models.CharField(max_length=3)
    user = models.ForeignKey("auth.user")
    amount = models.DecimalField(decimal_places=2, max_digits=10)
