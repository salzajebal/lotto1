import React, { useState } from 'react';
import {
  ArrowUpRight, BarChart3, Bell, CalendarDays, ChevronRight, CircleHelp,
  Clock3, FileText, Headphones, Menu, MessageCircle, ShieldCheck,
  Trophy, Users, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './PortalUnified.css';

type Notice = { text: string } | null;

const wins = [
  { round: '1,184회', rank: '3등', amount: '1,584,725원', place: '서울 서초구', date: '2024.08.24', numbers: ['03', '08', '14', '23', '33', '45'] },
  { round: '1,183회', rank: '2등', amount: '54,201,110원', place: '경기 용인시', date: '2024.08.17', numbers: ['07', '12', '18', '29', '34', '42'] },
  { round: '1,181회', rank: '3등', amount: '1,420,900원', place: '부산 수영구', date: '2024.08.03', numbers: ['11', '15', '22', '31', '38', '40'] },
];

const posts = [
  { tag: '당첨 후기', title: '1184회 3등, 문자 받고도 한참을 다시 봤어요', author: '행운의기록', time: '오늘 09:42', replies: 18 },
  { tag: '번호 토론', title: '이번 주 홀짝 비율은 어떻게 보고 계신가요?', author: '숫자읽는밤', time: '어제 21:08', replies: 12 },
  { tag: '자유 이야기', title: '지난주 결과 복기하고 다음 조합을 준비합니다', author: 'blue45', time: '08.26', replies: 7 },
  { tag: '분석 질문', title: '간격이 긴 번호를 고르는 기준이 궁금합니다', author: '소담한토요일', time: '08.25', replies: 23 },
];
const quickServices: [LucideIcon, string][] = [[FileText, '당첨 기록'], [BarChart3, '번호 분석실'], [Users, '커뮤니티'], [Trophy, '회원 혜택']];

function ActionButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return <button className={`portal-action ${className}`} onClick={onClick}>{children}</button>;
}

