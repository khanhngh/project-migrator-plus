
# Kế hoạch: Upload file trực tiếp lên Google Drive của User

## Tổng quan

Thay vì lưu file vào Supabase Storage (giới hạn dung lượng), hệ thống sẽ cho phép user kết nối Google Drive cá nhân và upload file trực tiếp lên đó.

---

## Luồng hoạt động mới

```text
┌─────────────────────────────────────────────────────────────────┐
│                    KHI USER NỘP BÀI                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User chọn file                                                │
│         │                                                       │
│         ▼                                                       │
│   ┌─────────────────────────────────────────────────────┐       │
│   │  Đã kết nối Google Drive?                           │       │
│   └─────────────────┬───────────────────────────────────┘       │
│                     │                                           │
│         ┌───────────┴───────────┐                               │
│         │                       │                               │
│         ▼ CHƯA                  ▼ RỒI                           │
│   ┌───────────────┐       ┌─────────────────────┐               │
│   │ Upload lên    │       │ Upload lên          │               │
│   │ Supabase      │       │ Google Drive        │               │
│   │ Storage       │       │ của user            │               │
│   │ (như cũ)      │       └─────────┬───────────┘               │
│   └───────┬───────┘                 │                           │
│           │                         │                           │
│           ▼                         ▼                           │
│   ┌──────────────────────────────────────────────┐              │
│   │  Lưu link file (storage hoặc Drive)          │              │
│   │  vào database                                │              │
│   └──────────────────────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Trải nghiệm người dùng

### Lần đầu sử dụng

1. User vào nộp bài, thấy vùng upload file
2. Có thông báo: "Kết nối Google Drive để lưu file không giới hạn dung lượng"
3. User nhấn nút "Kết nối Google Drive"
4. Popup đăng nhập Google xuất hiện
5. User đồng ý cấp quyền → Hoàn tất

### Sau khi kết nối

1. User chọn file để upload
2. File tự động upload lên Google Drive của user
3. Hiển thị: "Đã lưu vào Google Drive của bạn"
4. Link file Drive được lưu vào hệ thống

---

## Các bước triển khai

### Bước 1: Xóa migration cũ và tạo schema mới

Xóa hoặc sửa migration `google_drive_connections` hiện tại để phù hợp với flow mới (lưu token theo từng user, không chỉ admin).

### Bước 2: Yêu cầu Google OAuth credentials

Bạn cần tạo OAuth Client ID từ Google Cloud Console với scope:
- `https://www.googleapis.com/auth/drive.file` (chỉ truy cập file do app tạo)

### Bước 3: Tạo Edge Function xử lý Google Drive

**`supabase/functions/google-drive-upload/index.ts`**

Chức năng:
- `action: connect` - Đổi authorization code lấy access/refresh token
- `action: upload` - Upload file lên Drive của user
- `action: disconnect` - Xóa kết nối
- `action: status` - Kiểm tra trạng thái kết nối

### Bước 4: Cập nhật MultiFileUploadSubmission

Thêm logic:
1. Kiểm tra user đã kết nối Drive chưa
2. Nếu rồi → Upload lên Drive thay vì Storage
3. Nếu chưa → Upload lên Storage như cũ + hiện gợi ý kết nối

### Bước 5: Tạo component GoogleDriveConnect

Nút kết nối/ngắt kết nối Google Drive, hiển thị trong:
- Dialog nộp bài (TaskSubmissionDialog)
- Trang thông tin cá nhân (PersonalInfo)

---

## Database schema (điều chỉnh)

```sql
-- Bảng lưu kết nối Google Drive của MỖI user
CREATE TABLE user_drive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  google_email TEXT NOT NULL,
  access_token TEXT,          -- Có thể null (hết hạn)
  refresh_token TEXT NOT NULL, -- Dùng để làm mới access_token
  folder_id TEXT,              -- Folder "TaskFlow" trên Drive user
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS: User chỉ xem/quản lý kết nối của chính mình
ALTER TABLE user_drive_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drive connection"
  ON user_drive_connections FOR ALL
  USING (auth.uid() = user_id);
```

---

## Ưu điểm

| Tiêu chí | Mô tả |
|----------|-------|
| Tiết kiệm storage | File lưu trên Drive của user, không tốn dung lượng hệ thống |
| Không giới hạn | User có Drive 15GB miễn phí, hoặc nhiều hơn nếu UEH |
| Tùy chọn | User không muốn kết nối vẫn dùng Storage như cũ |
| Đồng bộ | File nằm trong Drive cá nhân, user dễ quản lý |

---

## Nhược điểm và giải pháp

| Nhược điểm | Giải pháp |
|------------|-----------|
| Cần Google Client ID/Secret | Một lần cấu hình, sau đó tự động |
| User phải đăng nhập Google | Tùy chọn, không bắt buộc |
| Token có thể hết hạn | Auto-refresh bằng refresh_token |

---

## Yêu cầu từ bạn

Để triển khai, bạn cần:

1. **Tạo Google Cloud Project** (miễn phí) tại console.cloud.google.com
2. **Bật Google Drive API**
3. **Tạo OAuth 2.0 Client ID** (Web application)
   - Authorized redirect URI: `https://vwfexrhbnnuyqnkgqdml.supabase.co/functions/v1/google-drive-upload`
4. **Cung cấp**:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

## Các file sẽ tạo/sửa

| File | Hành động | Mô tả |
|------|-----------|-------|
| Database migration | Sửa | Đổi schema phù hợp flow mới |
| `supabase/functions/google-drive-upload/index.ts` | Tạo mới | Edge function xử lý OAuth + upload |
| `src/components/GoogleDriveConnect.tsx` | Tạo mới | Nút kết nối Drive |
| `src/components/MultiFileUploadSubmission.tsx` | Sửa | Thêm logic upload lên Drive |
| `src/components/TaskSubmissionDialog.tsx` | Sửa | Tích hợp nút kết nối Drive |

---

## Tóm tắt

Đây là giải pháp để mỗi user tự quản lý file trên Google Drive cá nhân:
- User kết nối 1 lần → sau đó tự động
- Không bắt buộc, vẫn có fallback về Storage
- Tiết kiệm dung lượng hệ thống đáng kể

Bạn có muốn tôi hướng dẫn chi tiết cách lấy Google Client ID/Secret không?
