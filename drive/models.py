from django.db import models
from django.contrib.auth.models import User
import os

def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return f'user_{instance.user.id}/{filename}'

class Folder(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subfolders')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    is_starred = models.BooleanField(default=False)
    is_trashed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ('name', 'parent', 'user')

    def __str__(self):
        return self.name

class File(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=user_directory_path)
    parent = models.ForeignKey(Folder, on_delete=models.CASCADE, null=True, blank=True, related_name='files')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    size = models.BigIntegerField(default=0)  # size in bytes
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    is_starred = models.BooleanField(default=False)
    is_trashed = models.BooleanField(default=False)
    visibility = models.CharField(
        max_length=10,
        choices=[('private', 'Riêng tư'), ('public', 'Công khai')],
        default='private'
    )
    shared_with = models.ManyToManyField(User, related_name='shared_files', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def readable_size(self):
        if self.size < 1024:
            return f"{self.size} B"
        elif self.size < 1024 * 1024:
            return f"{self.size / 1024:.1f} KB"
        elif self.size < 1024 * 1024 * 1024:
            return f"{self.size / (1024 * 1024):.1f} MB"
        else:
            return f"{self.size / (1024 * 1024 * 1024):.1f} GB"

    @property
    def extension(self):
        _, ext = os.path.splitext(self.name)
        return ext.lower().replace('.', '')
