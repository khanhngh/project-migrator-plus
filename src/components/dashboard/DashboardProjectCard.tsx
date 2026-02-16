import { Link } from 'react-router-dom';
import { FolderKanban, Users, Calendar, Globe } from 'lucide-react';
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
      className="group relative block rounded-lg overflow-hidden bg-card border border-border shadow-card card-interactive"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {group.image_url ? (
          <img
            src={group.image_url}
            alt={group.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <FolderKanban className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        
        {group.is_public && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 text-[10px] bg-card/90 backdrop-blur-sm px-1.5 py-0.5"
          >
            <Globe className="w-2.5 h-2.5 mr-0.5" />
            Public
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {group.name}
        </h3>
        
        {group.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {group.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
          {group.class_code && (
            <span className="flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded">
              <Users className="w-2.5 h-2.5" />
              {group.class_code}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(group.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
