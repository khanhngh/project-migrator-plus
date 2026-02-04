import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Phone, 
  Sparkles, 
  FileText,
  Camera,
  Loader2,
  Save,
  Shield,
  Crown,
  UserCheck,
  Calendar,
  Hash,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PersonalInfo() {
  const { user, profile, isAdmin, isLeader, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Form state
  const [yearBatch, setYearBatch] = useState('');
  const [major, setMajor] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (profile) {
      setYearBatch((profile as any).year_batch || '');
      setMajor((profile as any).major || '');
      setPhone((profile as any).phone || '');
      setSkills((profile as any).skills || '');
      setBio((profile as any).bio || '');
    }
  }, [profile]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    if (isAdmin) return (
      <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg gap-1.5 px-3 py-1">
        <Shield className="w-3.5 h-3.5" />
        Quản trị viên
      </Badge>
    );
    if (isLeader) return (
      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg gap-1.5 px-3 py-1">
        <Crown className="w-3.5 h-3.5" />
        Nhóm trưởng
      </Badge>
    );
    return (
      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg gap-1.5 px-3 py-1">
        <UserCheck className="w-3.5 h-3.5" />
        Thành viên
      </Badge>
    );
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    const fields = [
      profile?.full_name,
      profile?.email,
      profile?.student_id,
      (profile as any)?.year_batch,
      (profile as any)?.major,
      (profile as any)?.phone,
      (profile as any)?.skills,
      (profile as any)?.bio,
      profile?.avatar_url
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Định dạng không hợp lệ',
        description: 'Vui lòng chọn file ảnh (JPEG, PNG, GIF, WebP)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File quá lớn',
        description: 'Kích thước ảnh tối đa là 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({ title: 'Thành công', description: 'Đã cập nhật ảnh đại diện' });
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra khi tải ảnh lên',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          year_batch: yearBatch || null,
          major: major || null,
          phone: phone || null,
          skills: skills || null,
          bio: bio || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Thành công', description: 'Đã cập nhật thông tin cá nhân' });
      setIsEditing(false);
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const InfoItem = ({ icon: Icon, label, value, highlight = false }: { icon: any; label: string; value: string | null | undefined; highlight?: boolean }) => {
    const hasValue = Boolean(value);
    return (
      <div className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${highlight ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
        <div className={`p-2.5 rounded-lg ${hasValue ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          {hasValue ? (
            <p className="font-medium text-foreground mt-0.5">{value}</p>
          ) : (
            <p className="text-muted-foreground/60 italic mt-0.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Chưa cập nhật
            </p>
          )}
        </div>
        {hasValue && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
      </div>
    );
  };

  const skillsList = (profile as any)?.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header với gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 md:p-8 text-primary-foreground">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Avatar với hiệu ứng */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-white/20 rounded-full blur-md group-hover:bg-white/30 transition-colors" />
              <Avatar className="relative h-32 w-32 md:h-36 md:w-36 border-4 border-white/30 shadow-2xl ring-4 ring-white/10">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-white/20 text-primary-foreground text-3xl font-bold">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="w-7 h-7 text-white" />
                    <span className="text-xs text-white font-medium">Đổi ảnh</span>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Thông tin cơ bản */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{profile?.full_name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-primary-foreground/80">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4" />
                    {profile?.student_id}
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {getRoleBadge()}
                {profile?.is_approved && (
                  <Badge variant="outline" className="bg-white/10 border-white/30 text-white gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Đã xác minh
                  </Badge>
                )}
              </div>

              {/* Ngày tham gia */}
              <p className="text-sm text-primary-foreground/70 flex items-center justify-center md:justify-start gap-1.5">
                <Calendar className="w-4 h-4" />
                Tham gia từ {profile?.created_at ? format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Completion */}
        <Card className="border-2 border-dashed">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Hoàn thiện hồ sơ</span>
                  <span className={`text-sm font-bold ${profileCompletion === 100 ? 'text-emerald-600' : 'text-primary'}`}>
                    {profileCompletion}%
                  </span>
                </div>
                <Progress value={profileCompletion} className="h-2.5" />
              </div>
              {profileCompletion < 100 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="shrink-0"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Hoàn thiện ngay
                </Button>
              )}
            </div>
            {profileCompletion < 100 && (
              <p className="text-xs text-muted-foreground mt-3">
                💡 Hồ sơ đầy đủ giúp Leader phân công công việc phù hợp với thế mạnh của bạn
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Thông tin học vấn */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Thông tin học vấn
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <InfoItem icon={GraduationCap} label="Khóa" value={(profile as any)?.year_batch} />
              <InfoItem icon={BookOpen} label="Ngành học" value={(profile as any)?.major} />
            </CardContent>
          </Card>

          {/* Thông tin liên hệ */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <InfoItem icon={Mail} label="Email" value={profile?.email} />
              <InfoItem icon={Phone} label="Số điện thoại" value={(profile as any)?.phone} />
            </CardContent>
          </Card>
        </div>

        {/* Kỹ năng & Giới thiệu */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                Kỹ năng & Giới thiệu
              </CardTitle>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>
              )}
            </div>
            <CardDescription>Thông tin giúp Leader hiểu rõ hơn về bạn</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isEditing ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearBatch" className="flex items-center gap-2 text-sm font-medium">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      Khóa
                    </Label>
                    <Input
                      id="yearBatch"
                      placeholder="VD: K47, K48..."
                      value={yearBatch}
                      onChange={(e) => setYearBatch(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major" className="flex items-center gap-2 text-sm font-medium">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      Ngành học
                    </Label>
                    <Input
                      id="major"
                      placeholder="VD: Quản trị kinh doanh..."
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Số điện thoại
                  </Label>
                  <Input
                    id="phone"
                    placeholder="VD: 0901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills" className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    Kỹ năng / Thế mạnh
                  </Label>
                  <Textarea
                    id="skills"
                    placeholder="VD: Thiết kế đồ họa, PowerPoint, Excel, Thuyết trình... (phân tách bằng dấu phẩy)"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Nhập các kỹ năng, phân tách bằng dấu phẩy</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Giới thiệu bản thân
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Viết vài dòng giới thiệu về bản thân, sở thích, mục tiêu..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Lưu thay đổi
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    <X className="w-4 h-4 mr-2" />
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Skills Tags */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Kỹ năng & Thế mạnh
                  </h4>
                  {skillsList.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skillsList.map((skill: string, idx: number) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border-0"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground/60 italic flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Chưa cập nhật kỹ năng
                    </p>
                  )}
                </div>

                <Separator />

                {/* Bio */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Giới thiệu bản thân
                  </h4>
                  {(profile as any)?.bio ? (
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-4">
                      {(profile as any).bio}
                    </p>
                  ) : (
                    <p className="text-muted-foreground/60 italic flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Chưa có thông tin giới thiệu
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
