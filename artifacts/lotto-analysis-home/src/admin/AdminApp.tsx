import { useState, useEffect } from 'react';
import './admin.css';
import { useAdminAuth, useAdminLogin, useAdminBootstrap, useAdminLogout } from './api';
import { Card, Input, Button, Label } from './components/UI';
import { LayoutDashboard, Users, Database, MessagesSquare, ShieldHalf, Award, Star, BarChart3, LogOut, Loader2, Settings, MessageCircle } from 'lucide-react';
import DashboardView from './views/DashboardView';
import MembersView from './views/MembersView';
import DatabasesView from './views/DatabasesView';
import InquiriesView from './views/InquiriesView';
import StaffView from './views/StaffView';
import GradesView from './views/GradesView';
import ReviewsView from './views/ReviewsView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import CommunityView from './views/CommunityView';

function AuthScreen({ needsBootstrap }: { needsBootstrap: boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const login = useAdminLogin();
  const bootstrap = useAdminBootstrap();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (needsBootstrap) {
      bootstrap.mutate({ username, password });
    } else {
      login.mutate({ username, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 border-2 border-[var(--ad-gold)] rotate-45 mx-auto flex items-center justify-center mb-4 bg-[var(--ad-gold-bg)]">
            <span className="-rotate-45 text-[var(--ad-gold)] font-bold text-xl">R</span>
          </div>
          <p className="text-[var(--ad-gold)] text-sm font-bold tracking-tight mb-2">로또리코</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">운영 콘솔 로그인</h1>
          <p className="text-[var(--ad-muted)] text-sm mt-2">
            아이디와 비밀번호만 입력하세요.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>아이디</Label>
            <Input required minLength={3} value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" autoComplete="username" />
          </div>
          <div>
            <Label>비밀번호</Label>
            <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={login.isPending || bootstrap.isPending}>
            {(login.isPending || bootstrap.isPending) ? <Loader2 size={16} className="animate-spin" /> : '로그인'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

type ViewType = 'dashboard' | 'members' | 'databases' | 'inquiries' | 'staff' | 'grades' | 'reviews' | 'community' | 'stats' | 'settings';

function AdminLayout({ user }: { user: any }) {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const logout = useAdminLogout();

  const menu = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'members', label: '회원 관리', icon: Users },
    { id: 'databases', label: '분석 DB', icon: Database },
    { id: 'inquiries', label: '고객센터', icon: MessagesSquare },
    { id: 'reviews', label: '당첨 후기', icon: Star, ownerOnly: true },
    { id: 'community', label: '커뮤니티', icon: MessageCircle, ownerOnly: true },
    { id: 'stats', label: '통계', icon: BarChart3, ownerOnly: true },
    { id: 'grades', label: '회원 등급', icon: Award },
    { id: 'staff', label: '직원 관리', icon: ShieldHalf, ownerOnly: true },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="w-full md:w-64 flex-shrink-0 bg-[var(--ad-panel)] border-r border-[var(--ad-border)] flex flex-col">
        <div className="p-5 border-b border-[var(--ad-border)] flex items-center gap-3">
          <div className="w-8 h-8 border border-[var(--ad-gold)] rotate-45 flex items-center justify-center bg-[var(--ad-gold-bg)]">
            <span className="-rotate-45 text-[var(--ad-gold)] font-bold text-sm">R</span>
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-white">로또리코</h2>
            <p className="text-[10px] text-[var(--ad-muted)] uppercase tracking-widest">운영 콘솔</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 admin-scrollbar">
          {menu.map(item => {
            if (item.ownerOnly && user.role !== 'owner') return null;
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[var(--ad-gold-bg)] text-[var(--ad-gold)]' 
                    : 'text-[var(--ad-muted)] hover:bg-[#1A1F2B] hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[var(--ad-gold)]' : 'opacity-70'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--ad-border)]">
          <div className="flex items-center justify-between mb-4">
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-[var(--ad-muted)] uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => logout.mutate()} disabled={logout.isPending}>
            <LogOut size={14} /> 로그아웃
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[var(--ad-bg)] h-screen overflow-y-auto admin-scrollbar">
        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto admin-animate-in">
          {activeView === 'dashboard' && <DashboardView user={user} onNavigate={(v: string) => setActiveView(v as ViewType)} />}
          {activeView === 'members' && <MembersView />}
          {activeView === 'databases' && <DatabasesView user={user} />}
          {activeView === 'inquiries' && <InquiriesView user={user} />}
          {activeView === 'reviews' && <ReviewsView />}
          {activeView === 'community' && <CommunityView />}
          {activeView === 'stats' && <StatsView />}
          {activeView === 'grades' && <GradesView user={user} />}
          {activeView === 'staff' && <StaffView user={user} />}
          {activeView === 'settings' && <SettingsView user={user} />}
        </div>
      </main>
    </div>
  );
}

export default function AdminApp() {
  const { data, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--ad-bg)] flex items-center justify-center admin-app">
        <Loader2 size={32} className="text-[var(--ad-gold)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="admin-app">
      {data?.authenticated ? (
        <AdminLayout user={data.user} />
      ) : (
        <AuthScreen needsBootstrap={data?.needsBootstrap} />
      )}
    </div>
  );
}
