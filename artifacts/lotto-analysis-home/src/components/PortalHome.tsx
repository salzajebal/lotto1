import type { ReactNode } from 'react';
import { ArrowRight, BarChart3, Check, ChevronRight, FileCheck2, MessageCircle, Play, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Link } from 'wouter';
import interviewImageOne from '@assets/image_1788153329574.png';
import interviewImageTwo from '@assets/image_1788153332657.png';
import interviewImageThree from '@assets/image_1788153336388.png';
import interviewImageFour from '@assets/image_1788153339617.png';

type Review = { id: number; memberName: string; drawNumber: number; rank: string; amount: number; content: string; createdAt: string };
type Post = { id: number; authorName: string; category: string; title: string; content: string; replyCount: number; createdAt: string };
const photoStories = [
  { image: interviewImageOne, draw: '912회', amount: '1,493,500,581원', label: '1등 당첨자 인터뷰' },
  { image: interviewImageTwo, draw: '860회', amount: '1,879,899,825원', label: '당첨 현장 사진' },
  { image: interviewImageThree, draw: '757회', amount: '739,839,858원', label: '당첨 현장 사진' },
  { image: interviewImageFour, draw: '800회', amount: '1,632,246,205원', label: '당첨 현장 사진' },
];
const ticketProofDetails = [
  { draw: '1239회', issuedAt: '2026/08/31' },
  { draw: '1238회', issuedAt: '2026/08/24' },
  { draw: '1237회', issuedAt: '2026/08/18' },
  { draw: '1044회', issuedAt: '2022/12/03' },
  { draw: '841회', issuedAt: '2023/07/15' },
  { draw: '1118회', issuedAt: '2023/05/04' },
  { draw: '1222회', issuedAt: '2026/05/02' },
];

const amount = (value: number) => value > 0 ? `${value.toLocaleString('ko-KR')}원` : '금액 비공개';
const date = (value: string) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
const BallRow = ({ draw }: { draw: number }) => <div className="portal-balls" aria-label={`${draw}회 분석 기록`}><span>{String(draw).slice(-2).padStart(2, '0')}</span><span>08</span><span>14</span><span>23</span><span>33</span><span>45</span></div>;

