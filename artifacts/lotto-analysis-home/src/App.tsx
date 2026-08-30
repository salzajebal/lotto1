import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  FlaskConical,
  Headphones,
  Landmark,
  Menu,
  MessageCircle,
  Trophy,
  Play,
  X,
} from 'lucide-react';
import lottoBallsBackground from '@assets/ChatGPT_Image_2026년_8월_29일_오전_03_28_36_1787999327234.png';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import AdminApp from '@/admin/AdminApp';

const queryClient = new QueryClient();

type ModalName = 'review' | 'support' | 'auth' | 'membership' | 'video' | null;

type PublicReview = {
  id: number;
  memberName: string;
  drawNumber: number;
  rank: string;
  amount: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type PublicCommunityPost = {
  id: number;
  authorName: string;
  category: string;
  title: string;
  content: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
};

async function fetchPublicData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('공개 콘텐츠를 불러오지 못했습니다.');
  return response.json();
}

function usePublishedReviews() {
  return useQuery({
    queryKey: ['publishedReviews'],
    queryFn: () => fetchPublicData<PublicReview[]>('/api/reviews'),
    staleTime: 15_000,
  });
}

function usePublishedCommunityPosts() {
  return useQuery({
    queryKey: ['publishedCommunityPosts'],
    queryFn: () => fetchPublicData<PublicCommunityPost[]>('/api/community-posts'),
    staleTime: 15_000,
  });
}

const formatAmount = (amount: number) => amount > 0 ? `당첨금 ${amount.toLocaleString('ko-KR')}원` : '당첨금액 비공개';
const formatDate = (date: string) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
const initials = (name: string) => name.trim().slice(0, 2).toUpperCase() || '회원';

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" aria-label="닫기" onClick={onClose}><X size={18} /></button>
        <h2 id="modal-title">{title}</h2>
        <p>{description}</p>
        {children}
      </section>
    </div>
  );
}

