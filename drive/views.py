from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, FileResponse, Http404, HttpResponseForbidden
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Sum
from django.db import IntegrityError
import mimetypes
import os

from .models import Folder, File

# Helper serializers
def serialize_folder(folder):
    return {
        'id': folder.id,
        'name': folder.name,
        'is_starred': folder.is_starred,
        'is_trashed': folder.is_trashed,
        'updated_at': folder.updated_at.strftime('%Y-%m-%d %H:%M'),
        'type': 'folder'
    }

def serialize_file(file):
    return {
        'id': file.id,
        'name': file.name,
        'is_starred': file.is_starred,
        'is_trashed': file.is_trashed,
        'size': file.size,
        'readable_size': file.readable_size,
        'mime_type': file.mime_type or 'application/octet-stream',
        'extension': file.extension,
        'updated_at': file.updated_at.strftime('%Y-%m-%d %H:%M'),
        'url': file.file.url if file.file else '#',
        'type': 'file',
        'visibility': file.visibility,
        'is_shared': file.shared_with.exists(),
        'shared_count': file.shared_with.count()
    }

def get_breadcrumbs(folder):
    breadcrumbs = []
    current = folder
    while current:
        breadcrumbs.append({
            'id': current.id,
            'name': current.name
        })
        current = current.parent
    breadcrumbs.reverse()
    return breadcrumbs

# --- Authentication Views ---

def signup_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    error = None
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        
        if not username or not email or not password:
            error = "Vui lòng điền đầy đủ các thông tin."
        elif password != confirm_password:
            error = "Mật khẩu xác nhận không khớp."
        elif User.objects.filter(username=username).exists():
            error = "Tên đăng nhập đã tồn tại."
        elif User.objects.filter(email=email).exists():
            error = "Email đã được đăng ký."
        else:
            user = User.objects.create_user(username=username, email=email, password=password)
            login(request, user)
            return redirect('dashboard')
            
    return render(request, 'drive/signup.html', {'error': error})

def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
        
    error = None
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')
        else:
            error = "Tên đăng nhập hoặc mật khẩu không chính xác."
            
    return render(request, 'drive/login.html', {'error': error})

def logout_view(request):
    logout(request)
    return redirect('login')

# --- Dashboard view ---

@login_required
@ensure_csrf_cookie
def dashboard_view(request):
    return render(request, 'drive/dashboard.html')

# --- API Endpoints ---

@login_required
@require_GET
def api_get_contents(request):
    parent_id = request.GET.get('parent_id')
    filter_type = request.GET.get('filter', 'my-drive')
    query = request.GET.get('q', '').strip()
    
    folders = Folder.objects.filter(user=request.user)
    files = File.objects.filter(user=request.user)
    
    current_folder_data = None
    breadcrumbs = []
    
    # 1. Search Query override
    if query:
        folders = folders.filter(name__icontains=query, is_trashed=False)
        files = files.filter(name__icontains=query, is_trashed=False)
    # 2. Starred View
    elif filter_type == 'starred':
        folders = folders.filter(is_starred=True, is_trashed=False)
        files = files.filter(is_starred=True, is_trashed=False)
    # 3. Shared With Me View
    elif filter_type == 'shared-with-me':
        folders = Folder.objects.none()
        files = File.objects.filter(shared_with=request.user, is_trashed=False)
    # 4. Trash View
    elif filter_type == 'trash':
        folders = folders.filter(is_trashed=True)
        files = files.filter(is_trashed=True)
    # 4. Recent View
    elif filter_type == 'recent':
        folders = folders.filter(is_trashed=False).order_index = [] # We'll just filter files for recent
        folders = Folder.objects.none() # Usually drive recent mostly lists files
        files = files.filter(is_trashed=False).order_by('-updated_at')[:20]
    # 5. Normal Drive Navigation
    else:
        if parent_id and parent_id != 'null' and parent_id != 'undefined':
            current_folder = get_object_or_404(Folder, id=parent_id, user=request.user)
            current_folder_data = {
                'id': current_folder.id,
                'name': current_folder.name,
                'parent_id': current_folder.parent_id
            }
            breadcrumbs = get_breadcrumbs(current_folder)
            folders = folders.filter(parent=current_folder, is_trashed=False)
            files = files.filter(parent=current_folder, is_trashed=False)
        else:
            folders = folders.filter(parent=None, is_trashed=False)
            files = files.filter(parent=None, is_trashed=False)
            
    serialized_folders = [serialize_folder(f) for f in folders]
    serialized_files = [serialize_file(f) for f in files]
    
    return JsonResponse({
        'current_folder': current_folder_data,
        'breadcrumbs': breadcrumbs,
        'folders': serialized_folders,
        'files': serialized_files
    })

