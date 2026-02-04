# 🚀 HƯỚNG DẪN SETUP VÀ TÁI TẠO WEBSITE TEAMWORKS UEH

> **Phiên bản:** 1.0  
> **Cập nhật lần cuối:** 04/02/2026  
> **Tác giả:** Nguyễn Hoàng Khánh (khanhngh.ueh@gmail.com)

---

## 📋 MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Công nghệ & Phiên bản](#2-công-nghệ--phiên-bản)
3. [Supabase - Cấu hình chi tiết](#3-supabase---cấu-hình-chi-tiết)
4. [Biến môi trường (ENV)](#4-biến-môi-trường-env)
5. [Cấu trúc thư mục source code](#5-cấu-trúc-thư-mục-source-code)
6. [Hướng dẫn Setup & Chạy Project](#6-hướng-dẫn-setup--chạy-project)
7. [Những lưu ý quan trọng](#7-những-lưu-ý-quan-trọng)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả
**Teamworks UEH** là hệ thống quản lý công việc nhóm dành cho sinh viên Đại học Kinh tế TP.HCM (UEH). Hệ thống giúp:
- Quản lý dự án nhóm một cách minh bạch
- Phân công và theo dõi tiến độ công việc
- Tính điểm tự động dựa trên đóng góp của từng thành viên
- Hỗ trợ giao tiếp nội bộ nhóm

### 1.2 Chức năng chính
| Chức năng | Mô tả |
|-----------|-------|
| **Quản lý nhóm** | Tạo nhóm, thêm/xóa thành viên, phân quyền |
| **Quản lý Task** | Tạo task, gán người phụ trách, theo dõi deadline |
| **Giai đoạn (Stage)** | Chia dự án thành các giai đoạn, đặt trọng số điểm |
| **Nộp bài** | Upload file hoặc link, lưu lịch sử nộp bài |
| **Tính điểm** | Tự động tính điểm dựa trên hoàn thành, trễ hạn, bonus |
| **Khiếu nại điểm** | Thành viên có thể gửi khiếu nại về điểm số |
| **Tài liệu nhóm** | Upload và quản lý tài liệu dự án |
| **Thông báo** | Hệ thống thông báo realtime |
| **AI Assistant** | Trợ lý AI hỗ trợ công việc nhóm |

### 1.3 Đối tượng sử dụng
| Vai trò | Quyền hạn |
|---------|-----------|
| **Admin** | Quản trị toàn hệ thống, quản lý user, xem tất cả dự án |
| **Leader** | Tạo nhóm, quản lý thành viên, tạo task, chấm điểm |
| **Member** | Xem task được gán, nộp bài, xem điểm cá nhân |

---

## 2. CÔNG NGHỆ & PHIÊN BẢN

### 2.1 Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React | ^18.3.1 | UI Framework |
| Vite | ^5.x | Build tool |
| TypeScript | ^5.x | Type safety |
| Tailwind CSS | ^3.x | Styling |
| shadcn/ui | Latest | UI Components |
| TanStack Query | ^5.90.16 | Data fetching & caching |
| React Router DOM | ^6.30.1 | Routing |
| Lucide React | ^0.462.0 | Icons |

### 2.2 Backend
| Công nghệ | Mục đích |
|-----------|----------|
| Supabase | Database, Auth, Storage, Edge Functions |
| PostgreSQL | Database (managed by Supabase) |
| Deno | Edge Functions runtime |

### 2.3 Thư viện quan trọng khác
| Thư viện | Phiên bản | Mục đích |
|----------|-----------|----------|
| @supabase/supabase-js | ^2.87.3 | Supabase client |
| @hello-pangea/dnd | ^18.0.1 | Drag & drop (Kanban) |
| date-fns | ^3.6.0 | Xử lý ngày tháng |
| jspdf | ^4.1.0 | Xuất PDF |
| xlsx | ^0.18.5 | Xuất Excel |
| react-hook-form | ^7.61.1 | Form handling |
| zod | ^3.25.76 | Validation |
| sonner | ^1.7.4 | Toast notifications |
| recharts | ^2.15.4 | Charts |

---

## 3. SUPABASE - CẤU HÌNH CHI TIẾT

### 3.1 Tạo Supabase Project

#### Bước 1: Tạo project mới
1. Truy cập https://supabase.com/dashboard
2. Click **"New Project"**
3. Điền thông tin:
   - **Name:** `teamworks-ueh`
   - **Database Password:** Tạo mật khẩu mạnh (LƯU LẠI!)
   - **Region:** `Southeast Asia (Singapore)` - gần Việt Nam nhất
4. Click **"Create new project"**
5. Đợi 2-3 phút để project được khởi tạo

#### Bước 2: Lấy thông tin kết nối
Vào **Settings → API** để lấy:
- **Project URL:** `https://[project-id].supabase.co`
- **anon public key:** Dùng cho client-side
- **service_role key:** ⚠️ CHỈ DÙNG CHO SERVER, KHÔNG ĐƯỢC LỘ RA CLIENT

---

### 3.2 DATABASE - DANH SÁCH BẢNG

#### 3.2.1 Bảng `profiles` - Thông tin người dùng
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
```
**Mục đích:** Lưu thông tin cá nhân của người dùng (mở rộng từ auth.users)

#### 3.2.2 Bảng `user_roles` - Phân quyền người dùng
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'leader', 'member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
```
**Mục đích:** Lưu vai trò của người dùng (TÁCH RIÊNG khỏi profiles để bảo mật)

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
```
**Mục đích:** Lưu thông tin nhóm dự án

#### 3.2.4 Bảng `group_members` - Thành viên nhóm
```sql
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
```
**Mục đích:** Liên kết người dùng với nhóm

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
```
**Mục đích:** Chia dự án thành các giai đoạn

#### 3.2.6 Bảng `tasks` - Công việc
```sql
CREATE TYPE public.task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'VERIFIED');

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
  max_file_size BIGINT DEFAULT 10485760,
  is_hidden BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**Mục đích:** Lưu thông tin công việc

#### 3.2.7 Bảng `task_assignments` - Phân công task
```sql
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);
```
**Mục đích:** Liên kết task với người được phân công

#### 3.2.8 Bảng `submission_history` - Lịch sử nộp bài
```sql
CREATE TABLE public.submission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  submission_link TEXT NOT NULL,
  submission_type TEXT DEFAULT 'link',
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**Mục đích:** Lưu lịch sử nộp bài của task

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
```
**Mục đích:** Lưu điểm từng task của thành viên

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
```
**Mục đích:** Tổng hợp điểm theo giai đoạn

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
```
**Mục đích:** Điểm cuối cùng của thành viên trong nhóm

#### 3.2.12 Bảng `stage_weights` - Trọng số giai đoạn
```sql
CREATE TABLE public.stage_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, stage_id)
);
```
**Mục đích:** Lưu trọng số điểm của từng giai đoạn

#### 3.2.13 Bảng `score_appeals` - Khiếu nại điểm
```sql
CREATE TABLE public.score_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_score_id UUID REFERENCES task_scores(id),
  stage_score_id UUID REFERENCES member_stage_scores(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id UUID,
  reviewer_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**Mục đích:** Lưu đơn khiếu nại điểm

#### 3.2.14 Bảng `appeal_attachments` - File đính kèm khiếu nại
```sql
CREATE TABLE public.appeal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_id UUID NOT NULL REFERENCES score_appeals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.15 Bảng `score_adjustment_history` - Lịch sử điều chỉnh điểm
```sql
CREATE TABLE public.score_adjustment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_id UUID NOT NULL,
  adjustment_type TEXT NOT NULL,
  previous_score NUMERIC,
  adjustment_value NUMERIC,
  new_score NUMERIC,
  reason TEXT,
  adjusted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.16 Bảng `task_notes` - Ghi chú task
```sql
CREATE TABLE public.task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  content TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.17 Bảng `task_note_attachments` - File đính kèm ghi chú
```sql
CREATE TABLE public.task_note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES task_notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.18 Bảng `task_comments` - Bình luận task
```sql
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.19 Bảng `project_messages` - Tin nhắn nhóm
```sql
CREATE TABLE public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'chat',
  source_task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.20 Bảng `message_mentions` - Mention trong tin nhắn
```sql
CREATE TABLE public.message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  message_type TEXT NOT NULL,
  comment_id UUID REFERENCES task_comments(id),
  mentioned_user_id UUID NOT NULL,
  mentioned_by UUID NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.21 Bảng `notifications` - Thông báo
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  group_id UUID REFERENCES groups(id),
  task_id UUID REFERENCES tasks(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.22 Bảng `activity_logs` - Nhật ký hoạt động
```sql
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.23 Bảng `project_resources` - Tài liệu dự án
```sql
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
```

#### 3.2.24 Bảng `resource_folders` - Thư mục tài liệu
```sql
CREATE TABLE public.resource_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.25 Bảng `pending_approvals` - Yêu cầu tham gia nhóm
```sql
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.26 Bảng `feedbacks` - Phản hồi người dùng
```sql
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID REFERENCES groups(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.27 Bảng `feedback_comments` - Bình luận phản hồi
```sql
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

### 3.3 DATABASE FUNCTIONS

#### 3.3.1 Function kiểm tra quyền
```sql
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
```

#### 3.3.2 Function tạo slug tiếng Việt
```sql
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

#### 3.3.3 Triggers
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

-- Áp dụng cho các bảng
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
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

### 3.4 AUTH - XÁC THỰC NGƯỜI DÙNG

#### 3.4.1 Phương thức đăng nhập
| Phương thức | Trạng thái | Ghi chú |
|-------------|------------|---------|
| Email/Password | ✅ Bật | Phương thức chính |
| OAuth Google | ❌ Tắt | Chưa triển khai |
| OAuth Facebook | ❌ Tắt | Chưa triển khai |
| Magic Link | ❌ Tắt | Không sử dụng |

#### 3.4.2 Cấu hình Auth (Supabase Dashboard → Authentication → Settings)

**Email Settings:**
- ✅ Enable Email Signup
- ❌ Disable Email Confirmations (TẮT - User phải xác minh email)
- ✅ Secure Email Change
- ✅ Secure Password Change

**Password Policy:**
- Minimum length: 6
- Require lowercase: Yes
- Require uppercase: No
- Require number: No
- Require special character: No

**Rate Limiting:**
- Email signup: 3 requests per hour per IP
- Password recovery: 3 requests per hour per IP

#### 3.4.3 Luồng xác thực

**Đăng ký:**
1. User nhập email + password + thông tin cá nhân
2. Hệ thống gửi email xác minh
3. User click link xác minh
4. Profile được tạo tự động (via trigger)
5. Admin duyệt tài khoản (set `is_approved = true`)
6. User có thể đăng nhập

**Đăng nhập:**
1. User nhập email + password
2. Kiểm tra `is_approved = true`
3. Nếu `must_change_password = true` → redirect đổi mật khẩu
4. Redirect về dashboard

**Logout:**
1. Clear session
2. Redirect về trang đăng nhập

---

### 3.5 ROW LEVEL SECURITY (RLS)

⚠️ **QUAN TRỌNG:** TẤT CẢ các bảng đều BẬT RLS

#### 3.5.1 Bảng `profiles`
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User có thể xem profile đã approved hoặc của chính mình
CREATE POLICY "Users can view all approved profiles"
ON public.profiles FOR SELECT
USING ((is_approved = true) OR (id = auth.uid()) OR is_admin(auth.uid()));

-- User chỉ có thể update profile của mình
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- User có thể insert profile của mình
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());
```

#### 3.5.2 Bảng `user_roles`
```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Chỉ admin có thể quản lý roles
CREATE POLICY "Only admin can manage roles"
ON public.user_roles FOR ALL
USING (is_admin(auth.uid()));

-- User có thể xem roles của mình
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING ((user_id = auth.uid()) OR is_admin(auth.uid()));
```

#### 3.5.3 Bảng `groups`
```sql
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Thành viên có thể xem nhóm của mình
CREATE POLICY "Members can view their groups"
ON public.groups FOR SELECT
USING (is_group_member(auth.uid(), id) OR is_admin(auth.uid()) OR (is_public = true));

-- Leader/Admin có thể tạo nhóm
CREATE POLICY "Leaders and admins can create groups"
ON public.groups FOR INSERT
WITH CHECK (has_role(auth.uid(), 'leader') OR is_admin(auth.uid()));

-- Leader nhóm có thể update
CREATE POLICY "Group leaders can update groups"
ON public.groups FOR UPDATE
USING (is_group_leader(auth.uid(), id));

-- Leader nhóm có thể xóa
CREATE POLICY "Group leaders can delete groups"
ON public.groups FOR DELETE
USING (is_group_leader(auth.uid(), id));
```

#### 3.5.4 Bảng `group_members`
```sql
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Thành viên có thể xem danh sách thành viên
CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
USING (is_group_member(auth.uid(), group_id) OR is_admin(auth.uid()));

-- Leader có thể quản lý thành viên
CREATE POLICY "Leaders can manage group members"
ON public.group_members FOR ALL
USING (is_group_leader(auth.uid(), group_id));
```

#### 3.5.5 Bảng `tasks`
```sql
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Thành viên có thể xem tasks
CREATE POLICY "Group members can view tasks"
ON public.tasks FOR SELECT
USING (is_group_member(auth.uid(), group_id) OR is_admin(auth.uid()));

-- Leader có thể tạo tasks
CREATE POLICY "Leaders can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (is_group_leader(auth.uid(), group_id));

-- Leader có thể update tất cả
CREATE POLICY "Leaders can update all task fields"
ON public.tasks FOR UPDATE
USING (is_group_leader(auth.uid(), group_id));

-- Người được gán có thể update status/submission
CREATE POLICY "Assignees can update task status and submission"
ON public.tasks FOR UPDATE
USING (is_task_assignee(auth.uid(), id))
WITH CHECK (is_task_assignee(auth.uid(), id));

-- Leader có thể xóa tasks
CREATE POLICY "Leaders can delete tasks"
ON public.tasks FOR DELETE
USING (is_group_leader(auth.uid(), group_id));
```

**(Các bảng khác có RLS tương tự - xem chi tiết trong Supabase Dashboard → Database → Policies)**

---

### 3.6 STORAGE - LƯU TRỮ FILE

#### 3.6.1 Danh sách Buckets

| Bucket Name | Public | Mục đích | Max Size |
|-------------|--------|----------|----------|
| `avatars` | ✅ Yes | Ảnh đại diện người dùng | 5MB |
| `group-images` | ✅ Yes | Ảnh đại diện nhóm | 5MB |
| `task-submissions` | ✅ Yes | File nộp bài của task | 10MB (có thể tùy chỉnh) |
| `task-note-attachments` | ✅ Yes | File đính kèm ghi chú task | 10MB |
| `appeal-attachments` | ✅ Yes | File đính kèm khiếu nại | 5MB |
| `project-resources` | ✅ Yes | Tài liệu dự án | 20MB |

#### 3.6.2 Tạo Buckets
```sql
-- Avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Group images
INSERT INTO storage.buckets (id, name, public) VALUES ('group-images', 'group-images', true);

-- Task submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('task-submissions', 'task-submissions', true);

-- Task note attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('task-note-attachments', 'task-note-attachments', true);

-- Appeal attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('appeal-attachments', 'appeal-attachments', true);

-- Project resources
INSERT INTO storage.buckets (id, name, public) VALUES ('project-resources', 'project-resources', true);
```

#### 3.6.3 Storage RLS Policies
```sql
-- Avatars: Ai cũng xem được, chỉ owner upload được
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
| task-submissions | `{group_id}/{task_id}/{user_id}/{timestamp}.{ext}` | `grp1/task1/usr1/1706198400000.pdf` |
| project-resources | `{group_id}/{folder_id}/{timestamp}_{filename}` | `grp1/folder1/1706198400000_report.docx` |

#### 3.6.5 Loại file được phép
| Bucket | Allowed MIME Types |
|--------|-------------------|
| avatars | image/jpeg, image/png, image/gif, image/webp |
| group-images | image/jpeg, image/png, image/gif, image/webp |
| task-submissions | Tất cả |
| project-resources | Tất cả |

---

## 4. BIẾN MÔI TRƯỜNG (ENV)

### 4.1 Danh sách biến môi trường

| Biến | Ý nghĩa | Bắt buộc | Môi trường |
|------|---------|----------|------------|
| `VITE_SUPABASE_URL` | URL của Supabase project | ✅ | Local + Production |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | ✅ | Local + Production |
| `VITE_SUPABASE_PROJECT_ID` | ID của Supabase project | ✅ | Local + Production |
| `LOVABLE_API_KEY` | API key cho AI Gateway | ⚠️ | Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | ⚠️ | Edge Functions |

### 4.2 File .env mẫu
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 4.3 Lưu ý bảo mật
- ⚠️ **KHÔNG BAO GIỜ** commit file `.env` lên git
- ⚠️ **KHÔNG BAO GIỜ** lộ `SERVICE_ROLE_KEY` ra client-side
- ✅ File `.env` đã được thêm vào `.gitignore`
- ✅ Các secret nhạy cảm lưu trong Supabase Secrets

---

## 5. CẤU TRÚC THƯ MỤC SOURCE CODE

```
teamworks-ueh/
├── public/                     # Static files
│   ├── favicon.png            # Favicon
│   ├── placeholder.svg        # Placeholder image
│   └── robots.txt             # SEO robots
│
├── src/
│   ├── assets/                # Images, logos
│   │   ├── ueh-logo.png
│   │   ├── ueh-logo-new.png
│   │   ├── zalo-logo.png
│   │   └── ai-assistant-logo.png
│   │
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (40+ components)
│   │   │
│   │   ├── layout/           # Layout components
│   │   │   └── DashboardLayout.tsx
│   │   │
│   │   ├── ai/               # AI Assistant
│   │   │   ├── AIAssistantButton.tsx
│   │   │   └── AIAssistantPanel.tsx
│   │   │
│   │   ├── communication/    # Chat/messaging
│   │   │   ├── MentionInput.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   └── TaskComments.tsx
│   │   │
│   │   ├── dashboard/        # Dashboard components
│   │   │   └── DashboardProjectCard.tsx
│   │   │
│   │   ├── public/           # Public view components
│   │   │   ├── PublicActivityLog.tsx
│   │   │   ├── PublicGroupDashboard.tsx
│   │   │   └── ...
│   │   │
│   │   ├── scores/           # Scoring components
│   │   │   ├── ProcessScores.tsx
│   │   │   ├── TaskScoringDialog.tsx
│   │   │   └── ...
│   │   │
│   │   └── [Other components] # TaskCard, KanbanBoard, etc.
│   │
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── NavigationContext.tsx
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useAutosave.ts
│   │   └── useUserPresence.ts
│   │
│   ├── integrations/          # External integrations
│   │   └── supabase/
│   │       ├── client.ts     # Supabase client (AUTO-GENERATED)
│   │       └── types.ts      # Database types (AUTO-GENERATED)
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── utils.ts          # General utilities
│   │   ├── datetime.ts       # Date/time helpers
│   │   ├── urlUtils.ts       # URL helpers
│   │   ├── notifications.ts  # Notification helpers
│   │   ├── messageParser.ts  # Message parsing
│   │   ├── excelExport.ts    # Excel export
│   │   ├── activityLogPdf.ts # Activity log PDF
│   │   ├── projectEvidencePdf.ts
│   │   └── uehLogoBase64.ts  # Logo for PDF
│   │
│   ├── pages/                 # Page components
│   │   ├── Index.tsx         # Entry point
│   │   ├── Landing.tsx       # Landing page
│   │   ├── Auth.tsx          # Auth selection
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Groups.tsx        # Groups list
│   │   ├── GroupDetail.tsx   # Group detail
│   │   ├── TaskDetail.tsx    # Task detail
│   │   ├── PersonalInfo.tsx  # Personal info
│   │   ├── Communication.tsx # Group chat
│   │   ├── Feedback.tsx      # Feedback page
│   │   ├── MemberManagement.tsx
│   │   ├── FilePreview.tsx
│   │   ├── PublicProjectView.tsx
│   │   ├── AdminUsers.tsx    # Admin: user management
│   │   ├── AdminActivity.tsx # Admin: activity logs
│   │   ├── AdminBackup.tsx   # Admin: backup/restore
│   │   └── NotFound.tsx      # 404 page
│   │
│   ├── types/                 # TypeScript types
│   │   ├── database.ts       # Database types
│   │   └── processScores.ts  # Score types
│   │
│   ├── App.tsx               # Main App component
│   ├── App.css               # Global styles
│   ├── index.css             # Tailwind imports + CSS variables
│   ├── main.tsx              # Entry point
│   └── vite-env.d.ts         # Vite types
│
├── supabase/
│   ├── config.toml           # Supabase config (AUTO-GENERATED)
│   ├── functions/            # Edge Functions
│   │   ├── ensure-admin/     # Ensure admin exists
│   │   ├── manage-users/     # User management
│   │   └── team-assistant/   # AI assistant
│   └── migrations/           # Database migrations (AUTO)
│
├── .env                       # Environment variables (NOT IN GIT)
├── .gitignore
├── components.json            # shadcn/ui config
├── eslint.config.js
├── index.html                 # HTML template
├── package.json
├── postcss.config.js
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts             # Vite config
└── SETUP_REBUILD_WEBSITE_GUIDE.md  # This file
```

---

## 6. HƯỚNG DẪN SETUP & CHẠY PROJECT

### 6.1 Yêu cầu hệ thống
- **Node.js:** >= 18.x
- **Package Manager:** npm, yarn, hoặc bun
- **Git:** Đã cài đặt
- **Trình duyệt:** Chrome, Firefox, Edge (phiên bản mới)

### 6.2 Clone project
```bash
git clone https://github.com/your-repo/teamworks-ueh.git
cd teamworks-ueh
```

### 6.3 Cài đặt dependencies
```bash
# Sử dụng npm
npm install

# Hoặc yarn
yarn install

# Hoặc bun (nhanh nhất)
bun install
```

### 6.4 Cấu hình môi trường
1. Copy file `.env.example` thành `.env`
2. Điền các biến môi trường từ Supabase Dashboard

```bash
cp .env.example .env
```

### 6.5 Chạy development server
```bash
# npm
npm run dev

# yarn
yarn dev

# bun
bun dev
```

Mở trình duyệt tại: `http://localhost:5173`

### 6.6 Build production
```bash
# npm
npm run build

# yarn
yarn build

# bun
bun run build
```

Output sẽ nằm trong thư mục `dist/`

### 6.7 Preview production build
```bash
npm run preview
```

### 6.8 Deploy

#### Lovable (Recommended)
- Project được host tự động trên Lovable
- Click "Publish" trong Lovable interface
- URL production: `https://project-sparkle-transfer.lovable.app`

#### Vercel
```bash
npm i -g vercel
vercel --prod
```

#### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod
```

---

## 7. NHỮNG LƯU Ý QUAN TRỌNG

### 7.1 ⚠️ Files KHÔNG ĐƯỢC chỉnh sửa thủ công

| File | Lý do |
|------|-------|
| `src/integrations/supabase/client.ts` | Auto-generated bởi Lovable |
| `src/integrations/supabase/types.ts` | Auto-generated từ database schema |
| `supabase/config.toml` | Auto-generated bởi Lovable |
| `.env` | Chứa secrets, không commit lên git |
| `supabase/migrations/*` | Managed bởi Supabase |

### 7.2 ⚠️ Lỗi thường gặp khi setup

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| "Invalid API key" | Sai anon key | Kiểm tra lại `VITE_SUPABASE_PUBLISHABLE_KEY` |
| "JWT expired" | Session hết hạn | Đăng xuất và đăng nhập lại |
| "RLS policy violation" | Không có quyền | Kiểm tra RLS policies |
| "Bucket not found" | Chưa tạo storage bucket | Chạy SQL tạo bucket |
| "Function not found" | Chưa có database function | Chạy SQL tạo function |
| Blank page | Lỗi JS | Mở DevTools → Console để xem lỗi |

### 7.3 ⚠️ Cẩn thận khi chỉnh sửa Supabase

1. **Database Schema:**
   - LUÔN backup trước khi thay đổi
   - Dùng migrations, KHÔNG sửa trực tiếp
   - Test kỹ trên môi trường dev trước

2. **RLS Policies:**
   - KHÔNG TẮT RLS (bảo mật)
   - Test kỹ với nhiều role khác nhau
   - Cẩn thận với infinite recursion

3. **Storage:**
   - KHÔNG xóa bucket đang có data
   - Backup files quan trọng trước khi thay đổi

4. **Auth:**
   - KHÔNG enable auto-confirm email (trừ khi cố ý)
   - KHÔNG lưu role trong profiles (bảo mật)

### 7.4 ⚠️ Rủi ro nếu cấu hình sai

| Cấu hình sai | Hậu quả |
|--------------|---------|
| Tắt RLS | ⛔ Ai cũng đọc/ghi được data |
| Lộ service_role_key | ⛔ Hacker có full access database |
| Lưu role trong profiles | ⛔ User có thể tự nâng quyền |
| Không validate input | ⛔ SQL injection, XSS attacks |
| Không limit file size | ⛔ DoS attack bằng upload file lớn |

### 7.5 ✅ Best Practices

1. **Bảo mật:**
   - Luôn bật RLS
   - Validate input ở cả client và server
   - Dùng SECURITY DEFINER function cho RLS

2. **Performance:**
   - Dùng pagination cho danh sách dài
   - Index các cột thường query
   - Dùng TanStack Query để cache data

3. **Code Quality:**
   - Tách component nhỏ, tái sử dụng
   - Dùng TypeScript strict mode
   - Comment code phức tạp

---

## 📞 LIÊN HỆ HỖ TRỢ

- **Email:** khanhngh.ueh@gmail.com
- **Đơn vị:** Trường Đại học Kinh tế TP. Hồ Chí Minh (UEH)

---

> **Ghi chú:** File này cần được cập nhật mỗi khi có thay đổi lớn trong:
> - Database schema
> - Storage buckets
> - Auth configuration
> - RLS policies
> - Công nghệ sử dụng
