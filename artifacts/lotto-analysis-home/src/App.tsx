import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  Menu,
  MessageCircle,
  Phone,
  Play,
  X,
} from 'lucide-react';
import lottoBallsBackground from '@assets/ChatGPT_Image_2026년_8월_29일_오전_03_28_36_1787999327234.png';
import winningTicketImageOne from '@assets/image_1788152850744.png';
import winningTicketImageTwo from '@assets/image_1788152853222.png';
import winningTicketImageFour from '@assets/image_1788152859622.png';
import winningTicketImageFive from '@assets/image_1788152866212.png';
import winningTicketImage1239 from '@assets/image_1788172301924.png';
import winningTicketImage1238 from '@assets/image_1788172304309.png';
import winningTicketImage1237 from '@assets/image_1788172299565.png';
import heroStoryImageOne from '@assets/image_1788153395386.png';
import heroStoryImageTwo from '@assets/image_1788153408517.png';
import heroStoryImageThree from '@assets/image_1788153415880.png';
import heroStoryImageFeatured from '@assets/image_1788154593822.png';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import AdminApp from '@/admin/AdminApp';
import { PortalHome } from '@/components/PortalHome';

const queryClient = new QueryClient();
const customerTrustBadges = [
  { src: `${import.meta.env.BASE_URL}customer-satisfaction-index-no-bg.png`, alt: '한국소비자만족지수 1위', label: '한국소비자만족지수 1위' },
  { src: `${import.meta.env.BASE_URL}customer-satisfaction-no-bg.png`, alt: '한국고객만족도 1위', label: '한국고객만족도 1위' },
  { src: `${import.meta.env.BASE_URL}consumer-surprise-index-no-bg.png`, alt: '한국소비자감동지수 1위', label: '한국소비자감동지수 1위' },
  { src: `${import.meta.env.BASE_URL}trust-brand-awards-no-bg.png`, alt: '고객이신뢰하는브랜드대상', label: '고객이신뢰하는브랜드대상' },
];
const winningTicketImages = [
  winningTicketImage1239,
  winningTicketImage1238,
  winningTicketImage1237,
  winningTicketImageOne,
  winningTicketImageTwo,
  winningTicketImageFour,
  winningTicketImageFive,
];
const heroStoryImages = [
  { image: heroStoryImageFeatured, draw: '1044회', title: '당첨 용지 증빙' },
  { image: heroStoryImageOne, draw: '800회', title: '1등 당첨자 인터뷰' },
  { image: heroStoryImageTwo, draw: '841회', title: '당첨 용지 증빙' },
  { image: heroStoryImageThree, draw: '912회', title: '1등 당첨자 인터뷰' },
  { image: winningTicketImage1239, draw: '1239회', title: '당첨 용지 증빙' },
];

type ModalName = 'review' | 'auth' | 'membership' | 'video' | 'refund' | null;

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