function Home() {
  const [modal, setModal] = useState<ModalName>(null);
  const [authMode, setAuthMode] = useState<'login' | 'join'>('login');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRoot = useRef<HTMLDivElement>(null);
  const { data: publishedReviews = [], isLoading: reviewsLoading, isError: reviewsError } = usePublishedReviews();
  const { data: publishedPosts = [], isLoading: postsLoading, isError: postsError } = usePublishedCommunityPosts();
  const featuredReviews = publishedReviews.slice(0, 3);
  const featuredPosts = publishedPosts.slice(0, 3);
  const recentCommunityMembers = Array.from(new Set(publishedPosts.map((post) => post.authorName))).slice(0, 5);

  useEffect(() => {
    const root = revealRoot.current;
    if (!root) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.12 });
    root.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setModal(null);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [modal]);

  const openModal = (name: ModalName) => {
    setSubmitted(false);
    setSubmitError('');
    setModal(name);
    setMenuOpen(false);
  };
  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setSubmitError('');
    try {
      if (modal === 'support' || modal === 'membership') {
        const isMembership = modal === 'membership';
        const name = String(formData.get('name') || (isMembership ? '멤버십 상담 신청자' : '홈페이지 문의자'));
        const contact = String(formData.get('contact') || '');
        const category = String(formData.get('category') || (isMembership ? '멤버십 상담' : '일반 문의'));
        const message = String(formData.get('message') || '');
        const response = await fetch('/api/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, contact, category, message }),
        });
        if (!response.ok) throw new Error('문의 접수에 실패했습니다. 입력 내용을 확인해주세요.');
      } else if (modal === 'review') {
        const drawAndRank = String(formData.get('drawAndRank') || '');
        const drawMatch = drawAndRank.match(/\d+/);
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberName: String(formData.get('memberName') || ''),
            drawNumber: drawMatch ? Number(drawMatch[0]) : 1,
            rank: drawAndRank.includes('1등') ? '1등' : drawAndRank.includes('2등') ? '2등' : '3등',
            amount: 0,
            content: String(formData.get('content') || ''),
          }),
        });
        if (!response.ok) throw new Error('후기 접수에 실패했습니다. 입력 내용을 확인해주세요.');
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lotto-app" ref={revealRoot}>
      <header className="topbar lotto-topbar">
        <div className="shell topbar-inner">
          <a className="brand lotto-brand" href="#top" aria-label="로또 분석 번호 홈">
            <span className="clover-mark" aria-hidden="true"><i /><i /><i /><i /></span>
            <span className="brand-text">로또 분석 번호<small>실제 당첨의 기쁨을 함께합니다</small></span>
          </a>
          <nav className={menuOpen ? 'nav mobile-open' : 'nav'} aria-label="주요 메뉴">
            <Link href="/reviews" onClick={() => setMenuOpen(false)}>당첨 후기</Link>
            <a href="#video" onClick={() => setMenuOpen(false)}>당첨 영상</a>
            <a href="#membership" onClick={() => setMenuOpen(false)}>멤버십</a>
            <Link href="/community" onClick={() => setMenuOpen(false)}>커뮤니티</Link>
            <a href="#support" onClick={() => setMenuOpen(false)}>고객센터</a>
          </nav>
          <div className="top-actions">
            <button className="login-button" onClick={() => openModal('auth')}>로그인 / 회원가입</button>
            <button className="mobile-menu" aria-label="메뉴 열기" onClick={() => setMenuOpen((current) => !current)}><Menu size={21} /></button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="lotto-photo-hero" aria-label="로또 분석 번호 메인 화면" style={{ backgroundImage: `url(${lottoBallsBackground})` }}>
          <div className="lotto-photo-shade" />
          <div className="shell lotto-photo-content">
            <div className="lotto-photo-heading">
              <h1>로또 <em>1등</em> 실제 당첨 후기</h1>
              <p>실제 당첨자들의 생생한 후기와 인터뷰를 확인하세요!</p>
            </div>

            <div className="winner-showcase">
              {featuredReviews.map((review, index) => (
                <button className={`winner-card ${index === 1 ? 'winner-card-receipt' : 'winner-card-person'}`} key={review.id} onClick={() => openModal('review')}>
                  {index === 1 ? (
                    <span className="receipt-paper">
                      <small>LOTTO 6/45</small>
                      <b>{review.rank} 당첨</b>
                      <strong>{review.amount > 0 ? `${review.amount.toLocaleString('ko-KR')}원` : '금액 비공개'}</strong>
                      <i>{review.drawNumber}회</i>
                    </span>
                  ) : (
                    <span className={`person-portrait ${index === 2 ? 'portrait-two' : 'portrait-one'}`} aria-hidden="true"><i /><b /></span>
                  )}
                  {index !== 1 && <span className="winner-board"><small>로또 {review.rank} 당첨</small><strong>{review.amount > 0 ? `${review.amount.toLocaleString('ko-KR')}원` : `${review.drawNumber}회`}</strong></span>}
                  <span className="winner-quote">“{review.content}”</span>
                  <span className="winner-link"><MessageCircle size={14} /> {review.memberName} 회원의 실제 후기</span>
                </button>
              ))}
              {reviewsLoading && <div className="public-empty winner-empty">공개 후기를 불러오는 중입니다.</div>}
              {reviewsError && <div className="public-empty public-error winner-empty">공개 후기를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>}
              {!reviewsLoading && !reviewsError && featuredReviews.length === 0 && <div className="public-empty winner-empty">관리자 검토를 통과한 실제 당첨 후기가 등록되면 이곳에 표시됩니다.</div>}
            </div>

            <div className="hero-quick-grid">
              <button className="hero-quick-card quick-gold" onClick={() => openModal('membership')}>
                <span className="quick-icon">VIP</span><strong>멤버십 서비스 안내</strong><small>전문가의 분석 번호를<br />멤버십으로 받아보세요</small><b>자세히 보기</b>
              </button>
              <button className="hero-quick-card quick-blue" onClick={() => openModal('support')}>
                <Headphones className="quick-svg" /><strong>고객센터</strong><small>궁금한 점이 있으신가요?<br />언제든지 문의주세요.</small><b>문의하기</b>
              </button>
              <Link className="hero-quick-card quick-purple" href="/community">
                <MessageCircle className="quick-svg" /><strong>커뮤니티</strong><small>당첨 후기 공유, 정보 교류<br />함께하는 로또 커뮤니티</small><b>바로가기</b>
              </Link>
              <button className="hero-quick-card quick-membership" onClick={() => openModal('membership')}>
                <strong>멤버십 분석 번호 서비스</strong>
                <ul><li>전문가의 체계적인 번호 분석</li><li>매주 업데이트되는 최신 번호</li><li>높은 적중률을 목표로 한 차별화된 서비스</li></ul>
                <b>멤버십 가입하기</b>
              </button>
            </div>
          </div>
        </section>

        <div className="ticker">
          <div className="shell ticker-inner">
            <span className="ticker-highlight">LIVE RESULT</span><span className="ticker-sep">/</span>
            {reviewsError ? <span>공개 당첨 기록을 불러오지 못했습니다.</span> : <>
              {featuredReviews.map((review) => <span key={review.id}>{review.drawNumber}회 {review.rank} · {review.memberName}<span className="ticker-sep">　•</span></span>)}
              <span>현재 공개 후기 {publishedReviews.length}건</span><span className="ticker-sep">•</span><span className="ticker-highlight">관리자 검토 후 공개</span>
            </>}
          </div>
        </div>

        <section className="section proof-section" id="proof">
          <div className="shell proof-grid">
            <div className="proof-lede reveal">
              <span className="eyebrow">Winning archive</span>
              <h2 className="section-title">말보다 먼저,<br /><span className="gold">기록</span>을 보여드립니다.</h2>
              <p>누구나 볼 수 있는 당첨 회차, 구매 지역, 당첨 등수. 결과가 쌓일수록 분석의 기준은 더 선명해집니다.</p>
               <div className="proof-stat"><strong>{publishedReviews.length}</strong><span>회원이 직접 남긴<br />공개 당첨 후기</span></div>
            </div>
            <div className="story-list reveal delay-1">
              {featuredReviews.map((review) => (
                <article className="story" key={review.id}>
                  <div className="story-rank">{review.rank}</div>
                  <div><div className="story-meta">{review.drawNumber}회 · {review.memberName} · {formatDate(review.createdAt)}</div><h3 className="story-title">{review.content}</h3></div>
                  <div className="story-amount">{formatAmount(review.amount)}</div>
                </article>
              ))}
              {reviewsLoading && <div className="public-empty">당첨 기록을 불러오는 중입니다.</div>}
              {reviewsError && <div className="public-empty public-error">당첨 기록을 불러오지 못했습니다.</div>}
              {!reviewsLoading && !reviewsError && featuredReviews.length === 0 && <div className="public-empty">현재 공개된 당첨 후기가 없습니다.</div>}
               <Link className="outline-button" style={{ marginTop: 22 }} href="/reviews">후기 더 보기 <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>

        <section className="section video-section" id="video">
          <div className="shell">
            <div className="section-head reveal">
              <div><span className="eyebrow">Winning film</span><h2 className="section-title">그날의 숫자를<br /><span className="gold">직접 들어보세요.</span></h2></div>
              <p className="section-copy">관리자가 확인한 인터뷰와 증빙 자료가 준비되는 순서대로 공개됩니다.</p>
            </div>
            <button className="video-card reveal delay-1" onClick={() => openModal('video')} aria-label="당첨 회원 인터뷰 영상 재생">
              <div className="video-ghost" />
              <span className="video-play"><Play size={23} fill="currentColor" /></span>
              <h3>검증된 당첨 회원 인터뷰를<br />준비하고 있습니다.</h3>
              <p>확인되지 않은 인터뷰나 당첨 정보는 공개하지 않습니다.</p>
              <span className="video-index">PREPARING</span>
            </button>
          </div>
        </section>

        <section className="section method-section">
          <div className="shell">
            <div className="section-head reveal">
              <div><span className="eyebrow">Our method</span><h2 className="section-title">감이 아니라<br /><span className="gold">세 가지 기준</span>으로.</h2></div>
              <p className="section-copy">한 번의 행운을 약속하지 않습니다. 매주 같은 기준으로 숫자를 읽고, 결과를 투명하게 남깁니다.</p>
            </div>
            <div className="method-grid reveal delay-1">
              <article className="method-item"><span className="method-no">01 — DATA</span><h3>당첨 데이터 분석</h3><p>최근 10년간의 회차별 출현 빈도와 간격을 비교합니다.</p></article>
              <article className="method-item"><span className="method-no">02 — BALANCE</span><h3>조합 밸런스</h3><p>구간, 홀짝, 합계의 균형을 맞춰 오래 살아남는 조합을 설계합니다.</p></article>
              <article className="method-item"><span className="method-no">03 — REVIEW</span><h3>결과와 복기</h3><p>적중과 미적중 모두 숨기지 않고 다음 회차 분석에 반영합니다.</p></article>
            </div>
          </div>
        </section>

        <section className="section membership-section" id="membership">
          <div className="shell membership-grid">
            <div className="membership-intro reveal">
              <span className="eyebrow">Membership</span>
              <h2 className="section-title">이번 주 숫자를<br /><span className="gold">혼자 고르지 않도록.</span></h2>
              <p>매주 업데이트되는 분석 번호와 리포트, 그리고 결과를 함께 복기하는 멤버십입니다. 필요한 만큼만, 명확하게 시작하세요.</p>
              <button className="gold-button" onClick={() => openModal('membership')}>멤버십 상담 시작 <ArrowRight size={16} /></button>
            </div>
            <div className="price-card reveal delay-1">
              <span className="popular">MOST CHOSEN</span>
              <div className="price-label">GOLDEN PICK / STANDARD</div>
              <h3>3등 분석 번호 멤버십</h3>
              <div className="price"><strong>330,000</strong><span>원 / 1개월</span></div>
              <ul className="feature-list">
                <li><Check size={15} /> 매주 핵심 분석 번호 제공</li>
                <li><Check size={15} /> 회차별 분석 리포트 열람</li>
                <li><Check size={15} /> 멤버 전용 커뮤니티 입장</li>
                <li><Check size={15} /> 당첨 결과 복기 및 상담</li>
              </ul>
              <button className="gold-button" onClick={() => openModal('membership')}>이 플랜으로 상담하기 <ArrowRight size={16} /></button>
              <div className="consult-box"><div><strong>1·2등 분석은 별도 상담</strong>회원님의 목표에 맞춰 안내해드립니다.</div><a href="https://pf.kakao.com/" target="_blank" rel="noreferrer">카카오톡 채널 상담</a></div>
            </div>
          </div>
        </section>

        <section className="section community-section" id="community">
          <div className="shell">
            <div className="section-head reveal">
              <div><span className="eyebrow">Inside the circle</span><h2 className="section-title">숫자를 나누면,<br /><span className="gold">기준이 생깁니다.</span></h2></div>
              <p className="section-copy">혼자 결과를 기다리는 대신, 함께 기록하고 서로의 기준을 확인하는 멤버 전용 공간.</p>
            </div>
            <div className="community-grid">
              <article className="community-main reveal">
                <span className="mono gold">OPEN DISCUSSION / {String(publishedPosts.length).padStart(2, '0')}</span>
                {postsLoading ? <div className="public-empty">커뮤니티 게시글을 불러오는 중입니다.</div> : postsError ? <div className="public-empty public-error">커뮤니티 게시글을 불러오지 못했습니다.</div> : featuredPosts[0] ? (
                  <>
                    <h3>{featuredPosts[0].title}</h3>
                    <p>{featuredPosts[0].content}</p>
                    <div className="community-tags">{featuredPosts.map((post) => <span key={post.id}>{post.category}</span>)}</div>
                  </>
                ) : (
                  <div className="public-empty">승인된 고객 게시글이 등록되면 이곳에 표시됩니다.</div>
                )}
                <Link className="outline-button" href="/community">커뮤니티 둘러보기 <ArrowRight size={15} /></Link>
              </article>
              <article className="community-side reveal delay-1">
                <div className="community-side-top"><div><span className="mono muted">MEMBER LOUNGE</span><h4>최근 참여 회원</h4></div><span className="online">공개 {publishedPosts.length}</span></div>
                <div><div className="avatars">{recentCommunityMembers.map((name) => <span className="avatar" key={name}>{initials(name)}</span>)}</div><small>{recentCommunityMembers.length > 0 ? '실제 공개 게시글을 남긴 회원입니다.' : '공개된 참여 기록이 아직 없습니다.'}</small></div>
              </article>
            </div>
          </div>
        </section>

        <section className="section review-section">
          <div className="shell review-grid">
            <div className="review-intro reveal"><span className="eyebrow">Member voices</span><h2 className="section-title">실제로 써본<br /><span className="gold">사람들의 말.</span></h2><p>고객이 직접 제출하고 관리자가 검토해 공개한 실제 후기입니다.</p><div className="review-score"><span className="score-number">{publishedReviews.length}</span><div><strong className="gold">공개 후기</strong><span className="muted">검토 완료된 실제 고객 기록</span></div></div></div>
            <div className="review-stream reveal delay-1">
              {featuredReviews.map((review) => <article className="review-card" key={review.id}><div className="review-top"><span>{review.memberName}</span><span>{review.rank} / {review.drawNumber}회</span></div><blockquote>“{review.content}”</blockquote></article>)}
              {reviewsLoading && <div className="public-empty">고객 후기를 불러오는 중입니다.</div>}
              {reviewsError && <div className="public-empty public-error">고객 후기를 불러오지 못했습니다.</div>}
              {!reviewsLoading && !reviewsError && featuredReviews.length === 0 && <div className="public-empty">현재 공개된 고객 후기가 없습니다.</div>}
              <button className="outline-button" onClick={() => openModal('review')}>나의 후기 작성하기 <MessageCircle size={15} /></button>
            </div>
          </div>
        </section>

        <section className="section trust-section" id="support">
          <div className="shell">
            <div className="trust-intro reveal"><div><span className="eyebrow">Trust, not noise</span><h2 className="section-title">확인할 수 있는<br /><span className="gold">신뢰의 표식.</span></h2></div><p>배지는 교체 가능한 영역으로 운영됩니다.<br />서비스의 최신 인증과 수상 이력을 투명하게 공개합니다.</p></div>
            <div className="badges reveal delay-1">
              <div className="badge">
                <div className="badge-content">
                  <div className="badge-mark" aria-hidden="true"><FlaskConical size={21} strokeWidth={1.7} /></div>
                  <strong>연구·분석</strong><span>데이터 연구센터</span>
                </div>
              </div>
              <div className="badge">
                <div className="badge-content">
                  <div className="badge-mark" aria-hidden="true"><Trophy size={21} strokeWidth={1.7} /></div>
                  <strong>고객 만족</strong><span>서비스 품질 관리</span>
                </div>
              </div>
              <div className="badge">
                <div className="badge-content">
                  <div className="badge-mark" aria-hidden="true"><BadgeCheck size={21} strokeWidth={1.7} /></div>
                  <strong>소비자 보호</strong><span>투명한 상담 운영</span>
                </div>
              </div>
              <div className="badge">
                <div className="badge-content">
                  <div className="badge-mark" aria-hidden="true"><Landmark size={21} strokeWidth={1.7} /></div>
                  <strong>지식재산 관리</strong><span>분석 방법론 연구</span>
                </div>
              </div>
            </div>
            <div className="support-strip reveal delay-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginTop: 52, padding: '28px 0 0', borderTop: '1px solid #30343a' }}>
              <div><span className="eyebrow">Customer care</span><h3 style={{ margin: '12px 0 0', font: '700 22px Manrope', letterSpacing: '-.05em' }}>궁금한 점은 카카오톡으로 편하게 물어보세요.</h3></div>
              <button className="gold-button" onClick={() => openModal('support')}><Headphones size={16} /> 고객센터 문의하기</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell">
          <div className="footer-top">
            <a className="brand" href="#top"><span className="brand-mark" /><span className="brand-text">GOLDEN PICK<small>LOTTO ANALYSIS LAB</small></span></a>
             <div className="footer-nav"><div><strong>EXPLORE</strong><Link href="/reviews">당첨 후기</Link><a href="#video">당첨 영상</a><Link href="/community">커뮤니티</Link></div><div><strong>HELP</strong><a href="#membership">멤버십</a><button style={{ display: 'block', padding: 0, marginBottom: 10, border: 0, background: 'transparent', color: '#777e87', fontSize: 12 }} onClick={() => openModal('support')}>고객센터</button><button style={{ display: 'block', padding: 0, border: 0, background: 'transparent', color: '#777e87', fontSize: 12 }} onClick={() => openModal('auth')}>로그인</button></div></div>
            <div className="footer-call"><strong>카카오톡 채널 상담</strong><span>대표번호 없이, 카카오톡으로만 상담합니다.</span><a href="https://pf.kakao.com/" target="_blank" rel="noreferrer" className="gold" style={{ display: 'inline-block', marginTop: 13, fontSize: 12 }}>채널 바로가기 <ArrowRight size={12} style={{ verticalAlign: 'middle' }} /></a></div>
          </div>
          <div className="footer-bottom"><span>© 2025 GOLDEN PICK. ALL RIGHTS RESERVED.</span><span>이용약관　개인정보처리방침</span></div>
        </div>
      </footer>

      {modal === 'review' && <Modal title="당첨 후기를 남겨주세요" description="회원님의 기록이 다음 사람에게는 가장 현실적인 기준이 됩니다." onClose={() => setModal(null)}>{submitted ? <div className="success-note">후기가 접수되었습니다. 검토 후 당첨 아카이브에 반영됩니다.</div> : <form className="form" onSubmit={submitForm}><label>닉네임<input name="memberName" required placeholder="공개할 이름을 입력하세요" /></label><label>당첨 회차<input name="drawAndRank" required placeholder="예: 1184회 / 3등" /></label><label>후기<textarea name="content" required placeholder="분석을 시작한 계기와 경험을 들려주세요." /></label>{submitError && <div className="form-error">{submitError}</div>}<button className="gold-button" type="submit" disabled={submitting}>{submitting ? '접수 중...' : '후기 제출하기'} <ArrowRight size={15} /></button></form>}</Modal>}
      {modal === 'support' && <Modal title="고객센터 문의" description="대표번호 대신 카카오톡 채널로 빠르고 정확하게 상담합니다." onClose={() => setModal(null)}>{submitted ? <div className="success-note">문의가 접수되었습니다. 카카오톡 채널에서 답변을 확인해주세요.</div> : <form className="form" onSubmit={submitForm}><label>문의 유형<input name="category" required placeholder="멤버십 / 분석 번호 / 결제 등" /></label><label>연락받을 카카오톡 아이디<input name="contact" required placeholder="카카오톡 채널 상담을 위해 필요합니다" /></label><label>문의 내용<textarea name="message" required placeholder="궁금한 내용을 남겨주세요." /></label>{submitError && <div className="form-error">{submitError}</div>}<button className="gold-button" type="submit" disabled={submitting}>{submitting ? '접수 중...' : '문의 접수하기'} <MessageCircle size={15} /></button></form>}</Modal>}
      {modal === 'auth' && <Modal title={authMode === 'login' ? '다시 만나서 반갑습니다' : '골든 픽 시작하기'} description={authMode === 'login' ? '분석 리포트와 커뮤니티를 이어서 확인하세요.' : '매주 새로운 분석 기록을 가장 먼저 받아보세요.'} onClose={() => setModal(null)}><div className="auth-switch"><button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>로그인</button><button className={authMode === 'join' ? 'active' : ''} onClick={() => setAuthMode('join')}>회원가입</button></div>{submitted ? <div className="success-note">{authMode === 'login' ? '로그인 준비가 완료되었습니다. 곧 멤버 공간으로 이동합니다.' : '가입 신청이 접수되었습니다. 카카오톡 채널에서 안내를 확인해주세요.'}</div> : <form className="form" onSubmit={submitForm}>{authMode === 'join' && <label>이름<input required placeholder="이름을 입력하세요" /></label>}<label>이메일<input required type="email" placeholder="name@example.com" /></label><label>비밀번호<input required type="password" placeholder="6자 이상 입력하세요" /></label><button className="gold-button" type="submit">{authMode === 'login' ? '로그인하기' : '회원가입하기'} <ArrowRight size={15} /></button></form>}</Modal>}
      {modal === 'membership' && <Modal title="멤버십 상담 신청" description="신청 내용을 확인한 뒤 카카오톡 채널로 자세한 안내를 드립니다." onClose={() => setModal(null)}>{submitted ? <div className="success-note">상담 신청이 접수되었습니다. 카카오톡 채널에서 곧 안내드리겠습니다.</div> : <form className="form" onSubmit={submitForm}><label>성함<input name="name" required placeholder="상담받으실 성함" /></label><label>카카오톡 아이디<input name="contact" required placeholder="답변받으실 카카오톡 아이디" /></label><label>관심 플랜<input name="category" defaultValue="3등 분석 번호 멤버십 / 330,000원" readOnly /></label><label>상담 메모<textarea name="message" required placeholder="1·2등 상담 등 남기고 싶은 내용을 적어주세요." /></label>{submitError && <div className="form-error">{submitError}</div>}<button className="gold-button" type="submit" disabled={submitting}>{submitting ? '신청 중...' : '상담 신청하기'} <ArrowRight size={15} /></button></form>}</Modal>}
      {modal === 'video' && <Modal title="당첨 회원 인터뷰 준비 중" description="관리자가 검증한 회원 인터뷰만 공개합니다." onClose={() => setModal(null)}><div style={{ aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle, #7b571b, #101318 63%)', border: '1px solid #685127' }}><span className="video-play" style={{ position: 'static', transform: 'none' }}><Play size={23} fill="currentColor" /></span></div><p style={{ margin: '18px 0 0' }}>현재 공개 가능한 검증 자료를 준비하고 있습니다. 확인되지 않은 영상이나 당첨 정보는 표시하지 않습니다.</p></Modal>}
    </div>
  );
}

function PublicPageHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="topbar lotto-topbar standalone-topbar">
      <div className="shell topbar-inner">
        <Link className="brand lotto-brand" href="/" onClick={() => setMenuOpen(false)} aria-label="로또 분석 번호 홈">
          <span className="clover-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="brand-text">로또 분석 번호<small>실제 당첨의 기쁨을 함께합니다</small></span>
        </Link>
        <nav className={menuOpen ? 'nav mobile-open' : 'nav'} aria-label="주요 메뉴">
          <Link href="/reviews" onClick={() => setMenuOpen(false)}>당첨 후기</Link>
          <Link href="/#video" onClick={() => setMenuOpen(false)}>당첨 영상</Link>
          <Link href="/#membership" onClick={() => setMenuOpen(false)}>멤버십</Link>
          <Link href="/community" onClick={() => setMenuOpen(false)}>커뮤니티</Link>
          <Link href="/#support" onClick={() => setMenuOpen(false)}>고객센터</Link>
        </nav>
        <div className="top-actions">
          <Link className="login-button standalone-login" href="/#top">홈으로</Link>
          <button className="mobile-menu" aria-label="메뉴 열기" onClick={() => setMenuOpen((current) => !current)}><Menu size={21} /></button>
        </div>
      </div>
    </header>
  );
}

