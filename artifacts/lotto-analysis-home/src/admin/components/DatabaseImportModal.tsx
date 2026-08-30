import { useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import {
  type DatabaseImportPreview,
  type DatabaseImportResult,
  useImportDatabase,
  usePreviewDatabaseImport,
} from '../api';
import { Button, Input, Label, Modal, Select, Textarea } from './UI';

type MappingField = 'phone' | 'name' | 'amount' | 'date';

const mappingFields: Array<{ key: MappingField; label: string }> = [
  { key: 'phone', label: '전화번호' },
  { key: 'name', label: '이름' },
  { key: 'amount', label: '금액' },
  { key: 'date', label: '날짜' },
];

const emptyMapping: Record<MappingField, number> = {
  phone: -1,
  name: -1,
  amount: -1,
  date: -1,
};

export default function DatabaseImportModal({
  isOpen,
  onClose,
  databases,
}: {
  isOpen: boolean;
  onClose: () => void;
  databases: any[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewMutation = usePreviewDatabaseImport();
  const importMutation = useImportDatabase();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DatabaseImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<MappingField, number>>(emptyMapping);
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new');
  const [targetDatabaseId, setTargetDatabaseId] = useState(0);
  const [name, setName] = useState('');
  const [drawNumber, setDrawNumber] = useState('');
  const [price, setPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<DatabaseImportResult | null>(null);

  const mappingValues = Object.values(mapping);
  const mappingReady = mappingValues.every((value) => value >= 0)
    && new Set(mappingValues).size === mappingValues.length;
  const selectedHeaders = useMemo(
    () => mappingFields.map((field) => preview?.headers[mapping[field.key]] ?? '-'),
    [mapping, preview],
  );
  const targetDatabase = databases.find((database) => database.id === targetDatabaseId);
  const targetReady = targetMode === 'new' ? Boolean(name.trim()) : Boolean(targetDatabase);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setMapping(emptyMapping);
    setTargetMode('new');
    setTargetDatabaseId(0);
    setName('');
    setDrawNumber('');
    setPrice(0);
    setNotes('');
    setResult(null);
    previewMutation.reset();
    importMutation.reset();
    if (inputRef.current) inputRef.current.value = '';
  };

  const close = () => {
    if (importMutation.isPending) return;
    reset();
    onClose();
  };

  const handleFile = (nextFile: File | undefined) => {
    if (!nextFile) return;
    setFile(nextFile);
    setPreview(null);
    setResult(null);
    setName(nextFile.name.replace(/\.(xlsx|xls)$/i, ''));
    previewMutation.mutate(nextFile, {
      onSuccess: (data) => {
        setPreview(data);
        setMapping({
          phone: data.suggestedMapping.phone ?? -1,
          name: data.suggestedMapping.name ?? -1,
          amount: data.suggestedMapping.amount ?? -1,
          date: data.suggestedMapping.date ?? -1,
        });
      },
    });
  };

  const handleImport = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !preview || !mappingReady || !targetReady) return;
    importMutation.mutate({
      file,
      databaseId: targetMode === 'existing' ? targetDatabaseId : undefined,
      name: targetMode === 'existing' ? targetDatabase.name : name.trim(),
      drawNumber: targetMode === 'existing' ? '' : drawNumber,
      price: targetMode === 'existing' ? Number(targetDatabase.price || 0) : price,
      notes: targetMode === 'existing' ? '' : notes,
      mapping,
    }, {
      onSuccess: setResult,
    });
  };

  return (
    <Modal title="엑셀 분석 DB 등록" isOpen={isOpen} onClose={close} size="xl">
      <div className="space-y-5">
        {!preview && !previewMutation.isPending && (
          <button
            type="button"
            className="w-full min-h-48 border-2 border-dashed border-[var(--ad-border)] rounded-xl flex flex-col items-center justify-center gap-3 text-[var(--ad-muted)] hover:border-[var(--ad-gold)] hover:text-white transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <span className="w-12 h-12 rounded-full bg-[var(--ad-gold-bg)] text-[var(--ad-gold)] flex items-center justify-center">
              <Upload size={22} />
            </span>
            <span className="font-semibold">엑셀 파일을 선택하세요</span>
            <span className="text-xs">xlsx 또는 xls · 최대 25MB · 첫 번째 시트를 읽습니다.</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        {previewMutation.isPending && (
          <div className="min-h-48 flex flex-col items-center justify-center gap-3 text-[var(--ad-muted)]">
            <Loader2 className="animate-spin text-[var(--ad-gold)]" size={28} />
            <p>엑셀 파일을 분석하고 있습니다.</p>
          </div>
        )}

        {previewMutation.error && (
          <div className="rounded-lg border border-[var(--ad-danger)] bg-[#3B1A1A] p-4 text-sm text-[#FFB4AE] flex gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{previewMutation.error.message}</span>
          </div>
        )}

        {preview && !result && (
          <form className="space-y-5" onSubmit={handleImport}>
            <div className="rounded-lg border border-[var(--ad-border)] bg-[#0B0E14] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet className="text-[var(--ad-gold)] shrink-0" size={24} />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{preview.fileName}</p>
                  <p className="text-xs text-[var(--ad-muted)]">{preview.sheetName} · 총 {preview.totalRows.toLocaleString()}행</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                파일 변경
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>등록 방식 *</Label>
                <Select
                  value={targetMode}
                  onChange={(event) => {
                    const mode = event.target.value as 'new' | 'existing';
                    setTargetMode(mode);
                    if (mode === 'existing' && !targetDatabaseId) setTargetDatabaseId(databases[0]?.id || 0);
                  }}
                >
                  <option value="new">새 분석 DB 생성</option>
                  <option value="existing" disabled={databases.length === 0}>기존 분석 DB에 추가</option>
                </Select>
              </div>
              {targetMode === 'existing' ? (
                <div>
                  <Label>기존 분석 DB *</Label>
                  <Select value={targetDatabaseId} onChange={(event) => setTargetDatabaseId(Number(event.target.value))}>
                    <option value={0} disabled>분석 DB 선택</option>
                    {databases.map((database) => (
                      <option key={database.id} value={database.id}>
                        {database.name} ({Number(database.entryCount || 0).toLocaleString()}건)
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>DB 식별자 (이름) *</Label>
                  <Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 2024 당첨 고객 DB" />
                </div>
              )}
            </div>

            {targetMode === 'new' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>관련 회차</Label>
                  <Input type="number" min={1} value={drawNumber} onChange={(event) => setDrawNumber(event.target.value)} placeholder="선택 입력" />
                </div>
                <div>
                  <Label>기대 단가</Label>
                  <Input type="number" min={0} value={price} onChange={(event) => setPrice(Number(event.target.value))} />
                </div>
              </div>
                <div>
                  <Label>설명/메모</Label>
                  <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="업로드 데이터에 대한 메모를 입력하세요." />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">컬럼 연결</h3>
                  <p className="text-xs text-[var(--ad-muted)] mt-1">각 항목에 해당하는 엑셀 컬럼을 선택하세요.</p>
                </div>
                {!mappingReady && (
                  <span className="text-xs text-[var(--ad-warning)]">서로 다른 컬럼을 모두 선택해야 합니다.</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {mappingFields.map((field) => (
                  <div key={field.key}>
                    <Label>{field.label} *</Label>
                    <Select
                      value={mapping[field.key]}
                      onChange={(event) => setMapping((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
                    >
                      <option value={-1}>컬럼 선택</option>
                      {preview.headers.map((header, index) => (
                        <option key={`${header}-${index}`} value={index}>{header}</option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">미리보기</h3>
              <div className="overflow-x-auto border border-[var(--ad-border)] rounded-lg">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr>
                      {mappingFields.map((field, index) => (
                        <th key={field.key} className="px-3 py-2.5 bg-[#0B0E14] text-[var(--ad-muted)] text-xs border-b border-[var(--ad-border)]">
                          {field.label}<span className="block text-[10px] font-normal mt-0.5">{selectedHeaders[index]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {mappingFields.map((field) => (
                          <td key={field.key} className="px-3 py-2.5 text-[#E2E8F0] border-b border-[var(--ad-border)]">
                            {mapping[field.key] >= 0 ? row[mapping[field.key]] || '-' : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {importMutation.error && (
              <div className="rounded-lg border border-[var(--ad-danger)] bg-[#3B1A1A] p-4 text-sm text-[#FFB4AE] flex gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{importMutation.error.message}</span>
              </div>
            )}

            {importMutation.isPending && (
              <div className="rounded-lg border border-[var(--ad-border)] bg-[#0B0E14] p-4 flex items-center gap-3 text-sm text-[var(--ad-muted)]">
                <Loader2 className="animate-spin text-[var(--ad-gold)]" size={20} />
                <span>{preview.totalRows.toLocaleString()}건을 검증하고 500건씩 나누어 등록하고 있습니다.</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close} disabled={importMutation.isPending}>취소</Button>
              <Button type="submit" className="gap-2" disabled={!mappingReady || !targetReady || importMutation.isPending}>
                {importMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {preview.totalRows.toLocaleString()}건 등록 시작
              </Button>
            </div>
          </form>
        )}

        {result && (
          <div className="space-y-5">
            <div className="text-center py-2">
              <CheckCircle2 className="mx-auto text-[var(--ad-success)] mb-3" size={42} />
              <h3 className="text-xl font-bold text-white">엑셀 등록이 완료되었습니다.</h3>
              <p className="text-sm text-[var(--ad-muted)] mt-1">{result.database.name}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['전체 행', result.totalRows],
                ['등록 완료', result.importedCount],
                ['중복 제외', result.duplicateCount],
                ['오류 제외', result.invalidCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[var(--ad-border)] bg-[#0B0E14] p-4">
                  <p className="text-xs text-[var(--ad-muted)]">{label}</p>
                  <p className="text-xl font-bold text-white mt-1">{Number(value).toLocaleString()}건</p>
                </div>
              ))}
            </div>
            {result.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-2">오류 행</h3>
                <div className="max-h-48 overflow-y-auto admin-scrollbar border border-[var(--ad-border)] rounded-lg">
                  {result.errors.map((error) => (
                    <div key={`${error.row}-${error.message}`} className="px-3 py-2 text-xs border-b border-[var(--ad-border)] text-[#FFB4AE]">
                      {error.row}행 · {error.message}
                    </div>
                  ))}
                </div>
                {result.errorCount > result.errors.length && (
                  <p className="text-xs text-[var(--ad-muted)] mt-2">오류는 처음 {result.errors.length}건만 표시됩니다.</p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={reset}>다른 파일 등록</Button>
              <Button type="button" onClick={close}>완료</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}