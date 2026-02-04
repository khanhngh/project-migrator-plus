import { Link } from 'react-router-dom';
import { FolderKanban, Users, Globe, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Group } from '@/types/database';

interface DashboardProjectCardProps {
  group: Group;
}

// Generate consistent colors based on name
const getColorScheme = (name: string) => {
  const schemes = [
    { bg: 'from-blue-500/20 to-cyan-500/10', icon: 'bg-blue-500/20 text-blue-500', accent: 'bg-blue-500' },
    { bg: 'from-violet-500/20 to-purple-500/10', icon: 'bg-violet-500/20 text-violet-500', accent: 'bg-violet-500' },
    { bg: 'from-emerald-500/20 to-teal-500/10', icon: 'bg-emerald-500/20 text-emerald-500', accent: 'bg-emerald-500' },
    { bg: 'from-amber-500/20 to-orange-500/10', icon: 'bg-amber-500/20 text-amber-500', accent: 'bg-amber-500' },
    { bg: 'from-rose-500/20 to-pink-500/10', icon: 'bg-rose-500/20 text-rose-500', accent: 'bg-rose-500' },
    { bg: 'from-indigo-500/20 to-blue-500/10', icon: 'bg-indigo-500/20 text-indigo-500', accent: 'bg-indigo-500' },
  ];
  return schemes[name.charCodeAt(0) % schemes.length];
};

export default function DashboardProjectCard({ group }: DashboardProjectCardProps) {
  const hasImage = !!group.image_url;
  const colors = getColorScheme(group.name);

  return (
    <Link
      to={`/p/${group.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Header/Image Area */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {hasImage ? (
          <>
            <img
              src={group.image_url}
              alt={group.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Title on image */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-bold text-sm text-white line-clamp-2 leading-tight">
                {group.name}
              </h3>
            </div>
          </>
        ) : (
          <div className={cn(
            "w-full h-full bg-gradient-to-br flex flex-col items-center justify-center p-4",
            colors.bg
          )}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-3",
              colors.icon
            )}>
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-center line-clamp-2 leading-tight px-1">
              {group.name}
            </h3>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          {group.class_code && (
            <span className="flex items-center gap-1 text-[10px] font-medium bg-white/90 dark:bg-black/60 backdrop-blur-sm text-foreground px-2 py-1 rounded-full shadow-sm">
              <Users className="w-2.5 h-2.5" />
              {group.class_code}
            </span>
          )}
          {group.is_public && (
            <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-500 text-white px-2 py-1 rounded-full shadow-sm">
              <Globe className="w-2.5 h-2.5" />
              Public
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-border/30">
        {group.description ? (
          <p className="text-[11px] text-muted-foreground line-clamp-1 flex-1 pr-2">
            {group.description}
          </p>
        ) : (
          <span className="text-[11px] text-muted-foreground/50 italic">
            Không có mô tả
          </span>
        )}
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all",
          colors.accent,
          "text-white"
        )}>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}
