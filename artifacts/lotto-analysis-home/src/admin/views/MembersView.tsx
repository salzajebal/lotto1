import { useState } from 'react';
import { useMembers, useGrades, useStaff, useCreateMember, useUpdateMember, useDeleteMember } from '../api';
import { Card, Table, Th, Td, Badge, Button, Input, Select, Modal, Label, Textarea } from '../components/UI';
import { Search, Plus, Edit2, Eye, Trash2, Loader2 } from 'lucide-react';

const memberStatusLabels: Record<string, string> = {
  pending: '승인 대기',
  active: '승인 완료',
  inactive: '비활성',
  rejected: '반려',
};

const memberStatusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  active: 'success',
  inactive: 'default',
  rejected: 'danger',
};

const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('ko-KR') : '-';

export default function MembersView() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState<number>(0);
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useMembers({ search: debouncedSearch, status: statusFilter, gradeId: gradeFilter, page });
  const members = data?.items || [];
  const pagination = data?.pagination;
  const { data: grades } = useGrades();
  const { data: staffList } = useStaff();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailMember, setDetailMember] = useState<any | null>(null);
  
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [form, setForm] = useState({
    username: '', name: '', email: '', phone: '', gradeId: 0, status: 'active', assignedStaffId: 0, paymentAmount: 0, monthlyRevenue: 0, notes: ''
  });

  const openModal = (member?: any) => {
    if (member) {
      setEditingId(member.id);
      setForm({
        username: member.username || '', name: member.name, email: member.email || '', phone: member.phone || '',
        gradeId: member.gradeId || 0, status: member.status, assignedStaffId: member.assignedStaffId || 0,
        paymentAmount: member.paymentAmount || 0, monthlyRevenue: member.monthlyRevenue || 0, notes: member.notes || ''
      });
    } else {
      setEditingId(null);
      setForm({
        username: '', name: '', email: '', phone: '', gradeId: grades?.[0]?.id || 0, status: 'active', assignedStaffId: 0, paymentAmount: 0, monthlyRevenue: 0, notes: ''
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      username: form.username || undefined,
      gradeId: form.gradeId || null,
      assignedStaffId: form.assignedStaffId || null,
      paymentAmount: Number(form.paymentAmount),
      monthlyRevenue: Number(form.monthlyRevenue)
    };
    if (editingId) {
      updateMember.mutate({ id: editingId, data: payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMember.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = (member: any) => {
    const identifier = member.username ? `아이디 ${member.username}` : '회원 정보';
    if (!window.confirm(`${member.name} 회원(${identifier})을 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
    deleteMember.mutate(member.id, {
      onSuccess: () => {
        if (detailMember?.id === member.id) setDetailMember(null);
      },
    });
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
            placeholder="아이디, 이름, 전화번호 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setDebouncedSearch(search); setPage(1); } }}
            onBlur={() => { setDebouncedSearch(search); setPage(1); }}
          />
        </div>
        <Select className="w-full sm:w-48" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">전체 상태</option>
           <option value="pending">승인 대기</option>
           <option value="active">승인 완료</option>
          <option value="inactive">비활성</option>
           <option value="rejected">반려</option>
        </Select>
        <Select className="w-full sm:w-48" value={gradeFilter} onChange={e => { setGradeFilter(Number(e.target.value)); setPage(1); }}>
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
              <Th>아이디</Th>
              <Th>전화번호</Th>
              <Th>가입일</Th>
              <Th>실제 결제금액</Th>
              <Th>등급</Th>
              <Th>담당자</Th>
              <Th>상태</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {members?.map((m: any) => (
              <tr key={m.id} className="hover:bg-[var(--ad-panel-hover)] transition-colors">
                <Td className="font-semibold text-white">{m.name}</Td>
                <Td>{m.username || <span className="text-[var(--ad-muted)]">-</span>}</Td>
                <Td>
                  <div className="text-sm">{m.phone || '-'}</div>
                  {m.email && <div className="text-xs text-[var(--ad-muted)]">{m.email}</div>}
                </Td>
                <Td><span className="text-[var(--ad-muted)]">{new Date(m.createdAt).toLocaleDateString()}</span></Td>
                <Td className="font-semibold text-[var(--ad-gold)]">₩{(m.paymentAmount || 0).toLocaleString()}</Td>
                <Td>
                  {m.gradeName ? (
                    <Badge variant="warning">{m.gradeName}</Badge>
                  ) : <span className="text-[var(--ad-muted)]">-</span>}
                </Td>
                <Td>{m.staffName || <span className="text-[var(--ad-muted)]">미배정</span>}</Td>
               <Td>
                 <Badge variant={memberStatusVariants[m.status] || 'default'}>{memberStatusLabels[m.status] || m.status}</Badge>
                 {m.status === 'pending' && (
                   <div className="flex gap-2 mt-2">
                     <Button size="sm" onClick={() => updateMember.mutate({ id: m.id, data: { status: 'active' } })} disabled={updateMember.isPending}>승인</Button>
                     <Button size="sm" variant="danger" onClick={() => updateMember.mutate({ id: m.id, data: { status: 'rejected' } })} disabled={updateMember.isPending}>반려</Button>
                   </div>
                 )}
               </Td>
                <Td className="text-right">
                   <div className="flex justify-end gap-1">
                     <Button variant="outline" size="sm" onClick={() => setDetailMember(m)} title="상세 보기" aria-label={`${m.name} 상세 보기`}><Eye size={14} /></Button>
                     <Button variant="ghost" size="sm" onClick={() => openModal(m)} title="수정" aria-label={`${m.name} 수정`}><Edit2 size={14} /></Button>
                     <Button variant="ghost" size="sm" onClick={() => handleDelete(m)} title="회원 삭제" aria-label={`${m.name} 회원 삭제`} disabled={deleteMember.isPending}><Trash2 size={14} /></Button>
                   </div>
                </Td>
              </tr>
            ))}
            {members?.length === 0 && (
              <tr><Td colSpan={9} className="text-center py-8 text-[var(--ad-muted)]">검색된 회원이 없습니다.</Td></tr>
            )}
          </tbody>
        </Table>
      )}

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--ad-border)] bg-[var(--ad-panel)] px-4 py-3">
          <p className="text-xs text-[var(--ad-muted)]">총 {pagination.total.toLocaleString()}명 · {pagination.page} / {pagination.totalPages} 페이지</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>이전</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}>다음</Button>
          </div>
        </div>
      )}

       <Modal title="회원 상세정보" isOpen={Boolean(detailMember)} onClose={() => setDetailMember(null)}>
         {detailMember && (
           <div className="space-y-5">
             <div className="flex items-start justify-between gap-4">
               <div>
                 <p className="text-xl font-bold text-white">{detailMember.name}</p>
                 <p className="text-sm text-[var(--ad-muted)] mt-1">{detailMember.username || '회원 아이디 미등록'}</p>
               </div>
               <Badge variant={memberStatusVariants[detailMember.status] || 'default'}>
                 {memberStatusLabels[detailMember.status] || detailMember.status}
               </Badge>
             </div>

             <div className="grid grid-cols-2 gap-x-4 gap-y-4">
               <div><Label>회원 아이디</Label><p className="text-sm text-white">{detailMember.username || '-'}</p></div>
               <div><Label>이름</Label><p className="text-sm text-white">{detailMember.name || '-'}</p></div>
               <div><Label>전화번호</Label><p className="text-sm text-white">{detailMember.phone || '-'}</p></div>
               <div><Label>이메일</Label><p className="text-sm text-white">{detailMember.email || '-'}</p></div>
               <div><Label>회원 등급</Label><p className="text-sm text-white">{detailMember.gradeName || '등급 미지정'}</p></div>
               <div><Label>담당자</Label><p className="text-sm text-white">{detailMember.staffName || '미배정'}</p></div>
               <div><Label>실제 결제금액</Label><p className="text-sm text-[var(--ad-gold)]">₩{(detailMember.paymentAmount || 0).toLocaleString()}</p></div>
               <div><Label>월 예상 수익</Label><p className="text-sm text-[var(--ad-gold)]">₩{(detailMember.monthlyRevenue || 0).toLocaleString()}</p></div>
               <div><Label>가입 경로</Label><p className="text-sm text-white">{detailMember.source || '-'}</p></div>
               <div><Label>가입일</Label><p className="text-sm text-white">{formatDateTime(detailMember.createdAt)}</p></div>
               <div className="col-span-2"><Label>최근 수정일</Label><p className="text-sm text-white">{formatDateTime(detailMember.updatedAt)}</p></div>
             </div>

             <div>
               <Label>상담 메모</Label>
               <div className="rounded-md border border-[var(--ad-border)] bg-[#0B0E14] px-3 py-3 text-sm text-[#E2E8F0] whitespace-pre-wrap min-h-[72px]">
                 {detailMember.notes || '등록된 메모가 없습니다.'}
               </div>
             </div>

             <div className="pt-1 flex justify-end">
               <Button variant="secondary" onClick={() => setDetailMember(null)}>닫기</Button>
             </div>
           </div>
         )}
       </Modal>

      <Modal title={editingId ? '회원 정보 수정' : '신규 회원 등록'} isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>회원 아이디</Label>
            <Input minLength={3} maxLength={32} value={form.username} onChange={e => setForm({...form, username: e.target.value})} autoComplete="username" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>이름 *</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <Label>상태</Label>
              <Select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                 <option value="pending">승인 대기</option>
                 <option value="active">승인 완료</option>
                <option value="inactive">비활성</option>
                 <option value="rejected">반려</option>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>실제 결제금액 (원)</Label>
              <Input type="number" min="0" value={form.paymentAmount} onChange={e => setForm({...form, paymentAmount: Number(e.target.value)})} />
            </div>
            <div>
              <Label>월 예상 수익 (원)</Label>
              <Input type="number" min="0" value={form.monthlyRevenue} onChange={e => setForm({...form, monthlyRevenue: Number(e.target.value)})} />
            </div>
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
