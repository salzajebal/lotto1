import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { useDatabaseRows } from '../api';
import { Button, Input, Modal, Table, Td, Th } from './UI';

export default function DatabaseRowsModal({
  database,
  onClose,
}: {
  database: any | null;
  onClose: () => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useDatabaseRows(database?.id ?? null, { search, page, limit: 50 });

  useEffect(() => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  }, [database?.id]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <Modal title={database ? `${database.name} 데이터` : '분석 DB 데이터'} isOpen={Boolean(database)} onClose={onClose} size="xl">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--ad-muted)]">등록 데이터</p>
            <p className="text-xl font-bold text-white">{Number(data?.pagination?.total ?? database?.entryCount ?? 0).toLocaleString()}건</p>
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
                <Th>번호</Th>
                <Th>전화번호</Th>
                <Th>이름</Th>
                <Th>금액</Th>
                <Th>날짜</Th>
              </tr>
            </thead>
            <tbody>
              {data?.rows?.map((row: any, index: number) => (
                <tr key={row.id} className="hover:bg-[var(--ad-panel-hover)]">
                  <Td className="text-[var(--ad-muted)]">{(page - 1) * 50 + index + 1}</Td>
                  <Td className="font-mono">{row.phone}</Td>
                  <Td className="font-semibold text-white">{row.memberName}</Td>
                  <Td>₩{Number(row.amount).toLocaleString()}</Td>
                  <Td>{row.recordedDate}</Td>
                </tr>
              ))}
              {data?.rows?.length === 0 && (
                <tr>
                  <Td colSpan={5} className="text-center py-10 text-[var(--ad-muted)]">
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