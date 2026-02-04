import { FolderKanban, Globe, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Group } from '@/types/database';

interface StatsGridProps {
  groups: Group[];
}

export default function StatsGrid({ groups }: StatsGridProps) {
  const publicCount = groups.filter(g => g.is_public).length;
  const recentProject = groups[0];

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Total Projects */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <FolderKanban className="w-5 h-5 mb-2 opacity-80" />
        <p className="text-3xl font-bold">{groups.length}</p>
        <p className="text-xs text-white/70 mt-0.5">Dự án</p>
      </div>

      {/* Public Projects */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <Globe className="w-5 h-5 mb-2 opacity-80" />
        <p className="text-3xl font-bold">{publicCount}</p>
        <p className="text-xs text-white/70 mt-0.5">Công khai</p>
      </div>

      {/* Recent Project */}
      <Link 
        to={recentProject ? `/p/${recentProject.slug}` : '/groups'}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-4 text-white group hover:shadow-lg hover:shadow-violet-500/20 transition-all"
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start justify-between">
          <Clock className="w-5 h-5 opacity-80" />
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-sm font-medium mt-2 line-clamp-1">
          {recentProject?.name || 'Chưa có'}
        </p>
        <p className="text-xs text-white/70 mt-0.5">Gần nhất</p>
      </Link>
    </div>
  );
}
