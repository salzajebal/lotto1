import { useState } from 'react';
import { useGrades, useCreateGrade, useUpdateGrade, useDeleteGrade } from '../api';
import { Card, Table, Th, Td, Badge, Button, Input, Modal, Label, Textarea } from '../components/UI';
import { Plus, Edit2, Loader2, ShieldAlert, Trash2 } from 'lucide-react';

export default function GradesView({ user }: { user: any }) {
  const { data: grades, isLoading } = useGrades();
  
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ name: '', slug: '', price: 0, color: '#D8A84E', description: '', benefits: '' });

  const isOwner = user?.role === 'owner';

  const openModal = (grade?: any) => {
    if (grade) {
      setEditingId(grade.id);
      setForm({ 
        name: grade.name, slug: grade.slug, price: grade.price, 
        color: grade.color || '#D8A84E', description: grade.description || '', 
        benefits: grade.benefits?.join(', ') || '' 
      });
    } else {
      setEditingId(null);
      setForm({ name: '', slug: '', price: 0, color: '#D8A84E', description: '', benefits: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      benefits: form.benefits.split(',').map(s => s.trim()).filter(Boolean)
    };

    if (editingId) {
      updateGrade.mutate({ id: editingId, data: payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createGrade.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('이 등급을 비활성화하시겠습니까? 기존 회원의 등급은 유지되나 신규 할당이 제한됩니다.')) {
      deleteGrade.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">회원 등급 관리</h1>
          <p className="text-[var(--ad-muted)] text-sm">서비스에서 제공하는 멤버십 등급 정책을 관리합니다.</p>
        </div>
        {isOwner && (
          <Button onClick={() => openModal()} className="gap-2">
            <Plus size={16} /> 신규 등급 추가
          </Button>
        )}
      </div>

      {!isOwner && (
        <Card className="flex items-center gap-3 bg-[var(--ad-danger)]/10 border-[var(--ad-danger)]/30 text-[#E2E8F0]">
          <ShieldAlert size={20} className="text-[var(--ad-danger)]" />
          <span className="text-sm">등급 관리 기능은 <strong>owner</strong> 권한을 가진 관리자만 접근할 수 있습니다. 조회만 가능합니다.</span>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>등급명</Th>
              <Th>슬러그 식별자</Th>
              <Th>기본 가격 (월)</Th>
              <Th>주요 혜택</Th>
              <Th>상태</Th>
              {isOwner && <Th></Th>}
            </tr>
          </thead>
          <tbody>
            {grades?.map((g: any) => (
              <tr key={g.id} className={`transition-colors ${!g.active ? 'opacity-50' : 'hover:bg-[var(--ad-panel-hover)]'}`}>
                <Td className="font-semibold text-white flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color || '#ccc' }} />
                  {g.name}
                </Td>
                <Td className="font-mono text-xs">{g.slug}</Td>
                <Td>₩{g.price.toLocaleString()}</Td>
                <Td className="text-xs truncate max-w-[200px] text-[var(--ad-muted)]">
                  {g.benefits?.join(', ') || '-'}
                </Td>
                <Td><Badge variant={g.active ? 'success' : 'default'}>{g.active ? '사용중' : '비활성'}</Badge></Td>
                {isOwner && (
                  <Td className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => openModal(g)}><Edit2 size={14} /></Button>
                    {g.active && (
                      <Button variant="ghost" size="sm" className="text-[var(--ad-danger)] hover:bg-[var(--ad-danger)]/10" onClick={() => handleDelete(g.id)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </Td>
                )}
              </tr>
            ))}
            {grades?.length === 0 && (
              <tr><Td colSpan={6} className="text-center py-8 text-[var(--ad-muted)]">등록된 등급이 없습니다.</Td></tr>
            )}
          </tbody>
        </Table>
      )}

      {isOwner && (
        <Modal title={editingId ? '등급 정보 수정' : '신규 등급 추가'} isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>등급명 (노출용) *</Label>
                <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="예: VIP" />
              </div>
              <div>
                <Label>식별자 (영문/숫자) *</Label>
                <Input required pattern="^[a-z0-9-]+$" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="예: vip" disabled={!!editingId} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>월 단가 (원) *</Label>
                <Input type="number" required value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
              </div>
              <div>
                <Label>테마 색상 (Hex)</Label>
                <Input type="color" className="h-9 p-1" value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>혜택 목록 (쉼표로 구분)</Label>
              <Input value={form.benefits} onChange={e => setForm({...form, benefits: e.target.value})} placeholder="예: 매주 리포트, 전담 상담, 1등 번호" />
            </div>
            <div>
              <Label>등급 설명</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>취소</Button>
              <Button type="submit" disabled={createGrade.isPending || updateGrade.isPending}>저장</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
