import { useState } from 'react';
import { useMembers, useGrades, useStaff, useCreateMember, useUpdateMember } from '../api';
import { Card, Table, Th, Td, Badge, Button, Input, Select, Modal, Label, Textarea } from '../components/UI';
import { Search, Plus, Edit2, Loader2 } from 'lucide-react';

export default function MembersView() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState<number>(0);
  
  const { data: members, isLoading } = useMembers({ search: debouncedSearch, status: statusFilter, gradeId: gradeFilter });
  const { data: grades } = useGrades();
  const { data: staffList } = useStaff();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', gradeId: 0, status: 'active', assignedStaffId: 0, monthlyRevenue: 0, notes: ''
  });

  const openModal = (member?: any) => {
    if (member) {
      setEditingId(member.id);
      setForm({
        name: member.name, email: member.email || '', phone: member.phone || '',
        gradeId: member.gradeId || 0, status: member.status, assignedStaffId: member.assignedStaffId || 0,
        monthlyRevenue: member.monthlyRevenue || 0, notes: member.notes || ''
      });
    } else {
      setEditingId(null);
      setForm({
        name: '', email: '', phone: '', gradeId: grades?.[0]?.id || 0, status: 'active', assignedStaffId: 0, monthlyRevenue: 0, notes: ''
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      gradeId: form.gradeId || null,
      assignedStaffId: form.assignedStaffId || null,
      monthlyRevenue: Number(form.monthlyRevenue)
    };
    if (editingId) {
      updateMember.mutate({ id: editingId, data: payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMember.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">회원 관리</h1>
          <p className="text-[var(--ad-muted)] text-sm">전체 회원을 조회하고 관리합니다.</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <Plus size={16} /> 신규 회원 등록
        </Button>
      </div>

      <Card className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-[var(--ad-muted)]" />
          <Input 
            className="pl-9" 
            placeholder="이름, 이메일, 전화번호 검색..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setDebouncedSearch(search)}
            onBlur={() => setDebouncedSearch(search)}
          />
        </div>
        <Select className="w-full sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </Select>
        <Select className="w-full sm:w-48" value={gradeFilter} onChange={e => setGradeFilter(Number(e.target.value))}>
          <option value={0}>전체 등급</option>
          {grades?.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>이름</Th>
              <Th>연락처/이메일</Th>
              <Th>등급</Th>
              <Th>담당자</Th>
              <Th>상태</Th>
              <Th>가입일</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {members?.map((m: any) => (
              <tr key={m.id} className="hover:bg-[var(--ad-panel-hover)] transition-colors">
                <Td className="font-semibold text-white">{m.name}</Td>
                <Td>
                  <div className="text-sm">{m.phone || '-'}</div>
                  <div className="text-xs text-[var(--ad-muted)]">{m.email || '-'}</div>
                </Td>
                <Td>
                  {m.gradeName ? (
                    <Badge variant="warning">{m.gradeName}</Badge>
                  ) : <span className="text-[var(--ad-muted)]">-</span>}
                </Td>
                <Td>{m.staffName || <span className="text-[var(--ad-muted)]">미배정</span>}</Td>
                <Td><Badge variant={m.status === 'active' ? 'success' : 'default'}>{m.status === 'active' ? '활성' : '비활성'}</Badge></Td>
                <Td><span className="text-[var(--ad-muted)]">{new Date(m.createdAt).toLocaleDateString()}</span></Td>
                <Td className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openModal(m)}><Edit2 size={14} /></Button>
                </Td>
              </tr>
            ))}
            {members?.length === 0 && (
              <tr><Td colSpan={7} className="text-center py-8 text-[var(--ad-muted)]">검색된 회원이 없습니다.</Td></tr>
            )}
          </tbody>
        </Table>
      )}

      <Modal title={editingId ? '회원 정보 수정' : '신규 회원 등록'} isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>이름 *</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <Label>상태</Label>
              <Select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>연락처</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <Label>이메일</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>등급</Label>
              <Select value={form.gradeId} onChange={e => setForm({...form, gradeId: Number(e.target.value)})}>
                <option value={0}>선택 안함</option>
                {grades?.filter((g: any) => g.active).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>담당 직원</Label>
              <Select value={form.assignedStaffId} onChange={e => setForm({...form, assignedStaffId: Number(e.target.value)})}>
                <option value={0}>미배정</option>
                {staffList?.filter((s: any) => s.active).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <Label>월 예상 수익 (원)</Label>
            <Input type="number" value={form.monthlyRevenue} onChange={e => setForm({...form, monthlyRevenue: Number(e.target.value)})} />
          </div>
          <div>
            <Label>상담 메모</Label>
            <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>취소</Button>
            <Button type="submit" disabled={createMember.isPending || updateMember.isPending}>저장</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
