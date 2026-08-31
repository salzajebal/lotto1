import { useState } from 'react';
import {
  useCommunityPosts,
  useCreateCommunityPost,
  useUpdateCommunityPost,
  useDeleteCommunityPost,
  useSeedCommunityPosts,
} from '../api';
import { Table, Th, Td, Badge, Button, Input, Select, Modal, Label, Textarea } from '../components/UI';
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react';

const emptyForm = {
  authorName: '',
  category: '번호 흐름',
  title: '',
  content: '',
  replyCount: 0,
  status: 'pending',
};

export default function CommunityView() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCommunityPosts(page);
  const posts = data?.items || [];
  const pagination = data?.pagination;
  const createPost = useCreateCommunityPost();
  const updatePost = useUpdateCommunityPost();
  const deletePost = useDeleteCommunityPost();
  const seedPosts = useSeedCommunityPosts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openModal = (post?: any) => {
    if (post) {
      setEditingId(post.id);
      setForm({
        authorName: post.authorName,
        category: post.category,
        title: post.title,
        content: post.content,
        replyCount: post.replyCount || 0,
        status: post.status,
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...form, replyCount: Number(form.replyCount) };
    if (editingId) {
      updatePost.mutate({ id: editingId, data: payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createPost.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = (post: any) => {
    if (!window.confirm(`‘${post.title}’ 게시글을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.`)) return;
    deletePost.mutate(post.id);
  };

  const handleSeed = () => {
    if (!window.confirm('2023년 1월부터 2026년 8월까지의 초기 게시글 110개를 등록하시겠습니까? 기존 게시글이 하나라도 있으면 추가하지 않습니다.')) return;
    seedPosts.mutate();
  };

  const statusBadge = (status: string) => {
    if (status === 'published') return <Badge variant="success">게시됨</Badge>;
    if (status === 'rejected') return <Badge variant="danger">숨김</Badge>;
    return <Badge variant="warning">검토 대기</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">커뮤니티 관리</h1>
          <p className="text-[var(--ad-muted)] text-sm">고객이 제출한 게시글을 검토하고 공개 여부를 관리합니다.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={seedPosts.isPending}>
            {seedPosts.isPending ? '등록 중...' : '초기 게시글 110개 등록'}
          </Button>
          <Button onClick={() => openModal()} className="gap-2"><Plus size={16} /> 게시글 직접 등록</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--ad-gold)]" /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>분류</Th>
              <Th>제목</Th>
              <Th>작성자</Th>
              <Th>답글</Th>
              <Th>게시 상태</Th>
              <Th>등록일</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {posts?.map((post: any) => (
              <tr key={post.id} className="hover:bg-[var(--ad-panel-hover)] transition-colors">
                <Td><Badge variant="info">{post.category}</Badge></Td>
                <Td className="max-w-[300px] truncate font-semibold text-white">{post.title}</Td>
                <Td>{post.authorName}</Td>
                <Td>{post.replyCount || 0}</Td>
                <Td>{statusBadge(post.status)}</Td>
                <Td><span className="text-[var(--ad-muted)]">{new Date(post.createdAt).toLocaleDateString()}</span></Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="게시글 수정" onClick={() => openModal(post)}><Edit2 size={14} /></Button>
                    <Button variant="ghost" size="sm" aria-label="게시글 삭제" disabled={deletePost.isPending} onClick={() => handleDelete(post)}><Trash2 size={14} /></Button>
                  </div>
                </Td>
              </tr>
            ))}
            {posts?.length === 0 && (
              <tr><Td colSpan={7} className="text-center py-8 text-[var(--ad-muted)]">등록된 커뮤니티 게시글이 없습니다.</Td></tr>
            )}
          </tbody>
        </Table>
      )}

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--ad-border)] bg-[var(--ad-panel)] px-4 py-3">
          <p className="text-xs text-[var(--ad-muted)]">총 {pagination.total.toLocaleString()}개 · {pagination.page} / {pagination.totalPages} 페이지</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>이전</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}>다음</Button>
          </div>
        </div>
      )}

      <Modal title={editingId ? '커뮤니티 게시글 수정' : '커뮤니티 게시글 등록'} isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>작성자 표시명 *</Label>
              <Input required value={form.authorName} onChange={(event) => setForm({ ...form, authorName: event.target.value })} />
            </div>
            <div>
              <Label>게시 상태</Label>
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="pending">검토 대기</option>
                <option value="published">홈페이지에 게시</option>
                <option value="rejected">숨김</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>분류 *</Label>
              <Input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </div>
            <div>
              <Label>답글 수</Label>
              <Input type="number" min="0" value={form.replyCount} onChange={(event) => setForm({ ...form, replyCount: Number(event.target.value) })} />
            </div>
          </div>
          <div>
            <Label>제목 *</Label>
            <Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div>
            <Label>내용 *</Label>
            <Textarea required className="min-h-[150px]" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>취소</Button>
            <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>저장</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}