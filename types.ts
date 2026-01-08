export interface ExpandedGoal {
  title: string;
  content: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface BlogPost {
  id: string;
  topic: string;
  twist: string;
  title: string;
  summary: string;
  goals: string[];
  expandedGoals?: ExpandedGoal[];
  conclusion: string;
  imageUrl?: string;
  score?: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
}

export interface AppState {
  step: 'idle' | 'generating_topics' | 'generating_content' | 'review' | 'finalizing' | 'published';
  posts: BlogPost[];
  selectedPostId: string | null;
  progress: {
    current: number;
    total: number;
    message: string;
  };
  error: string | null;
}

export type GenerationStage = 'topics' | 'images' | 'text';