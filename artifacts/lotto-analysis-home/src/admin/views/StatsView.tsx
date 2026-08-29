import { useStats } from '../api';
import { Card } from '../components/UI';
import { Loader2, TrendingUp, Users, MessagesSquare, Award } from 'lucide-react';

export default function StatsView() {
  const { data, isLoading } = useStats();

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>;

  const { membersByStatus = [], membersByGrade = [], inquiriesByStatus = [], revenue = 0 } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">통계</h1>
          <p className="text-[var(--ad-muted)] text-sm">서비스 운영에 대한 전반적인 지표를 확인합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Revenue Card */}
        <Card className="flex flex-col col-span-1 md:col-span-2 border-[var(--ad-gold)]/20 shadow-[0_0_20px_rgba(232,187,81,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={20} className="text-[var(--ad-gold)]" />
            <h2 className="font-bold text-lg text-white">월간 예상 총 수익</h2>
          </div>
          <p className="text-4xl lg:text-5xl font-extrabold text-[var(--ad-gold)] tracking-tight">
            ₩ {revenue.toLocaleString()}
          </p>
          <p className="mt-2 text-[var(--ad-muted)] text-sm">전체 활성 회원의 멤버십 비용 기반 예상치입니다.</p>
        </Card>

        {/* Member Status */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--ad-border)]">
            <Users size={16} className="text-[var(--ad-muted)]" />
            <h2 className="font-bold text-white">회원 활동 상태</h2>
          </div>
          <div className="space-y-4">
            {membersByStatus.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-[var(--ad-muted)] capitalize">{item.status === 'active' ? '활성 회원' : (item.status === 'inactive' ? '비활성 회원' : item.status)}</span>
                <span className="font-bold text-white font-mono">{item.count.toLocaleString()} 명</span>
              </div>
            ))}
            {membersByStatus.length === 0 && <p className="text-[var(--ad-muted)] text-sm">데이터가 없습니다.</p>}
          </div>
        </Card>

        {/* Member Grades */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--ad-border)]">
            <Award size={16} className="text-[var(--ad-muted)]" />
            <h2 className="font-bold text-white">등급별 회원 분포</h2>
          </div>
          <div className="space-y-4">
            {membersByGrade.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-[var(--ad-muted)]">{item.grade || '미배정/기본'}</span>
                <span className="font-bold text-[#E2E8F0] font-mono">{item.count.toLocaleString()} 명</span>
              </div>
            ))}
            {membersByGrade.length === 0 && <p className="text-[var(--ad-muted)] text-sm">데이터가 없습니다.</p>}
          </div>
        </Card>

        {/* Inquiry Status */}
        <Card className="flex flex-col col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--ad-border)]">
            <MessagesSquare size={16} className="text-[var(--ad-muted)]" />
            <h2 className="font-bold text-white">문의 처리 현황</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inquiriesByStatus.map((item: any, i: number) => {
              const labelMap: Record<string, string> = {
                new: '신규 접수',
                in_progress: '진행중',
                resolved: '답변완료',
                closed: '종료'
              };
              const colorMap: Record<string, string> = {
                new: 'text-[var(--ad-danger)]',
                in_progress: 'text-[var(--ad-warning)]',
                resolved: 'text-[var(--ad-success)]',
                closed: 'text-[var(--ad-muted)]'
              };
              return (
                <div key={i} className="p-4 bg-[var(--ad-bg)] rounded-md border border-[var(--ad-border)] text-center">
                  <p className="text-xs text-[var(--ad-muted)] mb-2 uppercase tracking-wider">{labelMap[item.status] || item.status}</p>
                  <p className={`text-2xl font-bold font-mono ${colorMap[item.status] || 'text-white'}`}>{item.count.toLocaleString()}</p>
                </div>
              );
            })}
            {inquiriesByStatus.length === 0 && <p className="text-[var(--ad-muted)] text-sm col-span-full">접수된 문의가 없습니다.</p>}
          </div>
        </Card>

      </div>
    </div>
  );
}