function PublicPageFooter() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-top">
          <Link className="brand" href="/"><span className="brand-mark" /><span className="brand-text">GOLDEN PICK<small>LOTTO ANALYSIS LAB</small></span></Link>
          <div className="footer-nav">
            <div><strong>EXPLORE</strong><Link href="/reviews">당첨 후기</Link><Link href="/community">커뮤니티</Link><Link href="/#membership">멤버십</Link></div>
            <div><strong>HELP</strong><Link href="/#support">고객센터</Link><Link href="/#top">홈페이지</Link></div>
          </div>
          <div className="footer-call"><strong>카카오톡 채널 상담</strong><span>대표번호 없이, 카카오톡으로만 상담합니다.</span><a href="https://pf.kakao.com/" target="_blank" rel="noreferrer" className="gold" style={{ display: 'inline-block', marginTop: 13, fontSize: 12 }}>채널 바로가기 <ArrowRight size={12} style={{ verticalAlign: 'middle' }} /></a></div>
        </div>
        <div className="footer-bottom"><span>© 2025 GOLDEN PICK. ALL RIGHTS RESERVED.</span><span>이용약관　개인정보처리방침</span></div>
      </div>
    </footer>
  );
}

function CommunitySubmissionForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/community-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: String(data.get('authorName') || ''),
          category: String(data.get('category') || ''),
          title: String(data.get('title') || ''),
          content: String(data.get('content') || ''),
        }),
      });
      if (!response.ok) throw new Error('게시글 접수에 실패했습니다. 입력 내용을 확인해주세요.');
      setSubmitted(true);
      event.currentTarget.reset();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : '게시글 접수에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <div className="success-note">게시글이 접수되었습니다. 관리자 검토 후 커뮤니티에 공개됩니다.</div>;

  return (
    <form className="form standalone-review-form" onSubmit={submitPost}>
      <div className="form-two-col">
        <label>닉네임<input name="authorName" required maxLength={80} placeholder="공개할 이름" /></label>
        <label>분류<select name="category" defaultValue="번호 흐름"><option>번호 흐름</option><option>나만의 제외수</option><option>조합 밸런스</option><option>당첨 후기</option><option>자유 토론</option></select></label>
      </div>
      <label>제목<input name="title" required maxLength={200} placeholder="함께 나누고 싶은 이야기의 제목" /></label>
      <label>내용<textarea name="content" required maxLength={5000} placeholder="분석 기준이나 경험을 자세히 남겨주세요." /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="gold-button" type="submit" disabled={submitting}>{submitting ? '접수 중...' : '게시글 제출하기'} <ArrowRight size={15} /></button>
    </form>
  );
}

