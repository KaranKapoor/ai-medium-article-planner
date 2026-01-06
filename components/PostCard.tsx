import React from 'react';
import { BlogPost } from '../types';
import { CheckCircle, Clock, BookOpen, Share2 } from 'lucide-react';

interface PostCardProps {
  post: BlogPost;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isReviewMode: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, isSelected, onSelect, isReviewMode }) => {
  return (
    <div 
      onClick={() => isReviewMode && onSelect(post.id)}
      className={`
        relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer
        border-2 flex flex-col h-full bg-white shadow-lg group
        ${isSelected ? 'border-indigo-600 ring-4 ring-indigo-100 scale-[1.02]' : 'border-transparent hover:border-gray-200 hover:shadow-xl'}
      `}
    >
      {/* Image Section */}
      <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
        {post.status === 'generating' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
            <span className="text-gray-400 font-semibold">Sculpting Clay...</span>
          </div>
        ) : post.imageUrl ? (
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">Image Pending</span>
          </div>
        )}
        
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full">
          {post.twist}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
          {post.title}
        </h3>
        
        {post.status === 'completed' ? (
          <>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 article-text">
              {post.summary}
            </p>
            
            <div className="mt-auto">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} className="text-indigo-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">3 Key Goals</span>
              </div>
              <ul className="space-y-1 mb-4">
                {post.goals.map((goal, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700">
                    <CheckCircle size={14} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 italic">
                  "{post.conclusion}"
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3 mt-2 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        )}
      </div>

      {/* Selection Overlay (Mobile friendly check) */}
      {isSelected && (
        <div className="absolute top-2 left-2 bg-indigo-600 text-white rounded-full p-1 shadow-lg z-10">
          <CheckCircle size={24} />
        </div>
      )}
    </div>
  );
};

export default PostCard;
