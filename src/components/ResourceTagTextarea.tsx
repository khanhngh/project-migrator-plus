import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  File, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Folder,
  Hash,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceItem {
  id: string;
  name: string;
  file_path: string;
  category: string | null;
  folder_name?: string;
}

interface ResourceTagTextareaProps {
  value: string;
  onChange: (value: string) => void;
  groupId: string;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClass = 'w-4 h-4';
  
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

export default function ResourceTagTextarea({
  value,
  onChange,
  groupId,
  placeholder = 'Nhập mô tả... (gõ # để tham chiếu tài nguyên)',
  className,
  minHeight = '80px',
  disabled = false
}: ResourceTagTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ResourceItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerStart, setTriggerStart] = useState(-1);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  // Fetch resources on mount
  useEffect(() => {
    if (!groupId) return;
    
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        // Fetch resources
        const { data: resourcesData } = await supabase
          .from('project_resources')
          .select('id, name, file_path, category, folder_id')
          .eq('group_id', groupId)
          .order('name', { ascending: true });

        // Fetch folders
        const { data: foldersData } = await (supabase
          .from('resource_folders' as any)
          .select('id, name')
          .eq('group_id', groupId) as any);

        const foldersMap = new Map<string, string>((foldersData || []).map((f: any) => [f.id, f.name]));

        const items: ResourceItem[] = (resourcesData || []).map(r => ({
          id: r.id,
          name: r.name,
          file_path: r.file_path,
          category: r.category,
          folder_name: (r as any).folder_id ? (foldersMap.get((r as any).folder_id) || undefined) : undefined
        }));

        setResources(items);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [groupId]);

  // Detect # trigger
  useEffect(() => {
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    
    // Find last # before cursor
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    const searchText = textBeforeCursor.substring(lastHashIndex + 1).toLowerCase();
    
    // Check if there's a space before the # (or it's at start)
    const charBefore = lastHashIndex > 0 ? textBeforeCursor[lastHashIndex - 1] : ' ';
    if (charBefore !== ' ' && charBefore !== '\n') {
      setShowSuggestions(false);
      return;
    }

    // Don't show if search text has newlines
    if (searchText.includes('\n')) {
      setShowSuggestions(false);
      return;
    }

    setTriggerStart(lastHashIndex);

    // Filter resources
    const filtered = resources.filter(r => 
      r.name.toLowerCase().includes(searchText) ||
      (r.folder_name && r.folder_name.toLowerCase().includes(searchText))
    ).slice(0, 8);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 || isLoading);
    setSelectedIndex(0);

    // Calculate popup position based on textarea
    if (textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      setPopupPosition({
        top: -10, // Above the textarea
        left: 0
      });
    }
  }, [value, resources, isLoading]);

  const handleSelectSuggestion = (resource: ResourceItem) => {
    if (triggerStart === -1) return;

    const beforeTrigger = value.substring(0, triggerStart);
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const afterCursor = value.substring(cursorPos);

    // Insert as [#filename](url) format
    const insertText = `[#${resource.name}](${resource.file_path}) `;

    const newValue = beforeTrigger + insertText + afterCursor;
    onChange(newValue);
    setShowSuggestions(false);

    // Focus and move cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeTrigger.length + insertText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  return (
    <div className="relative">
      {/* Suggestions Popup */}
      {showSuggestions && (
        <Card 
          className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden z-50 shadow-xl border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="p-2 border-b bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Hash className="w-3 h-3" />
              Chọn tài nguyên
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Không tìm thấy tài nguyên
              </div>
            ) : (
              suggestions.map((resource, index) => (
                <button
                  key={resource.id}
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-150',
                    index === selectedIndex 
                      ? 'bg-primary/10 text-foreground' 
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => handleSelectSuggestion(resource)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    {getFileIcon(resource.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">{resource.name}</span>
                    {resource.folder_name && (
                      <p className="text-muted-foreground text-xs truncate flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        {resource.folder_name}
                      </p>
                    )}
                  </div>
                  {index === selectedIndex && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      Enter ↵
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t bg-muted/20">
            <span className="text-[10px] text-muted-foreground">
              Gõ để tìm kiếm • ↑↓ để chọn • Enter để chèn
            </span>
          </div>
        </Card>
      )}

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('resize-none text-sm', className)}
        style={{ minHeight }}
        disabled={disabled}
      />

      {/* Helper text */}
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Hash className="w-3 h-3" /> Gõ # để chèn tài nguyên
        </span>
      </div>
    </div>
  );
}
