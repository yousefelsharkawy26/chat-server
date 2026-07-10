import React from 'react';
import { ExternalLink, Github, MessageSquare, Play, Layout } from 'lucide-react';

interface RichEmbedsProps {
  text: string;
  theme: any;
}

export const RichEmbeds: React.FC<RichEmbedsProps> = ({ text, theme: t }) => {
  // Regex for links
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const figmaRegex = /(?:https?:\/\/)?(?:www\.)?figma\.com\/(?:file|proto)\/([a-zA-Z0-9]+)/;
  const githubPrRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/pull\/(\d+)/;
  const jiraRegex = /(?:https?:\/\/)?([a-zA-Z0-9_-]+)\.atlassian\.net\/browse\/([a-zA-Z0-9]+-[0-9]+)/;

  const youtubeMatch = text.match(youtubeRegex);
  const figmaMatch = text.match(figmaRegex);
  const githubMatch = text.match(githubPrRegex);
  const jiraMatch = text.match(jiraRegex);

  if (!youtubeMatch && !figmaMatch && !githubMatch && !jiraMatch) return null;

  return (
    <div className="mt-3 flex flex-col gap-3">
      {youtubeMatch && (
        <div className={`rounded-xl overflow-hidden border ${t.border} bg-black aspect-video shadow-2xl`}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {figmaMatch && (
        <div className={`rounded-xl overflow-hidden border ${t.border} ${t.isLight ? 'bg-slate-50' : 'bg-slate-900'} aspect-video flex flex-col shadow-2xl`}>
          <div className="px-3 py-2 border-b flex items-center justify-between bg-slate-800/80 backdrop-blur-md">
            <div className="flex items-center gap-2 text-[11px] font-bold text-white tracking-tight">
              <Layout className="w-3.5 h-3.5 text-indigo-400" /> Figma Live Preview
            </div>
            <a href={figmaMatch[0]} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <iframe
            className="flex-1 w-full"
            src={`https://www.figma.com/embed?embed_host=astra&url=${encodeURIComponent(figmaMatch[0])}`}
            allowFullScreen
          ></iframe>
        </div>
      )}

      {githubMatch && (
        <div className={`p-4 rounded-xl border ${t.border} ${t.isLight ? 'bg-slate-50' : 'bg-slate-900/60'} flex flex-col gap-3 shadow-xl`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg ${t.isLight ? 'bg-slate-200' : 'bg-slate-800'} flex items-center justify-center`}>
                <Github className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex flex-col">
                <span className={`text-[11px] font-black uppercase tracking-widest ${t.isLight ? 'text-slate-400' : 'text-slate-500'}`}>GitHub Pull Request</span>
                <span className={`text-xs font-bold ${t.isLight ? 'text-slate-700' : 'text-slate-200'}`}>{githubMatch[1]}/{githubMatch[2]} #{githubMatch[3]}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
              Open
            </span>
          </div>
          <p className={`text-xs font-medium leading-relaxed ${t.isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Fix: Infinite recursion in canvas rendering engine and optimize memory layout for large buffers.
          </p>
          <div className="flex items-center gap-2 mt-1">
             <button className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]">
               Merge Pull Request
             </button>
             <button className={`px-3 py-1.5 ${t.isLight ? 'bg-white hover:bg-slate-50' : 'bg-slate-800 hover:bg-slate-700'} text-slate-300 text-[11px] font-bold rounded-lg transition-colors border ${t.border}`}>
               Review
             </button>
          </div>
        </div>
      )}

      {jiraMatch && (
        <div className={`p-4 rounded-xl border ${t.border} ${t.isLight ? 'bg-slate-50' : 'bg-slate-900/60'} flex flex-col gap-3 shadow-xl`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                 <span className="text-[12px] font-black text-white">J</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[11px] font-black uppercase tracking-widest ${t.isLight ? 'text-slate-400' : 'text-slate-500'}`}>Jira Issue</span>
                <span className={`text-xs font-bold ${t.isLight ? 'text-slate-700' : 'text-slate-200'}`}>{jiraMatch[2]}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
              In Progress
            </span>
          </div>
          <p className={`text-xs font-medium leading-relaxed ${t.isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Implement real-time sync for task board assignees using Socket.io and optimize broadcast events.
          </p>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> High Priority
            </div>
            <div className="flex items-center gap-1.5">
               <MessageSquare className="w-3 h-3" /> 12 Comments
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
