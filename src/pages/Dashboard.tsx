import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import DashboardProjectCard from '@/components/dashboard/DashboardProjectCard';
import { supabase } from '@/integrations/supabase/client';
import FirstTimeOnboarding from '@/components/FirstTimeOnboarding';
import {
  FolderKanban,
  ArrowRight,
  Loader2,
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { Group } from '@/types/database';

export default function Dashboard() {
  const { user, profile, mustChangePassword, refreshProfile, isLeader, isAdmin } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch groups where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);

      if (memberError) throw memberError;

      const groupIds = memberData?.map((m) => m.group_id) || [];

      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      setGroups(groupsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = () => {
    if (isAdmin) return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Admin</Badge>;
    if (isLeader) return <Badge className="bg-warning/20 text-warning border-warning/30">Leader</Badge>;
    return <Badge variant="secondary" className="border-border">Member</Badge>;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* First-time onboarding: Password change + Avatar upload */}
      {user && profile && mustChangePassword && (
        <FirstTimeOnboarding
          open={mustChangePassword}
          userId={user.id}
          userFullName={profile.full_name}
          userEmail={profile.email}
          userStudentId={profile.student_id}
          onComplete={refreshProfile}
        />
      )}

      <div className="space-y-6">
        {/* Welcome Section - Compact & Modern */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-6 text-primary-foreground shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl" />

          <div className="relative flex items-center gap-5">
            <div className="relative">
              <UserAvatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                size="lg"
                className="border-[3px] border-white/30 shadow-2xl ring-4 ring-white/10"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-primary flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-white/70 text-sm">{getGreeting()}</span>
              </div>
              <h1 className="text-2xl font-bold truncate">{profile?.full_name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-white/60 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  MSSV: {profile?.student_id}
                </span>
                {getRoleBadge()}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200/50 dark:border-blue-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{groups.length}</p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Dự án</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {groups.filter(g => g.is_public).length}
                  </p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Công khai</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/30 border-violet-200/50 dark:border-violet-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                    {groups[0]?.name || 'Chưa có dự án'}
                  </p>
                  <p className="text-xs text-violet-600/70 dark:text-violet-400/70">Dự án gần nhất</p>
                </div>
                {groups[0] && (
                  <Link to={`/p/${groups[0].slug}`}>
                    <Button size="sm" variant="ghost" className="text-violet-600 hover:bg-violet-500/10">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Projects */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-primary" />
                Projects của tôi
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {groups.length} dự án đang tham gia
              </CardDescription>
            </div>
            <Link to="/groups">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Tất cả
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <FolderKanban className="w-10 h-10 opacity-30" />
                </div>
                <p className="text-base font-medium mb-1">Bạn chưa tham gia project nào</p>
                <p className="text-sm text-muted-foreground/70">Liên hệ Leader để được thêm vào project</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {groups.map((group) => (
                  <DashboardProjectCard
                    key={group.id}
                    group={group}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}