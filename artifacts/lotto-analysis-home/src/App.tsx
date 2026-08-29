import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  Headphones,
  Menu,
  MessageCircle,
  Play,
  X,
} from 'lucide-react';
import lottoBallsBackground from '@assets/ChatGPT_Image_2026년_8월_29일_오전_03_28_36_1787999327234.png';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type ModalName = 'review' | 'support' | 'auth' | 'membership' | 'video' | null;

const stories = [
  { rank: '3등', date: '1184회 · 서울 마포', title: '퇴근 후 10분, 처음으로 맞춘 세 자리', amount: '당첨금 1,584,725원' },
  { rank: '2등', date: '1181회 · 경기 성남', title: '8년 만에 바뀐 번호, 숫자보다 분석을 믿었어요', amount: '당첨금 61,439,872원' },
  { rank: '3등', date: '1178회 · 부산 수영', title: '아버지와 함께 고른 조합이 해냈습니다', amount: '당첨금 1,742,091원' },
];

const reviews = [
  { name: '박민서 님', meta: '3등 / 1184회', text: '매주 무작정 사다가 분석 리포트를 먼저 읽는 습관이 생겼어요. 이번에는 정말 숫자가 달라 보였습니다.' },
  { name: '정우성 님', meta: '2등 / 1181회', text: '당첨 후에도 상담팀에서 차분하게 다음 흐름을 설명해주셔서 더 믿음이 갔습니다. 기록이 남는 서비스예요.' },
  { name: '김하늘 님', meta: '멤버십 6개월', text: '커뮤니티에서 다른 회원들의 조합을 함께 보며 공부하는 재미가 있습니다. 과장 없이 오래 하는 곳.' },
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRoot = useRef<HTMLDivElement>(null);

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
    setModal(name);
    setMenuOpen(false);
  };
  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
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
            <a href="#proof" onClick={() => setMenuOpen(false)}>당첨 후기</a>
            <a href="#video" onClick={() => setMenuOpen(false)}>당첨 영상</a>
            <a href="#membership" onClick={() => setMenuOpen(false)}>멤버십</a>
            <a href="#community" onClick={() => setMenuOpen(false)}>커뮤니티</a>
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
              <button className="winner-card winner-card-person" onClick={() => openModal('video')}>
                <span className="person-portrait portrait-one" aria-hidden="true"><i /><b /></span>
                <span className="winner-board"><small>로또 1등 당첨</small><strong>5,000,000,000원</strong></span>
                <span className="winner-quote">“평생 꿈만 같아요…<br />이제 가족들과 더 행복하게 살 수 있어요”</span>
                <span className="winner-link"><Play size={14} fill="currentColor" /> 로또 1등 당첨자 인터뷰</span>
              </button>

              <button className="winner-card winner-card-receipt" onClick={() => openModal('video')}>
                <span className="receipt-paper">
                  <small>LOTTO 6/45</small>
                  <b>1등 당첨</b>
                  <strong>5,000,000,000원</strong>
                  <i>03 08 14 23 33 45</i>
                </span>
                <span className="winner-quote">“정말 믿기지 않았는데,<br />확인하는 순간 눈물이 났습니다”</span>
                <span className="winner-link"><Play size={14} fill="currentColor" /> 로또 1등 실제 당첨 영상</span>
              </button>

              <button className="winner-card winner-card-person" onClick={() => openModal('review')}>
                <span className="person-portrait portrait-two" aria-hidden="true"><i /><b /></span>
                <span className="winner-board"><small>로또 1등 당첨</small><strong>10,000,000,000원</strong></span>
                <span className="winner-quote">“저에게는 인생이 바뀐 순간이었습니다.<br />정말 감사합니다!”</span>
                <span className="winner-link"><Play size={14} fill="currentColor" /> 로또 1등 당첨자 후기</span>
              </button>
            </div>

            <div className="hero-quick-grid">
              <button className="hero-quick-card quick-gold" onClick={() => openModal('membership')}>
                <span className="quick-icon">VIP</span><strong>멤버십 서비스 안내</strong><small>전문가의 분석 번호를<br />멤버십으로 받아보세요</small><b>자세히 보기</b>
              </button>
              <button className="hero-quick-card quick-blue" onClick={() => openModal('support')}>
                <Headphones className="quick-svg" /><strong>고객센터</strong><small>궁금한 점이 있으신가요?<br />언제든지 문의주세요.</small><b>문의하기</b>
              </button>
              <a className="hero-quick-card quick-purple" href="#community">
                <MessageCircle className="quick-svg" /><strong>커뮤니티</strong><small>당첨 후기 공유, 정보 교류<br />함께하는 로또 커뮤니티</small><b>바로가기</b>
              </a>
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
            <span>1184회 3등 당첨 회원 6명</span><span className="ticker-sep">•</span>
            <span>1181회 2등 당첨 회원 1명</span><span className="ticker-sep">•</span>
            <span>검증 가능한 후기 247건</span><span className="ticker-sep">•</span><span className="ticker-highlight">매주 토요일 업데이트</span>
          </div>
        </div>

        <section className="section proof-section" id="proof">
          <div className="shell proof-grid">
            <div className="proof-lede reveal">
              <span className="eyebrow">Winning archive</span>
              <h2 className="section-title">말보다 먼저,<br /><span className="gold">기록</span>을 보여드립니다.</h2>
              <p>누구나 볼 수 있는 당첨 회차, 구매 지역, 당첨 등수. 결과가 쌓일수록 분석의 기준은 더 선명해집니다.</p>
              <div className="proof-stat"><strong>247</strong><span>회원이 직접 남긴<br />검증 가능한 후기</span></div>
            </div>
            <div className="story-list reveal delay-1">
              {stories.map((story) => (
                <article className="story" key={story.date}>
                  <div className="story-rank">{story.rank}</div>
                  <div><div className="story-meta">{story.date}</div><h3 className="story-title">{story.title}</h3></div>
                  <div className="story-amount">{story.amount}</div>
                </article>
              ))}
              <button className="outline-button" style={{ marginTop: 22 }} onClick={() => openModal('review')}>후기 더 보기 <ArrowRight size={15} /></button>
            </div>
          </div>
        </section>

        <section className="section video-section" id="video">
          <div className="shell">
            <div className="section-head reveal">
              <div><span className="eyebrow">Winning film</span><h2 className="section-title">그날의 숫자를<br /><span className="gold">직접 들어보세요.</span></h2></div>
              <p className="section-copy">당첨 회원의 목소리와 실제 구매 영수증. 숫자 뒤에 있는 사람의 이야기를 담았습니다.</p>
            </div>
            <button className="video-card reveal delay-1" onClick={() => openModal('video')} aria-label="당첨 회원 인터뷰 영상 재생">
              <div className="video-ghost" />
              <span className="video-play"><Play size={23} fill="currentColor" /></span>
              <h3>“번호를 받았을 때보다<br />확인했을 때 더 놀랐어요.”</h3>
              <p>1181회 2등 당첨자 이○○ 회원 인터뷰</p>
              <span className="video-index">01 / 06</span>
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
                <span className="mono gold">OPEN DISCUSSION / 07</span>
                <h3>이번 주 가장 오래 고민한 숫자는?</h3>
                <p>회원들이 고른 기준과 조합을 자유롭게 공유하고, 분석팀의 코멘트를 확인하세요.</p>
                <div className="community-tags"><span>최근 출현 흐름</span><span>나만의 제외수</span><span>당첨 후기</span></div>
                <a className="outline-button" href="#membership">커뮤니티 둘러보기 <ArrowRight size={15} /></a>
              </article>
              <article className="community-side reveal delay-1">
                <div className="community-side-top"><div><span className="mono muted">MEMBER LOUNGE</span><h4>지금 함께 보는 회원</h4></div><span className="online">ONLINE 32</span></div>
                <div><div className="avatars"><span className="avatar">MJ</span><span className="avatar">SY</span><span className="avatar">JK</span><span className="avatar">HN</span><span className="avatar">+28</span></div><small>이번 주 분석을 함께 복기하고 있습니다.</small></div>
              </article>
            </div>
          </div>
        </section>

        <section className="section review-section">
          <div className="shell review-grid">
            <div className="review-intro reveal"><span className="eyebrow">Member voices</span><h2 className="section-title">실제로 써본<br /><span className="gold">사람들의 말.</span></h2><p>좋은 결과만 골라 보여주지 않습니다. 멤버십을 경험한 분들의 솔직한 기록을 모았습니다.</p><div className="review-score"><span className="score-number">4.8</span><div><div className="stars" aria-label="별점 5점 중 4.8점">★★★★★</div><span className="muted">회원 만족도 / 2024–2025</span></div></div></div>
            <div className="review-stream reveal delay-1">
              {reviews.map((review) => <article className="review-card" key={review.name}><div className="review-top"><span>{review.name}</span><span>{review.meta}</span></div><blockquote>“{review.text}”</blockquote></article>)}
              <button className="outline-button" onClick={() => openModal('review')}>나의 후기 작성하기 <MessageCircle size={15} /></button>
            </div>
          </div>
        </section>

        <section className="section trust-section" id="support">
          <div className="shell">
            <div className="trust-intro reveal"><div><span className="eyebrow">Trust, not noise</span><h2 className="section-title">확인할 수 있는<br /><span className="gold">신뢰의 표식.</span></h2></div><p>배지는 교체 가능한 영역으로 운영됩니다.<br />서비스의 최신 인증과 수상 이력을 투명하게 공개합니다.</p></div>
            <div className="badges reveal delay-1">
              <div className="badge"><div><div className="badge-mark">R&amp;D</div><strong>한국연구업적통합정보시스템</strong><span>등록 연구·분석 기관</span></div></div>
              <div className="badge"><div><div className="badge-mark">1st</div><strong>고객만족 1위</strong><span>서비스 부문</span></div></div>
              <div className="badge"><div><div className="badge-mark">CSI</div><strong>소비자만족지수 1위</strong><span>분석 서비스 부문</span></div></div>
              <div className="badge"><div><div className="badge-mark">PAT</div><strong>특허증</strong><span>데이터 분석 방법론</span></div></div>
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
            <div className="footer-nav"><div><strong>EXPLORE</strong><a href="#proof">당첨 후기</a><a href="#video">당첨 영상</a><a href="#community">커뮤니티</a></div><div><strong>HELP</strong><a href="#membership">멤버십</a><button style={{ display: 'block', padding: 0, marginBottom: 10, border: 0, background: 'transparent', color: '#777e87', fontSize: 12 }} onClick={() => openModal('support')}>고객센터</button><button style={{ display: 'block', padding: 0, border: 0, background: 'transparent', color: '#777e87', fontSize: 12 }} onClick={() => openModal('auth')}>로그인</button></div></div>
            <div className="footer-call"><strong>카카오톡 채널 상담</strong><span>대표번호 없이, 카카오톡으로만 상담합니다.</span><a href="https://pf.kakao.com/" target="_blank" rel="noreferrer" className="gold" style={{ display: 'inline-block', marginTop: 13, fontSize: 12 }}>채널 바로가기 <ArrowRight size={12} style={{ verticalAlign: 'middle' }} /></a></div>
          </div>
          <div className="footer-bottom"><span>© 2025 GOLDEN PICK. ALL RIGHTS RESERVED.</span><span>이용약관　개인정보처리방침</span></div>
        </div>
      </footer>

      {modal === 'review' && <Modal title="당첨 후기를 남겨주세요" description="회원님의 기록이 다음 사람에게는 가장 현실적인 기준이 됩니다." onClose={() => setModal(null)}>{submitted ? <div className="success-note">후기가 접수되었습니다. 검토 후 당첨 아카이브에 반영됩니다.</div> : <form className="form" onSubmit={submitForm}><label>닉네임<input required placeholder="공개할 이름을 입력하세요" /></label><label>당첨 회차<input required placeholder="예: 1184회 / 3등" /></label><label>후기<textarea required placeholder="분석을 시작한 계기와 경험을 들려주세요." /></label><button className="gold-button" type="submit">후기 제출하기 <ArrowRight size={15} /></button></form>}</Modal>}
      {modal === 'support' && <Modal title="고객센터 문의" description="대표번호 대신 카카오톡 채널로 빠르고 정확하게 상담합니다." onClose={() => setModal(null)}>{submitted ? <div className="success-note">문의가 접수되었습니다. 카카오톡 채널에서 답변을 확인해주세요.</div> : <form className="form" onSubmit={submitForm}><label>문의 유형<input required placeholder="멤버십 / 분석 번호 / 결제 등" /></label><label>연락받을 카카오톡 아이디<input required placeholder="카카오톡 채널 상담을 위해 필요합니다" /></label><label>문의 내용<textarea required placeholder="궁금한 내용을 남겨주세요." /></label><button className="gold-button" type="submit">문의 접수하기 <MessageCircle size={15} /></button></form>}</Modal>}
      {modal === 'auth' && <Modal title={authMode === 'login' ? '다시 만나서 반갑습니다' : '골든 픽 시작하기'} description={authMode === 'login' ? '분석 리포트와 커뮤니티를 이어서 확인하세요.' : '매주 새로운 분석 기록을 가장 먼저 받아보세요.'} onClose={() => setModal(null)}><div className="auth-switch"><button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>로그인</button><button className={authMode === 'join' ? 'active' : ''} onClick={() => setAuthMode('join')}>회원가입</button></div>{submitted ? <div className="success-note">{authMode === 'login' ? '로그인 준비가 완료되었습니다. 곧 멤버 공간으로 이동합니다.' : '가입 신청이 접수되었습니다. 카카오톡 채널에서 안내를 확인해주세요.'}</div> : <form className="form" onSubmit={submitForm}>{authMode === 'join' && <label>이름<input required placeholder="이름을 입력하세요" /></label>}<label>이메일<input required type="email" placeholder="name@example.com" /></label><label>비밀번호<input required type="password" placeholder="6자 이상 입력하세요" /></label><button className="gold-button" type="submit">{authMode === 'login' ? '로그인하기' : '회원가입하기'} <ArrowRight size={15} /></button></form>}</Modal>}
      {modal === 'membership' && <Modal title="멤버십 상담 신청" description="신청 내용을 확인한 뒤 카카오톡 채널로 자세한 안내를 드립니다." onClose={() => setModal(null)}>{submitted ? <div className="success-note">상담 신청이 접수되었습니다. 카카오톡 채널에서 곧 안내드리겠습니다.</div> : <form className="form" onSubmit={submitForm}><label>성함<input required placeholder="상담받으실 성함" /></label><label>관심 플랜<input defaultValue="3등 분석 번호 멤버십 / 330,000원" readOnly /></label><label>상담 메모<textarea placeholder="1·2등 상담 등 남기고 싶은 내용을 적어주세요." /></label><button className="gold-button" type="submit">상담 신청하기 <ArrowRight size={15} /></button></form>}</Modal>}
      {modal === 'video' && <Modal title="당첨 회원 인터뷰" description="실제 회원의 이야기를 담은 골든 픽 인터뷰입니다." onClose={() => setModal(null)}><div style={{ aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle, #7b571b, #101318 63%)', border: '1px solid #685127' }}><span className="video-play" style={{ position: 'static', transform: 'none' }}><Play size={23} fill="currentColor" /></span></div><p style={{ margin: '18px 0 0' }}>영상 전체 공개를 준비 중입니다. 멤버십에서는 회차별 당첨 인터뷰와 분석팀의 복기 영상을 먼저 확인할 수 있습니다.</p></Modal>}
    </div>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;