export function PortalUnified() {
  const [notice, setNotice] = useState<Notice>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'popular'>('recent');

  const flash = (text: string) => {
    setNotice({ text });
    window.setTimeout(() => setNotice(null), 2600);
  };

  return (
    <div className="portal-c">
      <div className="portal-utility">
        <div className="portal-wrap utility-inner">
          <span>로또리코 <b>실제 기록 아카이브</b></span>
          <div className="utility-links"><button onClick={() => flash('로그인 화면을 준비 중입니다.')}>로그인</button><i /> <button onClick={() => flash('회원가입 화면을 준비 중입니다.')}>회원가입</button><i /> <button onClick={() => flash('고객센터로 연결합니다.')}>고객센터</button></div>
        </div>
      </div>
      <header className="portal-header">
        <div className="portal-wrap header-inner">
          <button className="portal-logo" onClick={() => flash('로또리코 홈입니다.')}>
            <span className="logo-mark"><span>R</span></span><span><strong>LOTTORICO</strong><small>로또 분석 번호</small></span>
          </button>
          <nav className={menuOpen ? 'portal-nav open' : 'portal-nav'}>
            <button className="active" onClick={() => flash('현재 페이지입니다.')}>홈</button>
            <button onClick={() => flash('실제 당첨 기록으로 이동합니다.')}>실제 당첨</button>
            <button onClick={() => flash('분석실로 이동합니다.')}>로또리코 분석실</button>
            <button onClick={() => flash('커뮤니티로 이동합니다.')}>로또 커뮤니티</button>
            <button onClick={() => flash('고객센터로 이동합니다.')}>고객센터</button>
            <button className="join" onClick={() => flash('골드회원 안내를 준비 중입니다.')}>골드회원 가입</button>
          </nav>
          <button className="mobile-toggle" aria-label="메뉴" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </header>
      <div className="portal-status">
        <div className="portal-wrap status-inner">
          <div className="crumb"><span>HOME</span><ChevronRight size={13} /><b>로또리코 정보센터</b></div>
          <div className="status-live"><span /> 매주 토요일 업데이트 <b>·</b> 1,184회 결과 반영</div>
        </div>
      </div>

      <main className="portal-wrap portal-main">
        <section className="portal-intro">
          <div>
            <p className="section-kicker"><span /> LOTTORICO INFORMATION CENTER</p>
            <h1>당첨의 순간부터<br /><em>다음 회차의 기준</em>까지</h1>
            <p className="intro-copy">실제 당첨 기록과 회원들의 이야기를 한 곳에서 확인하세요.<br className="desktop-only" /> 로또리코는 결과를 남기고, 매주 같은 기준으로 숫자를 읽습니다.</p>
          </div>
          <div className="round-panel">
            <div className="panel-label"><CalendarDays size={15} /> 최신 당첨 결과</div>
            <strong>1,184<span>회</span></strong>
            <div className="round-numbers">{['03', '08', '14', '23', '33', '45'].map((n) => <i key={n}>{n}</i>)}</div>
            <small>2024.08.24 추첨 · 보너스 19</small>
          </div>
        </section>

        <section className="portal-grid">
          <div className="portal-left">
            <div className="block-heading"><div><span className="section-kicker">WINNING ARCHIVE</span><h2>로또리코 <em>당첨자 후기</em></h2></div><ActionButton onClick={() => flash('전체 당첨 후기 목록입니다.')}>전체보기 <ChevronRight size={16} /></ActionButton></div>
            <div className="winner-table">
              <div className="table-head"><span>회차 / 추첨일</span><span>등수</span><span>당첨금</span><span>구매 지역</span><span /></div>
              {wins.map((win) => <button className="winner-row" key={win.round} onClick={() => flash(`${win.round} 당첨 기록을 확인합니다.`)}>
                <span><b>{win.round}</b><small>{win.date}</small></span><strong className={win.rank === '2등' ? 'silver' : ''}>{win.rank}</strong><span className="money">{win.amount}</span><span className="place">{win.place}</span><ChevronRight size={16} />
              </button>)}
            </div>

            <div className="mini-section-title"><h3>당첨 회원의 <em>생생한 한마디</em></h3><button onClick={() => flash('인터뷰 전체보기')}>인터뷰 더보기 <ArrowUpRight size={14} /></button></div>
            <div className="quote-row">
              <article><div className="quote-avatar">ㅎㄴ</div><div><b>“분석표를 보며 조합을 좁힌 게 큰 도움이 됐습니다.”</b><small>1184회 3등 · 행운의기록 회원</small></div></article>
              <article><div className="quote-avatar blue">ㅅㅈ</div><div><b>“결과가 좋지 않은 주에도 복기할 기준이 남아요.”</b><small>1181회 3등 · 숫자읽는밤 회원</small></div></article>
            </div>

            <div className="analysis-banner">
              <div><span className="banner-tag">GOLD MEMBERS ONLY</span><h3>이번 주 번호를 고르는<br /><em>세 가지 분석 기준</em></h3><p>빈도 · 간격 · 조합 밸런스</p></div>
              <BarChart3 size={70} strokeWidth={1} />
              <ActionButton onClick={() => flash('분석 기준 안내를 준비 중입니다.')}>분석 기준 알아보기 <ArrowUpRight size={15} /></ActionButton>
            </div>
          </div>

          <aside className="portal-right">
            <div className="quick-box">
              <div className="side-heading"><h3>빠른 서비스</h3><CircleHelp size={16} /></div>
              <div className="quick-grid">
                {quickServices.map(([Icon, label]) => <button key={label} onClick={() => flash(`${label} 메뉴를 선택했습니다.`)}><span><Icon size={19} /></span>{label}<ChevronRight size={13} /></button>)}
              </div>
            </div>
            <div className="hot-box">
              <div className="side-heading"><h3>이번 주 HOT 번호</h3><span className="hot-live">LIVE</span></div>
              <p>최근 출현 빈도가 높은 번호입니다.</p>
              <div className="hot-numbers">{['07', '12', '18', '27', '34', '41'].map((n, i) => <span key={n} className={`ball ball-${i % 4}`}>{n}</span>)}</div>
              <small>지난 20회 기준 · 참고용 통계</small>
            </div>
            <div className="kakao-box"><div className="kakao-icon"><MessageCircle size={22} /></div><div><b>궁금한 점은 카카오톡으로</b><small>회원가입부터 분석 서비스까지<br />상담원이 안내해드립니다.</small></div><button onClick={() => flash('카카오톡 상담 연결을 준비 중입니다.')}><Headphones size={16} /> 상담하기</button></div>
            <div className="membership-box"><span className="membership-ribbon">GOLD</span><p>로또리코 골드회원</p><strong>330,000<span>원</span></strong><small>매주 분석 번호 · 전용 리포트</small><button onClick={() => flash('멤버십 상세 안내를 준비 중입니다.')}>회원 혜택 보기 <ArrowUpRight size={14} /></button></div>
          </aside>
        </section>

        <section className="community-block">
          <div className="community-head"><div><span className="section-kicker">LOTTORICO COMMUNITY</span><h2>회원들과 나누는 <em>이번 주 이야기</em></h2></div><ActionButton onClick={() => flash('커뮤니티 전체보기')}>커뮤니티 바로가기 <ArrowUpRight size={15} /></ActionButton></div>
          <div className="community-tabs"><button className={activeTab === 'recent' ? 'selected' : ''} onClick={() => setActiveTab('recent')}>최신글</button><button className={activeTab === 'popular' ? 'selected' : ''} onClick={() => setActiveTab('popular')}>인기글</button><span>오늘도 438명의 회원이 이야기를 나누고 있습니다.</span></div>
          <div className="post-list">{posts.map((post, i) => <button className="post-row" key={post.title} onClick={() => flash(`${post.title} 게시글을 엽니다.`)}><span className={`post-index ${i === 0 ? 'hot' : ''}`}>{i === 0 ? 'HOT' : String(i + 1).padStart(2, '0')}</span><span className="post-copy"><b>{post.title}</b><small><em>{post.tag}</em> {post.author} · {post.time}</small></span><span className="reply"><MessageCircle size={14} /> {post.replies}</span><ChevronRight size={15} /></button>)}</div>
        </section>

        <section className="trust-strip">
          <div className="trust-badge"><img src="/__mockup/images/customer-satisfaction-no-bg.png" alt="한국고객만족도 1위 관련 배지" /><span>한국고객만족도<br /><b>1위 표기 배지</b><small>참고용 표기</small></span></div>
          <div className="trust-item"><ShieldCheck size={25} /><b>투명한 기록 관리</b><small>공개 전 관리자 검토</small></div><div className="trust-item"><Trophy size={25} /><b>회원 경험 중심</b><small>실제 후기와 결과 공유</small></div><div className="trust-item"><Clock3 size={25} /><b>매주 업데이트</b><small>토요일 추첨 후 반영</small></div>
        </section>
      </main>
      <footer className="portal-footer"><div className="portal-wrap footer-inner"><div><b>로또리코</b><p>실제 기록과 읽기 쉬운 분석으로<br />다음 회차를 준비합니다.</p></div><div className="footer-company"><span>로또리코 정보센터</span><span>대표자 : 로또리코 운영팀　사업자 정보 확인</span><span>고객센터 : 카카오톡 채널 상담</span></div><div className="footer-bottom">이용약관　 개인정보처리방침　 청소년보호정책 <small>© 2024 로또리코. ALL RIGHTS RESERVED.</small></div></div></footer>
      {notice && <div className="portal-toast"><Bell size={16} /> {notice.text}</div>}
    </div>
  );
}

export default PortalUnified;