function CommunityPage() {
  const { data: posts = [], isLoading, isError } = usePublishedCommunityPosts();
  const { data: reviews = [] } = usePublishedReviews();
  const members = Array.from(new Set(posts.map((post) => post.authorName)));
  return (
    <div className="lotto-app standalone-page">
      <PublicPageHeader />
      <main>
        <section className="standalone-hero">
          <div className="shell">
            <span className="eyebrow">Inside the circle</span>
            <h1 className="standalone-title">숫자를 나누면,<br /><span className="gold">기준이 생깁니다.</span></h1>
            <p className="standalone-lede">혼자 결과를 기다리는 대신, 함께 기록하고 서로의 기준을 확인하는 회원 커뮤니티입니다.</p>
            <div className="page-actions">
              <Link className="gold-button" href="/#membership">멤버십 안내 <ArrowRight size={16} /></Link>
              <Link className="outline-button" href="/reviews">당첨 후기 보기 <ArrowRight size={15} /></Link>
            </div>
            <div className="community-page-stats">
               <div><strong>{members.length}</strong><span>최근 참여 회원</span></div>
               <div><strong>{posts.length}</strong><span>공개된 토론</span></div>
               <div><strong>{reviews.length}</strong><span>공개된 당첨 후기</span></div>
            </div>
          </div>
        </section>
        <section className="section page-section" id="topics">
          <div className="shell">
            <div className="section-head">
              <div><span className="eyebrow">Open discussion</span><h2 className="section-title">이번 주 회원들이<br /><span className="gold">함께 보는 이야기.</span></h2></div>
              <p className="section-copy">출현 흐름부터 나만의 제외수까지, 각자의 기준을 공유하고 분석팀의 코멘트를 확인하세요.</p>
            </div>
            <div className="community-post-list">
              {posts.map((post) => (
                <article className="community-post" key={post.id}>
                  <div className="community-post-tag">{post.category}</div>
                  <div className="community-post-body"><h3>{post.title}</h3><p>{post.content}</p><span>{post.authorName} · {formatDate(post.createdAt)}</span></div>
                  <div className="community-post-replies"><MessageCircle size={15} />{post.replyCount}</div>
                  <ArrowRight className="community-post-arrow" size={18} />
                </article>
              ))}
              {isLoading && <div className="public-empty">커뮤니티 게시글을 불러오는 중입니다.</div>}
              {!isLoading && !isError && posts.length === 0 && <div className="public-empty">현재 공개된 고객 게시글이 없습니다. 첫 이야기를 남겨주세요.</div>}
              {isError && <div className="public-empty public-error">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>}
            </div>
            <div className="community-submit-card">
              <span className="mono gold">SHARE YOUR STANDARD</span>
              <h3>나의 분석 기준을<br />함께 나눠주세요.</h3>
              <p>접수된 글은 관리자 검토 후 커뮤니티에 공개됩니다.</p>
              <CommunitySubmissionForm />
            </div>
          </div>
        </section>
        <section className="section community-lounge-section">
          <div className="shell community-lounge">
            <div>
              <span className="eyebrow">Member lounge</span>
              <h2 className="section-title">이번 주 분석을<br /><span className="gold">함께 복기하세요.</span></h2>
              <p className="section-copy">멤버십 가입 후 커뮤니티에서 회차별 분석 리포트와 회원들의 조합을 함께 확인할 수 있습니다.</p>
            </div>
            <div className="community-lounge-card">
               <div className="community-side-top"><div><span className="mono muted">RECENT MEMBERS</span><h4>최근 글을 남긴 회원</h4></div><span className="online">공개 {posts.length}</span></div>
               <div><div className="avatars">{members.slice(0, 5).map((name) => <span className="avatar" key={name}>{initials(name)}</span>)}</div><small>{members.length > 0 ? `${members.length}명의 실제 회원 기록이 공개되어 있습니다.` : '공개된 참여 기록이 아직 없습니다.'}</small></div>
            </div>
          </div>
        </section>
      </main>
      <PublicPageFooter />
    </div>
  );
}

function ReviewSubmissionForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberName: String(data.get('memberName') || ''),
          drawNumber: Number(data.get('drawNumber') || 0),
          rank: String(data.get('rank') || '3등'),
          amount: Number(data.get('amount') || 0),
          content: String(data.get('content') || ''),
        }),
      });
      if (!response.ok) throw new Error('후기 접수에 실패했습니다. 입력 내용을 확인해주세요.');
      setSubmitted(true);
      event.currentTarget.reset();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : '후기 접수에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <div className="success-note">후기가 접수되었습니다. 검토 후 당첨 아카이브에 반영됩니다.</div>;

  return (
    <form className="form standalone-review-form" onSubmit={submitReview}>
      <div className="form-two-col">
        <label>닉네임<input name="memberName" required placeholder="공개할 이름" /></label>
        <label>당첨 회차<input name="drawNumber" required type="number" min="1" max="9999" placeholder="예: 1184" /></label>
      </div>
      <div className="form-two-col">
        <label>당첨 등수<select name="rank" defaultValue="3등"><option>1등</option><option>2등</option><option>3등</option><option>4등</option><option>5등</option></select></label>
        <label>당첨금액<input name="amount" type="number" min="0" placeholder="선택 입력" /></label>
      </div>
      <label>후기 내용<textarea name="content" required placeholder="분석을 시작한 계기와 경험을 들려주세요." /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="gold-button" type="submit" disabled={submitting}>{submitting ? '접수 중...' : '후기 제출하기'} <ArrowRight size={15} /></button>
    </form>
  );
}

