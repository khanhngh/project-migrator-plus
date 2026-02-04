# 🚀 HƯỚNG DẪN SETUP VÀ TÁI TẠO WEBSITE TEAMWORKS UEH

> **Phiên bản:** 2.0  
> **Cập nhật lần cuối:** 04/02/2026  
> **Tác giả:** Nguyễn Hoàng Khánh (khanhngh.ueh@gmail.com)  
> **Đơn vị:** Trường Đại học Kinh tế TP. Hồ Chí Minh (UEH)

---

## 📋 MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Công nghệ & Phiên bản](#2-công-nghệ--phiên-bản)
3. [Supabase - Cấu hình chi tiết](#3-supabase---cấu-hình-chi-tiết)
4. [Edge Functions](#4-edge-functions)
5. [Biến môi trường (ENV)](#5-biến-môi-trường-env)
6. [Design System & Theming](#6-design-system--theming)
7. [Cấu trúc thư mục source code](#7-cấu-trúc-thư-mục-source-code)
8. [Routing & Navigation](#8-routing--navigation)
9. [Hướng dẫn Setup & Chạy Project](#9-hướng-dẫn-setup--chạy-project)
10. [Tạo tài khoản Admin đầu tiên](#10-tạo-tài-khoản-admin-đầu-tiên)
11. [Những lưu ý quan trọng](#11-những-lưu-ý-quan-trọng)
12. [Troubleshooting](#12-troubleshooting)
13. [Changelog](#13-changelog)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả
**Teamworks UEH** là hệ thống quản lý công việc nhóm dành cho sinh viên Đại học Kinh tế TP.HCM (UEH). Hệ thống giúp:
- Quản lý dự án nhóm một cách minh bạch
- Phân công và theo dõi tiến độ công việc
- Tính điểm tự động dựa trên đóng góp của từng thành viên
- Hỗ trợ giao tiếp nội bộ nhóm
- Trợ lý AI thông minh hỗ trợ tra cứu thông tin

### 1.2 Chức năng chính

| Chức năng | Mô tả chi tiết |
|-----------|----------------|
| **Quản lý nhóm** | Tạo nhóm, thêm/xóa thành viên, phân quyền Leader/Member, chia sẻ công khai |
| **Quản lý Task** | Tạo task, gán nhiều người phụ trách, theo dõi deadline, gia hạn deadline |
| **Giai đoạn (Stage)** | Chia dự án thành các giai đoạn, đặt trọng số điểm, ẩn/hiện giai đoạn |
| **Nộp bài** | Upload file (đa file) hoặc link, lưu lịch sử nộp bài, giới hạn dung lượng |
| **Ghi chú Task** | Ghi chú nhiều phiên bản cho mỗi task, đính kèm file |
| **Tính điểm** | Tự động tính điểm dựa trên: hoàn thành, trễ hạn, bonus sớm, bonus bug hunter |
| **Khiếu nại điểm** | Thành viên gửi khiếu nại, đính kèm file minh chứng, Leader xử lý |
| **Tài liệu nhóm** | Upload và quản lý tài liệu dự án, tổ chức theo thư mục |
| **Thông báo** | Hệ thống thông báo realtime, mention @user |
| **Trò chuyện nhóm** | Chat nội bộ nhóm, liên kết với task |
| **AI Assistant** | Trợ lý AI hỗ trợ tra cứu thông tin dự án, giới hạn 100 từ/câu hỏi |
| **Xuất báo cáo** | Xuất PDF/Excel: nhật ký hoạt động, bảng điểm, minh chứng |
| **Kanban Board** | Xem task dạng bảng Kanban, kéo thả thay đổi trạng thái |

### 1.3 Đối tượng sử dụng

| Vai trò | Quyền hạn chi tiết |
|---------|-------------------|
| **Admin** | Quản trị toàn hệ thống, quản lý tất cả user, duyệt tài khoản, xem tất cả dự án, backup/restore |
| **Leader** | Tạo nhóm mới, quản lý thành viên nhóm mình, tạo/sửa/xóa task, chấm điểm, xử lý khiếu nại, xuất báo cáo |
| **Member** | Xem task được gán, nộp bài, cập nhật trạng thái task, ghi chú, xem điểm cá nhân, gửi khiếu nại |

### 1.4 Luồng hoạt động chính

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LUỒNG HOẠT ĐỘNG CHÍNH                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. ĐĂNG KÝ/ĐĂNG NHẬP                                                       │
│     User đăng ký → Admin duyệt → User đăng nhập → Đổi mật khẩu (lần đầu)   │
│                                                                              │
│  2. TẠO VÀ QUẢN LÝ NHÓM                                                     │
│     Leader tạo nhóm → Thêm thành viên → Tạo giai đoạn → Tạo task           │
│                                                                              │
│  3. THỰC HIỆN CÔNG VIỆC                                                     │
│     Member nhận task → Cập nhật trạng thái → Nộp bài → Leader duyệt        │
│                                                                              │
│  4. TÍNH ĐIỂM                                                               │
│     Leader chấm điểm task → Tính điểm giai đoạn → Tính điểm tổng kết       │
│                                                                              │
│  5. KHIẾU NẠI (nếu có)                                                      │
│     Member gửi khiếu nại → Leader xem xét → Chấp nhận/Từ chối              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CÔNG NGHỆ & PHIÊN BẢN

### 2.1 Frontend

| Công nghệ | Phiên bản | Mục đích | Ghi chú |
|-----------|-----------|----------|---------|
| React | ^18.3.1 | UI Framework | Single Page Application |
| Vite | ^5.x | Build tool | Hot Module Replacement |
| TypeScript | ^5.x | Type safety | Strict mode |
| Tailwind CSS | ^3.x | Utility-first CSS | Custom design tokens |
| shadcn/ui | Latest | UI Components | Radix UI based |
| TanStack Query | ^5.90.16 | Data fetching & caching | Server state management |
| React Router DOM | ^6.30.1 | Routing | Nested routes |
| Lucide React | ^0.462.0 | Icons | 1000+ icons |

### 2.2 Backend

| Công nghệ | Mục đích | Ghi chú |
|-----------|----------|---------|
| Supabase | BaaS Platform | Auth, Database, Storage, Edge Functions |
| PostgreSQL | Database | Managed by Supabase, version 15+ |
| Deno | Edge Functions runtime | TypeScript native |
| PostgREST | REST API | Auto-generated from schema |

### 2.3 Thư viện quan trọng

| Thư viện | Phiên bản | Mục đích | Cách sử dụng |
|----------|-----------|----------|--------------|
| @supabase/supabase-js | ^2.87.3 | Supabase client | Import từ `@/integrations/supabase/client` |
| @hello-pangea/dnd | ^18.0.1 | Drag & drop | Kanban board |
| date-fns | ^3.6.0 | Xử lý ngày tháng | Format, parse, compare dates |
| jspdf | ^4.1.0 | Xuất PDF | Báo cáo, minh chứng |
| jspdf-autotable | ^5.0.7 | PDF tables | Bảng điểm |
| xlsx | ^0.18.5 | Xuất Excel | Export data |
| react-hook-form | ^7.61.1 | Form handling | Validation |
| zod | ^3.25.76 | Schema validation | Form + API validation |
| sonner | ^1.7.4 | Toast notifications | Modern toast |
| recharts | ^2.15.4 | Charts | Biểu đồ thống kê |
| react-markdown | ^10.1.0 | Markdown rendering | AI responses |
| framer-motion | N/A | Animations | Implicit via Tailwind |

### 2.4 Dev Dependencies

| Tool | Mục đích |
|------|----------|
| ESLint | Code linting |
| PostCSS | CSS processing |
| Autoprefixer | CSS vendor prefixes |

---

## 3. SUPABASE - CẤU HÌNH CHI TIẾT

### 3.1 Tạo Supabase Project

#### Bước 1: Tạo project mới
1. Truy cập https://supabase.com/dashboard
2. Click **"New Project"**
3. Điền thông tin:
   - **Organization:** Chọn hoặc tạo mới
   - **Name:** `teamworks-ueh`
   - **Database Password:** Tạo mật khẩu mạnh (LƯU LẠI!)
   - **Region:** `Southeast Asia (Singapore)` - gần Việt Nam nhất
   - **Pricing Plan:** Free tier hoặc Pro
4. Click **"Create new project"**
5. Đợi 2-3 phút để project được khởi tạo

#### Bước 2: Lấy thông tin kết nối
Vào **Settings → API** để lấy:
```
Project URL:        https://[project-id].supabase.co
anon (public) key:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (⚠️ BÍ MẬT)
```

⚠️ **CẢNH BÁO BẢO MẬT:**
- `anon key` - Có thể dùng ở client-side (đã public)
- `service_role key` - CHỈ dùng ở server/Edge Functions, KHÔNG BAO GIỜ lộ ra client

---

### 3.2 DATABASE - SCHEMA CHI TIẾT

#### 3.2.0 Tạo ENUM Types (Chạy đầu tiên)

```sql
-- Vai trò trong hệ thống
CREATE TYPE public.app_role AS ENUM ('admin', 'leader', 'member');

-- Trạng thái phê duyệt
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Trạng thái task
CREATE TYPE public.task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'VERIFIED');
```

#### 3.2.1 Bảng `profiles` - Thông tin người dùng

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY, -- References auth.users(id), không dùng FK trực tiếp
  student_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  major TEXT,
  year_batch TEXT,
  skills TEXT,
  bio TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index cho tìm kiếm
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
```

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | UUID | No | - | Khớp với auth.users.id |
| student_id | TEXT | No | - | Mã số sinh viên |
| full_name | TEXT | No | - | Họ và tên đầy đủ |
| email | TEXT | No | - | Email đăng nhập |
| avatar_url | TEXT | Yes | - | URL ảnh đại diện (từ Storage) |
| phone | TEXT | Yes | - | Số điện thoại |
| major | TEXT | Yes | - | Ngành học |
| year_batch | TEXT | Yes | - | Khóa (K47, K48...) |
| skills | TEXT | Yes | - | Kỹ năng (phân tách bằng dấu phẩy) |
| bio | TEXT | Yes | - | Giới thiệu bản thân |
| is_approved | BOOLEAN | No | false | Admin đã duyệt chưa |
| must_change_password | BOOLEAN | No | false | Buộc đổi mật khẩu lần đầu |
| created_at | TIMESTAMPTZ | No | now() | Thời điểm tạo |
| updated_at | TIMESTAMPTZ | No | now() | Thời điểm cập nhật |

#### 3.2.2 Bảng `user_roles` - Phân quyền (TÁCH RIÊNG VÌ BẢO MẬT)

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users(id)
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
```

⚠️ **QUAN TRỌNG:** Role được lưu riêng để tránh user tự nâng quyền qua profiles table.

#### 3.2.3 Bảng `groups` - Nhóm dự án

```sql
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  short_id TEXT UNIQUE,
  image_url TEXT,
  class_code TEXT,
  instructor_name TEXT,
  instructor_email TEXT,
  zalo_link TEXT,
  additional_info TEXT,
  leader_id UUID,
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT false,
  show_members_public BOOLEAN DEFAULT true,
  show_activity_public BOOLEAN DEFAULT true,
  show_resources_public BOOLEAN DEFAULT true,
  share_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_slug ON public.groups(slug);
CREATE INDEX idx_groups_share_token ON public.groups(share_token);
```

| Column | Mô tả |
|--------|-------|
| slug | URL-friendly name (auto-generated từ name) |
| short_id | Mã ngắn để chia sẻ |
| is_public | Cho phép xem công khai không cần đăng nhập |
| share_token | Token để chia sẻ link công khai |
| show_*_public | Tùy chọn hiển thị từng phần khi công khai |

#### 3.2.4 Bảng `group_members` - Thành viên nhóm

```sql
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
```

#### 3.2.5 Bảng `stages` - Giai đoạn dự án

```sql
CREATE TABLE public.stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC DEFAULT 1,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stages_group ON public.stages(group_id);
```

| Column | Mô tả |
|--------|-------|
| order_index | Thứ tự hiển thị (0, 1, 2...) |
| weight | Trọng số khi tính điểm (mặc định 1) |
| is_hidden | Ẩn khỏi danh sách (vẫn giữ data) |

#### 3.2.6 Bảng `tasks` - Công việc

```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT,
  short_id TEXT,
  status task_status NOT NULL DEFAULT 'TODO',
  deadline TIMESTAMPTZ,
  extended_deadline TIMESTAMPTZ,
  submission_link TEXT,
  max_file_size BIGINT DEFAULT 10485760, -- 10MB
  is_hidden BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_group ON public.tasks(group_id);
CREATE INDEX idx_tasks_stage ON public.tasks(stage_id);
CREATE INDEX idx_tasks_slug ON public.tasks(slug);
```

| Status | Mô tả | Màu hiển thị |
|--------|-------|--------------|
| TODO | Chờ thực hiện | Xám |
| IN_PROGRESS | Đang thực hiện | Xanh dương |
| DONE | Hoàn thành (chờ duyệt) | Xanh lá |
| VERIFIED | Đã được Leader duyệt | Tím |

#### 3.2.7 Bảng `task_assignments` - Phân công task

```sql
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_assignments_task ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user ON public.task_assignments(user_id);
```

**Ghi chú:** Một task có thể gán cho nhiều người (1-N relationship)

#### 3.2.8 Bảng `submission_history` - Lịch sử nộp bài

```sql
CREATE TABLE public.submission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  submission_link TEXT NOT NULL,
  submission_type TEXT DEFAULT 'link', -- 'link' hoặc 'file'
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submission_task ON public.submission_history(task_id);
CREATE INDEX idx_submission_user ON public.submission_history(user_id);
```

| submission_type | Mô tả |
|-----------------|-------|
| link | Nộp bằng URL |
| file | Nộp bằng upload file (lưu trong Storage) |

#### 3.2.9 Bảng `task_scores` - Điểm task

```sql
CREATE TABLE public.task_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  base_score NUMERIC NOT NULL DEFAULT 100,
  late_penalty NUMERIC NOT NULL DEFAULT 0,
  review_penalty NUMERIC NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  early_bonus BOOLEAN NOT NULL DEFAULT false,
  bug_hunter_bonus BOOLEAN NOT NULL DEFAULT false,
  adjustment NUMERIC DEFAULT 0,
  adjustment_reason TEXT,
  adjusted_by UUID,
  adjusted_at TIMESTAMPTZ,
  final_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_scores_task ON public.task_scores(task_id);
CREATE INDEX idx_task_scores_user ON public.task_scores(user_id);
```

**Công thức tính điểm:**
```
final_score = base_score - late_penalty - review_penalty + adjustment
            + (early_bonus ? 5 : 0) + (bug_hunter_bonus ? 5 : 0)
```

#### 3.2.10 Bảng `member_stage_scores` - Điểm giai đoạn

```sql
CREATE TABLE public.member_stage_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  average_score NUMERIC,
  k_coefficient NUMERIC DEFAULT 1.0,
  adjusted_score NUMERIC,
  early_submission_bonus BOOLEAN NOT NULL DEFAULT false,
  bug_hunter_bonus BOOLEAN NOT NULL DEFAULT false,
  late_task_count INTEGER NOT NULL DEFAULT 0,
  final_stage_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stage_scores_stage ON public.member_stage_scores(stage_id);
CREATE INDEX idx_stage_scores_user ON public.member_stage_scores(user_id);
```

**Công thức:**
```
final_stage_score = average_score * k_coefficient + bonuses
```

#### 3.2.11 Bảng `member_final_scores` - Điểm tổng kết

```sql
CREATE TABLE public.member_final_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  weighted_average NUMERIC,
  adjustment NUMERIC DEFAULT 0,
  final_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_final_scores_group ON public.member_final_scores(group_id);
```

**Công thức:**
```
final_score = Σ(stage_score × stage_weight) / Σ(stage_weight) + adjustment
```

#### 3.2.12-27 Các bảng còn lại

```sql
-- Bảng stage_weights - Trọng số giai đoạn
CREATE TABLE public.stage_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, stage_id)
);

-- Bảng score_appeals - Khiếu nại điểm
CREATE TABLE public.score_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_score_id UUID REFERENCES task_scores(id),
  stage_score_id UUID REFERENCES member_stage_scores(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewer_id UUID,
  reviewer_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng appeal_attachments - File đính kèm khiếu nại
CREATE TABLE public.appeal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_id UUID NOT NULL REFERENCES score_appeals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng score_adjustment_history - Lịch sử điều chỉnh điểm
CREATE TABLE public.score_adjustment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_id UUID NOT NULL,
  adjustment_type TEXT NOT NULL, -- task, stage, final
  previous_score NUMERIC,
  adjustment_value NUMERIC,
  new_score NUMERIC,
  reason TEXT,
  adjusted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng task_notes - Ghi chú task
CREATE TABLE public.task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  content TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng task_note_attachments - File đính kèm ghi chú
CREATE TABLE public.task_note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES task_notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng task_comments - Bình luận task
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng project_messages - Tin nhắn nhóm
CREATE TABLE public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'chat', -- chat, task_update
  source_task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng message_mentions - Mention trong tin nhắn
CREATE TABLE public.message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  message_type TEXT NOT NULL, -- project_message, task_comment
  comment_id UUID REFERENCES task_comments(id),
  mentioned_user_id UUID NOT NULL,
  mentioned_by UUID NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng notifications - Thông báo
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- task_assigned, deadline_reminder, mention, etc.
  group_id UUID REFERENCES groups(id),
  task_id UUID REFERENCES tasks(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng activity_logs - Nhật ký hoạt động
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL, -- task_created, task_updated, submission, etc.
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng project_resources - Tài liệu dự án
CREATE TABLE public.project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES resource_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'general',
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng resource_folders - Thư mục tài liệu
CREATE TABLE public.resource_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng pending_approvals - Yêu cầu tham gia nhóm
CREATE TABLE public.pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng feedbacks - Phản hồi người dùng
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID REFERENCES groups(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL, -- bug, feature, question, other
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, resolved, closed
  admin_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng feedback_comments - Bình luận phản hồi
CREATE TABLE public.feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 3.3 DATABASE FUNCTIONS (SECURITY DEFINER)

⚠️ **QUAN TRỌNG:** Các function này dùng `SECURITY DEFINER` để bypass RLS, tránh infinite recursion.

```sql
-- Function lấy email từ student_id
CREATE OR REPLACE FUNCTION public.get_email_by_student_id(_student_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE student_id = _student_id LIMIT 1;
$$;

-- Kiểm tra user có role cụ thể
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Kiểm tra là admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Kiểm tra là leader
CREATE OR REPLACE FUNCTION public.is_leader(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'leader'
  )
$$;

-- Kiểm tra là thành viên nhóm
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Kiểm tra là leader/admin của nhóm
CREATE OR REPLACE FUNCTION public.is_group_leader(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id
    AND group_id = _group_id
    AND role IN ('leader', 'admin')
  ) OR public.is_admin(_user_id)
$$;

-- Kiểm tra là người được gán task
CREATE OR REPLACE FUNCTION public.is_task_assignee(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_assignments
    WHERE user_id = _user_id AND task_id = _task_id
  )
$$;

-- Function tạo slug tiếng Việt
CREATE OR REPLACE FUNCTION public.generate_vietnamese_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result TEXT;
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN '';
  END IF;
  
  result := lower(input_text);
  
  -- Vietnamese character mappings
  result := translate(result, 
    'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd');
  
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  result := trim(both '-' from result);
  result := left(result, 50);
  
  RETURN result;
END;
$$;
```

---

### 3.4 DATABASE TRIGGERS

```sql
-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Áp dụng cho các bảng cần updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stages_updated_at
  BEFORE UPDATE ON public.stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, student_id, full_name, email, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    '',
    NEW.email,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger tự động set admin cho email cố định
CREATE OR REPLACE FUNCTION public.check_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'khanhngh.ueh@gmail.com' THEN
    UPDATE public.profiles
    SET
      is_approved = true,
      full_name = COALESCE(full_name, 'Nguyễn Hoàng Khánh'),
      email = NEW.email
    WHERE id = NEW.id;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger tạo slug cho groups
CREATE OR REPLACE FUNCTION public.set_group_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_vietnamese_slug(NEW.name);
    new_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.groups WHERE slug = new_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_group_slug_trigger
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_group_slug();

-- Trigger tạo slug cho tasks
CREATE OR REPLACE FUNCTION public.set_task_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_vietnamese_slug(NEW.title);
    new_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.tasks WHERE slug = new_slug AND group_id = NEW.group_id AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_task_slug_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_task_slug();
```

---

### 3.5 ROW LEVEL SECURITY (RLS)

⚠️ **BẮT BUỘC:** TẤT CẢ các bảng đều phải BẬT RLS

```sql
-- Enable RLS cho tất cả bảng
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_stage_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_final_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_adjustment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_note_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;
```

**Xem chi tiết policies trong file context hoặc Supabase Dashboard → Database → Policies**

---

### 3.6 STORAGE - LƯU TRỮ FILE

#### 3.6.1 Danh sách Buckets

| Bucket Name | Public | Mục đích | Max Size | Allowed Types |
|-------------|--------|----------|----------|---------------|
| `avatars` | ✅ Yes | Ảnh đại diện người dùng | 5MB | image/* |
| `group-images` | ✅ Yes | Ảnh đại diện nhóm | 5MB | image/* |
| `task-submissions` | ✅ Yes | File nộp bài của task | Custom per task | * |
| `task-note-attachments` | ✅ Yes | File đính kèm ghi chú task | 10MB | * |
| `appeal-attachments` | ✅ Yes | File đính kèm khiếu nại | 5MB | * |
| `project-resources` | ✅ Yes | Tài liệu dự án | 20MB | * |

#### 3.6.2 Tạo Buckets

```sql
-- Tạo tất cả buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('group-images', 'group-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('task-submissions', 'task-submissions', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('task-note-attachments', 'task-note-attachments', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('appeal-attachments', 'appeal-attachments', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('project-resources', 'project-resources', true);
```

#### 3.6.3 Storage RLS Policies

```sql
-- Avatars: Public read, owner write
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Tương tự cho các bucket khác...
```

#### 3.6.4 Naming Convention

| Bucket | Pattern | Ví dụ |
|--------|---------|-------|
| avatars | `{user_id}/{timestamp}.{ext}` | `abc123/1706198400000.png` |
| group-images | `{group_id}/{timestamp}.{ext}` | `xyz789/1706198400000.jpg` |
| task-submissions | `{group_id}/{task_id}/{user_id}/{timestamp}_{filename}` | `grp1/task1/usr1/1706198400000_report.pdf` |
| project-resources | `{group_id}/{folder_id?}/{timestamp}_{filename}` | `grp1/folder1/1706198400000_document.docx` |

---

### 3.7 AUTH - XÁC THỰC

#### 3.7.1 Cấu hình (Authentication → Settings)

| Setting | Giá trị | Ghi chú |
|---------|---------|---------|
| Enable Email Signup | ✅ ON | |
| Enable Email Confirmations | ✅ ON | User phải xác minh email |
| Secure Email Change | ✅ ON | |
| Secure Password Change | ✅ ON | |
| Min Password Length | 6 | |

#### 3.7.2 Luồng xác thực

```
ĐĂNG KÝ:
User điền form → Supabase gửi email xác minh → User click link
→ Trigger tạo profile → Admin duyệt (is_approved = true)
→ User đăng nhập

ĐĂNG NHẬP:
User nhập credentials → Check is_approved
→ If must_change_password → Redirect đổi mật khẩu
→ Redirect dashboard

MEMBER ĐƯỢC TẠO BỞI ADMIN:
Admin tạo member (password mặc định: 123456)
→ must_change_password = true
→ Member đăng nhập → Buộc đổi mật khẩu
```

---

## 4. EDGE FUNCTIONS

### 4.1 Danh sách Edge Functions

| Function | Mục đích | Endpoint |
|----------|----------|----------|
| `ensure-admin` | Tạo/đảm bảo tài khoản admin tồn tại | POST /functions/v1/ensure-admin |
| `manage-users` | Quản lý user (tạo member, đổi password, xóa user) | POST /functions/v1/manage-users |
| `team-assistant` | AI trợ lý nhóm | POST /functions/v1/team-assistant |

### 4.2 Chi tiết Edge Functions

#### 4.2.1 `ensure-admin`
**Mục đích:** Tạo tài khoản admin mặc định khi setup hệ thống

**Thông tin admin mặc định:**
- Email: `khanhngh.ueh@gmail.com`
- Password: `14092005`
- Student ID: `31241570562`
- Full Name: `Nguyễn Hoàng Khánh`

**Request:**
```bash
curl -X POST https://[project-id].supabase.co/functions/v1/ensure-admin
```

#### 4.2.2 `manage-users`
**Mục đích:** Các thao tác quản lý user cần service_role_key

**Actions:**
| Action | Mô tả | Required Fields |
|--------|-------|-----------------|
| `create_member` | Tạo member mới (password mặc định: 123456) | email, student_id, full_name |
| `setup_system_accounts` | Setup tài khoản Leader và Deputy | - |
| `update_password` | Đổi mật khẩu user | user_id, password |
| `clear_must_change_password` | Bỏ flag buộc đổi mật khẩu | user_id |
| `delete_user` | Xóa user | user_id |
| `update_email` | Đổi email user | user_id, email |

**Request Example:**
```bash
curl -X POST https://[project-id].supabase.co/functions/v1/manage-users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [anon-key]" \
  -d '{"action": "create_member", "email": "test@ueh.edu.vn", "student_id": "12345", "full_name": "Nguyễn Văn A"}'
```

#### 4.2.3 `team-assistant`
**Mục đích:** AI trợ lý hỗ trợ tra cứu thông tin dự án

**Giới hạn:**
- 100 từ/câu hỏi
- Streaming response
- Model: `google/gemini-3-flash-preview`

**Request:**
```json
{
  "messages": [{"role": "user", "content": "Tôi có bao nhiêu task?"}],
  "projectId": "uuid-of-project" // optional
}
```

**Required Secrets:**
- `LOVABLE_API_KEY` - API key cho Lovable AI Gateway

---

## 5. BIẾN MÔI TRƯỜNG (ENV)

### 5.1 Frontend (.env)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 5.2 Edge Functions (Supabase Secrets)

| Secret | Mục đích | Tự động có |
|--------|----------|-----------|
| `SUPABASE_URL` | URL của project | ✅ Yes |
| `SUPABASE_ANON_KEY` | Public key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key | ✅ Yes |
| `SUPABASE_DB_URL` | Database URL | ✅ Yes |
| `LOVABLE_API_KEY` | Lovable AI Gateway | ❌ Cần add |

### 5.3 Lưu ý bảo mật
- ⚠️ **KHÔNG BAO GIỜ** commit file `.env` lên git
- ⚠️ **KHÔNG BAO GIỜ** lộ `SERVICE_ROLE_KEY` ra client
- ✅ File `.env` đã có trong `.gitignore`

---

## 6. DESIGN SYSTEM & THEMING

### 6.1 Fonts

| Font | Sử dụng | Import |
|------|---------|--------|
| Poppins | Headings (font-heading) | Google Fonts |
| Inter | Body text (font-primary) | Google Fonts |

### 6.2 Color Palette (UEH Brand)

```css
/* Primary - UEH Teal */
--ueh-teal: 183 100% 21%;        /* #006B6B */
--ueh-teal-light: 183 58% 30%;
--ueh-teal-lighter: 183 40% 93%;

/* Accent - UEH Orange */
--ueh-orange: 18 88% 58%;         /* #E86830 */
--ueh-orange-light: 18 88% 66%;
--ueh-orange-lighter: 18 90% 97%;

/* Semantic Colors */
--primary: var(--ueh-teal);
--accent: var(--ueh-orange);
--success: 160 84% 40%;
--warning: 38 92% 50%;
--destructive: 0 84% 60%;
```

### 6.3 Stage Colors (Phân biệt giai đoạn)

```css
--stage-1: 183 100% 30%;  /* Teal */
--stage-2: 200 80% 45%;   /* Blue */
--stage-3: 260 70% 55%;   /* Purple */
--stage-4: 320 70% 50%;   /* Pink */
--stage-5: 18 85% 55%;    /* Orange */
--stage-6: 140 60% 40%;   /* Green */
```

### 6.4 Dark Mode

Hệ thống hỗ trợ Dark Mode với các biến CSS tương ứng trong `:root.dark`

---

## 7. CẤU TRÚC THƯ MỤC SOURCE CODE

```
teamworks-ueh/
├── public/                     # Static files
│   ├── favicon.png            # UEH Logo favicon
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── assets/                # Hình ảnh, logo
│   │   ├── ueh-logo.png       # Logo UEH (vuông)
│   │   ├── ueh-logo-new.png   # Logo UEH (ngang)
│   │   ├── zalo-logo.png      # Logo Zalo
│   │   └── ai-assistant-logo.png
│   │
│   ├── components/
│   │   ├── ui/               # shadcn/ui (40+ components)
│   │   ├── layout/           # DashboardLayout
│   │   ├── ai/               # AIAssistantButton, AIAssistantPanel
│   │   ├── communication/    # MentionInput, MessageItem, TaskComments
│   │   ├── dashboard/        # DashboardProjectCard
│   │   ├── public/           # PublicActivityLog, PublicGroupDashboard...
│   │   ├── scores/           # ProcessScores, TaskScoringDialog, AppealDialog...
│   │   └── [Feature components]
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx   # Auth state, user, profile, roles
│   │   └── NavigationContext.tsx
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx    # Detect mobile
│   │   ├── use-toast.ts      # Toast hook
│   │   ├── useAutosave.ts    # Auto-save hook
│   │   └── useUserPresence.ts
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts         # ⚠️ AUTO-GENERATED
│   │   └── types.ts          # ⚠️ AUTO-GENERATED
│   │
│   ├── lib/                  # Utilities
│   │   ├── utils.ts          # cn(), formatDate()...
│   │   ├── datetime.ts       # Date helpers
│   │   ├── urlUtils.ts       # URL helpers
│   │   ├── notifications.ts  # Notification helpers
│   │   ├── excelExport.ts    # Export Excel
│   │   ├── activityLogPdf.ts # Export PDF
│   │   └── uehLogoBase64.ts  # Logo for PDF
│   │
│   ├── pages/                # Route pages
│   │   ├── Index.tsx         # → Redirect to Landing
│   │   ├── Landing.tsx       # Public landing page
│   │   ├── Auth.tsx          # Auth page
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Groups.tsx        # Groups list
│   │   ├── GroupDetail.tsx   # Project detail
│   │   ├── PersonalInfo.tsx  # Profile page
│   │   └── [Other pages]
│   │
│   ├── types/
│   │   ├── database.ts
│   │   └── processScores.ts
│   │
│   ├── App.tsx               # Routes definition
│   ├── App.css
│   ├── index.css             # Tailwind + Design tokens
│   └── main.tsx
│
├── supabase/
│   ├── config.toml           # ⚠️ AUTO-GENERATED
│   └── functions/
│       ├── ensure-admin/
│       ├── manage-users/
│       └── team-assistant/
│
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── SETUP_REBUILD_WEBSITE_GUIDE.md  # This file
```

---

## 8. ROUTING & NAVIGATION

### 8.1 Danh sách Routes

| Path | Component | Protected | Mô tả |
|------|-----------|-----------|-------|
| `/` | Landing | ❌ | Trang chủ công khai |
| `/auth` | Auth | ❌ | Đăng nhập/Đăng ký |
| `/dashboard` | Dashboard | ✅ | Dashboard chính |
| `/groups` | Groups | ✅ | Danh sách nhóm |
| `/p/:projectSlug` | GroupDetail | ✅ | Chi tiết dự án (semantic URL) |
| `/p/:projectSlug/t/:taskSlug` | GroupDetail | ✅ | Chi tiết task |
| `/groups/:groupId` | GroupDetail | ✅ | Legacy URL (backward compatible) |
| `/s/:shareToken` | PublicProjectView | ❌ | Xem công khai bằng share token |
| `/personal-info` | PersonalInfo | ✅ | Thông tin cá nhân |
| `/communication` | Communication | ✅ | Trò chuyện nhóm |
| `/feedback` | Feedback | ✅ | Gửi phản hồi |
| `/members` | MemberManagement | ✅ | Quản lý thành viên (Admin/Leader) |
| `/admin/activity` | AdminActivity | ✅ | Nhật ký hệ thống (Admin) |
| `/admin/backup` | AdminBackup | ✅ | Backup/Restore (Admin) |
| `*` | NotFound | ❌ | 404 |

### 8.2 URL Structure

**Semantic URLs (preferred):**
- `/p/ten-du-an` - Dự án
- `/p/ten-du-an/t/ten-task` - Task trong dự án
- `/s/abc123` - Share link

**Legacy URLs (backward compatible):**
- `/groups/uuid` - Dự án (legacy)
- `/groups/uuid/tasks/uuid` - Task (legacy)

---

## 9. HƯỚNG DẪN SETUP & CHẠY PROJECT

### 9.1 Yêu cầu hệ thống
- **Node.js:** >= 18.x (recommend 20.x)
- **Package Manager:** npm, yarn, pnpm, hoặc bun
- **Git:** Installed
- **Browser:** Chrome, Firefox, Edge (latest)

### 9.2 Clone project

```bash
git clone https://github.com/your-repo/teamworks-ueh.git
cd teamworks-ueh
```

### 9.3 Cài đặt dependencies

```bash
# npm
npm install

# yarn
yarn install

# bun (fastest)
bun install
```

### 9.4 Cấu hình môi trường

```bash
# Copy file mẫu
cp .env.example .env

# Chỉnh sửa .env với thông tin từ Supabase Dashboard
```

### 9.5 Chạy development

```bash
npm run dev
# hoặc
bun dev
```

Mở trình duyệt: `http://localhost:5173`

### 9.6 Build production

```bash
npm run build
```

Output: `dist/`

### 9.7 Preview build

```bash
npm run preview
```

### 9.8 Deploy

**Lovable (Auto):**
- Click "Publish" trong Lovable interface

**Vercel:**
```bash
npm i -g vercel
vercel --prod
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 10. TẠO TÀI KHOẢN ADMIN ĐẦU TIÊN

### 10.1 Cách 1: Sử dụng Edge Function (Recommended)

```bash
curl -X POST https://[project-id].supabase.co/functions/v1/ensure-admin
```

**Tài khoản được tạo:**
- Email: `khanhngh.ueh@gmail.com`
- Password: `14092005`

### 10.2 Cách 2: Tạo thủ công

1. **Đăng ký tài khoản** qua giao diện website
2. **Xác minh email**
3. **Chạy SQL trong Supabase Dashboard:**

```sql
-- Lấy user_id
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Cập nhật profile
UPDATE public.profiles
SET is_approved = true, full_name = 'Admin Name'
WHERE id = 'your-user-id';

-- Gán role admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-id', 'admin');
```

### 10.3 Tạo tài khoản Leader

```sql
-- Gán role leader
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-id', 'leader');
```

---

## 11. NHỮNG LƯU Ý QUAN TRỌNG

### 11.1 ⚠️ Files KHÔNG ĐƯỢC chỉnh sửa

| File | Lý do |
|------|-------|
| `src/integrations/supabase/client.ts` | Auto-generated |
| `src/integrations/supabase/types.ts` | Auto-generated từ DB schema |
| `supabase/config.toml` | Auto-generated |
| `.env` | Chứa secrets |
| `supabase/migrations/*` | Managed by Supabase |

### 11.2 ⚠️ Bảo mật

| Vấn đề | Hậu quả | Phòng tránh |
|--------|---------|-------------|
| Tắt RLS | Ai cũng đọc/ghi được data | KHÔNG BAO GIỜ tắt RLS |
| Lộ service_role_key | Full access database | Chỉ dùng trong Edge Functions |
| Lưu role trong profiles | User tự nâng quyền | Dùng bảng user_roles riêng |
| Không validate input | SQL injection, XSS | Dùng Zod validation |
| Không limit file size | DoS attack | Set max_file_size |

### 11.3 ✅ Best Practices

1. **Database:**
   - Luôn dùng migrations
   - Test RLS policies với nhiều role
   - Backup trước khi thay đổi schema

2. **Code:**
   - Tách component nhỏ, tái sử dụng
   - Dùng TanStack Query cho data fetching
   - Handle loading/error states

3. **Security:**
   - Validate ở cả client và server
   - Dùng SECURITY DEFINER functions
   - Không hardcode secrets

---

## 12. TROUBLESHOOTING

### 12.1 Lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| "Invalid API key" | Sai anon key | Kiểm tra `VITE_SUPABASE_PUBLISHABLE_KEY` |
| "JWT expired" | Session hết hạn | Đăng xuất và đăng nhập lại |
| "new row violates row-level security policy" | RLS chặn | Kiểm tra user có quyền không, user_id có đúng không |
| "infinite recursion detected in policy" | RLS tự gọi chính nó | Dùng SECURITY DEFINER function |
| "Bucket not found" | Chưa tạo storage bucket | Chạy SQL tạo bucket |
| Blank page | JS error | Mở DevTools → Console |
| 401 Unauthorized | Chưa đăng nhập hoặc token hết hạn | Refresh token hoặc đăng nhập lại |
| 403 Forbidden | Không có quyền | Kiểm tra RLS policies |
| File upload failed | Vượt quá size hoặc sai type | Kiểm tra bucket policies |

### 12.2 Debug Tips

```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Check session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Check RLS manually
const { data, error } = await supabase.from('table').select('*');
console.log('Data:', data, 'Error:', error);
```

### 12.3 Liên hệ hỗ trợ

- **Email:** khanhngh.ueh@gmail.com
- **GitHub Issues:** [Link to repo]

---

## 13. CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 04/02/2026 | Thêm Edge Functions, Design System, Routing, Troubleshooting |
| 1.0 | 04/02/2026 | Initial version |

---

> **⚠️ LƯU Ý:** File này cần được CẬP NHẬT mỗi khi có thay đổi:
> - Database schema
> - Storage buckets  
> - Auth configuration
> - RLS policies
> - Edge Functions
> - Công nghệ sử dụng
> - Routes

---

**© 2025-2026 Teamworks UEH - Đại học Kinh tế TP. Hồ Chí Minh**
