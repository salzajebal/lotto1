import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const API_BASE = '/api/admin';

export const fetcher = async (url: string, options?: RequestInit) => {
  const headers = new Headers(options?.headers);
  if (!(options?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'API Error');
  }
  return res.json();
};

export function useAdminAuth() {
  return useQuery({
    queryKey: ['adminAuthStatus'],
    queryFn: () => fetcher(`${API_BASE}/auth/status`),
    retry: false,
  });
}

export function useAdminLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: any) => fetcher(`${API_BASE}/auth/login`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminAuthStatus'] }),
    onError: (err: any) => toast({ title: '로그인 실패', description: err.message, variant: 'destructive' })
  });
}

export function useAdminBootstrap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: any) => fetcher(`${API_BASE}/auth/bootstrap`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminAuthStatus'] }),
    onError: (err: any) => toast({ title: '계정 생성 실패', description: err.message, variant: 'destructive' })
  });
}

export function useAdminLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetcher(`${API_BASE}/auth/logout`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminAuthStatus'] })
  });
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { name?: string; password?: string }) => fetcher(`${API_BASE}/me`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAuthStatus'] });
      toast({ title: '설정 저장 완료', description: '관리자 계정 정보가 변경되었습니다.' });
    },
    onError: (err: Error) => toast({ title: '설정 저장 실패', description: err.message, variant: 'destructive' }),
  });
}

export function useAdminSiteSettings() {
  return useQuery({
    queryKey: ['adminSiteSettings'],
    queryFn: () => fetcher(`${API_BASE}/site-settings`),
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { kakaoChannelUrl: string; kakaoButtonLabel: string }) =>
      fetcher(`${API_BASE}/site-settings`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSiteSettings'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteSettings'] });
      toast({ title: '카카오톡 상담 설정 저장 완료', description: '공개 페이지의 상담 버튼에 즉시 반영됩니다.' });
    },
    onError: (err: Error) => toast({ title: '카카오톡 상담 설정 저장 실패', description: err.message, variant: 'destructive' }),
  });
}

export function useDashboard() {
  return useQuery({ queryKey: ['adminDashboard'], queryFn: () => fetcher(`${API_BASE}/dashboard`) });
}

