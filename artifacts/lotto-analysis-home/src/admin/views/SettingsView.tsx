import { useState } from 'react';
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { useUpdateAdminProfile } from '../api';
import { Button, Card, Input, Label } from '../components/UI';

export default function SettingsView({ user }: { user: { name: string; email: string; role: string } }) {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const updateProfile = useUpdateAdminProfile();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    updateProfile.mutate(
      { name, ...(password ? { password } : {}) },
      { onSuccess: () => setPassword('') },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">설정</h1>
        <p className="text-[var(--ad-muted)] text-sm">운영 계정과 보안 정보를 관리합니다.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 grid place-items-center rounded-md bg-[var(--ad-gold-bg)] text-[var(--ad-gold)]"><UserRound size={19} /></span>
            <div>
              <h2 className="font-bold text-white">관리자 계정</h2>
              <p className="text-xs text-[var(--ad-muted)]">{user.email}</p>
            </div>
          </div>
          <form className="space-y-5" onSubmit={submit}>
            <div>
              <Label>표시 이름</Label>
              <Input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <Label>새 비밀번호</Label>
              <Input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="변경하지 않으려면 비워두세요"
              />
              <p className="mt-2 text-xs text-[var(--ad-muted)]">8자 이상 입력하면 즉시 새 비밀번호로 변경됩니다.</p>
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>계정 설정 저장</Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-[var(--ad-gold)] mb-3"><ShieldCheck size={18} /><strong className="text-sm">현재 권한</strong></div>
            <p className="text-2xl font-bold text-white">{user.role === 'owner' ? '최고 관리자' : '운영 직원'}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--ad-muted)]">
              {user.role === 'owner' ? '직원 계정과 회원 등급을 포함한 모든 운영 기능을 관리할 수 있습니다.' : '배정된 회원과 문의, 분석 DB를 관리할 수 있습니다.'}
            </p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-[var(--ad-info)] mb-3"><KeyRound size={18} /><strong className="text-sm">세션 보안</strong></div>
            <p className="text-sm text-white">보안 쿠키 로그인 사용 중</p>
            <p className="mt-2 text-xs leading-5 text-[var(--ad-muted)]">세션은 서버에 저장되며 7일 후 자동 만료됩니다. 공용 기기에서는 반드시 로그아웃하세요.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}