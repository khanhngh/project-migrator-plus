import { Link } from 'react-router-dom';
import { FolderKanban, Users, Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Group } from '@/types/database';

interface DashboardProjectCardProps {
  group: Group;
}

export default function DashboardProjectCard({
  group,
}: DashboardProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Link
      to={`/p/${group.slug}`}
      className="group relative block aspect-square rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Background Image or Gradient */}
      <div className="absolute inset-0">
        {group.image_url ? (
          <img
            src={group.image_url}
            alt={group.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        )}
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-4">
        {/* Top Section - Icon and badges */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-primary/10 backdrop-blur-sm flex items-center justify-center border border-primary/20">
            <FolderKanban className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex items-center gap-2">
            {group.is_public && (
              <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
                <ExternalLink className="w-3 h-3 mr-1" />
                Công khai
              </Badge>
            )}
          </div>
        </div>

        {/* Bottom Section - Title and info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {group.description}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {group.class_code && (
              <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                <Users className="w-3 h-3" />
                {group.class_code}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(group.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Link>
  );
}
