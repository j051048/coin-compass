import { useState, useEffect, useCallback } from 'react';
import { Skill, KLINE_MASTER_2026 } from '@/lib/skills';

const SKILLS_STORAGE_KEY = 'custom_skills';
const ACTIVE_SKILLS_KEY = 'active_skill_ids';

// Load custom skills from localStorage
function loadCustomSkills(): Skill[] {
  try {
    const stored = localStorage.getItem(SKILLS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Load active skill IDs from localStorage
function loadActiveSkillIds(): string[] {
  try {
    const stored = localStorage.getItem(ACTIVE_SKILLS_KEY);
    return stored ? JSON.parse(stored) : [KLINE_MASTER_2026.id];
  } catch {
    return [KLINE_MASTER_2026.id];
  }
}

export function useSkillManager() {
  const [customSkills, setCustomSkills] = useState<Skill[]>(() => loadCustomSkills());
  const [activeSkillIds, setActiveSkillIds] = useState<string[]>(() => loadActiveSkillIds());

  // All available skills (built-in + custom)
  const allSkills: Skill[] = [KLINE_MASTER_2026, ...customSkills];

  // Currently active skills
  const activeSkills = allSkills.filter(s => activeSkillIds.includes(s.id));

  // Save to localStorage when skills change
  useEffect(() => {
    localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(customSkills));
  }, [customSkills]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_SKILLS_KEY, JSON.stringify(activeSkillIds));
  }, [activeSkillIds]);

  // Add a new custom skill
  const addSkill = useCallback((skill: Omit<Skill, 'id'>) => {
    const newSkill: Skill = {
      ...skill,
      id: `custom-${Date.now()}`,
    };
    setCustomSkills(prev => [...prev, newSkill]);
    return newSkill;
  }, []);

  // Update an existing skill
  const updateSkill = useCallback((id: string, updates: Partial<Skill>) => {
    if (id === KLINE_MASTER_2026.id) {
      // Can't update built-in skill
      return false;
    }
    setCustomSkills(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
    return true;
  }, []);

  // Delete a custom skill
  const deleteSkill = useCallback((id: string) => {
    if (id === KLINE_MASTER_2026.id) {
      // Can't delete built-in skill
      return false;
    }
    setCustomSkills(prev => prev.filter(s => s.id !== id));
    setActiveSkillIds(prev => prev.filter(i => i !== id));
    return true;
  }, []);

  // Toggle skill active state
  const toggleSkillActive = useCallback((id: string) => {
    setActiveSkillIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }, []);

  // Get combined prompt from all active skills
  const getActivePrompt = useCallback(() => {
    if (activeSkills.length === 0) {
      return KLINE_MASTER_2026.prompt;
    }
    if (activeSkills.length === 1) {
      return activeSkills[0].prompt;
    }
    return activeSkills.map(s => `## ${s.name}\n${s.prompt}`).join('\n\n---\n\n');
  }, [activeSkills]);

  return {
    allSkills,
    activeSkills,
    customSkills,
    addSkill,
    updateSkill,
    deleteSkill,
    toggleSkillActive,
    getActivePrompt,
    isBuiltIn: (id: string) => id === KLINE_MASTER_2026.id,
  };
}
