# AI_RULES.md

# Quy tắc AI cho Project

Tài liệu này định nghĩa các quy tắc bắt buộc dành cho toàn bộ mã nguồn được tạo bởi AI trong project.

AI PHẢI đọc và tuân thủ tất cả quy tắc trước khi tạo hoặc chỉnh sửa code.

---

# 1. Nguyên tắc chung

* Chỉ sử dụng Python 3.12 trở lên
* Ưu tiên tính dễ đọc và dễ bảo trì
* Tuân thủ pattern hiện có của project
* KHÔNG tạo abstraction không cần thiết
* KHÔNG thay đổi architecture nếu chưa được yêu cầu
* Giữ code module hóa và có thể tái sử dụng
* Tránh lặp logic
* Ưu tiên code rõ ràng thay vì “magic behavior”

---

# 2. Quy tắc viết code

## Chuẩn Python

* Tuân thủ PEP8
* Sử dụng type hint khi có thể
* Đặt tên biến có ý nghĩa
* Hàm tối đa 50 dòng
* Class tối đa 300 dòng
* Tránh nested logic quá sâu

## Quy tắc đặt tên

### Biến

```python
user_name = "John"
```

### Hằng số

```python
MAX_RETRY_COUNT = 5
```

### Class

```python
class UserService:
```

### Method private

```python
def _validate_token(self):
```

---

# 3. Kiến trúc project

AI PHẢI tuân thủ nghiêm ngặt kiến trúc này.

## Các layer

### Layer Controller / Route

Trách nhiệm:

* Nhận request
* Validate dữ liệu đầu vào
* Trả response

KHÔNG được:

* Chứa business logic
* Truy cập database trực tiếp

---

### Layer Service

Trách nhiệm:

* Xử lý business logic
* Điều phối workflow
* Kiểm tra quyền truy cập

---

### Layer Repository / Data

Trách nhiệm:

* Truy cập database
* Thực hiện query
* Xử lý ORM

---

# 4. Quy tắc giao diện (UI)

Toàn bộ giao diện PHẢI hỗ trợ song ngữ:

* Tiếng Anh
* Tiếng Việt

AI TUYỆT ĐỐI KHÔNG hardcode text trực tiếp trong component UI.

KHÔNG tốt:

```python
button.text = "Login"
```

Đúng:

```python
button.text = t("login")
```

---

# 5. Quy tắc đa ngôn ngữ (i18n)

## Cấu trúc translation bắt buộc

Ví dụ:

```python
translations = {
    "en": {
        "login": "Login",
        "logout": "Logout"
    },
    "vi": {
        "login": "Đăng nhập",
        "logout": "Đăng xuất"
    }
}
```

---

# 6. Quy tắc ngôn ngữ

Ngôn ngữ mặc định:

* Tiếng Anh

Ngôn ngữ hỗ trợ:

* English (en)
* Vietnamese (vi)

Toàn bộ:

* label
* button
* notification
* error message
* text hiển thị

PHẢI hỗ trợ translation.

AI PHẢI:

* sử dụng translation key
* tránh hardcode text UI
* giữ key translation nhất quán

---

# 7. Xử lý lỗi

AI PHẢI:

* xử lý exception đầy đủ
* trả về lỗi có ý nghĩa
* không expose stack trace nội bộ cho người dùng

Ví dụ:

```python
try:
    process_data()
except ValueError as e:
    logger.error(str(e))
    return {"success": False, "message": t("invalid_data")}
```

---

# 8. Logging

Sử dụng structured logging.

Đúng:

```python
logger.info("User logged in", extra={"user_id": user.id})
```

Không tốt:

```python
print("login")
```

---

# 9. Quy tắc bảo mật

AI PHẢI:

* validate toàn bộ input người dùng
* sanitize dữ liệu upload
* chống SQL Injection
* chống XSS
* không hardcode secret
* không expose API key
* dùng environment variable cho dữ liệu nhạy cảm

---

# 10. Quy tắc API

Toàn bộ API PHẢI trả về cùng format.

Ví dụ:

```json
{
    "success": true,
    "message": "Success",
    "data": {}
}
```

---

# 11. Quy tắc database

AI PHẢI:

* tối ưu query
* tránh N+1 query
* dùng transaction khi cần
* tránh raw SQL nếu không cần thiết

---

# 12. Quy tắc dependency

AI PHẢI:

* ưu tiên standard library trước
* tránh thêm dependency không cần thiết
* hỏi trước khi thêm package lớn

---

# 13. Quy tắc testing

AI NÊN tạo:

* unit test
* edge case test
* validation test

---

# 14. Quy tắc thiết kế giao diện

UI cần:

* sạch sẽ
* tối giản
* responsive
* dễ sử dụng

Tránh:

* layout rối
* animation quá mức
* inline style

---

# 15. Quy tắc chỉnh sửa file

AI PHẢI:

* chỉ sửa file liên quan
* tránh refactor không cần thiết
* giữ nguyên structure hiện tại

---

# 16. Comment & tài liệu

AI PHẢI:

* viết code dễ hiểu
* chỉ comment khi cần
* tạo docstring cho public function

Ví dụ:

```python
def calculate_total(price: float, tax: float) -> float:
    """
    Tính tổng giá bao gồm thuế.
    """
    return price + tax
```

---

# 17. Quy tắc Git

AI KHÔNG được:

* rewrite git history
* đổi tên file không cần thiết
* xóa file nếu chưa được yêu cầu

---

# 18. Quy tắc output

Khi generate code, AI PHẢI:

1. giải thích ngắn gọn các quyết định quan trọng
2. tuân thủ pattern hiện có
3. giữ consistency giữa các file
4. tránh placeholder code nếu không được yêu cầu

---

# 19. Tech stack ưu tiên

Ưu tiên:

* Python 3
* FastAPI / Django
* SQLAlchemy / Django ORM
* TailwindCSS
* SQLite/PostgreSQL

---

# 20. Quy tắc cuối cùng

Nếu có ambiguity:

1. Ưu tiên pattern hiện có của project
2. Ưu tiên maintainability
3. Giữ consistency của architecture
4. Chỉ hỏi lại khi thực sự cần thiết
