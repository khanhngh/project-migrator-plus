import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Shield, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import uehLogo from '@/assets/ueh-logo-new.png';

export default function Landing() {
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitAdmin = async () => {
    setIsInitializing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ensure-admin');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(data.message || 'Khởi tạo admin thành công!');
      } else {
        toast.error(data?.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('Error initializing admin:', error);
      toast.error('Lỗi kết nối: ' + (error.message || 'Không thể khởi tạo admin'));
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={uehLogo}
              alt="UEH logo"
              className="h-8 w-auto"
              loading="lazy"
            />
            <div className="hidden sm:block h-6 w-px bg-border" />
            <span className="hidden sm:block font-semibold text-lg text-foreground">Teamworks UEH</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Nút khởi tạo admin - nhỏ gọn */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInitAdmin}
              disabled={isInitializing}
              className="text-muted-foreground hover:text-foreground text-xs gap-1 h-8 px-2"
              title="Khởi tạo tài khoản Admin"
            >
              {isInitializing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Shield className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Init</span>
            </Button>
            
            <Link to="/auth">
              <Button className="font-semibold">
                Đăng nhập
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Sub-header - contact info */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-medium">Liên hệ Leader phụ trách hệ thống:</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Họ tên: <span className="font-semibold text-foreground">Nguyễn Hoàng Khánh</span>
            </span>
            <span>
              Email: <span className="font-semibold text-foreground">khanhngh.ueh@gmail.com</span>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main className="flex-1 flex items-center">
        <section className="w-full py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                <Users className="w-4 h-4" />
                Dành cho sinh viên UEH
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Effective Team{' '}
                <span className="text-primary">Task Management</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Nền tảng số giúp sinh viên quản lý công việc nhóm một cách minh bạch,
                công bằng với hệ thống tính điểm tự động.
              </p>

              <div className="flex justify-center pt-4">
                <Link to="/auth">
                  <Button size="lg" className="text-base font-semibold px-10">
                    Đăng nhập hệ thống
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-8 pt-8">
                <div className="px-4 py-2 bg-card rounded-lg shadow-card">
                  <p className="text-sm font-medium text-foreground">Đồ án Sinh viên</p>
                </div>
                <div className="px-4 py-2 bg-card rounded-lg shadow-card">
                  <p className="text-sm font-medium text-foreground">Mục đích Học tập</p>
                </div>
                <div className="px-4 py-2 bg-card rounded-lg shadow-card">
                  <p className="text-sm font-medium text-foreground">Phi thương mại</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 mt-8">
        <div className="container mx-auto px-4 space-y-4 text-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={uehLogo}
                alt="UEH logo"
                className="h-8 w-auto"
                loading="lazy"
              />
              <span className="text-xs md:text-sm text-muted-foreground">
                © 2025 Teamworks UEH &mdash; Hệ thống quản lý công việc nhóm cho sinh viên UEH.
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground text-center md:text-right max-w-md">
              Teamworks hỗ trợ chia task, theo dõi tiến độ, tính điểm từng thành viên và tổng kết theo giai đoạn,
              giúp giảng viên và sinh viên đánh giá công bằng, minh bạch.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Đơn vị: Trường Đại học Kinh tế TP. Hồ Chí Minh (UEH).</span>
            <span>
              Góp ý &amp; báo lỗi hệ thống: <span className="font-semibold text-foreground">khanhngh.ueh@gmail.com</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