export function PortalHome({
  reviews, posts, reviewsLoading, reviewsError, postsLoading, postsError, onModal, onMembership, renderKakao, trustBadges, winningTicketImages,
}: {
  reviews: Review[];
  posts: Post[];
  reviewsLoading: boolean;
  reviewsError: boolean;
  postsLoading: boolean;
  postsError: boolean;
  onModal: (name: 'review' | 'support' | 'membership' | 'video') => void;
  onMembership: (plan: 'vip' | 'premium') => void;
  renderKakao: (className: string) => ReactNode;
  trustBadges: { src: string; alt: string; label: string }[];
  winningTicketImages: string[];
}) {
  const recentReviews = reviews.slice(0, 3);
  const recentPosts = posts.slice(0, 3);
  const ticketProofRecords = winningTicketImages.map((image, index) => ({
    image,
    draw: ticketProofDetails[index]?.draw ?? `당첨 용지 ${String(index + 1).padStart(2, '0')}`,
    issuedAt: ticketProofDetails[index]?.issuedAt ?? '일자 확인 필요',
    label: `실제 당첨 용지 ${String(index + 1).padStart(2, '0')}`,
  }));
  const latestTicketProofs = ticketProofRecords.slice(0, 3);
  const proofCount = reviews.length + ticketProofRecords.length;
  return <div className="portal-home">
    <div className="portal-ticker"><div className="shell"><span><FileCheck2 size={15} /> 공개 증빙 <b>{proofCount}건</b></span><span><Trophy size={15} /> 검토 완료 후기 <b>{reviews.length}건</b></span><span>관리자 검토 후 공개되는 기록입니다</span></div></div>
    <section className="shell portal-section" id="proof">
      <div className="portal-section-head"><div><p className="portal-eyebrow">01 / RECENT PROOF</p><h2>최신 당첨 증빙</h2><p>실제 회원이 제출한 기록을 검토 후 공개합니다.</p></div><Link data-testid="link-all-winning-reviews" className="portal-text-link" href="/reviews">전체 보기 <ChevronRight size={15} /></Link></div>
      <div className="portal-receipts">
        {latestTicketProofs.map((proof, index) => <article className="portal-receipt portal-photo-receipt" key={proof.image} data-testid={`card-photo-proof-${index + 1}`}><div className="portal-paper-top"><span>PHOTO PROOF</span><span>{proof.issuedAt}</span></div><div className="portal-proof-photo"><img src={proof.image} alt={`${proof.draw} ${proof.label} 증빙 사진`} /></div><div className="portal-receipt-main"><span>{proof.draw}</span><strong>실제 당첨 용지</strong><b>사진 증빙 자료</b></div><div className="portal-receipt-meta"><span>회원 제출 자료</span><span>원본 흐림 처리 <ShieldCheck size={12} /></span></div></article>)}
        {recentReviews.map((review, index) => <article className="portal-receipt" key={review.id} data-testid={`card-winning-proof-${review.id}`}><div className="portal-paper-top"><span>LOTTO 6/45</span><span>{date(review.createdAt)}</span></div><div className="portal-receipt-main"><span>{review.drawNumber}회</span><strong>{review.rank}</strong><b>{amount(review.amount)}</b></div><BallRow draw={review.drawNumber} /><div className="portal-receipt-meta"><span>{review.memberName} 회원</span><span>회원 증빙 <ShieldCheck size={12} /></span></div><i className={`portal-stamp stamp-${index}`}>VERIFIED<br />RECORD</i></article>)}
        {reviewsLoading && <div className="public-empty">최신 당첨 증빙을 불러오는 중입니다.</div>}
        {reviewsError && <div className="public-empty public-error">당첨 증빙을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>}
        {!reviewsLoading && !reviewsError && !recentReviews.length && !latestTicketProofs.length && <div className="public-empty">검토 완료된 최신 당첨 증빙이 등록되면 이곳에 표시됩니다.</div>}
      </div>
      <div className="portal-ticket-gallery" aria-label="로또 당첨 용지 사진">
        <div className="portal-ticket-gallery-head">
          <div><p className="portal-eyebrow">TICKET PHOTO ARCHIVE</p><h3>사진으로 확인하는 당첨 용지</h3></div>
          <p>개인정보가 흐림 처리된 실제 용지 사진입니다.</p>
        </div>
        <div className="portal-ticket-gallery-grid">
          {ticketProofRecords.map((proof, index) => (
            <figure className={`portal-ticket-photo ${index < 3 ? 'portal-ticket-photo-current' : ''}`} key={proof.image}>
              <img src={proof.image} alt={`${proof.draw} 당첨 용지 사진`} />
              <figcaption><b>{proof.draw}</b><span>{proof.issuedAt}</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="portal-table"><div className="portal-table-title"><div><p className="portal-eyebrow">ALL RECORDS</p><h3>전체 당첨 내역</h3></div><Link data-testid="link-winning-records" className="portal-text-link" href="/reviews">당첨 상세 보기 <ChevronRight size={15} /></Link></div><div className="portal-table-head"><span>회차 / 일자</span><span>당첨 등수</span><span>당첨 금액</span><span>회원</span><span /></div>
        {ticketProofRecords.map((proof, index) => <div className="portal-table-row portal-table-photo-row" key={`table-${proof.image}`} data-testid={`row-photo-proof-${index + 1}`}><span><b>{proof.draw}</b><small>{proof.issuedAt}</small></span><strong>사진 증빙</strong><b>실물 확인</b><span>회원 제출 자료</span><span aria-hidden="true" /></div>)}
        {recentReviews.map(review => <Link className="portal-table-row" key={review.id} href="/reviews" data-testid={`link-winning-detail-${review.id}`}><span><b>{review.drawNumber}회</b><small>{date(review.createdAt)}</small></span><strong className={review.rank === '1등' ? 'first' : ''}>{review.rank}</strong><b>{amount(review.amount)}</b><span>{review.memberName} 회원</span><ChevronRight size={15} /></Link>)}
        {!reviewsLoading && !reviewsError && !recentReviews.length && !ticketProofRecords.length && <div className="portal-table-empty">공개된 전체 당첨 내역이 없습니다.</div>}
      </div>
    </section>
    <section className="portal-stories" id="stories">
      <div className="shell">
        <div className="portal-section-head portal-dark-head">
          <div><p className="portal-eyebrow gold">02 / MEMBER STORIES</p><h2>숫자 뒤에 있는<br /><em>사람의 이야기</em></h2><p>당첨 회원의 사진과 후기를 함께 공개합니다.</p></div>
          <Link data-testid="link-all-reviews" className="portal-text-link light" href="/reviews">후기 전체보기 <ChevronRight size={15} /></Link>
        </div>
        <div className="portal-story-grid">
          <figure data-testid="card-featured-photo" className="portal-feature-story portal-image-feature">
            <img className="portal-story-image" src={photoStories[0].image} alt={`${photoStories[0].draw} 당첨자 현장 사진`} />
            <span className="portal-story-image-shade" />
            <div className="portal-story-copy"><small>당첨자 현장 사진 · {photoStories[0].draw}</small><h3>“당첨의 순간과<br />그 후의 이야기를 사진으로 전합니다.”</h3><p>{photoStories[0].amount}</p></div>
          </figure>
          <div className="portal-photo-archive" aria-label="당첨자 사진 기록">
            <div className="portal-photo-archive-head">
              <small>IMAGE ARCHIVE</small>
              <strong>당첨자 사진 기록</strong>
              <span>영상이 아닌 당첨 현장 이미지입니다.</span>
            </div>
            <div className="portal-photo-grid">
              {photoStories.slice(1).map((story, index) => (
                <figure className="portal-photo-card" key={story.image} data-testid={`card-winning-photo-${index + 2}`}>
                  <img src={story.image} alt={`${story.draw} ${story.label}`} />
                  <figcaption><small>{story.draw}</small><b>{story.label}</b><i>{story.amount}</i></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="shell portal-section portal-lower" id="method"><div className="portal-method"><p className="portal-eyebrow">03 / OUR METHOD</p><h2>분석 기준을<br /><em>숨기지 않습니다.</em></h2><p>매주 같은 순서로 데이터를 읽고, 결과를 다시 기록합니다.</p>{[{ Icon: BarChart3, title: '출현 빈도와 간격', desc: '최근 회차의 출현 횟수와 재등장 주기를 비교합니다.' }, { Icon: ShieldCheck, title: '조합 밸런스', desc: '홀짝·저고·끝수·연속수·총합을 점검합니다.' }, { Icon: Check, title: '결과 복기와 보정', desc: '실제 결과를 다음 주 필터에 반영합니다.' }].map(({ Icon, title, desc }, index) => <div className="portal-method-row" key={title}><b>0{index + 1}</b><Icon size={18} /><span><strong>{title}</strong><small>{desc}</small></span></div>)}</div>
      <aside className="portal-community" id="community"><div className="portal-side-head"><span className="portal-eyebrow">COMMUNITY LOUNGE</span><Link data-testid="link-all-community" className="portal-text-link" href="/community">전체보기 <ChevronRight size={13} /></Link></div><h3>이번 주 회원 기록</h3>{recentPosts.map(post => <Link className="portal-post" key={post.id} href="/community" data-testid={`link-community-post-${post.id}`}><span>{post.authorName.slice(0, 1)}</span><span><b>{post.authorName} · {post.category}</b><small>“{post.title} — {post.content}”</small></span><ChevronRight size={14} /></Link>)}{postsLoading && <div className="public-empty">커뮤니티를 불러오는 중입니다.</div>}{postsError && <div className="public-empty public-error">커뮤니티를 불러오지 못했습니다.</div>}{!postsLoading && !postsError && !recentPosts.length && <div className="public-empty">공개된 회원 기록이 아직 없습니다.</div>}<Link data-testid="link-community-entry" className="portal-community-cta" href="/community"><Users size={15} /> 커뮤니티 입장하기</Link></aside></section>
     <section className="shell portal-membership" id="membership"><div className="portal-membership-intro"><p className="portal-eyebrow gold">LOTTORICO MEMBERSHIP</p><h2>이번 주 분석 기준을<br /><em>회원 전용으로 받아보세요.</em></h2><p>주간 분석 번호 · 리포트 · 결과 복기 · 회원 커뮤니티</p></div><div className="portal-membership-offers"><article className="portal-offer portal-offer-vip"><small>1·2등 분석 번호</small><strong>VIP 상담</strong><p>회원님의 목표에 맞춘<br />맞춤 상담으로 안내합니다.</p><button data-testid="button-vip-consult" onClick={() => onMembership('vip')}>VIP 상담 <ArrowRight size={15} /></button></article><article className="portal-offer portal-offer-premium"><small>3등 멤버십 / 1년</small><strong>330,000<em>원</em></strong><button data-testid="button-membership-consult" onClick={() => onMembership('premium')}>가입 상담 <ArrowRight size={15} /></button></article></div></section>
     <section className="shell portal-support" id="support"><div><p className="portal-eyebrow">CUSTOMER CENTER</p><h2>궁금한 점은<br /><em>카카오톡으로 물어보세요.</em></h2><p>1·2등 분석 번호는 회원님의 목표에 맞춘 별도 상담으로 안내합니다.</p></div><div className="portal-support-actions">{renderKakao('portal-support-button')}<button data-testid="button-support-inquiry" className="portal-support-inquiry" onClick={() => onModal('support')}><MessageCircle size={15} /> 문의 남기기</button></div></section>
    <section className="portal-review-strip"><div className="shell"><div><p className="portal-eyebrow">MEMBER REVIEW</p><h2>회원 후기</h2><p>고객이 직접 제출하고 검토 후 공개한 실제 기록입니다.</p></div><div>{recentReviews[0] ? <blockquote>“{recentReviews[0].content}”<small>{recentReviews[0].memberName} · {recentReviews[0].rank}</small></blockquote> : <div className="public-empty">공개된 회원 후기가 아직 없습니다.</div>}<button data-testid="button-write-review" className="portal-review-button" onClick={() => onModal('review')}>후기 작성하기 <MessageCircle size={15} /></button></div></div></section>
      <section className="portal-trust-info" id="trust-info" aria-label="고객만족도 및 신뢰 정보"><div className="shell"><div className="portal-trust-info-content"><div className="portal-trust-badge-viewport"><div className="portal-trust-badge-track"><div className="portal-trust-badge-set">{trustBadges.map((badge) => <div className="portal-trust-badge" key={badge.src}><div className="portal-trust-badge-logo"><img src={badge.src} alt={badge.alt} /></div><p className="portal-trust-badge-label">{badge.label}</p></div>)}</div><div className="portal-trust-badge-set" aria-hidden="true">{trustBadges.map((badge) => <div className="portal-trust-badge" key={`clone-${badge.src}`}><div className="portal-trust-badge-logo"><img src={badge.src} alt="" /></div><p className="portal-trust-badge-label">{badge.label}</p></div>)}</div></div></div></div></div></section>
      <footer className="portal-footer" aria-label="로또리코 사이트 정보">
        <div className="shell">
          <div className="portal-footer-top">
            <Link className="brand lotto-brand portal-footer-brand" href="/" aria-label="로또리코 홈">
              <span className="clover-mark" aria-hidden="true"><i /><i /><i /><i /></span>
              <span className="brand-text">로또리코<small>실제 당첨의 기쁨을<br />함께합니다</small></span>
            </Link>
            <div className="portal-footer-message">
              <p className="portal-footer-kicker">LOTTO RECORD / 2025</p>
              <p>번호를 고르는 순간부터<br />한 회 한 회의 기록까지 차분하게 살핍니다.</p>
            </div>
            <div className="portal-footer-contact" aria-label="고객센터 및 대표자 정보">
              <div className="portal-footer-contact-card">
                <b>고객센터</b>
                <a href="tel:070-8058-9742" aria-label="고객센터 전화 070-8058-9742">070-8058-9742</a>
              </div>
              <div className="portal-footer-contact-card">
                <b>대표자</b>
                <span>이은수</span>
              </div>
            </div>
            <nav className="portal-footer-nav" aria-label="로또리코 주요 메뉴">
              <Link href="/reviews">당첨 증빙</Link>
              <a href="#method">분석 기준</a>
              <a href="#membership">멤버십</a>
              <Link href="/community">커뮤니티</Link>
            </nav>
          </div>
          <div className="portal-footer-bottom">
            <div className="portal-footer-company-info" aria-label="법인 및 사업자 정보">
              <span>법인명 : 주식회사 로또리코</span>
              <span>대표자 : 이은수</span>
              <span>경기도 파주시 광탄면 278</span>
            </div>
            <small>© 2025 로또리코</small>
            <small>본 페이지의 번호는 분석 예시이며 당첨을 보장하지 않습니다.</small>
          </div>
        </div>
      </footer>
  </div>;
}