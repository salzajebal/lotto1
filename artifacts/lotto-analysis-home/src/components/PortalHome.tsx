import type { ReactNode } from 'react';
import { ArrowRight, BarChart3, Check, ChevronRight, FileCheck2, MessageCircle, Play, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Link } from 'wouter';

type Review = { id: number; memberName: string; drawNumber: number; rank: string; amount: number; content: string; createdAt: string };
type Post = { id: number; authorName: string; category: string; title: string; content: string; replyCount: number; createdAt: string };

const amount = (value: number) => value > 0 ? `${value.toLocaleString('ko-KR')}원` : '금액 비공개';
const date = (value: string) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
const BallRow = ({ draw }: { draw: number }) => <div className="portal-balls" aria-label={`${draw}회 분석 기록`}><span>{String(draw).slice(-2).padStart(2, '0')}</span><span>08</span><span>14</span><span>23</span><span>33</span><span>45</span></div>;

export function PortalHome({
  reviews, posts, reviewsLoading, reviewsError, postsLoading, postsError, onModal, renderKakao, trustBadges,
}: {
  reviews: Review[];
  posts: Post[];
  reviewsLoading: boolean;
  reviewsError: boolean;
  postsLoading: boolean;
  postsError: boolean;
  onModal: (name: 'review' | 'support' | 'membership' | 'video') => void;
  renderKakao: (className: string) => ReactNode;
  trustBadges: { src: string; alt: string }[];
}) {
  const recentReviews = reviews.slice(0, 3);
  const recentPosts = posts.slice(0, 3);
  return <div className="portal-home">
    <div className="portal-ticker"><div className="shell"><span><FileCheck2 size={15} /> 공개 증빙 <b>{reviews.length}건</b></span><span><Trophy size={15} /> 검토 완료 후기 <b>{reviews.length}건</b></span><span>관리자 검토 후 공개되는 기록입니다</span></div></div>
    <section className="shell portal-section" id="proof">
      <div className="portal-section-head"><div><p className="portal-eyebrow">01 / RECENT PROOF</p><h2>최신 당첨 증빙</h2><p>실제 회원이 제출한 기록을 검토 후 공개합니다.</p></div><Link data-testid="link-all-winning-reviews" className="portal-text-link" href="/reviews">전체 보기 <ChevronRight size={15} /></Link></div>
      <div className="portal-receipts">
        {recentReviews.map((review, index) => <article className="portal-receipt" key={review.id} data-testid={`card-winning-proof-${review.id}`}><div className="portal-paper-top"><span>LOTTO 6/45</span><span>{date(review.createdAt)}</span></div><div className="portal-receipt-main"><span>{review.drawNumber}회</span><strong>{review.rank}</strong><b>{amount(review.amount)}</b></div><BallRow draw={review.drawNumber} /><div className="portal-receipt-meta"><span>{review.memberName} 회원</span><span>회원 증빙 <ShieldCheck size={12} /></span></div><i className={`portal-stamp stamp-${index}`}>VERIFIED<br />RECORD</i></article>)}
        {reviewsLoading && <div className="public-empty">최신 당첨 증빙을 불러오는 중입니다.</div>}
        {reviewsError && <div className="public-empty public-error">당첨 증빙을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>}
        {!reviewsLoading && !reviewsError && !recentReviews.length && <div className="public-empty">검토 완료된 최신 당첨 증빙이 등록되면 이곳에 표시됩니다.</div>}
      </div>
      <div className="portal-table"><div className="portal-table-title"><div><p className="portal-eyebrow">ALL RECORDS</p><h3>전체 당첨 내역</h3></div><Link data-testid="link-winning-records" className="portal-text-link" href="/reviews">당첨 상세 보기 <ChevronRight size={15} /></Link></div><div className="portal-table-head"><span>회차 / 일자</span><span>당첨 등수</span><span>당첨 금액</span><span>회원</span><span /></div>
        {recentReviews.map(review => <Link className="portal-table-row" key={review.id} href="/reviews" data-testid={`link-winning-detail-${review.id}`}><span><b>{review.drawNumber}회</b><small>{date(review.createdAt)}</small></span><strong className={review.rank === '1등' ? 'first' : ''}>{review.rank}</strong><b>{amount(review.amount)}</b><span>{review.memberName} 회원</span><ChevronRight size={15} /></Link>)}
        {!reviewsLoading && !reviewsError && !recentReviews.length && <div className="portal-table-empty">공개된 전체 당첨 내역이 없습니다.</div>}
      </div>
    </section>
    <section className="portal-stories" id="video"><div className="shell"><div className="portal-section-head portal-dark-head"><div><p className="portal-eyebrow gold">02 / MEMBER STORIES</p><h2>숫자 뒤에 있는<br /><em>사람의 이야기</em></h2><p>당첨 회원의 인터뷰와 후기를 함께 공개합니다.</p></div><button data-testid="button-all-interviews" className="portal-text-link light" onClick={() => onModal('video')}>인터뷰 전체보기 <ChevronRight size={15} /></button></div><div className="portal-story-grid"><button data-testid="button-feature-interview" className="portal-feature-story" onClick={() => onModal('video')}><span className="portal-play"><Play size={18} fill="currentColor" /></span><div><small>검증된 당첨 회원 인터뷰</small><h3>“확인된 기록과 경험을<br />영상으로 전해드립니다.”</h3></div></button><div className="portal-mini-stories">{recentReviews.slice(0, 2).map(review => <button key={review.id} data-testid={`button-interview-${review.id}`} onClick={() => onModal('video')}><Play size={14} fill="currentColor" /><span><small>{review.drawNumber}회 · MEMBER INTERVIEW</small><b>{review.content}</b><i>{review.memberName} 님</i></span><ChevronRight size={16} /></button>)}{!recentReviews.length && <div className="portal-empty-dark">공개할 당첨자 인터뷰를 준비하고 있습니다.</div>}</div></div></div></section>
    <section className="shell portal-section portal-lower" id="method"><div className="portal-method"><p className="portal-eyebrow">03 / OUR METHOD</p><h2>분석 기준을<br /><em>숨기지 않습니다.</em></h2><p>매주 같은 순서로 데이터를 읽고, 결과를 다시 기록합니다.</p>{[{ Icon: BarChart3, title: '출현 빈도와 간격', desc: '최근 회차의 출현 횟수와 재등장 주기를 비교합니다.' }, { Icon: ShieldCheck, title: '조합 밸런스', desc: '홀짝·저고·끝수·연속수·총합을 점검합니다.' }, { Icon: Check, title: '결과 복기와 보정', desc: '실제 결과를 다음 주 필터에 반영합니다.' }].map(({ Icon, title, desc }, index) => <div className="portal-method-row" key={title}><b>0{index + 1}</b><Icon size={18} /><span><strong>{title}</strong><small>{desc}</small></span></div>)}</div>
      <aside className="portal-community" id="community"><div className="portal-side-head"><span className="portal-eyebrow">COMMUNITY LOUNGE</span><Link data-testid="link-all-community" className="portal-text-link" href="/community">전체보기 <ChevronRight size={13} /></Link></div><h3>이번 주 회원 기록</h3>{recentPosts.map(post => <Link className="portal-post" key={post.id} href="/community" data-testid={`link-community-post-${post.id}`}><span>{post.authorName.slice(0, 1)}</span><span><b>{post.authorName} · {post.category}</b><small>“{post.title} — {post.content}”</small></span><ChevronRight size={14} /></Link>)}{postsLoading && <div className="public-empty">커뮤니티를 불러오는 중입니다.</div>}{postsError && <div className="public-empty public-error">커뮤니티를 불러오지 못했습니다.</div>}{!postsLoading && !postsError && !recentPosts.length && <div className="public-empty">공개된 회원 기록이 아직 없습니다.</div>}<Link data-testid="link-community-entry" className="portal-community-cta" href="/community"><Users size={15} /> 커뮤니티 입장하기</Link></aside></section>
    <section className="shell portal-membership" id="membership"><div><p className="portal-eyebrow gold">LOTTORICO MEMBERSHIP</p><h2>이번 주 분석 기준을<br /><em>회원 전용으로 받아보세요.</em></h2><p>주간 분석 번호 · 리포트 · 결과 복기 · 회원 커뮤니티</p></div><div className="portal-price"><small>3등 멤버십 / 1개월</small><strong>330,000<em>원</em></strong><button data-testid="button-membership-consult" onClick={() => onModal('membership')}>가입 상담 <ArrowRight size={15} /></button></div></section>
     <section className="shell portal-support" id="support"><div><p className="portal-eyebrow">CUSTOMER CENTER</p><h2>궁금한 점은<br /><em>카카오톡으로 물어보세요.</em></h2><p>1·2등 분석 번호는 회원님의 목표에 맞춘 별도 상담으로 안내합니다.</p></div><div className="portal-support-actions">{renderKakao('portal-support-button')}<button data-testid="button-support-inquiry" className="portal-support-inquiry" onClick={() => onModal('support')}><MessageCircle size={15} /> 문의 남기기</button></div></section>
    <section className="portal-review-strip"><div className="shell"><div><p className="portal-eyebrow">MEMBER REVIEW</p><h2>회원 후기</h2><p>고객이 직접 제출하고 검토 후 공개한 실제 기록입니다.</p></div><div>{recentReviews[0] ? <blockquote>“{recentReviews[0].content}”<small>{recentReviews[0].memberName} · {recentReviews[0].rank}</small></blockquote> : <div className="public-empty">공개된 회원 후기가 아직 없습니다.</div>}<button data-testid="button-write-review" className="portal-review-button" onClick={() => onModal('review')}>후기 작성하기 <MessageCircle size={15} /></button></div></div></section>
      <section className="portal-trust-info" id="trust-info" aria-labelledby="portal-trust-info-title"><div className="shell"><div className="portal-trust-info-content"><p className="portal-eyebrow">CUSTOMER TRUST</p><h2 id="portal-trust-info-title">고객만족도 및 신뢰 정보</h2><p className="portal-trust-info-note">고객님께서 제공해주신 만족도·신뢰 관련 자료입니다.</p><div className="portal-trust-badge-grid">{trustBadges.map((badge) => <div className="portal-trust-badge" key={badge.src}><img src={badge.src} alt={badge.alt} /></div>)}</div></div></div></section>
    <footer className="portal-footer"><div className="shell"><div><b>로또리코</b><span>기록으로 확인하는 로또 분석 서비스</span></div><div><Link href="/reviews">당첨 증빙</Link><a href="#method">분석 기준</a><a href="#membership">멤버십</a><Link href="/community">커뮤니티</Link></div><small>© 2025 로또리코 · 본 페이지의 번호는 분석 예시이며 당첨을 보장하지 않습니다.</small></div></footer>
  </div>;
}