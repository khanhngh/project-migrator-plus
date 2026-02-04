import { Sparkles } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';

interface WelcomeHeaderProps {
  profile: {
    avatar_url?: string | null;
    full_name?: string;
    student_id?: string;
  } | null;
  isAdmin: boolean;
  isLeader: boolean;
}

export default function WelcomeHeader({ profile, isAdmin, isLeader }: WelcomeHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const getRoleBadge = () => {
    if (isAdmin) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Admin</Badge>;
    if (isLeader) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Leader</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Member</Badge>;
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10">
      <div className="relative">
        <UserAvatar
          src={profile?.avatar_url}
          name={profile?.full_name}
          size="lg"
          className="ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
        />
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-0.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>{getGreeting()}</span>
        </div>
        <h1 className="text-xl font-bold truncate">{profile?.full_name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {profile?.student_id}
          </span>
          {getRoleBadge()}
        </div>
      </div>
    </div>
  );
}
