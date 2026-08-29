import { useState, useMemo } from 'react';
import { useDatabases, useStaff, useCreateDatabase, useBulkAssignDatabases, useAssignDatabase } from '../api';
import { Card, Table, Th, Td, Badge, Button, Input, Select, Modal, Label, Textarea } from '../components/UI';
import { Plus, UserPlus, Loader2, CheckSquare } from 'lucide-react';

export default function DatabasesView({ user }: { user: { role: string } }) {
  const canAssign = user.role === 'owner';
  const { data: databases, isLoading } = useDatabases();
  const { data: staffList } = useStaff();
  
  const createDb = useCreateDatabase();
  const assignDb = useAssignDatabase();
  const bulkAssign = useBulkAssignDatabases();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', drawNumber: '', price: 0, notes: '' });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetStaffId, setTargetStaffId] = useState<number>(0);
  const [singleAssignId, setSingleAssignId] = useState<number | null>(null);

  const activeStaff = useMemo(() => staffList?.filter((s: any) => s.active) || [], [staffList]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createDb.mutate({
      ...form,
      drawNumber: form.drawNumber ? Number(form.drawNumber) : null,
      price: Number(form.price)
    }, { onSuccess: () => { setModalOpen(false); setForm({ name: '', drawNumber: '', price: 0, notes: '' }); }});
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStaffId) return;
    if (singleAssignId) {
      assignDb.mutate({ id: singleAssignId, staffId: targetStaffId }, { onSuccess: () => setAssignModalOpen(false) });
    } else if (selectedIds.size > 0) {
      bulkAssign.mutate({ databaseIds: Array.from(selectedIds), staffId: targetStaffId }, { onSuccess: () => { setAssignModalOpen(false); setSelectedIds(new Set()); }});
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === databases?.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(databases?.map((d: any) => d.id)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">분석 DB 관리</h1>
          <p className="text-[var(--ad-muted)] text-sm">생성된 분석 데이터베이스를 관리하고 직원에게 배정합니다.</p>
        </div>
        <div className="flex gap-2">
          {canAssign && selectedIds.size > 0 && (
            <Button variant="secondary" className="gap-2" onClick={() => { setSingleAssignId(null); setTargetStaffId(activeStaff[0]?.id || 0); setAssignModalOpen(true); }}>
              <UserPlus size={16} /> 일괄 배정 ({selectedIds.size})
            </Button>
          )}
          {canAssign && <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus size={16} /> 신규 DB 생성
          </Button>}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>
                {canAssign && <button className="text-[var(--ad-muted)] hover:text-white" onClick={toggleAll}><CheckSquare size={16} /></button>}
              </Th>
              <Th>DB 식별자</Th>
              <Th>회차</Th>
              <Th>단가</Th>
              <Th>담당자</Th>
              <Th>상태</Th>
              <Th>생성일</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {databases?.map((db: any) => (
              <tr key={db.id} className={`transition-colors ${selectedIds.has(db.id) ? 'bg-[var(--ad-gold-bg)]' : 'hover:bg-[var(--ad-panel-hover)]'}`}>
                <Td>
                  {canAssign && <input type="checkbox" checked={selectedIds.has(db.id)} onChange={() => toggleSelect(db.id)} className="accent-[var(--ad-gold)] bg-transparent border-[var(--ad-border)]" />}
                </Td>
                <Td className="font-semibold text-white">{db.name}</Td>
                <Td>{db.drawNumber ? `${db.drawNumber}회` : '-'}</Td>
                <Td>₩{db.price.toLocaleString()}</Td>
                <Td>{db.staffName ? <span className="text-[var(--ad-info)]">{db.staffName}</span> : <span className="text-[var(--ad-muted)]">미배정</span>}</Td>
                <Td><Badge variant={db.status === 'ready' ? 'warning' : 'success'}>{db.status === 'ready' ? '대기' : db.status}</Badge></Td>
                <Td><span className="text-[var(--ad-muted)]">{new Date(db.createdAt).toLocaleDateString()}</span></Td>
                <Td className="text-right">
                  {canAssign && <Button variant="ghost" size="sm" onClick={() => { setSingleAssignId(db.id); setTargetStaffId(db.assignedStaffId || activeStaff[0]?.id || 0); setAssignModalOpen(true); }}>
                    배정
                  </Button>}
                </Td>
              </tr>
            ))}
            {databases?.length === 0 && (
              <tr><Td colSpan={8} className="text-center py-8 text-[var(--ad-muted)]">생성된 분석 DB가 없습니다.</Td></tr>
            )}
          </tbody>
        </Table>
      )}

      <Modal title="신규 분석 DB 생성" isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label>DB 식별자 (이름) *</Label>
            <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="예: 2503_VIP_SET_1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>관련 회차</Label>
              <Input type="number" value={form.drawNumber} onChange={e => setForm({...form, drawNumber: e.target.value})} placeholder="예: 1185" />
            </div>
            <div>
              <Label>기대 단가</Label>
              <Input type="number" required value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
            </div>
          </div>
          <div>
            <Label>설명/메모</Label>
            <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>취소</Button>
            <Button type="submit" disabled={createDb.isPending}>생성</Button>
          </div>
        </form>
      </Modal>

      <Modal title={singleAssignId ? "직원 배정" : "일괄 직원 배정"} isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)}>
        <form onSubmit={handleAssign} className="space-y-4">
          <p className="text-sm text-[var(--ad-muted)] mb-4">
            {singleAssignId ? '이 DB를 처리할 담당 직원을 선택하세요.' : `선택한 ${selectedIds.size}개의 DB를 일괄 배정합니다.`}
          </p>
          <div>
            <Label>담당 직원 선택</Label>
            <Select required value={targetStaffId} onChange={e => setTargetStaffId(Number(e.target.value))}>
              <option value={0} disabled>직원 선택</option>
              {activeStaff.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
            </Select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAssignModalOpen(false)}>취소</Button>
            <Button type="submit" disabled={assignDb.isPending || bulkAssign.isPending}>배정 저장</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