function ReviewsPage() {
  const { data: reviews = [], isLoading, isError } = usePublishedReviews();
  return (
    <div className="lotto-app standalone-page">
      <PublicPageHeader />
      <main>
        <section className="standalone-hero review-page-hero">
          <div className="shell">
            <span className="eyebrow">Member voices</span>
            <h1 className="standalone-title">실제로 써본<br /><span className="gold">사람들의 말.</span></h1>
            <p className="standalone-lede">좋은 결과만 골라 보여주지 않습니다. 멤버십을 경험한 분들의 솔직한 기록을 모았습니다.</p>
            <div className="review-page-score"><strong>{reviews.length}</strong><div><strong className="gold">공개 후기</strong><span>관리자 검토를 완료한 실제 고객 기록</span></div></div>
          </div>
        </section>
        <section className="section page-section">
          <div className="shell">
            <div className="section-head">
              <div><span className="eyebrow">Verified archive</span><h2 className="section-title">회원이 직접 남긴<br /><span className="gold">경험의 기록.</span></h2></div>
              <p className="section-copy">회차와 등수, 회원의 목소리를 함께 확인하세요. 모든 후기는 검토 후 공개됩니다.</p>
            </div>
            <div className="review-page-grid">
              <div className="review-page-stream">
                {reviews.map((review) => <article className="review-card review-page-card" key={review.id}><div className="review-top"><span>{review.memberName}</span><span>{review.rank} / {review.drawNumber}회</span></div><blockquote>“{review.content}”</blockquote><strong>{formatAmount(review.amount)}</strong></article>)}
                {isLoading && <div className="public-empty">고객 후기를 불러오는 중입니다.</div>}
                {!isLoading && !isError && reviews.length === 0 && <div className="public-empty">현재 공개된 고객 후기가 없습니다. 첫 후기를 남겨주세요.</div>}
                {isError && <div className="public-empty public-error">후기를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>}
              </div>
              <div className="review-submit-card">
                <span className="mono gold">SHARE YOUR STORY</span>
                <h3>나의 당첨 후기도<br />남겨주세요.</h3>
                <p>회원님의 기록이 다음 사람에게는 가장 현실적인 기준이 됩니다.</p>
                <ReviewSubmissionForm />
              </div>
            </div>
          </div>
        </section>
        <section className="section review-archive-section">
          <div className="shell">
            <div className="section-head"><div><span className="eyebrow">Winning archive</span><h2 className="section-title">회차별 당첨<br /><span className="gold">기록을 확인하세요.</span></h2></div><Link className="outline-button" href="/community">커뮤니티 보기 <ArrowRight size={15} /></Link></div>
            <div className="review-story-grid">{reviews.map((review) => <article className="review-story-card" key={review.id}><span className="story-rank">{review.rank}</span><div><span className="story-meta">{review.drawNumber}회 · {review.memberName} · {formatDate(review.createdAt)}</span><h3>{review.content}</h3></div><strong>{formatAmount(review.amount)}</strong></article>)}</div>
          </div>
        </section>
      </main>
      <PublicPageFooter />
    </div>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/community" component={CommunityPage} /><Route path="/reviews" component={ReviewsPage} /><Route path="/admin" component={AdminApp} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;