import { Link } from 'react-router-dom';
import { FolderKanban, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardProjectCard from './DashboardProjectCard';
import type { Group } from '@/types/database';

interface ProjectGridProps {
  groups: Group[];
}

export default function ProjectGrid({ groups }: ProjectGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-4">
          <FolderKanban className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Chưa có dự án nào</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Bạn chưa tham gia dự án nào. Liên hệ Leader để được thêm vào project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Projects của tôi</h2>
            <p className="text-xs text-muted-foreground">{groups.length} dự án</p>
          </div>
        </div>
        <Link to="/groups">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            Xem tất cả
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {groups.map((group) => (
          <DashboardProjectCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
