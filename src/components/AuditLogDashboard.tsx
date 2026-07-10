import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, Clock, User, MessageSquare, AlertCircle, Search, Filter, History as HistoryIcon } from "lucide-react";
import { AuditLog } from "../types";

interface AuditLogDashboardProps {
  onClose: () => void;
  socket: any;
  theme: any;
}

export function AuditLogDashboard({ onClose, socket, theme: t }: AuditLogDashboardProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (socket) {
      socket.emit("audit_logs:fetch");
      
      const handleList = (list: AuditLog[]) => {
        setLogs(list.reverse());
        setIsLoading(false);
      };

      const handleNew = (log: AuditLog) => {
        setLogs(prev => [log, ...prev]);
      };

      socket.on("audit_logs:list", handleList);
      socket.on("audit_log:new", handleNew);

      return () => {
        socket.off("audit_logs:list", handleList);
        socket.off("audit_log:new", handleNew);
      };
    }
  }, [socket]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.target?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType === "all" || log.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className={`w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border ${t.border} ${t.bg} shadow-2xl flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${t.border} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <HistoryIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Audit Logs
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30 uppercase tracking-widest font-black">
                  Admin Only
                </span>
              </h2>
              <p className="text-xs text-slate-400">Tracking administrative and moderation actions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className={`p-4 border-b ${t.border} flex flex-col sm:flex-row gap-3 shrink-0`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search actions, actors, or targets..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/50 border ${t.border} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all`}
            />
          </div>
          <div className="flex gap-2">
            {["all", "moderation", "security", "system"].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                  filterType === type 
                    ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : `bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600`
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex flex-center flex-col gap-4">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400 animate-pulse">Fetching audit history...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex flex-center flex-col text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-300">No logs found</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-1">
                {search || filterType !== "all" 
                  ? "Try adjusting your filters or search terms." 
                  : "No administrative actions have been recorded yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-2xl border ${t.border} ${t.isLight ? "bg-white" : "bg-slate-900/40 hover:bg-slate-900/60"} transition-all group`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        log.type === "moderation" ? "bg-rose-500/10 text-rose-500" :
                        log.type === "security" ? "bg-indigo-500/10 text-indigo-400" :
                        "bg-emerald-500/10 text-emerald-500"
                      }`}>
                        {log.type === "moderation" ? <Shield className="w-4 h-4" /> :
                         log.type === "security" ? <AlertCircle className="w-4 h-4" /> :
                         <HistoryIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-white">{log.action}</span>
                          <span className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full font-black border ${
                            log.type === "moderation" ? "bg-rose-500/5 border-rose-500/20 text-rose-500/70" :
                            log.type === "security" ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-400/70" :
                            "bg-emerald-500/5 border-emerald-500/20 text-emerald-500/70"
                          }`}>
                            {log.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{log.details}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{log.actor}</span>
                          </div>
                          {log.target && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-600 font-black uppercase italic">Target:</span>
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{log.target}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[9px] text-slate-600 font-mono">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className={`p-4 bg-slate-900/50 border-t ${t.border} shrink-0 text-center`}>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
            Immutable Workspace Audit Ledger • {logs.length} Total Records
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
