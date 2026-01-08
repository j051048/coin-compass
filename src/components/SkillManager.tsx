import { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useSkillManager } from '@/hooks/useSkillManager';
import { Skill } from '@/lib/skills';
import { useToast } from '@/hooks/use-toast';

interface SkillEditorProps {
  skill?: Skill;
  onSave: (skill: Omit<Skill, 'id'>) => void;
  onCancel: () => void;
}

function SkillEditor({ skill, onSave, onCancel }: SkillEditorProps) {
  const [name, setName] = useState(skill?.name || '');
  const [description, setDescription] = useState(skill?.description || '');
  const [author, setAuthor] = useState(skill?.author || '');
  const [version, setVersion] = useState(skill?.version || '1.0.0');
  const [prompt, setPrompt] = useState(skill?.prompt || '');

  const handleSave = () => {
    if (!name.trim() || !prompt.trim()) return;
    onSave({ name, description, author, version, prompt });
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="skill-name" className="text-xs">技能名称 *</Label>
          <Input
            id="skill-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="我的自定义技能"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skill-author" className="text-xs">作者</Label>
          <Input
            id="skill-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="作者名"
            className="h-9 text-sm"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="skill-desc" className="text-xs">描述</Label>
        <Input
          id="skill-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="简要描述技能功能"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="skill-prompt" className="text-xs">Prompt模板 *</Label>
        <Textarea
          id="skill-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入完整的系统提示词..."
          className="min-h-[200px] text-sm font-mono resize-y"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          取消
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!name.trim() || !prompt.trim()}>
          <Check className="w-4 h-4 mr-1" />
          保存
        </Button>
      </div>
    </div>
  );
}

interface SkillCardProps {
  skill: Skill;
  isActive: boolean;
  isBuiltIn: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SkillCard({ skill, isActive, isBuiltIn, onToggle, onEdit, onDelete }: SkillCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`p-3 rounded-lg border transition-colors ${
      isActive ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm truncate">{skill.name}</h4>
            {isBuiltIn && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded">
                <Star className="w-3 h-3" />
                内置
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {skill.description}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {skill.author} · v{skill.version}
          </p>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
            className="scale-75"
          />
        </div>
      </div>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs">
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                收起详情
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                查看Prompt
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="p-2 bg-muted/50 rounded text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
            {skill.prompt.slice(0, 500)}...
          </div>
          {!isBuiltIn && (
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}>
                <Edit3 className="w-3 h-3 mr-1" />
                编辑
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={onDelete}>
                <Trash2 className="w-3 h-3 mr-1" />
                删除
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function SkillManager() {
  const { toast } = useToast();
  const {
    allSkills,
    activeSkills,
    addSkill,
    updateSkill,
    deleteSkill,
    toggleSkillActive,
    isBuiltIn,
  } = useSkillManager();

  const [isEditing, setIsEditing] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | undefined>();
  const [open, setOpen] = useState(false);

  const handleAddNew = () => {
    setEditingSkill(undefined);
    setIsEditing(true);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setIsEditing(true);
  };

  const handleSave = (skillData: Omit<Skill, 'id'>) => {
    if (editingSkill) {
      updateSkill(editingSkill.id, skillData);
      toast({ title: '技能已更新' });
    } else {
      const newSkill = addSkill(skillData);
      toggleSkillActive(newSkill.id);
      toast({ title: '技能已创建并激活' });
    }
    setIsEditing(false);
    setEditingSkill(undefined);
  };

  const handleDelete = (id: string) => {
    deleteSkill(id);
    toast({ title: '技能已删除' });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2">
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">技能库</span>
          {activeSkills.length > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] bg-primary text-primary-foreground rounded-full">
              {activeSkills.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b border-border flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-primary" />
            AI技能库管理
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            管理和自定义AI分析技能模板
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          {isEditing ? (
            <SkillEditor
              skill={editingSkill}
              onSave={handleSave}
              onCancel={() => {
                setIsEditing(false);
                setEditingSkill(undefined);
              }}
            />
          ) : (
            <div className="space-y-4">
              {/* Active skills count */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">当前已激活</p>
                <p className="text-sm font-medium text-primary mt-1">
                  {activeSkills.length > 0 
                    ? activeSkills.map(s => s.name).join(' + ')
                    : '无激活技能'}
                </p>
              </div>

              {/* Add new button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAddNew}
              >
                <Plus className="w-4 h-4 mr-2" />
                创建自定义技能
              </Button>

              {/* Skills list */}
              <div className="space-y-2">
                {allSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isActive={activeSkills.some(s => s.id === skill.id)}
                    isBuiltIn={isBuiltIn(skill.id)}
                    onToggle={() => toggleSkillActive(skill.id)}
                    onEdit={() => handleEdit(skill)}
                    onDelete={() => handleDelete(skill.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
