import { useState } from 'react';
import { useStaff, useCreateStaff, useUpdateStaff } from '../api';
import { Card, Table, Th, Td, Badge, Button, Input, Select, Modal, Label } from '../components/UI';
import { Plus, Edit2, Loader2, ShieldAlert } from 'lucide-react';

export default function StaffView({ user }: { user: any }) {
  const { data: staffList, isLoading } = useStaff();
  
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'staff', active: true });

  const isOwner = user?.role === 'owner';

  const openModal = (staff?: any) => {
    if (staff) {
      setEditingId(staff.id);
      setForm({ name: staff.name, username: staff.username, email: staff.email, password: '', role: staff.role, active: staff.active });
    } else {
      setEditingId(null);
      setForm({ name: '', username: '', email: '', password: '', role: 'staff', active: true });
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const payload: any = { name: form.name, username: form.username };
      if (editingId !== user.id) {
        payload.role = form.role;
        payload.active = form.active;
      }
      if (form.password) payload.password = form.password;
      updateStaff.mutate({ id: editingId, data: payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createStaff.mutate({ name: form.name, username: form.username, email: form.email, password: form.password, role: form.role }, { onSuccess: () => setModalOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">직원 관리</h1>
          <p className="text-[var(--ad-muted)] text-sm">운영 콘솔에 접근할 수 있는 직원 계정을 관리합니다.</p>
        </div>
        {isOwner && (
          <Button onClick={() => openModal()} className="gap-2">
            <Plus size={16} /> 신규 직원 등록
          </Button>
        )}
      </div>

      {!isOwner && (
        <Card className="flex items-center gap-3 bg-[var(--ad-danger)]/10 border-[var(--ad-danger)]/30 text-[#E2E8F0]">
          <ShieldAlert size={20} className="text-[var(--ad-danger)]" />
          <span className="text-sm">직원 관리 기능은 <strong>owner</strong> 권한을 가진 관리자만 접근할 수 있습니다. 조회만 가능합니다.</span>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>이름</Th>
              <Th>아이디</Th>
              <Th>이메일 (연락처)</Th>
              <Th>권한</Th>
              <Th>배정된 회원수</Th>
              <Th>진행중 문의</Th>
              <Th>상태</Th>
              <Th>등록일</Th>
              {isOwner && <Th></Th>}
            </tr>
          </thead>
          <tbody>
            {staffList?.map((s: any) => (
              <tr key={s.id} className="hover:bg-[var(--ad-panel-hover)] transition-colors">
                <Td className="font-semibold text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--ad-bg)] flex items-center justify-center text-[10px] text-[var(--ad-gold)]">
                    {s.name.substring(0, 2)}
                  </div>
                  {s.name}
                </Td>
                <Td>{s.username}</Td>
                <Td>{s.email || '-'}</Td>
                <Td><Badge variant={s.role === 'owner' ? 'warning' : 'info'}>{s.role}</Badge></Td>
                <Td className="font-mono">{s.memberCount}</Td>
                <Td className="font-mono">{s.inquiryCount}</Td>
                <Td><Badge variant={s.active ? 'success' : 'default'}>{s.active ? '활성' : '비활성'}</Badge></Td>
                <Td><span className="text-[var(--ad-muted)]">{new Date(s.createdAt).toLocaleDateString()}</span></Td>
                {isOwner && (
                  <Td className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openModal(s)}><Edit2 size={14} /></Button>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {isOwner && (
        <Modal title={editingId ? '직원 정보 수정' : '신규 직원 등록'} isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>이름 *</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            {!editingId && (
              <div>
                <Label>이메일 *</Label>
                <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            )}
            <div>
              <Label>아이디 *</Label>
              <Input required minLength={3} value={form.username} onChange={e => setForm({...form, username: e.target.value})} autoComplete="username" />
            </div>
            <div>
              <Label>{editingId ? '새 비밀번호 (변경시에만 입력)' : '초기 비밀번호 *'}</Label>
              <Input type="password" required={!editingId} minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>권한</Label>
                <Select value={form.role} onChange={e => setForm({...form, role: e.target.value})} disabled={editingId === user.id}>
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                </Select>
              </div>
              {editingId && (
                <div>
                  <Label>상태</Label>
                  <Select value={form.active ? 'true' : 'false'} onChange={e => setForm({...form, active: e.target.value === 'true'})} disabled={editingId === user.id}>
                    <option value="true">활성 (로그인 가능)</option>
                    <option value="false">비활성 (접근 차단)</option>
                  </Select>
                </div>
              )}
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>취소</Button>
              <Button type="submit" disabled={createStaff.isPending || updateStaff.isPending}>저장</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
