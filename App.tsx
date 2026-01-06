import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, BlogPost } from './types';
import { generateTrendingTopics, generatePostContent, generateClaymationImage } from './services/geminiService';
import PostCard from './components/PostCard';
import { Sparkles, Linkedin, FileText, Loader2, Send, RotateCcw, PenTool, Download, Copy, ExternalLink, ArrowRight, X } from 'lucide-react';

const INITIAL_STATE: AppState = {
  step: 'idle',
  posts: [],
  selectedPostId: null,
  progress: { current: 0, total: 0, message: '' },
  error: null,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [customContext, setCustomContext] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleStart = async () => {
    setState({ ...INITIAL_STATE, step: 'generating_topics', progress: { current: 0, total: 100, message: 'Scouring the web for trending AI topics...' } });

    try {
      // 1. Generate Topics with Custom Context
      const topics = await generateTrendingTopics(customContext);
      
      // Initialize posts in state
      const initialPosts = topics.map(t => ({
        ...t,
        goals: [],
        summary: '',
        conclusion: '',
        status: 'pending' as const
      })) as BlogPost[];

      setState(prev => ({
        ...prev,
        step: 'generating_content',
        posts: initialPosts,
        progress: { current: 10, total: 100, message: 'Topics found! Starting creative engine...' }
      }));

      // 2. Generate Content & Images for each post
      const updatedPosts = [...initialPosts];
      const totalSteps = initialPosts.length;

      for (let i = 0; i < totalSteps; i++) {
        const post = updatedPosts[i];
        
        post.status = 'generating';
        setState(prev => ({ 
          ...prev, 
          posts: [...updatedPosts], 
          progress: { 
            current: 10 + ((i / totalSteps) * 90), // Scale from 10% to 100%
            total: 100, 
            message: `Generating post ${i + 1} of ${totalSteps}: ${post.title}...` 
          } 
        }));

        const [content, imageUrl] = await Promise.all([
          generatePostContent(post),
          generateClaymationImage(post)
        ]);

        updatedPosts[i] = {
          ...post,
          ...content,
          imageUrl,
          status: 'completed'
        };

        setState(prev => ({ ...prev, posts: [...updatedPosts] }));
      }

      setState(prev => ({
        ...prev,
        step: 'review',
        progress: { current: 100, total: 100, message: 'All done!' }
      }));

    } catch (error) {
      console.error(error);
      setState(prev => ({ 
        ...prev, 
        step: 'idle', 
        error: error instanceof Error ? error.message : "An unexpected error occurred." 
      }));
    }
  };

  const handlePublishSetup = () => {
    if (!state.selectedPostId) return;
    setState(prev => ({ ...prev, step: 'published' }));
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const selectedPost = state.posts.find(p => p.id === state.selectedPostId);

  const getMarkdownContent = () => {
    if (!selectedPost) return '';
    return `# ${selectedPost.title}

![${selectedPost.twist}](${selectedPost.title} Image)

## Summary
${selectedPost.summary}

## Key Takeaways
${selectedPost.goals.map((goal, i) => `${i + 1}. ${goal}`).join('\n')}

## Conclusion
${selectedPost.conclusion}
`;
  };

  const handleCopyMarkdown = async () => {
    const md = getMarkdownContent();
    try {
      await navigator.clipboard.writeText(md);
      showToast("Article Markdown copied to clipboard!");
    } catch (err) {
      showToast("Failed to copy. Please try manually.", "error");
    }
  };

  const handleDownloadImage = () => {
    if (!selectedPost?.imageUrl) return;
    const link = document.createElement('a');
    link.href = selectedPost.imageUrl;
    link.download = `claymation-${selectedPost.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Image downloading started.");
  };

  const handleLinkedInShare = async () => {
    if (!selectedPost) return;

    const text = `🚀 Just published a new article on AI & ${selectedPost.twist}: "${selectedPost.title}"\n\n${selectedPost.summary.substring(0, 150)}...\n\nKey Insights:\n${selectedPost.goals.map(g => `• ${g}`).join('\n')}\n\n#AI #Innovation #TechTrends #ClaymationBlogger`;
    
    try {
      await navigator.clipboard.writeText(text);
      showToast("Post text copied! Opening LinkedIn...", "success");
      
      // Slight delay to ensure toast is seen and clipboard is set
      setTimeout(() => {
        // Opens the LinkedIn "Start a Post" dialog directly
        window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank');
      }, 500);
    } catch (err) {
      showToast("Failed to copy text for LinkedIn.", "error");
    }
  };

  const handleReset = () => {
    setState(INITIAL_STATE);
    setCustomContext('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[60] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transition-all transform translate-y-0 animate-fade-in-up ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow-300 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">ClayMation AI Blogger</h1>
          </div>
          {state.step !== 'idle' && (
             <button 
               onClick={handleReset}
               className="text-indigo-200 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
             >
               <RotateCcw size={16} /> Reset
             </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Error Message */}
        {state.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* IDLE STATE */}
        {state.step === 'idle' && (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="inline-flex items-center justify-center p-6 bg-indigo-100 rounded-full mb-8 text-indigo-700 shadow-inner">
               <PenTool size={48} />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Your Daily AI Content Engine
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Generate 5 unique, trending AI blog posts with custom claymation visuals in seconds. 
              Review, select, and publish to the world.
            </p>
            
            <div className="max-w-md mx-auto mb-8">
              <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                 Optional: Focus on specific themes (e.g., "Healthcare", "Rust", "Quantum")
              </label>
              <input
                type="text"
                id="context"
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="Enter a keyword or domain..."
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-lg border-gray-300 rounded-md p-3"
              />
            </div>

            <button
              onClick={handleStart}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105"
            >
              Generate
              <Sparkles className="ml-2 -mr-1 h-5 w-5" />
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {(state.step === 'generating_topics' || state.step === 'generating_content') && (
          <div className="text-center py-20">
            <div className="mb-8 relative max-w-lg mx-auto">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(state.progress.current)}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse transition-all duration-500 ease-out"
                  style={{ width: `${state.progress.current}%` }}
                ></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium animate-pulse">{state.progress.message}</p>
            </div>
            
            {/* Grid preview while loading - Removed blur during generation so user can see progress */}
            <div className={`
              grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 transition-all
              ${state.step === 'generating_topics' ? 'opacity-50 filter blur-sm pointer-events-none' : 'opacity-100'}
            `}>
               {state.posts.length > 0 ? state.posts.map(post => (
                 <PostCard 
                   key={post.id} 
                   post={post} 
                   isSelected={false} 
                   onSelect={() => {}} 
                   isReviewMode={false} 
                 />
               )) : Array(5).fill(0).map((_, i) => (
                 <div key={i} className="h-96 bg-white rounded-xl shadow border border-gray-100 flex items-center justify-center">
                    <span className="text-gray-300">...</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* REVIEW STATE */}
        {state.step === 'review' && (
          <div className="space-y-8" ref={scrollRef}>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Today's Selection</h2>
              <p className="text-gray-600 mt-2">Select the best article to publish today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 justify-center">
              {state.posts.map((post) => (
                <div key={post.id} className="flex justify-center">
                   <div className="w-full max-w-md h-full">
                    <PostCard
                      post={post}
                      isSelected={state.selectedPostId === post.id}
                      onSelect={(id) => setState(prev => ({ ...prev, selectedPostId: id }))}
                      isReviewMode={true}
                    />
                   </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-2xl flex justify-center items-center gap-4 z-40 transition-transform duration-300 transform translate-y-0">
              <span className="text-gray-500 text-sm hidden sm:block">
                {state.selectedPostId ? "One article selected" : "Please select an article"}
              </span>
              <button
                onClick={handlePublishSetup}
                disabled={!state.selectedPostId}
                className={`
                  inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white 
                  ${state.selectedPostId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}
                  transition-colors
                `}
              >
                Prepare for Publication
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* PUBLISHED / READY STATE */}
        {state.step === 'published' && selectedPost && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-indigo-100 mb-10">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Publication Package Ready</h2>
              <p className="text-indigo-100 mt-2 max-w-lg mx-auto">
                Due to Medium's security policies, please manually copy the content to their editor.
              </p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Visual Asset */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    Visual Asset
                  </h3>
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img src={selectedPost.imageUrl} alt="Thumbnail" className="w-full h-48 object-cover" />
                  </div>
                  <button 
                    onClick={handleDownloadImage}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Image
                  </button>
                </div>

                {/* Content Asset */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Content Asset
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-48 overflow-y-auto text-xs font-mono text-gray-600">
                    {getMarkdownContent()}
                  </div>
                  <button 
                    onClick={handleCopyMarkdown}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy Markdown
                  </button>
                </div>
              </div>

              {/* Action Steps */}
              <div className="border-t border-gray-100 pt-8">
                 <h3 className="font-bold text-gray-900 mb-6 text-center">Finalize Publication</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <button 
                      onClick={() => window.open('https://medium.com/new-story', '_blank')}
                      className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition-colors shadow-lg transform active:scale-95"
                    >
                      <ExternalLink className="mr-2 h-5 w-5" />
                      Open Medium Editor
                    </button>

                    <button 
                      onClick={handleLinkedInShare}
                      className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-[#0077b5] hover:bg-[#006396] transition-colors shadow-lg transform active:scale-95"
                    >
                      <Linkedin className="mr-2 h-5 w-5" />
                      Share on LinkedIn
                    </button>
                 </div>
                 <p className="text-center text-gray-500 text-sm mt-4 px-4">
                   Click "Share on LinkedIn" to copy the post text and open the LinkedIn editor. 
                   <br/>You may need to allow popups for this site.
                 </p>
              </div>

              <div className="pt-8 mt-8 border-t border-gray-100 text-center">
                <button 
                  onClick={handleReset}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Start New Session
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;