import React from 'react';
import {
  LayoutDashboard,
  Database,
  TableProperties,
  Search,
  Cpu,
  Sliders,
  Workflow,
  CalendarClock,
  History,
  CheckCheck,
  FileSpreadsheet,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'databases'
  | 'table-designer'
  | 'data-explorer'
  | 'modules'
  | 'rules'
  | 'jobs'
  | 'scheduler'
  | 'executions'
  | 'results'
  | 'reports'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  group?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  collapsed,
  onToggleCollapsed,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'databases', label: 'Database Manager', icon: Database, group: 'DATA MANAGEMENT' },
    { id: 'table-designer', label: 'Table Designer', icon: TableProperties, group: 'DATA MANAGEMENT' },
    { id: 'data-explorer', label: 'Data Explorer', icon: Search, group: 'DATA MANAGEMENT' },
    { id: 'modules', label: 'Reconciliation Modules', icon: Cpu, group: 'ENGINE CONFIGURATION' },
    { id: 'rules', label: 'Matching Rules', icon: Sliders, group: 'ENGINE CONFIGURATION' },
    { id: 'jobs', label: 'Job Designer', icon: Workflow, group: 'ORCHESTRATION' },
    { id: 'scheduler', label: 'Job Scheduler', icon: CalendarClock, group: 'ORCHESTRATION' },
    { id: 'executions', label: 'Execution History', icon: History, group: 'MONITORING' },
    { id: 'results', label: 'Reconciliation Results', icon: CheckCheck, group: 'MONITORING' },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, group: 'AUDIT & COMPLIANCE' },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText, group: 'AUDIT & COMPLIANCE' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  let currentGroup = '';

  return (
    <aside
      className={`${
        collapsed ? 'w-18' : 'w-64'
      } bg-slate-900 border-r border-slate-800 transition-all duration-200 flex flex-col justify-between shrink-0 select-none z-20`}
    >
      <div className="py-3 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const isSelected = currentPage === item.id;
            const Icon = item.icon;
            const showGroup = item.group && item.group !== currentGroup && !collapsed;
            if (item.group) currentGroup = item.group;

            return (
              <React.Fragment key={item.id}>
                {showGroup && (
                  <div className="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {item.group}
                  </div>
                )}
                <button
                  onClick={() => onSelectPage(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="px-2 text-[11px] text-slate-500 truncate">
            RSP Core Node v2.5
          </div>
        )}
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition ml-auto cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
