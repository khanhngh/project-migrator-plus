
# Kế hoạch: Tích hợp Google Drive đơn giản (Chỉ cần đồng ý)

## Tổng quan

Thay vì yêu cầu Admin cấu hình phức tạp (tạo Service Account, Cloud Console...), tôi sẽ xây dựng hệ thống cho phép **user tự kết nối Google Drive cá nhân** với một nút đồng ý đơn giản. Khi đồng ý, hệ thống sẽ:
- Tự động backup file lên Google Drive của người dùng
- Hoặc cho phép Admin đăng nhập Google một lần để backup tập trung

---

## Phương án được chọn: OAuth đơn giản với Checkbox đồng ý

### Luồng người dùng

```text
┌────────────────────────────────────────────────────────────────┐
│                     ADMIN BACKUP PAGE                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ☐ Đồng ý kết nối Google Drive để backup file            │  │
│  │                                                          │  │
│  │  Khi đồng ý, bạn cho phép hệ thống:                      │  │
│  │  • Tạo folder "TaskFlow Backup" trên Drive của bạn       │  │
│  │  • Tự động upload file backup vào folder này             │  │
│  │  • Truy cập chỉ đọc thông tin tài khoản Google           │  │
│  │                                                          │  │
│  │  [🔗 Kết nối Google Drive]                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Sau khi kết nối:                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ✅ Đã kết nối: admin@gmail.com                          │  │
│  │  📁 Folder: TaskFlow Backup                              │  │
│  │  📊 Đã backup: 15 file (245 MB)                          │  │
│  │                                                          │  │
│  │  [Ngắt kết nối]  [Backup ngay]  [Xem trên Drive]         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Chi tiết triển khai

### Bước 1: Bật Google OAuth trong Authentication

Sử dụng tính năng **Google Sign-In** có sẵn trong hệ thống backend để xác thực và lấy quyền truy cập Drive.

### Bước 2: Tạo Edge Function `google-drive-backup`

Chức năng:
- Nhận access token từ Google OAuth
- Tạo folder "TaskFlow Backup" nếu chưa có
- Upload file từ storage lên Drive
- Trả về link public của file

### Bước 3: Cập nhật AdminBackupRestore component

Thêm section mới:
- Nút "Kết nối Google Drive" (sử dụng Google OAuth)
- Hiển thị trạng thái kết nối
- Nút backup thủ công hoặc tự động
- Xem danh sách file đã backup

### Bước 4: Lưu trữ token và trạng thái

Tạo bảng `google_drive_connections`:
- Lưu refresh token để tự động làm mới
- Lưu folder ID trên Drive
- Tracking file đã backup

---

## Database schema mới

```sql
-- Bảng lưu kết nối Google Drive của user
CREATE TABLE google_drive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  google_email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,  -- Encrypted
  folder_id TEXT,               -- ID folder trên Drive
  folder_name TEXT DEFAULT 'TaskFlow Backup',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Bảng tracking file đã backup
CREATE TABLE drive_file_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES google_drive_connections(id) ON DELETE CASCADE,
  original_bucket TEXT NOT NULL,
  original_path TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  backed_up_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(connection_id, original_bucket, original_path)
);

-- RLS policies
ALTER TABLE google_drive_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_file_backups ENABLE ROW LEVEL SECURITY;

-- Chỉ admin có thể xem/quản lý
CREATE POLICY "Admins can manage drive connections"
  ON google_drive_connections FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage drive backups"
  ON drive_file_backups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM google_drive_connections c
      WHERE c.id = drive_file_backups.connection_id
      AND public.is_admin(auth.uid())
    )
  );
```

---

## Edge Function: google-drive-backup

```text
Endpoint: POST /google-drive-backup

Input:
{
  "action": "connect" | "backup" | "disconnect" | "list",
  "google_code": "..." (for connect),
  "file_paths": [...] (for backup)
}

Output:
{
  "success": true,
  "data": { ... }
}
```

---

## Các file sẽ tạo/sửa

| File | Hành động | Mô tả |
|------|-----------|-------|
| `supabase/functions/google-drive-backup/index.ts` | Tạo mới | Edge function xử lý OAuth và upload |
| `src/components/GoogleDriveBackup.tsx` | Tạo mới | Component quản lý kết nối Drive |
| `src/components/AdminBackupRestore.tsx` | Sửa | Tích hợp Google Drive section |
| `src/pages/AdminBackup.tsx` | Giữ nguyên | Không đổi |
| Database migration | Tạo mới | Thêm 2 bảng mới |

---

## Yêu cầu từ bạn

Để hoàn thành tích hợp, bạn chỉ cần:

1. **Tạo Google Cloud Project** (miễn phí) tại console.cloud.google.com
2. **Bật Google Drive API**
3. **Tạo OAuth Client ID** (loại "Web application")
4. **Cung cấp 2 thông tin**:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

Sau đó mọi thứ sẽ tự động - Admin chỉ cần **bấm nút "Kết nối Google Drive"** và đồng ý quyền truy cập.

---

## Trải nghiệm người dùng cuối

1. Admin vào trang Sao lưu & Khôi phục
2. Thấy section "Backup lên Google Drive"
3. Tick checkbox đồng ý điều khoản
4. Bấm "Kết nối Google Drive"
5. Đăng nhập Google và cho phép quyền
6. Xong! Hệ thống tự động backup file

---

## Lưu ý bảo mật

- Refresh token được mã hóa trước khi lưu
- Chỉ Admin mới có quyền kết nối/quản lý
- User không thể truy cập Drive của Admin
- Có thể ngắt kết nối bất cứ lúc nào
