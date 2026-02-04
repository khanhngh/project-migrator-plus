import { useNavigate } from 'react-router-dom';
import { 
  File, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceLinkRendererProps {
  content: string;
  className?: string;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClass = 'w-3 h-3';
  
  switch (ext) {
    case 'pdf':
      return <FileText className={cn(iconClass, 'text-red-500')} />;
    case 'doc':
    case 'docx':
      return <FileText className={cn(iconClass, 'text-blue-500')} />;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FileSpreadsheet className={cn(iconClass, 'text-green-500')} />;
    case 'ppt':
    case 'pptx':
      return <Presentation className={cn(iconClass, 'text-orange-500')} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return <ImageIcon className={cn(iconClass, 'text-purple-500')} />;
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'avi':
      return <Video className={cn(iconClass, 'text-pink-500')} />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <Music className={cn(iconClass, 'text-cyan-500')} />;
    case 'zip':
    case 'rar':
    case '7z':
      return <Archive className={cn(iconClass, 'text-amber-500')} />;
    default:
      return <File className={cn(iconClass, 'text-muted-foreground')} />;
  }
}

// Extract clean filename from the resource tag
function extractFileName(tagContent: string): string {
  // Remove # prefix if present
  let name = tagContent.startsWith('#') ? tagContent.slice(1) : tagContent;
  
  // If it looks like a storage name (uuid-timestamp format), try to clean it
  // Pattern: timestamp-randomchars.ext or uuid.ext
  const storagePattern = /^\d{13}-[a-z0-9]+\./i;
  if (storagePattern.test(name)) {
    // This is a storage name, just show shortened version
    const ext = name.split('.').pop();
    return `file.${ext}`;
  }
  
  return name;
}

export default function ResourceLinkRenderer({ content, className }: ResourceLinkRendererProps) {
  const navigate = useNavigate();
  
  if (!content) return null;
  
  // Multiple patterns to match:
  // 1. [#filename](url) - markdown style
  // 2. (url) - parenthesized URL
  // 3. Raw supabase storage URLs
  
  const patterns = [
    // Pattern 1: [#filename](url)
    { regex: /\[#([^\]]+)\]\(([^)]+)\)/g, type: 'markdown' as const },
    // Pattern 2: Standalone (https://...supabase...storage...) - parenthesized URLs
    { regex: /\((https:\/\/[^)]*supabase[^)]*\/storage\/[^)]+)\)/g, type: 'paren_url' as const },
    // Pattern 3: Raw supabase storage URLs (not in markdown or parens)
    { regex: /(?<![(\[])(https:\/\/[^\s]*supabase[^\s]*\/storage\/v1\/object\/[^\s\])]+)/g, type: 'raw_url' as const },
  ];
  
  // First, find all matches with their positions
  interface MatchInfo {
    start: number;
    end: number;
    type: 'markdown' | 'paren_url' | 'raw_url';
    fileName: string;
    url: string;
  }
  
  const allMatches: MatchInfo[] = [];
  
  // Find markdown style matches first (highest priority)
  const markdownRegex = /\[#([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownRegex.exec(content)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'markdown',
      fileName: match[1],
      url: match[2]
    });
  }
  
  // Find parenthesized URLs
  const parenUrlRegex = /\((https:\/\/[^)]*supabase[^)]*\/storage\/[^)]+)\)/g;
  while ((match = parenUrlRegex.exec(content)) !== null) {
    // Check if this overlaps with existing matches
    const overlaps = allMatches.some(m => 
      (match!.index >= m.start && match!.index < m.end) ||
      (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
    );
    if (!overlaps) {
      const url = match[1];
      const fileName = extractFileNameFromUrl(url);
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'paren_url',
        fileName,
        url
      });
    }
  }
  
  // Find raw URLs
  const rawUrlRegex = /(https:\/\/[^\s]*supabase[^\s]*\/storage\/v1\/object\/[^\s\])]+)/g;
  while ((match = rawUrlRegex.exec(content)) !== null) {
    // Check if this overlaps with existing matches
    const overlaps = allMatches.some(m => 
      (match!.index >= m.start && match!.index < m.end) ||
      (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
    );
    if (!overlaps) {
      const url = match[1];
      const fileName = extractFileNameFromUrl(url);
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'raw_url',
        fileName,
        url
      });
    }
  }
  
  // Sort by position
  allMatches.sort((a, b) => a.start - b.start);
  
  // Build parts
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  
  allMatches.forEach((m, idx) => {
    // Add text before this match
    if (m.start > lastIndex) {
      parts.push(content.slice(lastIndex, m.start));
    }
    
    const cleanName = extractFileName(m.fileName);
    
    // Add clickable chip
    parts.push(
      <button
        key={`resource-${idx}`}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const params = new URLSearchParams();
          params.set('url', m.url);
          params.set('name', cleanName);
          params.set('source', 'resource');
          navigate(`/file-preview?${params.toString()}`);
        }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors cursor-pointer"
        title={`Xem: ${cleanName}`}
      >
        {getFileIcon(cleanName)}
        <span className="max-w-[120px] truncate">{cleanName}</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
      </button>
    );
    
    lastIndex = m.end;
  });
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  // If no matches found, just return plain text
  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }
  
  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {parts.map((part, index) => 
        typeof part === 'string' ? <span key={index}>{part}</span> : part
      )}
    </span>
  );
}

// Extract filename from a storage URL
function extractFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    return decodeURIComponent(fileName);
  } catch {
    // Fallback: get last part after /
    const parts = url.split('/');
    return parts[parts.length - 1] || 'file';
  }
}
