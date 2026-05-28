from django.urls import path
from . import views

urlpatterns = [
    # Auth Views
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    
    # Dashboard View
    path('', views.dashboard_view, name='dashboard'),
    
    # Secure Direct Download
    path('download/<int:file_id>/', views.download_file, name='download_file'),
    
    # JSON API Endpoints
    path('api/contents/', views.api_get_contents, name='api_get_contents'),
    path('api/folder/create/', views.api_create_folder, name='api_create_folder'),
    path('api/file/upload/', views.api_upload_file, name='api_upload_file'),
    path('api/item/rename/', views.api_rename_item, name='api_rename_item'),
    path('api/item/star/', views.api_toggle_star, name='api_toggle_star'),
    path('api/item/trash/', views.api_trash_item, name='api_trash_item'),
    path('api/item/restore/', views.api_restore_item, name='api_restore_item'),
    path('api/item/delete/', views.api_delete_forever, name='api_delete_forever'),
    path('api/storage/', views.api_get_storage_use, name='api_get_storage_use'),
    path('api/file/share/', views.api_share_file, name='api_share_file'),
    path('api/file/shared-users/', views.api_get_shared_users, name='api_get_shared_users'),
    path('api/file/share/remove/', views.api_remove_share, name='api_remove_share'),
]
