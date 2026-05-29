/**
 * Google Drive Clone - SPA Client JS Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let currentFolderId = null;
    let currentFilter = 'my-drive'; // 'my-drive', 'recent', 'starred', 'trash'
    let currentLayout = 'grid'; // 'grid' or 'list'
    let searchQuery = '';
    
    let activeFolders = [];
    let activeFiles = [];
    let activeContextItem = null; // { id, type, name }
    
    // --- DOM Elements Cache ---
    const foldersSection = document.getElementById('folders-section');
    const filesSection = document.getElementById('files-section');
    const foldersGrid = document.getElementById('folders-grid');
    const filesGrid = document.getElementById('files-grid');
    const contentContainer = document.getElementById('content-container');
    const emptyState = document.getElementById('empty-state');
    
    const newDropdownBtn = document.getElementById('new-dropdown-btn');
    const newMenu = document.getElementById('new-menu');
    const fileSelector = document.getElementById('file-selector');
    const createFolderTrigger = document.getElementById('create-folder-trigger');
    const uploadFileTrigger = document.getElementById('upload-file-trigger');
    
    const sidebarNavLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const storageFill = document.getElementById('storage-fill');
    const storageText = document.getElementById('storage-text');
    
    const breadcrumbs = document.getElementById('breadcrumbs');
    const layoutToggleBtn = document.getElementById('layout-toggle-btn');
    
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    const dropZone = document.getElementById('drop-zone');
    const dragOverlay = document.getElementById('drag-overlay');
    
    // Context Menu
    const contextMenu = document.getElementById('context-menu');
    const ctxStar = document.getElementById('ctx-star');
    const ctxShare = document.getElementById('ctx-share');
    const ctxRename = document.getElementById('ctx-rename');
    const ctxDownload = document.getElementById('ctx-download');
    const ctxTrash = document.getElementById('ctx-trash');
    const ctxRestore = document.getElementById('ctx-restore');
    const ctxDeleteForever = document.getElementById('ctx-delete-forever');
    
    // Modals
    const createFolderModal = document.getElementById('create-folder-modal');
    const newFolderNameInput = document.getElementById('new-folder-name');
    const cancelFolderBtn = document.getElementById('cancel-folder-btn');
    const confirmFolderBtn = document.getElementById('confirm-folder-btn');
    
    const renameModal = document.getElementById('rename-modal');
    const renameInput = document.getElementById('rename-input');
    const cancelRenameBtn = document.getElementById('cancel-rename-btn');
    const confirmRenameBtn = document.getElementById('confirm-rename-btn');
    
    const confirmDeleteModal = document.getElementById('confirm-delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    // Share Modal
    const shareModal = document.getElementById('share-modal');
    const shareFileName = document.getElementById('share-file-name');
    const shareFileLink = document.getElementById('share-file-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const shareVisibilitySelect = document.getElementById('share-visibility-select');
    const shareUsernameInput = document.getElementById('share-username-input');
    const addShareUserBtn = document.getElementById('add-share-user-btn');
    const shareErrorMessage = document.getElementById('share-error-message');
    const shareErrorText = document.getElementById('share-error-text');
    const sharedUsersList = document.getElementById('shared-users-list');
    const closeShareBtn = document.getElementById('close-share-btn');
    
    // Upload Progress Widget
    const uploadWidget = document.getElementById('upload-widget');
    const uploadWidgetToggle = document.getElementById('upload-widget-toggle');
    const uploadWidgetTitle = document.getElementById('upload-widget-title');
    const uploadWidgetCloseBtn = document.getElementById('upload-widget-close-btn');
    const uploadList = document.getElementById('upload-list');

    // --- Core CSRF Handler helper ---
    function t(key) {
        return (window.I18N && typeof window.I18N.t === 'function') ? window.I18N.t(key) : key;
    }

    function getCSRFHeaders() {
        return {
            'X-CSRFToken': CSRF_TOKEN
        };
    }

    // --- Init App ---
    function init() {
        bindEvents();
        updateLanguageUI();
        fetchStorageUsage();
        loadContentsFromHash();
    }

    function updateLanguageUI() {
        const langBtnLabel = document.querySelector('[data-lang-current]');
        if (langBtnLabel) {
            langBtnLabel.textContent = (window.I18N && window.I18N.getCurrentLang ? window.I18N.getCurrentLang().toUpperCase() : 'EN');
        }
        if (window.I18N && typeof window.I18N.applyTranslations === 'function') {
            window.I18N.applyTranslations();
        }
    }

    // --- Hash Navigation helper (for back-button SPA routing) ---
    function loadContentsFromHash() {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const folder = params.get('folder');
            const filter = params.get('filter') || 'my-drive';
            const search = params.get('q') || '';
            
            currentFolderId = (folder && folder !== 'root') ? folder : null;
            currentFilter = filter;
            searchQuery = search;
            
            // Sync Search input box
            searchInput.value = searchQuery;
            if (searchQuery) {
                clearSearchBtn.style.display = 'block';
            } else {
                clearSearchBtn.style.display = 'none';
            }
            
            // Sync Sidebar UI
            sidebarNavLinks.forEach(link => {
                if (link.getAttribute('data-filter') === currentFilter && !searchQuery) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
        
        fetchContents();
    }

    function setHash() {
        const params = new URLSearchParams();
        if (currentFolderId) params.append('folder', currentFolderId);
        if (currentFilter && currentFilter !== 'my-drive') params.append('filter', currentFilter);
        if (searchQuery) params.append('q', searchQuery);
        
        window.location.hash = params.toString();
    }

    // --- Content Loader ---
    function fetchContents() {
        let url = `/api/contents/?filter=${currentFilter}`;
        if (currentFolderId) {
            url += `&parent_id=${currentFolderId}`;
        }
        if (searchQuery) {
            url += `&q=${encodeURIComponent(searchQuery)}`;
        }
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                activeFolders = data.folders || [];
                activeFiles = data.files || [];
                renderContents(data.breadcrumbs, data.current_folder);
            })
            .catch(err => {
                console.error("Lỗi khi tải dữ liệu:", err);
            });
    }

    // --- Render Elements ---
    function renderContents(breadcrumbsData, currentFolder) {
        // Clear grids
        foldersGrid.innerHTML = '';
        filesGrid.innerHTML = '';
        
        // 1. Render Breadcrumbs
        renderBreadcrumbs(breadcrumbsData, currentFolder);
        
        const hasFolders = activeFolders.length > 0;
        const hasFiles = activeFiles.length > 0;
        
        if (!hasFolders && !hasFiles) {
            emptyState.style.display = 'flex';
            contentContainer.style.display = 'none';
            
            // Customize empty state details
            const emptyTitle = document.getElementById('empty-title');
            const emptyDesc = document.getElementById('empty-desc');
            const emptyIcon = document.querySelector('.empty-icon');
            
            if (currentFilter === 'trash') {
                emptyTitle.textContent = t('empty.trash_title');
                emptyDesc.textContent = t('empty.trash_desc');
                emptyIcon.textContent = 'delete_forever';
            } else if (currentFilter === 'starred') {
                emptyTitle.textContent = t('empty.starred_title');
                emptyDesc.textContent = t('empty.starred_desc');
                emptyIcon.textContent = 'star';
            } else if (searchQuery) {
                emptyTitle.textContent = t('empty.search_title');
                emptyDesc.textContent = `${t('empty.search_desc_prefix')} "${searchQuery}"`;
                emptyIcon.textContent = 'search_off';
            } else {
                emptyTitle.textContent = t('empty.folder_title');
                emptyDesc.textContent = t('empty.folder_desc');
                emptyIcon.textContent = 'folder_open';
            }
        } else {
            emptyState.style.display = 'none';
            contentContainer.style.display = 'flex';
            
            // Adjust layouts
            if (currentLayout === 'grid') {
                contentContainer.className = "content-view grid-view";
                
                // Folders section
                if (hasFolders) {
                    foldersSection.style.display = 'flex';
                    activeFolders.forEach(folder => {
                        foldersGrid.appendChild(createFolderGridItem(folder));
                    });
                } else {
                    foldersSection.style.display = 'none';
                }
                
                // Files section
                if (hasFiles) {
                    filesSection.style.display = 'flex';
                    activeFiles.forEach(file => {
                        filesGrid.appendChild(createFileGridItem(file));
                    });
                } else {
                    filesSection.style.display = 'none';
                }
            } else {
                // List View Table
                contentContainer.className = "content-view list-view";
                foldersSection.style.display = 'none';
                filesSection.style.display = 'none';
                
                const table = createListViewTable();
                contentContainer.appendChild(table);
            }
        }
    }

    // --- Breadcrumbs Assembler ---
    function renderBreadcrumbs(crumbs, currentFolder) {
        breadcrumbs.innerHTML = '';
        
        let rootLabel = t('workspace.breadcrumb_my_drive');
        if (currentFilter === 'recent') rootLabel = t('workspace.breadcrumb_recent');
        else if (currentFilter === 'starred') rootLabel = t('workspace.breadcrumb_starred');
        else if (currentFilter === 'trash') rootLabel = t('workspace.breadcrumb_trash');

        if (searchQuery) {
            rootLabel = `${t('workspace.search_results')} "${searchQuery}"`;
        }
        
        // Add root item
        const rootCrumb = document.createElement('span');
        rootCrumb.className = `breadcrumb-item font-title ${(!currentFolderId && !searchQuery) ? 'active' : ''}`;
        rootCrumb.textContent = rootLabel;
        rootCrumb.addEventListener('click', () => {
            if (searchQuery) {
                searchQuery = '';
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
            }
            currentFolderId = null;
            setHash();
        });
        breadcrumbs.appendChild(rootCrumb);
        
        // Render ancestor trail
        if (crumbs && crumbs.length > 0 && !searchQuery) {
            crumbs.forEach((crumb, idx) => {
                // separator
                const sep = document.createElement('span');
                sep.className = 'breadcrumb-separator material-symbols-rounded';
                sep.textContent = 'chevron_right';
                breadcrumbs.appendChild(sep);
                
                // crumb node
                const node = document.createElement('span');
                const isLast = (idx === crumbs.length - 1);
                node.className = `breadcrumb-item font-title ${isLast ? 'active' : ''}`;
                node.textContent = crumb.name;
                if (!isLast) {
                    node.addEventListener('click', () => {
                        currentFolderId = crumb.id;
                        setHash();
                    });
                }
                breadcrumbs.appendChild(node);
            });
        }
    }

    // --- HTML Component builders ---
    
    // 1. Grid Folder Card
    function createFolderGridItem(folder) {
        const div = document.createElement('div');
        div.className = `folder-item ${folder.is_starred ? 'is-starred' : ''}`;
        div.setAttribute('data-id', folder.id);
        div.setAttribute('data-type', 'folder');
        
        div.innerHTML = `
            <span class="material-symbols-rounded folder-icon">folder</span>
            <span class="folder-name">${escapeHTML(folder.name)}</span>
            <span class="material-symbols-rounded star-indicator">star</span>
        `;
        
        // Double-click to navigate
        div.addEventListener('dblclick', () => {
            if (currentFilter !== 'trash') {
                currentFolderId = folder.id;
                setHash();
            }
        });
        
        // Context Menu Handler
        div.addEventListener('contextmenu', (e) => {
            showContextMenu(e, folder.id, 'folder', folder.name, folder.is_starred);
        });
        
        // Selection highlight
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            clearAllSelections();
            div.classList.add('selected');
        });
        
        return div;
    }

    // 2. Grid File Card
    function createFileGridItem(file) {
        const div = document.createElement('div');
        div.className = `file-item ${file.is_starred ? 'is-starred' : ''}`;
        div.setAttribute('data-id', file.id);
        div.setAttribute('data-type', 'file');
        
        // File extension color class
        const extClass = `ext-${file.extension}`;
        let previewHtml = `<span class="material-symbols-rounded file-preview-icon ${extClass}">description</span>`;
        
        // Image preview if it is an image
        const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(file.extension);
        if (isImage && file.url !== '#') {
            previewHtml = `<img src="${file.url}" style="width:100%; height:100%; object-fit: cover;" alt="${file.name}">`;
        }
        
        // Visibility Badge
        let badgeHtml = '';
        if (file.visibility === 'public') {
            badgeHtml = `<span class="material-symbols-rounded visibility-badge public tooltip" data-tooltip="${t('share.public_badge')}">public</span>`;
        } else if (file.is_shared) {
            badgeHtml = `<span class="material-symbols-rounded visibility-badge shared tooltip" data-tooltip="${t('share.shared_badge_prefix')} ${file.shared_count} ${t('share.shared_badge_suffix')}">group</span>`;
        }
        
        div.innerHTML = `
            <div class="file-preview">
                ${previewHtml}
            </div>
            <div class="file-details">
                <span class="material-symbols-rounded file-detail-icon ${extClass}">description</span>
                <div class="file-info">
                    <span class="file-name" style="display:flex; align-items:center; gap:4px; max-width:100%;">
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex-grow:1;">${escapeHTML(file.name)}</span>
                        ${badgeHtml}
                    </span>
                    <span class="file-size">${file.readable_size}</span>
                </div>
                <span class="material-symbols-rounded star-indicator">star</span>
            </div>
        `;
        
        // Click highlights, double click triggers direct action (download)
        div.addEventListener('dblclick', () => {
            if (currentFilter !== 'trash') {
                window.open(`/download/${file.id}/`, '_blank');
            }
        });
        
        // Context Menu
        div.addEventListener('contextmenu', (e) => {
            showContextMenu(e, file.id, 'file', file.name, file.is_starred);
        });
        
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            clearAllSelections();
            div.classList.add('selected');
        });
        
        return div;
    }

    // 3. ListView Table Builder
    function createListViewTable() {
        const table = document.createElement('table');
        table.className = "list-table";
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width: 50%">${t('list.name')}</th>
                    <th style="width: 15%">${t('list.owner')}</th>
                    <th style="width: 20%">${t('list.last_modified')}</th>
                    <th style="width: 15%">${t('list.file_size')}</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        // Append folders first
        activeFolders.forEach(folder => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', folder.id);
            tr.setAttribute('data-type', 'folder');
            tr.className = folder.is_starred ? 'is-starred' : '';
            
            tr.innerHTML = `
                <td>
                    <div class="list-name-cell">
                        <span class="material-symbols-rounded">folder</span>
                        <span class="list-name-text">${escapeHTML(folder.name)}</span>
                        <span class="material-symbols-rounded star-indicator">star</span>
                    </div>
                </td>
                <td class="list-owner-cell">${t('list.owner_me')}</td>
                <td class="list-date-cell">${folder.updated_at}</td>
                <td class="list-size-cell">—</td>
            `;
            
            tr.addEventListener('dblclick', () => {
                if (currentFilter !== 'trash') {
                    currentFolderId = folder.id;
                    setHash();
                }
            });
            
            tr.addEventListener('contextmenu', (e) => {
                showContextMenu(e, folder.id, 'folder', folder.name, folder.is_starred);
            });
            
            tr.addEventListener('click', (e) => {
                e.stopPropagation();
                clearAllSelections();
                tr.classList.add('selected');
            });
            
            tbody.appendChild(tr);
        });
        
        // Append files next
        activeFiles.forEach(file => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', file.id);
            tr.setAttribute('data-type', 'file');
            tr.className = file.is_starred ? 'is-starred' : '';
            
            const extClass = `ext-${file.extension}`;
            
            // Visibility Badge
            let badgeHtml = '';
            if (file.visibility === 'public') {
                badgeHtml = `<span class="material-symbols-rounded visibility-badge public tooltip" data-tooltip="${t('share.public_badge')}">public</span>`;
            } else if (file.is_shared) {
                badgeHtml = `<span class="material-symbols-rounded visibility-badge shared tooltip" data-tooltip="${t('share.shared_badge_prefix')} ${file.shared_count} ${t('share.shared_badge_suffix')}">group</span>`;
            }
            
            tr.innerHTML = `
                <td>
                    <div class="list-name-cell">
                        <span class="material-symbols-rounded ${extClass}">description</span>
                        <span class="list-name-text" style="display:flex; align-items:center; gap:4px; flex-grow:1; overflow:hidden;">
                            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(file.name)}</span>
                            ${badgeHtml}
                        </span>
                        <span class="material-symbols-rounded star-indicator">star</span>
                    </div>
                </td>
                <td class="list-owner-cell">${t('list.owner_me')}</td>
                <td class="list-date-cell">${file.updated_at}</td>
                <td class="list-size-cell">${file.readable_size}</td>
            `;
            
            tr.addEventListener('dblclick', () => {
                if (currentFilter !== 'trash') {
                    window.open(`/download/${file.id}/`, '_blank');
                }
            });
            
            tr.addEventListener('contextmenu', (e) => {
                showContextMenu(e, file.id, 'file', file.name, file.is_starred);
            });
            
            tr.addEventListener('click', (e) => {
                e.stopPropagation();
                clearAllSelections();
                tr.classList.add('selected');
            });
            
            tbody.appendChild(tr);
        });
        
        return table;
    }

    function clearAllSelections() {
        document.querySelectorAll('.folder-item, .file-item, .list-table tbody tr').forEach(el => {
            el.classList.remove('selected');
        });
    }

    // --- Floating Context Menu Handler ---
    function showContextMenu(e, id, type, name, isStarred) {
        e.preventDefault();
        e.stopPropagation();
        
        // Record active context item info
        activeContextItem = { id, type, name, isStarred };
        
        // Style adjustments based on state/filter
        if (currentFilter === 'trash') {
            ctxStar.style.display = 'none';
            ctxShare.style.display = 'none';
            ctxRename.style.display = 'none';
            ctxDownload.style.display = 'none';
            ctxTrash.style.display = 'none';
            
            ctxRestore.style.display = 'flex';
            ctxDeleteForever.style.display = 'flex';
        } else {
            ctxStar.style.display = 'flex';
            ctxRename.style.display = 'flex';
            ctxRestore.style.display = 'none';
            ctxDeleteForever.style.display = 'none';
            
            // Share only files
            ctxShare.style.display = (type === 'file') ? 'flex' : 'none';
            
            // Star option label toggling
            const starText = ctxStar.querySelector('.ctx-text');
            const starIcon = ctxStar.querySelector('.material-symbols-rounded');
            if (isStarred) {
                starText.textContent = t('ctx.remove_star');
                starIcon.textContent = "star_rate";
                starIcon.style.color = "#f29900";
            } else {
                starText.textContent = t('ctx.add_star');
                starIcon.textContent = "star";
                starIcon.style.color = "";
            }
            
            // Download option logic (only file gets downloaded)
            if (type === 'file') {
                ctxDownload.style.display = 'flex';
            } else {
                ctxDownload.style.display = 'none';
            }
            
            ctxTrash.style.display = 'flex';
        }
        
        // Set coordinates
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.display = 'block';
        
        // Prevent overflowing edges
        const menuHeight = contextMenu.offsetHeight;
        const menuWidth = contextMenu.offsetWidth;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if ((e.clientX + menuWidth) > windowWidth) {
            contextMenu.style.left = `${windowWidth - menuWidth - 8}px`;
        }
        if ((e.clientY + menuHeight) > windowHeight) {
            contextMenu.style.top = `${windowHeight - menuHeight - 8}px`;
        }
    }

    function hideContextMenu() {
        contextMenu.style.display = 'none';
    }

    // --- File Upload Mechanics with Docked Widget Progress ---
    function triggerFilesUpload(files) {
        if (files.length === 0) return;
        
        // Expand the progress panel
        uploadWidget.classList.remove('collapsed');
        
        // Upload each file individually to show detailed progress bars
        Array.from(files).forEach(file => {
            uploadSingleFile(file);
        });
    }

    function uploadSingleFile(file) {
        // Create dynamic list entry in widget
        const uploadId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'upload-item';
        itemDiv.id = uploadId;
        
        itemDiv.innerHTML = `
            <div class="upload-item-info">
                <span class="material-symbols-rounded file-icon">description</span>
                <span class="file-name">${escapeHTML(file.name)}</span>
            </div>
            <div class="upload-item-status">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: 0%"></div>
                </div>
                <span class="material-symbols-rounded status-icon pending">pending</span>
            </div>
        `;
        uploadList.appendChild(itemDiv);
        updateUploadWidgetHeaderTitle();
        
        const progressBarFill = itemDiv.querySelector('.progress-bar-fill');
        const statusIcon = itemDiv.querySelector('.status-icon');
        
        // Use XMLHttpRequest for actual upload progress callback
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        
        formData.append('files', file);
        if (currentFolderId) {
            formData.append('parent_id', currentFolderId);
        }
        
        xhr.open('POST', '/api/file/upload/', true);
        
        // Add CSRF
        xhr.setRequestHeader('X-CSRFToken', CSRF_TOKEN);
        
        // Progress Listener
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBarFill.style.width = percent + '%';
            }
        });
        
        // Finish Listener
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    progressBarFill.style.width = '100%';
                    progressBarFill.style.backgroundColor = '#0f9d58';
                    
                    statusIcon.className = "material-symbols-rounded status-icon success";
                    statusIcon.textContent = "check_circle";
                    
                    // Refresh view & storage counts
                    fetchContents();
                    fetchStorageUsage();
                } else {
                    statusIcon.className = "material-symbols-rounded status-icon error";
                    statusIcon.textContent = "cancel";
                    
                    try {
                        const resJson = JSON.parse(xhr.responseText);
                        console.error("Lỗi khi tải tệp lên:", resJson.error);
                    } catch(e) {
                        console.error("Lỗi mạng tải lên:", xhr.statusText);
                    }
                }
                updateUploadWidgetHeaderTitle();
            }
        };
        
        xhr.send(formData);
    }

    function updateUploadWidgetHeaderTitle() {
        const items = uploadList.querySelectorAll('.upload-item');
        const successes = uploadList.querySelectorAll('.status-icon.success').length;
        
        if (items.length === 0) {
            uploadWidgetTitle.textContent = t('upload.no_files');
        } else if (successes === items.length) {
            uploadWidgetTitle.textContent = `${t('upload.complete_prefix')} ${successes}/${items.length} ${t('upload.files')}`;
        } else {
            uploadWidgetTitle.textContent = `${t('upload.uploading')} ${items.length - successes} ${t('upload.files')}...`;
        }
    }

    // --- Dynamic Storage Capacity Meter ---
    function fetchStorageUsage() {
        fetch('/api/storage/')
            .then(res => res.json())
            .then(data => {
                storageFill.style.width = `${data.percentage}%`;
                storageText.textContent = `${t('storage.used_prefix')} ${data.readable} ${t('storage.used_suffix')}`;
            })
            .catch(err => {
                console.error("Lỗi tải thông số dung lượng:", err);
            });
    }

    // --- Action dispatchers ---

    function createFolder(name) {
        const formData = new FormData();
        formData.append('name', name);
        if (currentFolderId) {
            formData.append('parent_id', currentFolderId);
        }
        
        fetch('/api/folder/create/', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: formData
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error); });
                }
                return res.json();
            })
            .then(data => {
                closeModal(createFolderModal);
                fetchContents();
            })
            .catch(err => {
                alert(err.message || t('error.cannot_create_folder'));
            });
    }

    function renameItem(newName) {
        const formData = new FormData();
        formData.append('item_id', activeContextItem.id);
        formData.append('item_type', activeContextItem.type);
        formData.append('new_name', newName);
        
        fetch('/api/item/rename/', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: formData
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error); });
                }
                return res.json();
            })
            .then(data => {
                closeModal(renameModal);
                fetchContents();
            })
            .catch(err => {
                alert(err.message || t('error.cannot_rename'));
            });
    }

    function toggleStarItem() {
        const formData = new FormData();
        formData.append('item_id', activeContextItem.id);
        formData.append('item_type', activeContextItem.type);
        
        fetch('/api/item/star/', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                fetchContents();
            })
            .catch(err => console.error("Lỗi khi gắn sao:", err));
    }

    function trashItem() {
        const formData = new FormData();
        formData.append('item_id', activeContextItem.id);
        formData.append('item_type', activeContextItem.type);
        
        fetch('/api/item/trash/', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                fetchContents();
            })
            .catch(err => console.error("Lỗi khi chuyển vào thùng rác:", err));
    }

    function restoreItem() {
        const formData = new FormData();
        formData.append('item_id', activeContextItem.id);
        formData.append('item_type', activeContextItem.type);
        
        fetch('/api/item/restore/', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                fetchContents();
            })
            .catch(err => console.error("Lỗi khi khôi phục:", err));
    }

    function deleteForeverItem() {
        const formData = new FormData();
        formData.append('item_id', activeContextItem.id);
        formData.append('item_type', activeContextItem.type);
        
        fetch('/api/item/delete/', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                closeModal(confirmDeleteModal);
                fetchContents();
                fetchStorageUsage();
            })
            .catch(err => console.error("Lỗi khi xóa vĩnh viễn:", err));
    }

    // --- Modal overlays control helpers ---
    function openModal(modal) {
        modal.classList.add('show');
        const input = modal.querySelector('input');
        if (input) {
            input.value = '';
            setTimeout(() => input.focus(), 50);
        }
    }

    function closeModal(modal) {
        modal.classList.remove('show');
    }

    // --- File Sharing Action Dispatchers ---
    
    function fetchSharedUsers(fileId) {
        sharedUsersList.innerHTML = `<div style="padding:10px; font-size:12px; color:var(--text-secondary); text-align:center;">${t('share.loading_users')}</div>`;
        shareErrorMessage.style.display = 'none';
        
        fetch(`/api/file/shared-users/?file_id=${fileId}`)
            .then(res => res.json())
            .then(data => {
                // Update dropdown and name
                shareVisibilitySelect.value = data.visibility;
                shareFileName.textContent = activeContextItem.name;
                shareFileLink.value = window.location.origin + "/download/" + fileId + "/";
                
                // Populate users list
                sharedUsersList.innerHTML = '';
                const users = data.shared_users || [];
                if (users.length === 0) {
                    sharedUsersList.innerHTML = `<div style="padding:16px; font-size:12px; color:var(--text-secondary); text-align:center;">${t('share.no_shared_users')}</div>`;
                } else {
                    users.forEach(user => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'shared-user-item';
                        itemDiv.innerHTML = `
                            <div class="shared-user-info">
                                <span class="shared-user-name">${escapeHTML(user.username)}</span>
                                <span class="shared-user-email">${escapeHTML(user.email || t('share.no_email'))}</span>
                            </div>
                            <button class="remove-share-btn" data-user-id="${user.id}">${t('share.revoke')}</button>
                        `;
                        
                        // Remove trigger
                        itemDiv.querySelector('.remove-share-btn').addEventListener('click', () => {
                            removeShareUser(user.id);
                        });
                        
                        sharedUsersList.appendChild(itemDiv);
                    });
                }
            })
            .catch(err => {
                console.error("Lỗi khi tải người dùng chia sẻ:", err);
                sharedUsersList.innerHTML = `<div style="padding:10px; font-size:12px; color:var(--text-danger); text-align:center;">${t('share.load_error')}</div>`;
            });
    }

    function shareFileVisibility(visibility) {
        const formData = new FormData();
        formData.append('file_id', activeContextItem.id);
        formData.append('visibility', visibility);
        
        fetch('/api/file/share/', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                fetchContents(); // Refresh list to update visibility badges
            })
            .catch(err => {
                console.error("Lỗi cập nhật chế độ công khai:", err);
                alert(t('error.cannot_update_access'));
            });
    }

    function addShareUser(username) {
        shareErrorMessage.style.display = 'none';
        
        const formData = new FormData();
        formData.append('file_id', activeContextItem.id);
        formData.append('usernames', username);
        
        fetch('/api/file/share/', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.errors && data.errors.length > 0) {
                    shareErrorText.textContent = data.errors[0];
                    shareErrorMessage.style.display = 'flex';
                } else {
                    shareUsernameInput.value = '';
                    fetchSharedUsers(activeContextItem.id);
                    fetchContents();
                }
            })
            .catch(err => {
                console.error("Lỗi thêm chia sẻ người dùng:", err);
                shareErrorText.textContent = t('error.server_connection');
                shareErrorMessage.style.display = 'flex';
            });
    }

    function removeShareUser(userId) {
        const formData = new FormData();
        formData.append('file_id', activeContextItem.id);
        formData.append('user_id', userId);
        
        fetch('/api/file/share/remove/', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                fetchSharedUsers(activeContextItem.id);
                fetchContents();
            })
            .catch(err => {
                console.error("Lỗi xóa chia sẻ người dùng:", err);
                alert(t('error.cannot_revoke'));
            });
    }

    // --- Bind Interactivity & Events ---
    function bindEvents() {
        // Window hash change routing
        window.addEventListener('hashchange', loadContentsFromHash);
        
        // Hide context menu on left click anywhere
        document.addEventListener('click', hideContextMenu);
        
        // Sidebar active styles on click
        sidebarNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                const targetFilter = link.getAttribute('data-filter');
                sidebarNavLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Switch sidebar focus
                currentFilter = targetFilter;
                currentFolderId = null;
                searchQuery = '';
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                
                setHash();
            });
        });
        
        // "New" dropdown toggle
        newDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            newMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            newMenu.classList.remove('show');
        });
        
        // Create Folder Trigger
        createFolderTrigger.addEventListener('click', () => {
            openModal(createFolderModal);
        });
        
        cancelFolderBtn.addEventListener('click', () => closeModal(createFolderModal));
        confirmFolderBtn.addEventListener('click', () => {
            const name = newFolderNameInput.value.trim();
            createFolder(name || t('modal.new_folder_placeholder'));
        });
        newFolderNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const name = newFolderNameInput.value.trim();
                createFolder(name || t('modal.new_folder_placeholder'));
            }
        });
        
        // Upload File Trigger
        uploadFileTrigger.addEventListener('click', () => {
            fileSelector.click();
        });
        
        fileSelector.addEventListener('change', (e) => {
            triggerFilesUpload(e.target.files);
            fileSelector.value = ''; // clear selector
        });
        
        // Drag & Drop bindings
        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentFilter !== 'trash') {
                dragOverlay.style.display = 'flex';
            }
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentFilter !== 'trash') {
                dragOverlay.style.display = 'flex';
            }
        });
        
        dragOverlay.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragOverlay.style.display = 'none';
        });
        
        dragOverlay.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragOverlay.style.display = 'none';
            
            if (currentFilter !== 'trash' && e.dataTransfer.files) {
                triggerFilesUpload(e.dataTransfer.files);
            }
        });
        
        // Search bar interaction with debounce
        let searchTimeout = null;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.trim()) {
                clearSearchBtn.style.display = 'block';
            } else {
                clearSearchBtn.style.display = 'none';
            }
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = query.trim();
                setHash();
            }, 400); // 400ms debounce
        });
        
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.style.display = 'none';
            setHash();
        });
        
        // Layout view toggle Grid vs List
        layoutToggleBtn.addEventListener('click', () => {
            const toggleIcon = layoutToggleBtn.querySelector('span');
            if (currentLayout === 'grid') {
                currentLayout = 'list';
                toggleIcon.textContent = 'grid_view';
                layoutToggleBtn.setAttribute('data-tooltip', t('workspace.toggle_grid'));
            } else {
                currentLayout = 'grid';
                toggleIcon.textContent = 'view_list';
                layoutToggleBtn.setAttribute('data-tooltip', t('workspace.toggle_list'));
            }
            updateLanguageUI();
            fetchContents();
        });
        
        // Context Menu Item Actions bindings
        ctxStar.addEventListener('click', () => {
            if (activeContextItem) toggleStarItem();
        });
        
        ctxShare.addEventListener('click', () => {
            if (activeContextItem && activeContextItem.type === 'file') {
                openModal(shareModal);
                fetchSharedUsers(activeContextItem.id);
            }
        });
        
        closeShareBtn.addEventListener('click', () => closeModal(shareModal));
        
        copyLinkBtn.addEventListener('click', () => {
            shareFileLink.select();
            document.execCommand('copy');
            copyLinkBtn.textContent = t('share.copied');
            setTimeout(() => {
                copyLinkBtn.textContent = t('share.copy_link');
            }, 1500);
        });
        
        shareVisibilitySelect.addEventListener('change', (e) => {
            if (activeContextItem) {
                shareFileVisibility(e.target.value);
            }
        });
        
        addShareUserBtn.addEventListener('click', () => {
            const username = shareUsernameInput.value.trim();
            if (username && activeContextItem) {
                addShareUser(username);
            }
        });
        
        shareUsernameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const username = shareUsernameInput.value.trim();
                if (username && activeContextItem) {
                    addShareUser(username);
                }
            }
        });
        
        ctxRename.addEventListener('click', () => {
            if (activeContextItem) {
                openModal(renameModal);
                renameInput.value = activeContextItem.name;
                
                // Select name without file extension for easier renaming
                if (activeContextItem.type === 'file') {
                    const lastDot = activeContextItem.name.lastIndexOf('.');
                    if (lastDot > 0) {
                        setTimeout(() => {
                            renameInput.setSelectionRange(0, lastDot);
                        }, 100);
                    }
                }
            }
        });
        
        cancelRenameBtn.addEventListener('click', () => closeModal(renameModal));
        confirmRenameBtn.addEventListener('click', () => {
            const name = renameInput.value.trim();
            if (name) renameItem(name);
        });
        renameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const name = renameInput.value.trim();
                if (name) renameItem(name);
            }
        });
        
        ctxDownload.addEventListener('click', () => {
            if (activeContextItem && activeContextItem.type === 'file') {
                window.open(`/download/${activeContextItem.id}/`, '_blank');
            }
        });
        
        ctxTrash.addEventListener('click', () => {
            if (activeContextItem) trashItem();
        });
        
        ctxRestore.addEventListener('click', () => {
            if (activeContextItem) restoreItem();
        });
        
        ctxDeleteForever.addEventListener('click', () => {
            if (activeContextItem) {
                openModal(confirmDeleteModal);
            }
        });
        
        cancelDeleteBtn.addEventListener('click', () => closeModal(confirmDeleteModal));
        confirmDeleteBtn.addEventListener('click', () => {
            if (activeContextItem) deleteForeverItem();
        });
        
        // Upload Widget Header Toggle (Collapse / Expand)
        uploadWidgetToggle.addEventListener('click', () => {
            uploadWidget.classList.toggle('collapsed');
        });
        
        uploadWidgetCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            uploadWidget.classList.add('collapsed');
            // Clear successful list entries to clean widget
            setTimeout(() => {
                uploadList.innerHTML = '';
                updateUploadWidgetHeaderTitle();
            }, 300);
        });
        
        // Clicking outer space deselects elements
        dropZone.addEventListener('click', () => {
            clearAllSelections();
        });
    }

    // --- HTML Escaper helper ---
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Launch
    init();
});
