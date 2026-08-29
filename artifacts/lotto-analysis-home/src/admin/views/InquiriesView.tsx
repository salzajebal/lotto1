import { useState } from 'react';
import { useInquiries, useUpdateInquiry, useInquiryNotes, useCreateInquiryNote, useStaff } from '../api';
import { Card, Table, Th, Td, Badge, Button, Select, Modal, Label, Textarea } from '../components/UI';
import { Loader2, MessageCircle, Send, Check } from 'lucide-react';

export default function InquiriesView({ user }: { user: { role: string } }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: inquiries, isLoading } = useInquiries({ status: statusFilter !== 'all' ? statusFilter : undefined });
  const { data: staffList } = useStaff();
  
  const updateInquiry = useUpdateInquiry();
  const createNote = useCreateInquiryNote();

  const [activeInquiry, setActiveInquiry] = useState<any>(null);
  const [noteContent, setNoteContent] = useState('');

  const { data: notes, isLoading: notesLoading } = useInquiryNotes(activeInquiry?.id || 0);

  const activeStaff = staffList?.filter((s: any) => s.active) || [];

  const handleStatusChange = (status: string) => {
    if (!activeInquiry) return;
    updateInquiry.mutate({ id: activeInquiry.id, data: { status } }, {
      onSuccess: () => {
        setActiveInquiry({ ...activeInquiry, status });
      }
    });
  };

  const handleAssign = (staffId: number) => {
    if (!activeInquiry) return;
    updateInquiry.mutate({ id: activeInquiry.id, data: { assignedStaffId: staffId } }, {
      onSuccess: () => {
        const staffName = staffList?.find((s: any) => s.id === staffId)?.name;
        setActiveInquiry({ ...activeInquiry, assignedStaffId: staffId, staffName });
      }
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInquiry || !noteContent.trim()) return;
    createNote.mutate({ inquiryId: activeInquiry.id, content: noteContent }, {
      onSuccess: () => {
        setNoteContent('');
        if (activeInquiry.status === 'new') {
          setActiveInquiry({ ...activeInquiry, status: 'in_progress' });
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge variant="danger">신규</Badge>;
      case 'in_progress': return <Badge variant="warning">진행중</Badge>;
      case 'resolved': return <Badge variant="success">답변완료</Badge>;
      case 'closed': return <Badge variant="default">종료</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row gap-6">
      {/* List Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">고객센터 문의</h1>
            <p className="text-[var(--ad-muted)] text-sm">들어온 문의를 확인하고 답변을 작성합니다.</p>
          </div>
          <Select className="w-32" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">전체 상태</option>
            <option value="new">신규</option>
            <option value="in_progress">진행중</option>
            <option value="resolved">답변완료</option>
          </Select>
        </div>

        <Card className="flex-1 flex flex-col p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>
          ) : (
            <div className="overflow-y-auto admin-scrollbar flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-[var(--ad-panel)] z-10">
                  <tr>
                    <Th>상태</Th>
                    <Th>문의자</Th>
                    <Th>주제</Th>
                    <Th>담당자</Th>
                    <Th>접수일</Th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries?.map((iq: any) => (
                    <tr 
                      key={iq.id} 
                      onClick={() => setActiveInquiry(iq)}
                      className={`cursor-pointer border-b border-[var(--ad-border)] transition-colors ${activeInquiry?.id === iq.id ? 'bg-[var(--ad-gold-bg)]' : 'hover:bg-[var(--ad-panel-hover)]'}`}
                    >
                      <Td>{getStatusBadge(iq.status)}</Td>
                      <Td className="font-semibold text-white">{iq.name}</Td>
                      <Td className="truncate max-w-[200px] text-[var(--ad-muted)]">{iq.subject}</Td>
                      <Td>{iq.staffName || '-'}</Td>
                      <Td className="text-[var(--ad-muted)] text-xs">{new Date(iq.createdAt).toLocaleDateString()}</Td>
                    </tr>
                  ))}
                  {inquiries?.length === 0 && (
                    <tr><Td colSpan={5} className="text-center py-8 text-[var(--ad-muted)]">조건에 맞는 문의가 없습니다.</Td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Detail Panel */}
      <Card className="w-full lg:w-[400px] flex-shrink-0 flex flex-col p-0 overflow-hidden h-[600px] lg:h-auto border-[var(--ad-gold)] shadow-[0_0_20px_rgba(232,187,81,0.05)]">
        {activeInquiry ? (
          <>
            <div className="p-5 border-b border-[var(--ad-border)] bg-[#11141A]">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg text-white break-all whitespace-normal">{activeInquiry.subject}</h2>
                {getStatusBadge(activeInquiry.status)}
              </div>
              <div className="text-sm text-[var(--ad-muted)] flex flex-wrap gap-x-4 gap-y-1 mb-4">
                <span><strong className="text-white">문의자:</strong> {activeInquiry.name}</span>
                <span><strong className="text-white">연락처:</strong> {activeInquiry.contact}</span>
                <span><strong className="text-white">유형:</strong> {activeInquiry.category}</span>
              </div>
              
              <div className="p-3 bg-[var(--ad-bg)] rounded-md border border-[var(--ad-border)] text-sm text-[#E2E8F0] whitespace-pre-wrap leading-relaxed">
                {activeInquiry.message}
              </div>

              <div className="mt-4 flex gap-2">
                <Select 
                  className="flex-1 text-xs py-1.5" 
                  value={activeInquiry.assignedStaffId || 0} 
                  onChange={(e) => handleAssign(Number(e.target.value))}
                  disabled={updateInquiry.isPending || user.role !== 'owner'}
                >
                  <option value={0}>담당자 배정...</option>
                  {activeStaff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <Select 
                  className="flex-1 text-xs py-1.5" 
                  value={activeInquiry.status} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updateInquiry.isPending}
                >
                  <option value="new">신규</option>
                  <option value="in_progress">진행중</option>
                  <option value="resolved">답변완료</option>
                  <option value="closed">종료</option>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto admin-scrollbar p-5 space-y-4 bg-[var(--ad-bg)]">
              <h3 className="text-xs font-bold text-[var(--ad-muted)] uppercase tracking-wider mb-2">처리 기록 / 메모</h3>
              {notesLoading ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-[var(--ad-muted)]" /></div>
              ) : notes?.length === 0 ? (
                <p className="text-center text-[var(--ad-muted)] text-sm py-4">기록된 메모가 없습니다.</p>
              ) : (
                notes?.map((n: any) => (
                  <div key={n.id} className="bg-[var(--ad-panel)] border border-[var(--ad-border)] p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-xs text-[var(--ad-gold)]">{n.staffName}</span>
                      <span className="text-[10px] text-[var(--ad-muted)]">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-[#E2E8F0] whitespace-pre-wrap leading-snug">{n.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="p-4 border-t border-[var(--ad-border)] bg-[var(--ad-panel)]">
              <div className="relative">
                <Textarea 
                  className="pr-12" 
                  placeholder="메모 작성 (고객에게는 노출되지 않습니다)..." 
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm" 
                  className="absolute bottom-2 right-2 w-8 h-8 p-0 rounded-md"
                  disabled={createNote.isPending || !noteContent.trim()}
                >
                  {createNote.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--ad-muted)] p-8">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p>목록에서 문의를 선택하여 상세 내용을 확인하세요.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