@login_required
@require_POST
def api_create_folder(request):
    name = request.POST.get('name', '').strip()
    parent_id = request.POST.get('parent_id')
    
    if not name:
        return JsonResponse({'error': 'Tên thư mục không được để trống.'}, status=400)
        
    parent = None
    if parent_id and parent_id != 'null' and parent_id != 'undefined':
        parent = get_object_or_404(Folder, id=parent_id, user=request.user)
        
    try:
        folder = Folder.objects.create(
            name=name,
            parent=parent,
            user=request.user
        )
        return JsonResponse({'folder': serialize_folder(folder)})
    except IntegrityError:
        return JsonResponse({'error': 'Thư mục có tên này đã tồn tại trong thư mục hiện tại.'}, status=400)

@login_required
@require_POST
def api_upload_file(request):
    parent_id = request.POST.get('parent_id')
    parent = None
    
    if parent_id and parent_id != 'null' and parent_id != 'undefined':
        parent = get_object_or_404(Folder, id=parent_id, user=request.user)
        
    uploaded_files = request.FILES.getlist('files')
    if not uploaded_files:
        return JsonResponse({'error': 'Không tìm thấy tệp tải lên.'}, status=400)
        
    serialized_files = []
    for f in uploaded_files:
        mime_type, _ = mimetypes.guess_type(f.name)
        file_obj = File.objects.create(
            name=f.name,
            file=f,
            parent=parent,
            user=request.user,
            size=f.size,
            mime_type=mime_type
        )
        serialized_files.append(serialize_file(file_obj))
        
    return JsonResponse({'files': serialized_files})

@login_required
@require_POST
def api_rename_item(request):
    item_type = request.POST.get('item_type')
    item_id = request.POST.get('item_id')
    new_name = request.POST.get('new_name', '').strip()
    
    if not new_name:
        return JsonResponse({'error': 'Tên mới không hợp lệ.'}, status=400)
        
    if item_type == 'folder':
        folder = get_object_or_404(Folder, id=item_id, user=request.user)
        folder.name = new_name
        try:
            folder.save()
            return JsonResponse({'item': serialize_folder(folder)})
        except IntegrityError:
            return JsonResponse({'error': 'Thư mục có tên này đã tồn tại.'}, status=400)
    elif item_type == 'file':
        file_obj = get_object_or_404(File, id=item_id, user=request.user)
        
        # Keep extension if not provided in the new name
        _, old_ext = os.path.splitext(file_obj.name)
        _, new_ext = os.path.splitext(new_name)
        
        if not new_ext and old_ext:
            new_name = new_name + old_ext
            
        file_obj.name = new_name
        file_obj.save()
        return JsonResponse({'item': serialize_file(file_obj)})
    
    return JsonResponse({'error': 'Loại đối tượng không hợp lệ.'}, status=400)

@login_required
@require_POST
def api_toggle_star(request):
    item_type = request.POST.get('item_type')
    item_id = request.POST.get('item_id')
    
    if item_type == 'folder':
        folder = get_object_or_404(Folder, id=item_id, user=request.user)
        folder.is_starred = not folder.is_starred
        folder.save()
        return JsonResponse({'is_starred': folder.is_starred})
    elif item_type == 'file':
        file_obj = get_object_or_404(File, id=item_id, user=request.user)
        file_obj.is_starred = not file_obj.is_starred
        file_obj.save()
        return JsonResponse({'is_starred': file_obj.is_starred})
        
    return JsonResponse({'error': 'Loại đối tượng không hợp lệ.'}, status=400)

@login_required
@require_POST
def api_trash_item(request):
    item_type = request.POST.get('item_type')
    item_id = request.POST.get('item_id')
    
    if item_type == 'folder':
        folder = get_object_or_404(Folder, id=item_id, user=request.user)
        folder.is_trashed = True
        folder.save()
        
        # Recursively trash subfolders and files to hide them
        def recurse_trash(fld):
            fld.subfolders.all().update(is_trashed=True)
            fld.files.all().update(is_trashed=True)
            for sub in fld.subfolders.all():
                recurse_trash(sub)
        
        recurse_trash(folder)
        return JsonResponse({'success': True})
    elif item_type == 'file':
        file_obj = get_object_or_404(File, id=item_id, user=request.user)
        file_obj.is_trashed = True
        file_obj.save()
        return JsonResponse({'success': True})
        
    return JsonResponse({'error': 'Loại đối tượng không hợp lệ.'}, status=400)

@login_required
@require_POST
def api_restore_item(request):
    item_type = request.POST.get('item_type')
    item_id = request.POST.get('item_id')
    
    if item_type == 'folder':
        folder = get_object_or_404(Folder, id=item_id, user=request.user)
        folder.is_trashed = False
        folder.save()
        
        # Recursively restore subfolders and files
        def recurse_restore(fld):
            fld.subfolders.all().update(is_trashed=False)
            fld.files.all().update(is_trashed=False)
            for sub in fld.subfolders.all():
                recurse_restore(sub)
                
        recurse_restore(folder)
        return JsonResponse({'success': True})
    elif item_type == 'file':
        file_obj = get_object_or_404(File, id=item_id, user=request.user)
        file_obj.is_trashed = False
        file_obj.save()
        return JsonResponse({'success': True})
        
    return JsonResponse({'error': 'Loại đối tượng không hợp lệ.'}, status=400)

