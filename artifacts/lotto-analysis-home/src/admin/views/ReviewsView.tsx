import { useState } from 'react';
import { useReviews, useCreateReview, useUpdateReview } from '../api';
import { Card, Table, Th, Td, Badge, Button, Input, Select, Modal, Label, Textarea } from '../components/UI';
import { Plus, Edit2, Loader2 } from 'lucide-react';

export default function ReviewsView() {
  const { data: reviews, isLoading } = useReviews();
  
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ memberName: '', drawNumber: 0, rank: '', amount: 0, content: '', status: 'pending' });

  const openModal = (review?: any) => {
    if (review) {
      setEditingId(review.id);
      setForm({ 
        memberName: review.memberName, drawNumber: review.drawNumber, 
        rank: review.rank, amount: review.amount || 0, 
        content: review.content, status: review.status 
      });
    } else {
      setEditingId(null);
      setForm({ memberName: '', drawNumber: 0, rank: '1등', amount: 0, content: '', status: 'pending' });
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      drawNumber: Number(form.drawNumber),
      amount: Number(form.amount)
    };

    if (editingId) {
      updateReview.mutate({ id: editingId, data: payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createReview.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">검토 대기</Badge>;
      case 'published': return <Badge variant="success">게시됨</Badge>;
      case 'rejected': return <Badge variant="danger">거절됨</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">당첨 후기 관리</h1>
          <p className="text-[var(--ad-muted)] text-sm">회원이 제출한 당첨 후기를 검토하고 게시합니다.</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <Plus size={16} /> 자체 후기 등록
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>회차 / 등수</Th>
              <Th>작성자</Th>
              <Th>당첨금</Th>
              <Th>내용 (요약)</Th>
              <Th>게시 상태</Th>
              <Th>등록일</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {reviews?.map((r: any) => (
              <tr key={r.id} className="hover:bg-[var(--ad-panel-hover)] transition-colors">
                <Td className="font-semibold text-white">{r.drawNumber}회 <span className="text-[var(--ad-gold)] ml-1">{r.rank}</span></Td>
                <Td>{r.memberName}</Td>
                <Td className="font-mono text-xs text-[var(--ad-muted)]">₩{r.amount?.toLocaleString() || '0'}</Td>
                <Td className="truncate max-w-[200px] text-xs text-[#E2E8F0]">{r.content}</Td>
                <Td>{getStatusBadge(r.status)}</Td>
                <Td><span className="text-[var(--ad-muted)]">{new Date(r.createdAt).toLocaleDateString()}</span></Td>
                <Td className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openModal(r)}><Edit2 size={14} /></Button>
                </Td>
              </tr>
            ))}
            {reviews?.length === 0 && (
              <tr><Td colSpan={7} className="text-center py-8 text-[var(--ad-muted)]">등록된 후기가 없습니다.</Td></tr>
            )}
          </tbody>
        </Table>
      )}

      <Modal title={editingId ? '후기 수정 및 검토' : '자체 당첨 후기 등록'} isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>작성자 (표시용) *</Label>
              <Input required value={form.memberName} onChange={e => setForm({...form, memberName: e.target.value})} placeholder="예: 김○○" />
            </div>
            <div>
              <Label>상태 (게시 여부)</Label>
              <Select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="pending">검토 대기</option>
                <option value="published">홈페이지에 게시 (공개)</option>
                <option value="rejected">거절 / 숨김</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>회차 *</Label>
              <Input type="number" required value={form.drawNumber || ''} onChange={e => setForm({...form, drawNumber: Number(e.target.value)})} placeholder="예: 1185" />
            </div>
            <div>
              <Label>당첨 등수 *</Label>
              <Input required value={form.rank} onChange={e => setForm({...form, rank: e.target.value})} placeholder="예: 1등" />
            </div>
            <div>
              <Label>당첨금액</Label>
              <Input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
            </div>
          </div>
          <div>
            <Label>후기 내용 *</Label>
            <Textarea required className="min-h-[140px]" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>취소</Button>
            <Button type="submit" disabled={createReview.isPending || updateReview.isPending}>저장</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
