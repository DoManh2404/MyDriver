/**
 * Google Drive Clone — Internationalization (i18n) Module
 * Supports: English (en), Vietnamese (vi)
 * Persists language preference in localStorage.
 */

const I18N = (() => {
    const STORAGE_KEY = 'gdrive_lang';
    const DEFAULT_LANG = 'en';

    const translations = {
        // ===== Authentication Pages =====
        'auth.drive_title': { en: 'Google Drive', vi: 'Google Drive' },
        'auth.login_subtitle': { en: 'Sign in to continue to Drive', vi: 'Đăng nhập để tiếp tục đến Drive của bạn' },
        'auth.signup_subtitle': { en: 'Create your Google Account', vi: 'Tạo tài khoản Google mới của bạn' },
        'auth.username': { en: 'Username', vi: 'Tên đăng nhập' },
        'auth.email': { en: 'Email address', vi: 'Địa chỉ Email' },
        'auth.password': { en: 'Password', vi: 'Mật khẩu' },
        'auth.confirm_password': { en: 'Confirm password', vi: 'Xác nhận mật khẩu' },
        'auth.login_btn': { en: 'Next', vi: 'Tiếp theo' },
        'auth.signup_btn': { en: 'Sign up', vi: 'Đăng ký' },
        'auth.create_account': { en: 'Create account', vi: 'Tạo tài khoản' },
        'auth.sign_in_instead': { en: 'Sign in instead', vi: 'Đăng nhập thay thế' },

        // ===== Header =====
        'header.app_title': { en: 'Drive', vi: 'Drive' },
        'header.search_placeholder': { en: 'Search in Drive', vi: 'Tìm trong Drive' },
        'header.clear_search': { en: 'Clear search', vi: 'Xóa tìm kiếm' },
        'header.logout_tooltip': { en: 'Sign out', vi: 'Đăng xuất' },
        'header.settings_tooltip': { en: 'Settings', vi: 'Cài đặt' },
        'header.help_tooltip': { en: 'Support', vi: 'Hỗ trợ' },
        'header.language_tooltip': { en: 'Language', vi: 'Ngôn ngữ' },

        // ===== Sidebar =====
        'sidebar.new_btn': { en: 'New', vi: 'Mới' },
        'sidebar.new_folder': { en: 'New folder', vi: 'Thư mục mới' },
        'sidebar.file_upload': { en: 'File upload', vi: 'Tải tệp lên' },
        'sidebar.folder_upload': { en: 'Folder upload', vi: 'Tải thư mục lên' },
        'sidebar.my_drive': { en: 'My Drive', vi: 'Drive của tôi' },
        'sidebar.shared_with_me': { en: 'Shared with me', vi: 'Được chia sẻ với tôi' },
        'sidebar.recent': { en: 'Recent', vi: 'Gần đây' },
        'sidebar.starred': { en: 'Starred', vi: 'Có gắn dấu sao' },
        'sidebar.trash': { en: 'Trash', vi: 'Thùng rác' },
        'sidebar.storage': { en: 'Storage', vi: 'Bộ nhớ' },
        'sidebar.storage_loading': { en: 'Loading...', vi: 'Đang tải...' },

        // ===== Workspace =====
        'workspace.breadcrumb_my_drive': { en: 'My Drive', vi: 'Drive của tôi' },
        'workspace.breadcrumb_recent': { en: 'Recent', vi: 'Gần đây' },
        'workspace.breadcrumb_starred': { en: 'Starred', vi: 'Có gắn dấu sao' },
        'workspace.breadcrumb_trash': { en: 'Trash', vi: 'Thùng rác' },
        'workspace.breadcrumb_shared': { en: 'Shared with me', vi: 'Được chia sẻ với tôi' },
        'workspace.search_results': { en: 'Search results for', vi: 'Kết quả tìm kiếm cho' },
        'workspace.toggle_list': { en: 'List layout', vi: 'Dạng danh sách' },
        'workspace.toggle_grid': { en: 'Grid layout', vi: 'Dạng lưới' },
        'workspace.section_folders': { en: 'Folders', vi: 'Thư mục' },
        'workspace.section_files': { en: 'Files', vi: 'Tệp tin' },

        // ===== List View Headers =====
        'list.name': { en: 'Name', vi: 'Tên' },
        'list.owner': { en: 'Owner', vi: 'Chủ sở hữu' },
        'list.last_modified': { en: 'Last modified', vi: 'Sửa đổi lần cuối' },
        'list.file_size': { en: 'File size', vi: 'Kích cỡ tệp' },
        'list.owner_me': { en: 'me', vi: 'tôi' },

        // ===== Empty States =====
        'empty.folder_title': { en: 'Drop files here', vi: 'Thư mục trống' },
        'empty.folder_desc': { en: 'or use the "New" button', vi: 'Kéo thả tệp hoặc sử dụng nút "Mới" để bắt đầu' },
        'empty.trash_title': { en: 'Trash is empty', vi: 'Thùng rác trống' },
        'empty.trash_desc': { en: 'Items moved to the trash will be deleted forever after 30 days', vi: 'Không có thư mục hoặc tệp nào trong thùng rác' },
        'empty.starred_title': { en: 'No starred files', vi: 'Không có thư mục hoặc tệp được gắn dấu sao' },
        'empty.starred_desc': { en: 'Add stars to things that you want to easily find later', vi: 'Nhấp chuột phải vào tệp hoặc thư mục và chọn "Gắn dấu sao"' },
        'empty.search_title': { en: 'No results found', vi: 'Không tìm thấy kết quả' },
        'empty.search_desc_prefix': { en: 'Try searching for something else instead of', vi: 'Thử tìm kiếm cụm từ khác ngoài' },
        'empty.recent_title': { en: 'No recent files', vi: 'Không có tệp gần đây' },
        'empty.recent_desc': { en: 'Files you open or edit will show up here', vi: 'Các tệp bạn mở hoặc chỉnh sửa sẽ xuất hiện ở đây' },
        'empty.shared_title': { en: 'Nothing shared yet', vi: 'Chưa có tệp nào được chia sẻ' },
        'empty.shared_desc': { en: 'Files shared with you will appear here', vi: 'Các tệp được chia sẻ với bạn sẽ xuất hiện ở đây' },

        // ===== Drag & Drop =====
        'drag.title': { en: 'Drop files here', vi: 'Thả các tệp vào đây' },
        'drag.desc': { en: 'to upload them to this folder instantly', vi: 'để tải chúng lên thư mục này ngay lập tức' },

        // ===== Context Menu =====
        'ctx.add_star': { en: 'Add to starred', vi: 'Gắn dấu sao' },
        'ctx.remove_star': { en: 'Remove from starred', vi: 'Xóa dấu sao' },
        'ctx.share': { en: 'Share', vi: 'Chia sẻ' },
        'ctx.rename': { en: 'Rename', vi: 'Đổi tên' },
        'ctx.download': { en: 'Download', vi: 'Tải xuống' },
        'ctx.move_to_trash': { en: 'Move to trash', vi: 'Di chuyển vào thùng rác' },
        'ctx.restore': { en: 'Restore', vi: 'Khôi phục' },
        'ctx.delete_forever': { en: 'Delete forever', vi: 'Xóa vĩnh viễn' },

        // ===== Modals =====
        'modal.new_folder': { en: 'New folder', vi: 'Thư mục mới' },
        'modal.new_folder_placeholder': { en: 'Untitled folder', vi: 'Thư mục chưa đặt tên' },
        'modal.cancel': { en: 'Cancel', vi: 'Hủy' },
        'modal.create': { en: 'Create', vi: 'Tạo' },
        'modal.rename_title': { en: 'Rename', vi: 'Đổi tên' },
        'modal.rename_ok': { en: 'OK', vi: 'Đồng ý' },
        'modal.delete_title': { en: 'Delete forever?', vi: 'Xóa vĩnh viễn?' },
        'modal.delete_body': { en: 'This item will be permanently deleted and cannot be recovered. Are you sure you want to continue?', vi: 'Đối tượng sẽ bị xóa vĩnh viễn và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?' },
        'modal.delete_confirm': { en: 'Delete forever', vi: 'Xóa vĩnh viễn' },

        // ===== Share Modal =====
        'share.title': { en: 'Share access', vi: 'Chia sẻ quyền truy cập' },
        'share.sharing_label': { en: 'Sharing:', vi: 'Đang chia sẻ:' },
        'share.copy_link': { en: 'Copy link', vi: 'Sao chép' },
        'share.copied': { en: 'Copied!', vi: 'Đã chép!' },
        'share.general_access': { en: 'General access', vi: 'Quyền truy cập chung' },
        'share.private': { en: '🔒 Restricted (Only people added can open)', vi: '🔒 Riêng tư (Chỉ những người được thêm mới có quyền xem)' },
        'share.public': { en: '🌐 Anyone with the link (Anyone on the internet can view/download)', vi: '🌐 Công khai (Bất kỳ ai có liên kết đều có thể xem/tải)' },
        'share.add_people': { en: 'Add people', vi: 'Thêm người dùng' },
        'share.add_people_placeholder': { en: 'Enter username (e.g. userB)', vi: 'Nhập tên đăng nhập (ví dụ: userB)' },
        'share.add_btn': { en: 'Add', vi: 'Thêm' },
        'share.shared_users_label': { en: 'People with access', vi: 'Người dùng đã được chia sẻ' },
        'share.no_shared_users': { en: 'Not shared with anyone', vi: 'Chưa chia sẻ với bất kỳ ai' },
        'share.loading_users': { en: 'Loading user list...', vi: 'Đang tải danh sách người dùng...' },
        'share.load_error': { en: 'Could not load list', vi: 'Không thể tải danh sách' },
        'share.no_email': { en: 'no email', vi: 'không có email' },
        'share.revoke': { en: 'Remove', vi: 'Thu hồi' },
        'share.done': { en: 'Done', vi: 'Xong' },
        'share.public_badge': { en: 'Public', vi: 'Công khai' },
        'share.shared_badge_prefix': { en: 'Shared with', vi: 'Đã chia sẻ với' },
        'share.shared_badge_suffix': { en: 'people', vi: 'người' },

        // ===== Upload Widget =====
        'upload.no_files': { en: 'No uploads', vi: 'Không có tệp tải lên' },
        'upload.success': { en: 'uploaded successfully', vi: 'Đã tải lên thành công' },
        'upload.uploading': { en: 'Uploading', vi: 'Đang tải lên' },
        'upload.files': { en: 'files', vi: 'tệp' },
        'upload.complete_prefix': { en: 'Upload complete', vi: 'Đã tải lên thành công' },

        // ===== Storage =====
        'storage.used_prefix': { en: 'Used', vi: 'Đã dùng' },
        'storage.used_suffix': { en: 'of 15 GB', vi: 'trong tổng số 15 GB' },

        // ===== Errors / Alerts =====
        'error.cannot_create_folder': { en: 'Cannot create folder.', vi: 'Không thể tạo thư mục.' },
        'error.cannot_rename': { en: 'Cannot rename.', vi: 'Không thể đổi tên.' },
        'error.cannot_update_access': { en: 'Cannot update general access.', vi: 'Không thể cập nhật quyền truy cập chung.' },
        'error.server_connection': { en: 'Cannot connect to server.', vi: 'Không kết nối được máy chủ.' },
        'error.cannot_revoke': { en: 'Cannot revoke access.', vi: 'Không thể thu hồi quyền truy cập.' },

        // ===== Language Switcher =====
        'lang.english': { en: 'English', vi: 'English' },
        'lang.vietnamese': { en: 'Tiếng Việt', vi: 'Tiếng Việt' },
    };

    /**
     * Get current language from localStorage, fallback to default.
     */
    function getCurrentLang() {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    }

    /**
     * Set language and persist.
     */
    function setLang(lang) {
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.setAttribute('lang', lang);
        applyTranslations();
    }

    /**
     * Translate a key to the current language.
     */
    function t(key) {
        const lang = getCurrentLang();
        const entry = translations[key];
        if (!entry) {
            console.warn(`[i18n] Missing key: "${key}"`);
            return key;
        }
        return entry[lang] || entry['en'] || key;
    }

    /**
     * Walk the DOM and apply translations to elements with data-i18n attributes.
     * Supports:
     *   data-i18n="key"           → sets textContent
     *   data-i18n-placeholder="key" → sets placeholder attribute
     *   data-i18n-tooltip="key"   → sets data-tooltip attribute
     *   data-i18n-html="key"      → sets innerHTML (for options with emoji)
     */
    function applyTranslations() {
        // textContent
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        });

        // placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) el.placeholder = t(key);
        });

        // tooltip (data-tooltip for custom CSS tooltips)
        document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
            const key = el.getAttribute('data-i18n-tooltip');
            if (key) el.setAttribute('data-tooltip', t(key));
        });

        // innerHTML (for select options with emojis, etc.)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (key) el.innerHTML = t(key);
        });
    }

    /**
     * Initialize: set lang attribute and apply translations once DOM ready.
     */
    function init() {
        document.documentElement.setAttribute('lang', getCurrentLang());
        // Apply when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyTranslations);
        } else {
            applyTranslations();
        }
    }

    // Auto-init
    init();

    // Public API
    return { t, getCurrentLang, setLang, applyTranslations };
})();

window.I18N = I18N;
