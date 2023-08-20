from django.contrib import admin
from .models import Email, User


class EmailAdmin(admin.ModelAdmin):
    list_display = ("user", "sender", "subject", "body", "timestamp",
    "read", "archived")

# Register your models here.
admin.site.register(Email, EmailAdmin)