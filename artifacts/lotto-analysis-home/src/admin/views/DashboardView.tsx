import { useDashboard } from '../api';
import { Card, Badge, Button } from '../components/UI';
import { Loader2, Users, Database, MessagesSquare, ArrowRight, TrendingUp } from 'lucide-react';

export default function DashboardView({ user, onNavigate }: { user: any, onNavigate: (v: string) => void }) {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>;

  const m = data?.metrics || {};
  const recentInquiries = data?.recentInquiries || [];
  const staff = data?.staff || [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">대시보드</h1>
          <p className="text-[var(--ad-muted)] text-sm">오늘도 좋은 하루 되세요, {user.name}님.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--ad-panel-hover)] flex items-center justify-center text-[var(--ad-info)]">
              <Users size={20} />
            </div>
            <Badge variant="info">Total</Badge>
          </div>
          <p className="text-[var(--ad-muted)] text-sm font-semibold uppercase tracking-wider mb-1">총 회원</p>
          <p className="text-3xl font-bold text-white">{m.members.toLocaleString()}</p>
        </Card>
        
        <Card className="flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--ad-panel-hover)] flex items-center justify-center text-[var(--ad-gold)]">
              <Database size={20} />
            </div>
            <Badge variant="warning">Ready</Badge>
          </div>
          <p className="text-[var(--ad-muted)] text-sm font-semibold uppercase tracking-wider mb-1">누적 분석 DB</p>
          <p className="text-3xl font-bold text-white">{m.databases.toLocaleString()}</p>
        </Card>

        <Card className="flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--ad-panel-hover)] flex items-center justify-center text-[var(--ad-danger)]">
              <MessagesSquare size={20} />
            </div>
            <Badge variant="danger">Action Req</Badge>
          </div>
          <p className="text-[var(--ad-muted)] text-sm font-semibold uppercase tracking-wider mb-1">신규 문의</p>
          <p className="text-3xl font-bold text-white">{m.newInquiries.toLocaleString()}</p>
        </Card>

        <Card className="flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--ad-panel-hover)] flex items-center justify-center text-[var(--ad-success)]">
              <TrendingUp size={20} />
            </div>
            <Badge variant="success">Monthly</Badge>
          </div>
          <p className="text-[var(--ad-muted)] text-sm font-semibold uppercase tracking-wider mb-1">월 예상 수익</p>
          <p className="text-3xl font-bold text-white">₩{m.monthlyRevenue.toLocaleString()}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">최근 문의 내역</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('inquiries')}>
              전체보기 <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[var(--ad-muted)] text-sm py-8">
              최근 접수된 문의가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map((iq: any) => (
                <div key={iq.id} className="flex items-center justify-between p-3 rounded-md bg-[var(--ad-bg)] border border-[var(--ad-border)]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-[#E2E8F0]">{iq.name}</span>
                      <Badge variant={iq.status === 'new' ? 'danger' : 'default'}>{iq.status === 'new' ? '신규' : '진행중'}</Badge>
                    </div>
                    <p className="text-xs text-[var(--ad-muted)] truncate max-w-[200px]">{iq.subject}</p>
                  </div>
                  <span className="text-xs text-[var(--ad-muted)]">{new Date(iq.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">팀 현황</h3>
            {user.role === 'owner' && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate('staff')}>
                관리 <ArrowRight size={14} className="ml-1" />
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {staff.map((st: any) => (
              <div key={st.id} className="flex items-center justify-between p-3 rounded-md bg-[var(--ad-bg)] border border-[var(--ad-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--ad-panel-hover)] border border-[var(--ad-border)] flex items-center justify-center text-xs font-bold text-[var(--ad-gold)]">
                    {st.name.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#E2E8F0]">{st.name}</p>
                    <p className="text-xs text-[var(--ad-muted)] uppercase tracking-wider">{st.role}</p>
                  </div>
                </div>
                <Badge variant={st.active ? 'success' : 'default'}>{st.active ? '활성' : '비활성'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
