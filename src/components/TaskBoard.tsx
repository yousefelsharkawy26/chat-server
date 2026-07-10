import React, { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User as UserIcon, 
  Calendar, 
  Trash2, 
  Plus,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, User } from "../types";
import { Theme } from "../contexts/SettingsContext";

interface TaskBoardProps {
  tasks: Task[];
  users: User[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask: (text: string) => void;
  theme: Theme;
}

export function TaskBoard({ tasks, users, onUpdateTask, onDeleteTask, onCreateTask, theme: t }: TaskBoardProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const [filter, setFilter] = useState<"all" | "todo" | "in-progress" | "done">("all");

  const filteredTasks = tasks.filter(task => filter === "all" || task.status === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onCreateTask(newTaskText.trim());
    setNewTaskText("");
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "done": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "in-progress": return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "done": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "in-progress": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  return (
    <div className={`flex flex-col h-full ${t.bg} border-l ${t.border}`}>
      {/* Header */}
      <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${t.accentLightBg} ${t.accentText}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className={`font-bold ${t.isLight ? "text-slate-900" : "text-white"}`}>Task Board</h2>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${t.isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-400"}`}>
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </div>
      </div>

      {/* Quick Add */}
      <div className={`p-4 border-b ${t.border}`}>
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a quick task..."
            className={`w-full pl-4 pr-12 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500/20 outline-none ${
              t.isLight 
                ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400" 
                : "bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
            }`}
          />
          <button
            type="submit"
            className={`absolute right-1.5 top-1.5 p-1.5 rounded-lg ${t.accentBg} text-white shadow-lg transition-transform active:scale-95`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 p-2 bg-slate-500/5 m-4 rounded-xl">
        {(["all", "todo", "in-progress", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
              filter === f
                ? `bg-white shadow-sm ${t.accentText}`
                : `text-slate-500 hover:text-slate-700`
            } ${!t.isLight && filter === f ? "bg-slate-800 text-indigo-400" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <AnimatePresence initial={false}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-2xl border ${t.isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-800"} group shadow-sm`}
              >
                <div className="flex gap-3">
                  <button 
                    onClick={() => onUpdateTask({ ...task, status: task.status === "done" ? "todo" : "done" })}
                    className="mt-0.5 shrink-0"
                  >
                    {getStatusIcon(task.status)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed mb-3 ${t.isLight ? "text-slate-900" : "text-slate-100"} ${task.status === "done" ? "opacity-50 line-through" : ""}`}>
                      {task.text}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Assignee Dropdown */}
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                        <UserIcon className="w-3 h-3" />
                        <select
                          value={task.assignee || ""}
                          onChange={(e) => onUpdateTask({ ...task, assignee: e.target.value })}
                          className="bg-transparent border-none outline-none cursor-pointer hover:text-indigo-500 transition-colors"
                        >
                          <option value="">Unassigned</option>
                          {users.map(u => (
                            <option key={u.id} value={u.username}>{u.username}</option>
                          ))}
                        </select>
                      </div>

                      {/* Due Date */}
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <input
                          type="date"
                          value={task.dueDate || ""}
                          onChange={(e) => onUpdateTask({ ...task, dueDate: e.target.value })}
                          className="bg-transparent border-none outline-none cursor-pointer hover:text-indigo-500 transition-colors"
                        />
                      </div>

                      <div className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <button 
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-40 py-20 text-center">
              <CheckCircle2 className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-sm font-medium">No tasks found</p>
              <p className="text-xs mt-1">Add a task or convert a message to get started</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
