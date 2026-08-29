import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const API_BASE = '/api/admin';

export const fetcher = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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

export function useDashboard() {
  return useQuery({ queryKey: ['adminDashboard'], queryFn: () => fetcher(`${API_BASE}/dashboard`) });
}

export function useMembers(params?: { search?: string, status?: string, gradeId?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  if (params?.gradeId) qs.set('gradeId', String(params.gradeId));
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminStaff'] })
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

export function useDatabases() {
  return useQuery({ queryKey: ['adminDatabases'], queryFn: () => fetcher(`${API_BASE}/databases`) });
}

export function useCreateDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetcher(`${API_BASE}/databases`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDatabases'] })
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

export function useInquiries(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  return useQuery({ queryKey: ['adminInquiries', params], queryFn: () => fetcher(`${API_BASE}/inquiries?${qs.toString()}`) });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminReviews'] })
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => fetcher(`${API_BASE}/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminReviews'] })
  });
}

export function useStats() {
  return useQuery({ queryKey: ['adminStats'], queryFn: () => fetcher(`${API_BASE}/stats`) });
}