type PublicCommunityPage = {
  items: PublicCommunityPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

function usePublishedCommunityPage(page: number) {
  return useQuery({
    queryKey: ['publishedCommunityPosts', page],
    queryFn: () => fetchPublicData<PublicCommunityPage>(`/api/community-posts?page=${page}`),
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
  const [modal, setModal] = useState<ModalName>('refund');
  const [refundFormOpen, setRefundFormOpen] = useState(false);
  const [membershipPlan, setMembershipPlan] = useState<'vip' | 'premium'>('premium');
  const [authMode, setAuthMode] = useState<'login' | 'join'>('login');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRoot = useRef<HTMLDivElement>(null);
  const { data: publishedReviews = [], isLoading: reviewsLoading, isError: reviewsError } = usePublishedReviews();
  const { data: publishedPosts = [], isLoading: postsLoading, isError: postsError } = usePublishedCommunityPosts();
  const featuredReviews = publishedReviews.slice(0, 3);

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
    setRefundFormOpen(false);
    setModal(name);
    setMenuOpen(false);
  };
  const openMembershipModal = (plan: 'vip' | 'premium' = 'premium') => {
    setMembershipPlan(plan);
    openModal('membership');
  };
  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setSubmitError('');
    try {
      if (modal === 'membership' || modal === 'refund') {
        const isMembership = modal === 'membership';
        const isRefund = modal === 'refund';
        const defaultName = isMembership ? '멤버십 신청자' : '홈페이지 문의자';
        const name = String(formData.get('name') || (isRefund ? '환불 신청자' : defaultName));
        const contact = String(formData.get('contact') || '');
        const category = String(formData.get('category') || (isMembership ? '멤버십 신청' : isRefund ? '환불 신청' : '일반 문의'));
        const message = String(formData.get('message') || '');
        const response = await fetch('/api/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, contact, category, message }),
        });
        if (!response.ok) throw new Error('문의 접수에 실패했습니다. 입력 내용을 확인해주세요.');
      } else if (modal === 'auth' && authMode === 'join') {
        const response = await fetch('/api/member-signups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: String(formData.get('username') || ''),
            password: String(formData.get('password') || ''),
            name: String(formData.get('name') || ''),
            phone: String(formData.get('phone') || ''),
          }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || '회원가입 신청에 실패했습니다. 입력 내용을 확인해주세요.');
        }
      } else if (modal === 'auth' && authMode === 'login') {
        const response = await fetch('/api/member-auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: String(formData.get('username') || ''),
            password: String(formData.get('password') || ''),
          }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
        }
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
          <a className="brand lotto-brand" href="#top" aria-label="로또리코 홈">
            <span className="clover-mark" aria-hidden="true"><i /><i /><i /><i /></span>
            <span className="brand-text">로또리코<small>실제 당첨의 기쁨을 함께합니다</small></span>
          </a>
          <nav className={menuOpen ? 'nav mobile-open' : 'nav'} aria-label="주요 메뉴">
            <Link href="/reviews" onClick={() => setMenuOpen(false)}>당첨 후기</Link>
            <a href="#stories" onClick={() => setMenuOpen(false)}>당첨자 사진</a>
            <a href="#membership" onClick={() => setMenuOpen(false)}>멤버십</a>
            <Link href="/community" onClick={() => setMenuOpen(false)}>커뮤니티</Link>
            <a href="#support" onClick={() => setMenuOpen(false)}>고객센터</a>
          </nav>
          <div className="top-actions">
            <button className="login-button" onClick={() => openModal('auth')}>로그인 / 회원가입</button>
            <button className="mobile-menu" aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={menuOpen} onClick={() => setMenuOpen((current) => !current)}>
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="lotto-photo-hero" aria-label="로또리코 메인 화면" style={{ backgroundImage: `url(${lottoBallsBackground})` }}>
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
                     <span className="receipt-paper receipt-photo-paper">
                       <img src={winningTicketImages[0]} alt="로또 당첨 용지 증빙 사진" />
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
               {!reviewsLoading && !reviewsError && featuredReviews.length === 0 && (
                 <div className="hero-photo-gallery" aria-label="로또리코 당첨자 인터뷰 및 증빙 사진">
                   {heroStoryImages.map((story, index) => (
                      <figure className={`hero-photo-card ${index === 0 ? 'hero-photo-card-featured' : ''} ${index === heroStoryImages.length - 1 ? 'hero-photo-card-ticket' : ''}`} key={story.image}>
                       <img src={story.image} alt={`${story.draw} ${story.title}`} />
                       <figcaption><small>{story.draw}</small><strong>{story.title}</strong></figcaption>
                     </figure>
                   ))}
                 </div>
               )}
            </div>

            <div className="hero-quick-grid">
              <button className="hero-quick-card quick-gold" onClick={() => openModal('membership')}>
                <span className="quick-icon">VIP</span><strong>멤버십 서비스 안내</strong><small>전문가의 분석 번호를<br />멤버십으로 받아보세요</small><b>자세히 보기</b>
              </button>
              <a className="hero-quick-card quick-blue" href="tel:070-8095-3814" aria-label="환불 보상 상담 전화 070-8095-3814">
                <Phone className="quick-svg" /><strong>환불 보상 상담</strong><small>환불 및 보상 관련 문의는<br />전용 전화로 안내합니다.</small><b>070-8095-3814</b>
              </a>
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

        <PortalHome
          reviews={publishedReviews}
          posts={publishedPosts}
          reviewsLoading={reviewsLoading}
          reviewsError={reviewsError}
          postsLoading={postsLoading}
          postsError={postsError}
          onModal={openModal}
          onMembership={openMembershipModal}
          trustBadges={customerTrustBadges}
           winningTicketImages={winningTicketImages}
        />
      </main>

      {modal === 'review' && <Modal title="당첨 후기를 남겨주세요" description="회원님의 기록이 다음 사람에게는 가장 현실적인 기준이 됩니다." onClose={() => setModal(null)}>{submitted ? <div className="success-note">후기가 접수되었습니다. 검토 후 당첨 아카이브에 반영됩니다.</div> : <form className="form" onSubmit={submitForm}><label>닉네임<input name="memberName" required placeholder="공개할 이름을 입력하세요" /></label><label>당첨 회차<input name="drawAndRank" required placeholder="예: 1184회 / 3등" /></label><label>후기<textarea name="content" required placeholder="분석을 시작한 계기와 경험을 들려주세요." /></label>{submitError && <div className="form-error">{submitError}</div>}<button className="gold-button" type="submit" disabled={submitting}>{submitting ? '접수 중...' : '후기 제출하기'} <ArrowRight size={15} /></button></form>}</Modal>}
      {modal === 'auth' && <Modal title={authMode === 'login' ? '다시 만나서 반갑습니다' : '로또리코 시작하기'} description={authMode === 'login' ? '아이디와 비밀번호로 로그인하세요.' : '가입 신청 후 관리자 승인 절차를 거쳐 안내드립니다.'} onClose={() => setModal(null)}><div className="auth-switch"><button className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setSubmitted(false); setSubmitError(''); }}>로그인</button><button className={authMode === 'join' ? 'active' : ''} onClick={() => { setAuthMode('join'); setSubmitted(false); setSubmitError(''); }}>회원가입</button></div>{submitted ? <div className="success-note">{authMode === 'login' ? '로그인되었습니다.' : '가입 신청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.'}</div> : <form className="form" onSubmit={submitForm}><label>아이디<input name="username" required minLength={3} maxLength={32} autoComplete="username" placeholder="아이디를 입력하세요" /></label><label>비밀번호<input name="password" required minLength={6} maxLength={100} type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} placeholder="6자 이상 입력하세요" /></label>{authMode === 'join' && <><label>이름<input name="name" required maxLength={80} placeholder="이름을 입력하세요" /></label><label>전화번호<input name="phone" required type="tel" minLength={8} maxLength={30} autoComplete="tel" placeholder="010-0000-0000" /></label></>}{submitError && <div className="form-error">{submitError}</div>}<button className="gold-button" type="submit" disabled={submitting}>{submitting ? (authMode === 'login' ? '로그인 중...' : '신청 중...') : authMode === 'login' ? '로그인하기' : '회원가입 신청하기'} <ArrowRight size={15} /></button></form>}</Modal>}
      {modal === 'membership' && <Modal title="멤버십 신청" description="신청 내용을 확인한 뒤 입력하신 연락처로 안내드립니다." onClose={() => setModal(null)}>{submitted ? <div className="success-note">멤버십 신청이 접수되었습니다. 담당자가 확인 후 안내드리겠습니다.</div> : <form className="form" onSubmit={submitForm}><label>성함<input name="name" required placeholder="신청하실 성함" /></label><label>연락처<input name="contact" required placeholder="안내받으실 연락처" /></label><label>관심 플랜<input name="category" value={membershipPlan === 'vip' ? '1·2등 VIP 안내' : '3등 분석 번호 멤버십 / 330,000원'} readOnly /></label><label>신청 메모<textarea name="message" required placeholder={membershipPlan === 'vip' ? 'VIP 서비스에서 확인하고 싶은 내용을 적어주세요.' : '신청 관련 내용을 적어주세요.'} /></label>{submitError && <div className="form-error">{submitError}</div>}<button className="gold-button" type="submit" disabled={submitting}>{submitting ? '신청 중...' : '멤버십 신청하기'} <ArrowRight size={15} /></button></form>}</Modal>}
      {modal === 'video' && <Modal title="당첨 회원 인터뷰 준비 중" description="관리자가 검증한 회원 인터뷰만 공개합니다." onClose={() => setModal(null)}><div style={{ aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle, #7b571b, #101318 63%)', border: '1px solid #685127' }}><span className="video-play" style={{ position: 'static', transform: 'none' }}><Play size={23} fill="currentColor" /></span></div><p style={{ margin: '18px 0 0' }}>현재 공개 가능한 검증 자료를 준비하고 있습니다. 확인되지 않은 영상이나 당첨 정보는 표시하지 않습니다.</p></Modal>}
      {modal === 'refund' && <Modal title="주식회사 로또리코 공식 안내문" description="고객 여러분께 드리는 사과의 말씀과 환불 접수 안내" onClose={() => setModal(null)}>{submitted ? <div className="success-note">환불 신청이 접수되었습니다. 담당자가 확인 후 순차적으로 연락드리겠습니다.</div> : <div className="refund-content"><div className="refund-notice"><p>안녕하세요. <strong>주식회사 로또리코</strong>입니다.</p><p>그동안 저희 서비스를 믿고 이용해주신 고객 여러분께 깊은 감사의 말씀을 드리며, 서비스 이용에 불편을 드린 점 진심으로 사과드립니다.</p><p>당사는 고객님들의 소중한 의견을 수렴하여, 서비스 만족도가 미흡하셨던 분들을 대상으로 환불 절차를 진행하고자 합니다. 접수해주신 내용을 바탕으로 신속하고 정확하게 처리해드릴 것을 약속드립니다.</p><p>환불을 원하시는 고객님께서는 아래 '환불 신청하기' 버튼을 눌러 신청 양식을 작성해주시기 바랍니다.</p><p>다시 한번 죄송한 말씀 전하며, 끝까지 책임지는 자세로 임하겠습니다.</p></div>{!refundFormOpen ? <div className="modal-actions"><button className="outline-button" onClick={() => setModal(null)}>닫기</button><button className="gold-button" onClick={() => setRefundFormOpen(true)}>환불 신청하기</button></div> : <form className="form refund-form" onSubmit={submitForm} style={{ marginTop: '26px', borderTop: '1px solid #2d3138', paddingTop: '26px' }}><div className="refund-form-header" style={{ marginBottom: '16px', borderBottom: 'none', paddingBottom: 0 }}><h3>환불 접수 양식</h3><p style={{ margin: 0, color: '#888e98', fontSize: '12px' }}>결제하신 금액과 환불을 요청하시는 신청금액을 반드시 포함하여 작성해주세요.</p></div><input type="hidden" name="category" value="환불 신청" /><label>이름<input name="name" required placeholder="가입하신 성함을 입력해주세요" /></label><label>연락처<input name="contact" required placeholder="연락 가능한 휴대전화 번호" /></label><label>환불 신청금액 및 내용<textarea name="message" required placeholder="결제하신 금액과 환불을 요청하시는 신청금액을 반드시 포함하여 작성해주세요." rows={3} /></label>{submitError && <div className="form-error">{submitError}</div>}<div className="modal-actions" style={{ marginTop: '18px' }}><button className="outline-button" type="button" onClick={() => setRefundFormOpen(false)}>취소</button><button className="gold-button" type="submit" disabled={submitting}>{submitting ? '접수 중...' : '환불 신청 제출'} <ArrowRight size={15} /></button></div></form>}</div>}</Modal>}
    </div>
  );
}

function PublicPageHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="topbar lotto-topbar standalone-topbar">
      <div className="shell topbar-inner">
        <Link className="brand lotto-brand" href="/" onClick={() => setMenuOpen(false)} aria-label="로또리코 홈">
          <span className="clover-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="brand-text">로또리코<small>실제 당첨의 기쁨을 함께합니다</small></span>
        </Link>
        <nav className={menuOpen ? 'nav mobile-open' : 'nav'} aria-label="주요 메뉴">
          <Link href="/reviews" onClick={() => setMenuOpen(false)}>당첨 후기</Link>
          <Link href="/#stories" onClick={() => setMenuOpen(false)}>당첨자 사진</Link>
          <Link href="/#membership" onClick={() => setMenuOpen(false)}>멤버십</Link>
          <Link href="/community" onClick={() => setMenuOpen(false)}>커뮤니티</Link>
          <Link href="/#support" onClick={() => setMenuOpen(false)}>고객센터</Link>
        </nav>
        <div className="top-actions">
          <Link className="login-button standalone-login" href="/#top">홈으로</Link>
          <button className="mobile-menu" aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={menuOpen} onClick={() => setMenuOpen((current) => !current)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
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
          <Link className="brand lotto-brand" href="/" aria-label="로또리코 홈"><span className="clover-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-text">로또리코<small>실제 당첨의 기쁨을 함께합니다</small></span></Link>
          <div className="footer-nav">
            <div><strong>EXPLORE</strong><Link href="/reviews">당첨 후기</Link><Link href="/community">커뮤니티</Link><Link href="/#membership">멤버십</Link></div>
            <div><strong>HELP</strong><Link href="/#support">고객센터</Link><Link href="/#top">홈페이지</Link></div>
          </div>
          <div className="footer-call"><strong>환불 보상 상담 전화</strong><span>환불 및 보상 관련 문의 전용 번호입니다.</span><a className="gold footer-kakao-link" href="tel:070-8095-3814"><Phone size={12} />070-8095-3814</a></div>
        </div>
        <div className="footer-bottom"><span>© 2025 LOTTORICO. ALL RIGHTS RESERVED.</span><span>이용약관　개인정보처리방침</span></div>
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
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePublishedCommunityPage(page);
  const posts = data?.items || [];
  const pagination = data?.pagination;
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
                <div><strong>{pagination?.total ?? posts.length}</strong><span>공개된 토론</span></div>
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
            {pagination && pagination.total > 0 && (
              <div className="public-pagination" aria-label="커뮤니티 페이지 이동">
                <button className="outline-button" type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>이전</button>
                <span>총 {pagination.total.toLocaleString()}개 · {pagination.page} / {pagination.totalPages} 페이지</span>
                <button className="outline-button" type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}>다음</button>
              </div>
            )}
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
                <div className="community-side-top"><div><span className="mono muted">RECENT MEMBERS</span><h4>최근 글을 남긴 회원</h4></div><span className="online">공개 {pagination?.total ?? posts.length}</span></div>
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