import { Link } from 'react-router-dom';
import { FolderKanban, Users, Calendar, Globe, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Group } from '@/types/database';

interface DashboardProjectCardProps {
  group: Group;
}

// Generate a consistent gradient based on group name
const getGradientClass = (name: string): string => {
  const gradients = [
    'from-blue-500/20 via-blue-400/10 to-cyan-500/20',
    'from-violet-500/20 via-purple-400/10 to-fuchsia-500/20',
    'from-emerald-500/20 via-green-400/10 to-teal-500/20',
    'from-amber-500/20 via-orange-400/10 to-yellow-500/20',
    'from-rose-500/20 via-pink-400/10 to-red-500/20',
    'from-indigo-500/20 via-blue-400/10 to-purple-500/20',
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
};

const getIconBgClass = (name: string): string => {
  const colors = [
    'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function DashboardProjectCard({
  group,
}: DashboardProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const hasImage = !!group.image_url;

  return (
    <Link
      to={`/p/${group.slug}`}
      className="group relative block rounded-2xl overflow-hidden bg-card border border-border/40 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image/Gradient Header */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {hasImage ? (
          <>
            <img
              src={group.image_url}
              alt={group.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className={cn(
            "w-full h-full bg-gradient-to-br",
            getGradientClass(group.name),
            "flex items-center justify-center"
          )}>
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm",
              getIconBgClass(group.name)
            )}>
              <FolderKanban className="w-7 h-7" />
            </div>
          </div>
        )}
        
        {/* Floating badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          {group.class_code && (
            <Badge 
              variant="secondary" 
              className="text-[10px] bg-background/80 backdrop-blur-md px-2 py-0.5 font-medium shadow-sm"
            >
              <Users className="w-2.5 h-2.5 mr-1" />
              {group.class_code}
            </Badge>
          )}
          {group.is_public && (
            <Badge 
              className="text-[10px] bg-emerald-500/90 text-white px-2 py-0.5 shadow-sm"
            >
              <Globe className="w-2.5 h-2.5 mr-1" />
              Public
            </Badge>
          )}
        </div>

        {/* Arrow indicator on hover */}
        <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
          <ArrowUpRight className="w-3.5 h-3.5 text-primary-foreground" />
        </div>

        {/* Title overlay on image */}
        {hasImage && (
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-bold text-sm text-white leading-tight line-clamp-2 drop-shadow-md">
              {group.name}
            </h3>
          </div>
        )}
      </div>

      {/* Content Section - only show for non-image cards */}
      <div className={cn(
        "p-3 space-y-2",
        hasImage ? "pt-2" : ""
      )}>
        {!hasImage && (
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5em]">
            {group.name}
          </h3>
        )}
        
        {group.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {group.description}
          </p>
        )}

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(group.created_at)}
          </span>
          <span className="text-[10px] text-primary/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Xem chi tiết →
          </span>
        </div>
      </div>
    </Link>
  );
}