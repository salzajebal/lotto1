import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, ChevronLeft, ChevronRight, Loader2, MessageSquareText, Search, Send, UserMinus, UserPlus } from 'lucide-react';
import {
  useAssignDatabaseRows,
  useCreateDatabaseNote,
  useDatabaseNotes,
  useDatabaseRows,
  useStaff,
  useUnassignDatabaseRows,
  useUpdateDatabaseRowNote,
} from '../api';
import { Button, Input, Modal, Select, Table, Td, Th, Textarea } from './UI';

export default function DatabaseRowsModal({
  database,
  canAssign,
  onClose,
}: {
  database: any | null;
  canAssign: boolean;
  onClose: () => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useDatabaseRows(database?.id ?? null, { search, page, limit: 50 });
  const { data: notes, isLoading: notesLoading } = useDatabaseNotes(database?.id ?? null);
  const createNote = useCreateDatabaseNote();
  const assignRows = useAssignDatabaseRows();
  const unassignRows = useUnassignDatabaseRows();
  const updateRowNote = useUpdateDatabaseRowNote();
  const { data: staffList } = useStaff();
  const [noteContent, setNoteContent] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [targetStaffId, setTargetStaffId] = useState(0);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [rowNoteContent, setRowNoteContent] = useState('');
  const activeStaff = useMemo(() => staffList?.filter((staff: any) => staff.active && staff.role === 'staff') || [], [staffList]);

  useEffect(() => {
    setSearchInput('');
    setSearch('');
    setPage(1);
    setNoteContent('');
    setSelectedRowIds(new Set());
    setTargetStaffId(0);
    setEditingRow(null);
    setRowNoteContent('');
  }, [database?.id]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleAddNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!database || !noteContent.trim()) return;
    createNote.mutate({ databaseId: database.id, content: noteContent.trim() }, {
      onSuccess: () => setNoteContent(''),
    });
  };

  const visibleRowIds = data?.rows?.map((row: any) => row.id) || [];
  const allVisibleSelected = visibleRowIds.length > 0 && visibleRowIds.every((id: number) => selectedRowIds.has(id));

  const toggleRow = (id: number) => {
    setSelectedRowIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVisibleRows = () => {
    setSelectedRowIds((current) => {
      const next = new Set(current);
      visibleRowIds.forEach((id: number) => {
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const handleAssignRows = (event: React.FormEvent) => {
    event.preventDefault();
    if (!database || !targetStaffId || selectedRowIds.size === 0) return;
    assignRows.mutate({
      databaseId: database.id,
      rowIds: Array.from(selectedRowIds),
      staffId: targetStaffId,
    }, {
      onSuccess: () => {
        setSelectedRowIds(new Set());
        setTargetStaffId(0);
      },
    });
  };

  const handleUnassignRows = () => {
    if (!database || selectedRowIds.size === 0) return;
    if (!window.confirm(`선택한 ${selectedRowIds.size.toLocaleString()}건의 배정을 취소할까요?`)) return;
    unassignRows.mutate({
      databaseId: database.id,
      rowIds: Array.from(selectedRowIds),
    }, {
      onSuccess: () => {
        setSelectedRowIds(new Set());
        setTargetStaffId(0);
      },
    });
  };

  const openRowNote = (row: any) => {
    setEditingRow(row);
    setRowNoteContent(row.notes || '');
  };

  const handleSaveRowNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!database || !editingRow) return;
    updateRowNote.mutate({
      databaseId: database.id,
      rowId: editingRow.id,
      content: rowNoteContent,
    }, {
      onSuccess: () => {
        setEditingRow(null);
        setRowNoteContent('');
      },
    });
  };

  return (
    <Modal title={database ? `${database.name} 데이터` : '분석 DB 데이터'} isOpen={Boolean(database)} onClose={onClose} size="xl">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--ad-muted)]">등록 데이터</p>
              <p className="text-xl font-bold text-white">{Number(data?.pagination?.total ?? database?.entryCount ?? 0).toLocaleString()}건</p>
              {data?.assignmentSummary && (
                <p className="mt-1 text-xs text-[var(--ad-muted)]">
                  배정 {Number(data.assignmentSummary.assigned).toLocaleString()}건 · 미배정 {Number(data.assignmentSummary.unassigned).toLocaleString()}건
                </p>
              )}
          </div>
          <form className="flex gap-2 w-full sm:max-w-md" onSubmit={handleSearch}>
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="이름, 전화번호, 날짜 검색"
            />
            <Button type="submit" variant="secondary" className="gap-2 shrink-0">
              <Search size={15} /> 검색
            </Button>
          </form>
        </div>

        {canAssign && (
          <form onSubmit={handleAssignRows} className="rounded-lg border border-[var(--ad-gold)] bg-[var(--ad-gold-bg)] p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ad-muted)]">
                <CheckSquare size={15} className="text-[var(--ad-gold)]" />
                <strong className="text-white">{selectedRowIds.size.toLocaleString()}건 선택됨</strong>
                <span>· 페이지를 이동해도 선택이 유지됩니다.</span>
                <Button type="button" variant="outline" size="sm" onClick={toggleVisibleRows}>
                  {allVisibleSelected ? '현재 페이지 선택 해제' : `현재 페이지 ${visibleRowIds.length.toLocaleString()}건 전체 선택`}
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={targetStaffId} onChange={(event) => setTargetStaffId(Number(event.target.value))} className="min-w-40">
                  <option value={0}>담당 직원 선택</option>
                  {activeStaff.map((staff: any) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                </Select>
                <Button type="submit" className="shrink-0 gap-2" disabled={!targetStaffId || selectedRowIds.size === 0 || assignRows.isPending}>
                  {assignRows.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                  선택한 {selectedRowIds.size.toLocaleString()}건 배정
                </Button>
                <Button type="button" variant="danger" className="shrink-0 gap-2" disabled={selectedRowIds.size === 0 || unassignRows.isPending} onClick={handleUnassignRows}>
                  {unassignRows.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserMinus size={15} />}
                  선택 행 배정 취소
                </Button>
              </div>
            </div>
          </form>
        )}

        <section className="rounded-lg border border-[var(--ad-border)] bg-[var(--ad-bg)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquareText size={16} className="text-[var(--ad-gold)]" />
            <div>
              <h3 className="text-sm font-semibold text-white">분석 DB 메모</h3>
              <p className="text-xs text-[var(--ad-muted)]">고객에게 노출되지 않는 내부 기록입니다.</p>
            </div>
          </div>
          <div className="mb-3 space-y-2">
            {notesLoading ? (
              <div className="flex justify-center py-3"><Loader2 size={16} className="animate-spin text-[var(--ad-muted)]" /></div>
            ) : notes?.length ? (
              notes.map((note: any) => (
                <div key={note.id} className="rounded-md border border-[var(--ad-border)] bg-[var(--ad-panel)] p-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[var(--ad-gold)]">{note.staffName || '관리자'}</span>
                    <span className="text-[10px] text-[var(--ad-muted)]">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#E2E8F0]">{note.content}</p>
                </div>
              ))
            ) : (
              <p className="py-2 text-center text-xs text-[var(--ad-muted)]">아직 작성된 상담 메모가 없습니다.</p>
            )}
          </div>
          <form onSubmit={handleAddNote} className="relative">
            <Textarea
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              placeholder="통화 후 고객 성향과 상담 내용을 기록해주세요."
              maxLength={3000}
              className="min-h-[74px] pr-12"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute bottom-2 right-2 h-8 w-8 rounded-md p-0"
              disabled={createNote.isPending || !noteContent.trim()}
              aria-label="상담 메모 저장"
            >
              {createNote.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </Button>
          </form>
          {createNote.isError && <p className="mt-2 text-xs text-[#F85149]">{createNote.error instanceof Error ? createNote.error.message : '메모 저장에 실패했습니다.'}</p>}
        </section>

        {editingRow && (
          <section className="rounded-lg border border-[var(--ad-gold)] bg-[var(--ad-gold-bg)] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">행별 메모 · {editingRow.memberName}</h3>
                <p className="mt-1 text-xs text-[var(--ad-muted)]">{editingRow.phone} · 해당 데이터 행에만 저장되는 내부 메모입니다.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingRow(null)}>닫기</Button>
            </div>
            <form onSubmit={handleSaveRowNote} className="space-y-3">
              <Textarea
                value={rowNoteContent}
                onChange={(event) => setRowNoteContent(event.target.value)}
                placeholder="이 고객 행의 상담 내용, 성향, 후속 조치 등을 기록하세요."
                maxLength={3000}
                className="min-h-[110px]"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-[var(--ad-muted)]">{rowNoteContent.length.toLocaleString()} / 3,000자</span>
                <Button type="submit" size="sm" className="gap-2" disabled={updateRowNote.isPending}>
                  {updateRowNote.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  행 메모 저장
                </Button>
              </div>
            </form>
          </section>
        )}

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>
        ) : error ? (
          <div className="rounded-lg border border-[var(--ad-danger)] bg-[#3B1A1A] p-4 text-sm text-[#FFB4AE]">
            {error.message}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                {canAssign && (
                  <Th>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisibleRows}
                      className="accent-[var(--ad-gold)]"
                      aria-label="현재 페이지 전체 선택"
                    />
                  </Th>
                )}
                <Th>번호</Th>
                <Th>전화번호</Th>
                <Th>이름</Th>
                <Th>금액</Th>
                <Th>날짜</Th>
                <Th>담당자</Th>
                <Th>행 메모</Th>
              </tr>
            </thead>
            <tbody>
              {data?.rows?.map((row: any, index: number) => (
                <tr key={row.id} className="hover:bg-[var(--ad-panel-hover)]">
                  {canAssign && (
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedRowIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="accent-[var(--ad-gold)] bg-transparent border-[var(--ad-border)]"
                        aria-label={`${row.memberName} 데이터 선택`}
                      />
                    </Td>
                  )}
                  <Td className="text-[var(--ad-muted)]">{(page - 1) * 50 + index + 1}</Td>
                  <Td className="font-mono">{row.phone}</Td>
                  <Td className="font-semibold text-white">{row.memberName}</Td>
                  <Td>₩{Number(row.amount).toLocaleString()}</Td>
                  <Td>{row.recordedDate}</Td>
                  <Td>{row.assignedStaffName || <span className="text-[var(--ad-muted)]">미배정</span>}</Td>
                  <Td>
                    <Button
                      type="button"
                      variant={row.notes ? 'secondary' : 'ghost'}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openRowNote(row)}
                    >
                      <MessageSquareText size={14} />
                      {row.notes ? '메모 있음' : '메모'}
                    </Button>
                  </Td>
                </tr>
              ))}
              {data?.rows?.length === 0 && (
                <tr>
                  <Td colSpan={canAssign ? 8 : 7} className="text-center py-10 text-[var(--ad-muted)]">
                    {search ? '검색 결과가 없습니다.' : '등록된 데이터가 없습니다.'}
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        )}

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--ad-muted)]">
              {data.pagination.page} / {data.pagination.totalPages} 페이지
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft size={15} /> 이전
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((current) => Math.min(data.pagination.totalPages, current + 1))}
              >
                다음 <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}