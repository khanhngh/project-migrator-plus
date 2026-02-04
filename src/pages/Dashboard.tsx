import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WelcomeHeader from '@/components/dashboard/WelcomeHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import ProjectGrid from '@/components/dashboard/ProjectGrid';
import FirstTimeOnboarding from '@/components/FirstTimeOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* First-time onboarding */}
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

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <WelcomeHeader 
          profile={profile} 
          isAdmin={isAdmin} 
          isLeader={isLeader} 
        />

        {/* Stats Grid */}
        <StatsGrid groups={groups} />

        {/* Projects */}
        <ProjectGrid groups={groups} />
      </div>
    </DashboardLayout>
  );
}