export function useMembers(params?: { search?: string, status?: string, gradeId?: number; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  if (params?.gradeId) qs.set('gradeId', String(params.gradeId));
  if (params?.page) qs.set('page', String(params.page));
  return useQuery({ queryKey: ['adminMembers', params], queryFn: () => fetcher(`${API_BASE}/members?${qs.toString()}`) });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetcher(`${API_BASE}/members`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminMembers'] }); queryClient.invalidateQueries({ queryKey: ['adminDashboard'] }); }
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => fetcher(`${API_BASE}/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminMembers'] }); queryClient.invalidateQueries({ queryKey: ['adminDashboard'] }); }
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetcher(`${API_BASE}/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
}

export function useStaff() {
  return useQuery({ queryKey: ['adminStaff'], queryFn: () => fetcher(`${API_BASE}/staff`) });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetcher(`${API_BASE}/staff`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminStaff'] })
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => fetcher(`${API_BASE}/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStaff'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuthStatus'] });
    }
  });
}

export function useGrades() {
  return useQuery({ queryKey: ['adminGrades'], queryFn: () => fetcher(`${API_BASE}/grades`) });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetcher(`${API_BASE}/grades`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminGrades'] })
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => fetcher(`${API_BASE}/grades/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminGrades'] })
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetcher(`${API_BASE}/grades/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminGrades'] })
  });
}

export function useDatabases(page = 1) {
  return useQuery({ queryKey: ['adminDatabases', page], queryFn: () => fetcher(`${API_BASE}/databases?page=${page}`) });
}

export function useCreateDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetcher(`${API_BASE}/databases`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDatabases'] })
  });
}

export type DatabaseImportPreview = {
  fileName: string;
  sheetName: string;
  totalRows: number;
  headers: string[];
  suggestedMapping: Partial<Record<'phone' | 'name' | 'amount' | 'date', number>>;
  sampleRows: string[][];
};

export type DatabaseImportResult = {
  database: any;
  fileName: string;
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
};

export function usePreviewDatabaseImport() {
  return useMutation({
    mutationFn: (file: File) => {
      const data = new FormData();
      data.append('file', file);
      return fetcher(`${API_BASE}/databases/import/preview`, { method: 'POST', body: data }) as Promise<DatabaseImportPreview>;
    },
  });
}

export function useImportDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      file: File;
      databaseId?: number;
      name: string;
      drawNumber?: string;
      price?: number;
      notes?: string;
      mapping: Record<'phone' | 'name' | 'amount' | 'date', number>;
    }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.databaseId) formData.append('databaseId', String(data.databaseId));
      formData.append('name', data.name);
      formData.append('drawNumber', data.drawNumber || '');
      formData.append('price', String(data.price || 0));
      formData.append('notes', data.notes || '');
      formData.append('mapping', JSON.stringify(data.mapping));
      return fetcher(`${API_BASE}/databases/import`, { method: 'POST', body: formData }) as Promise<DatabaseImportResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDatabases'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
}

export function useDatabaseRows(databaseId: number | null, params?: { search?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return useQuery({
    queryKey: ['adminDatabaseRows', databaseId, params],
    queryFn: () => fetcher(`${API_BASE}/databases/${databaseId}/rows?${qs.toString()}`),
    enabled: databaseId != null,
  });
}

export function useAssignDatabaseRows() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ databaseId, rowIds, staffId }: { databaseId: number; rowIds: number[]; staffId: number }) =>
      fetcher(`${API_BASE}/databases/${databaseId}/rows/assign`, {
        method: 'POST',
        body: JSON.stringify({ rowIds, staffId }),
      }),
    onSuccess: (result: { assignedCount: number }, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminDatabaseRows', variables.databaseId] });
      queryClient.invalidateQueries({ queryKey: ['adminDatabases'] });
      toast({ title: '데이터 행 배정 완료', description: `${result.assignedCount.toLocaleString()}건을 직원에게 배정했습니다.` });
    },
    onError: (err: Error) => toast({ title: '데이터 행 배정 실패', description: err.message, variant: 'destructive' }),
  });
}

export function useDatabaseNotes(databaseId: number | null) {
  return useQuery({
    queryKey: ['adminDatabaseNotes', databaseId],
    queryFn: () => fetcher(`${API_BASE}/databases/${databaseId}/notes`),
    enabled: databaseId != null,
  });
}

export function useCreateDatabaseNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ databaseId, content }: { databaseId: number; content: string }) =>
      fetcher(`${API_BASE}/databases/${databaseId}/notes`, { method: 'POST', body: JSON.stringify({ content }) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminDatabaseNotes', variables.databaseId] });
      toast({ title: '상담 메모 저장 완료', description: '분석 DB에 내부 메모가 추가되었습니다.' });
    },
    onError: (err: Error) => toast({ title: '상담 메모 저장 실패', description: err.message, variant: 'destructive' }),
  });
}

export function useAssignDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, staffId }: { id: number, staffId: number }) => fetcher(`${API_BASE}/databases/${id}/assign`, { method: 'POST', body: JSON.stringify({ staffId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDatabases'] })
  });
}

export function useBulkAssignDatabases() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ databaseIds, staffId }: { databaseIds: number[], staffId: number }) => fetcher(`${API_BASE}/databases/bulk-assign`, { method: 'POST', body: JSON.stringify({ databaseIds, staffId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDatabases'] })
  });
}

export function useInquiries(params?: { status?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  return useQuery({ queryKey: ['adminInquiries', params], queryFn: () => fetcher(`${API_BASE}/inquiries?${qs.toString()}`) });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: {
      name: string;
      contact: string;
      category: string;
      subject: string;
      message: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
    }) => fetcher(`${API_BASE}/inquiries`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInquiries'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      toast({ title: '문의 등록 완료', description: '새 문의가 고객센터 목록에 등록되었습니다.' });
    },
    onError: (err: Error) => toast({ title: '문의 등록 실패', description: err.message, variant: 'destructive' }),
  });
}

export function useUpdateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => fetcher(`${API_BASE}/inquiries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminInquiries'] }); queryClient.invalidateQueries({ queryKey: ['adminDashboard'] }); }
  });
}

export function useInquiryNotes(inquiryId: number) {
  return useQuery({
    queryKey: ['adminInquiryNotes', inquiryId],
    queryFn: () => fetcher(`${API_BASE}/inquiries/${inquiryId}/notes`),
    enabled: !!inquiryId
  });
}

export function useCreateInquiryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inquiryId, content }: { inquiryId: number, content: string }) => fetcher(`${API_BASE}/inquiries/${inquiryId}/notes`, { method: 'POST', body: JSON.stringify({ content }) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminInquiryNotes', variables.inquiryId] });
      queryClient.invalidateQueries({ queryKey: ['adminInquiries'] });
    }
  });
}

export function useReviews() {
  return useQuery({ queryKey: ['adminReviews'], queryFn: () => fetcher(`${API_BASE}/reviews`) });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetcher(`${API_BASE}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['publishedReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    }
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => fetcher(`${API_BASE}/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['publishedReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    }
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => fetcher(`${API_BASE}/reviews/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['publishedReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      toast({ title: '후기 삭제 완료', description: '선택한 후기가 삭제되었습니다.' });
    },
    onError: (err: Error) => toast({ title: '후기 삭제 실패', description: err.message, variant: 'destructive' }),
  });
}

export function useCommunityPosts(page = 1) {
  return useQuery({
    queryKey: ['adminCommunityPosts', page],
    queryFn: () => fetcher(`${API_BASE}/community-posts?page=${page}`),
  });
}

export function useSeedCommunityPosts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => fetcher(`${API_BASE}/community-posts/seed`, { method: 'POST' }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['adminCommunityPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publishedCommunityPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      toast({ title: result.created > 0 ? '초기 게시글 등록 완료' : '등록할 게시글이 없습니다.', description: result.message });
    },
    onError: (err: Error) => toast({ title: '초기 게시글 등록 실패', description: err.message, variant: 'destructive' }),
  });
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetcher(`${API_BASE}/community-posts`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCommunityPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publishedCommunityPosts'] });
    },
  });
}

export function useUpdateCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => fetcher(`${API_BASE}/community-posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCommunityPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publishedCommunityPosts'] });
    },
  });
}

export function useDeleteCommunityPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => fetcher(`${API_BASE}/community-posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCommunityPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publishedCommunityPosts'] });
      toast({ title: '게시글 삭제 완료', description: '선택한 게시글이 삭제되었습니다.' });
    },
    onError: (err: Error) => toast({ title: '게시글 삭제 실패', description: err.message, variant: 'destructive' }),
  });
}

export function useStats() {
  return useQuery({ queryKey: ['adminStats'], queryFn: () => fetcher(`${API_BASE}/stats`) });
}