@login_required
@require_POST
def api_delete_forever(request):
    item_type = request.POST.get('item_type')
    item_id = request.POST.get('item_id')
    
    if item_type == 'folder':
        folder = get_object_or_404(Folder, id=item_id, user=request.user)
        
        # Recursively delete files on disk first
        def delete_files_on_disk(fld):
            for file_obj in fld.files.all():
                if file_obj.file and os.path.exists(file_obj.file.path):
                    try:
                        os.remove(file_obj.file.path)
                    except OSError:
                        pass
            for sub in fld.subfolders.all():
                delete_files_on_disk(sub)
                
        delete_files_on_disk(folder)
        folder.delete()
        return JsonResponse({'success': True})
    elif item_type == 'file':
        file_obj = get_object_or_404(File, id=item_id, user=request.user)
        if file_obj.file and os.path.exists(file_obj.file.path):
            try:
                os.remove(file_obj.file.path)
            except OSError:
                pass
        file_obj.delete()
        return JsonResponse({'success': True})
        
    return JsonResponse({'error': 'Loại đối tượng không hợp lệ.'}, status=400)

@login_required
@require_GET
def api_get_storage_use(request):
    aggregate = File.objects.filter(user=request.user).aggregate(total_bytes=Sum('size'))
    total_bytes = aggregate['total_bytes'] or 0
    
    # Format readable size
    if total_bytes < 1024:
        readable = f"{total_bytes} B"
    elif total_bytes < 1024 * 1024:
        readable = f"{total_bytes / 1024:.1f} KB"
    elif total_bytes < 1024 * 1024 * 1024:
        readable = f"{total_bytes / (1024 * 1024):.1f} MB"
    else:
        readable = f"{total_bytes / (1024 * 1024 * 1024):.1f} GB"
        
    # Standard GDrive free space: 15 GB
    limit_bytes = 15 * 1024 * 1024 * 1024
    percentage = min(100.0, (total_bytes / limit_bytes) * 100.0)
    
    return JsonResponse({
        'total_bytes': total_bytes,
        'readable': readable,
        'limit_bytes': limit_bytes,
        'percentage': round(percentage, 2)
    })

# Secure download view (removed login_required to allow anonymous downloads of public files)
def download_file(request, file_id):
    file_obj = get_object_or_404(File, id=file_id)
    
    is_owner = (request.user.is_authenticated and file_obj.user == request.user)
    is_public = (file_obj.visibility == 'public')
    is_shared = (request.user.is_authenticated and file_obj.shared_with.filter(id=request.user.id).exists())
    
    if not (is_owner or is_public or is_shared):
        return HttpResponseForbidden("Bạn không có quyền tải xuống tệp này.")
        
    if not file_obj.file or not os.path.exists(file_obj.file.path):
        raise Http404("Tệp không tồn tại trên hệ thống.")
        
    response = FileResponse(open(file_obj.file.path, 'rb'), as_attachment=True, filename=file_obj.name)
    return response

@login_required
@require_POST
def api_share_file(request):
    file_id = request.POST.get('file_id')
    visibility = request.POST.get('visibility')  # 'public' or 'private'
    usernames_str = request.POST.get('usernames', '').strip()  # comma separated
    
    file_obj = get_object_or_404(File, id=file_id, user=request.user)
    
    if visibility in ['public', 'private']:
        file_obj.visibility = visibility
        file_obj.save()
        
    errors = []
    successes = []
    
    if usernames_str:
        usernames = [u.strip() for u in usernames_str.split(',') if u.strip()]
        for username in usernames:
            # Do not share with oneself
            if username == request.user.username:
                continue
            try:
                user_to_share = User.objects.get(username=username)
                file_obj.shared_with.add(user_to_share)
                successes.append(username)
            except User.DoesNotExist:
                errors.append(f"Không tìm thấy người dùng '{username}'.")
                
    return JsonResponse({
        'visibility': file_obj.visibility,
        'successes': successes,
        'errors': errors,
        'is_shared': file_obj.shared_with.exists(),
        'shared_count': file_obj.shared_with.count()
    })

@login_required
@require_GET
def api_get_shared_users(request):
    file_id = request.GET.get('file_id')
    file_obj = get_object_or_404(File, id=file_id, user=request.user)
    
    shared_users = [{
        'id': u.id,
        'username': u.username,
        'email': u.email
    } for u in file_obj.shared_with.all()]
    
    return JsonResponse({
        'visibility': file_obj.visibility,
        'shared_users': shared_users
    })

@login_required
@require_POST
def api_remove_share(request):
    file_id = request.POST.get('file_id')
    user_id = request.POST.get('user_id')
    
    file_obj = get_object_or_404(File, id=file_id, user=request.user)
    user_to_remove = get_object_or_404(User, id=user_id)
    
    file_obj.shared_with.remove(user_to_remove)
    
    return JsonResponse({
        'success': True,
        'is_shared': file_obj.shared_with.exists(),
        'shared_count': file_obj.shared_with.count()
    })
