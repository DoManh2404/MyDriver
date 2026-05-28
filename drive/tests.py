from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
import tempfile
import shutil
import os

from .models import Folder, File

class DriveTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'testuser'
        self.password = 'securepass123'
        self.email = 'test@example.com'
        self.user = User.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        
        # Temp dir for uploads during tests
        self.temp_media = tempfile.mkdtemp()
        
    def tearDown(self):
        shutil.rmtree(self.temp_media, ignore_errors=True)

    def test_auth_redirection(self):
        # Accessing home/dashboard when unauthenticated redirects to login
        response = self.client.get(reverse('dashboard'))
        self.assertRedirects(response, f"{reverse('login')}?next=/")

    def test_user_login(self):
        response = self.client.post(reverse('login'), {
            'username': self.username,
            'password': self.password
        })
        self.assertRedirects(response, reverse('dashboard'))

    def test_api_create_folder(self):
        self.client.login(username=self.username, password=self.password)
        
        response = self.client.post(reverse('api_create_folder'), {
            'name': 'Test Subfolder'
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('folder', data)
        self.assertEqual(data['folder']['name'], 'Test Subfolder')
        
        # Verify in DB
        self.assertTrue(Folder.objects.filter(name='Test Subfolder', user=self.user).exists())

    def test_api_star_item(self):
        self.client.login(username=self.username, password=self.password)
        
        # Create Folder
        folder = Folder.objects.create(name='Star Folder', user=self.user)
        self.assertFalse(folder.is_starred)
        
        # Toggle Star API
        response = self.client.post(reverse('api_toggle_star'), {
            'item_id': folder.id,
            'item_type': 'folder'
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['is_starred'])
        
        # Refresh and verify
        folder.refresh_from_db()
        self.assertTrue(folder.is_starred)

    def test_api_trash_item_recursive(self):
        self.client.login(username=self.username, password=self.password)
        
        parent = Folder.objects.create(name='Parent Folder', user=self.user)
        child = Folder.objects.create(name='Child Folder', parent=parent, user=self.user)
        
        self.assertFalse(parent.is_trashed)
        self.assertFalse(child.is_trashed)
        
        # Trash parent
        response = self.client.post(reverse('api_trash_item'), {
            'item_id': parent.id,
            'item_type': 'folder'
        })
        self.assertEqual(response.status_code, 200)
        
        # Refresh & Check recursive trashing logic
        parent.refresh_from_db()
        child.refresh_from_db()
        self.assertTrue(parent.is_trashed)
        self.assertTrue(child.is_trashed)

    def test_api_storage_usage(self):
        self.client.login(username=self.username, password=self.password)
        
        # Test get storage API
        response = self.client.get(reverse('api_get_storage_use'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['total_bytes'], 0)

    def test_file_visibility_and_sharing(self):
        # Create a second user
        other_user = User.objects.create_user(username='otheruser', password='password123')
        
        # Create a dummy file on disk under temp directory
        temp_dir = self.temp_media
        dummy_file_name = 'test_doc.txt'
        dummy_file_path = os.path.join(temp_dir, f'user_{self.user.id}')
        os.makedirs(dummy_file_path, exist_ok=True)
        full_path = os.path.join(dummy_file_path, dummy_file_name)
        with open(full_path, 'w') as f:
            f.write('Hello, this is a test file!')
            
        file_obj = File.objects.create(
            name=dummy_file_name,
            file=f'user_{self.user.id}/{dummy_file_name}',
            user=self.user,
            size=len('Hello, this is a test file!'),
            visibility='private'
        )
        
        with self.settings(MEDIA_ROOT=temp_dir):
            # 1. Private access check: anonymous cannot download (returns 403)
            anon_client = Client()
            response = anon_client.get(reverse('download_file', args=[file_obj.id]))
            self.assertEqual(response.status_code, 403)
            
            # 2. Private access check: other logged-in user cannot download (returns 403)
            other_client = Client()
            other_client.login(username='otheruser', password='password123')
            response = other_client.get(reverse('download_file', args=[file_obj.id]))
            self.assertEqual(response.status_code, 403)
            
            # 3. Share with other user API
            self.client.login(username=self.username, password=self.password)
            response = self.client.post(reverse('api_share_file'), {
                'file_id': file_obj.id,
                'visibility': 'private',
                'usernames': 'otheruser'
            })
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.json()['is_shared'])
            
            # 4. Shared user can download now (returns 200)
            response = other_client.get(reverse('download_file', args=[file_obj.id]))
            self.assertEqual(response.status_code, 200)
            
            # 5. Shared user sees it in "shared-with-me" view
            response = other_client.get(reverse('api_get_contents') + '?filter=shared-with-me')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(response.json()['files']), 1)
            self.assertEqual(response.json()['files'][0]['id'], file_obj.id)
            
            # 6. Change visibility to public
            response = self.client.post(reverse('api_share_file'), {
                'file_id': file_obj.id,
                'visibility': 'public'
            })
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['visibility'], 'public')
            
            # 7. Anonymous client can download public file now (returns 200)
            response = anon_client.get(reverse('download_file', args=[file_obj.id]))
            self.assertEqual(response.status_code, 200)
