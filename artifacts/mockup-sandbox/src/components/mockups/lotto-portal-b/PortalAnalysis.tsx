import React, { useState } from 'react';
import { ArrowRight, BarChart3, Check, ChevronRight, Clock3, FileCheck2, MessageCircle, Play, Search, ShieldCheck, Trophy, Users } from 'lucide-react';
import './PortalAnalysis.css';

const winning = [
  { draw: '1184회', rank: '3등', amount: '1,584,725원', area: '서울 서초구', date: '2024.08.24', nums: ['03', '08', '14', '23', '33', '45'] },
  { draw: '1183회', rank: '2등', amount: '54,201,110원', area: '경기 용인시', date: '2024.08.17', nums: ['07', '12', '18', '29', '34', '42'] },
  { draw: '1181회', rank: '2등', amount: '61,439,872원', area: '경기 성남시', date: '2024.08.03', nums: ['04', '11', '19', '27', '35', '41'] },
];

const posts = [
  ['박민서', '1184회 · 3등', '번호를 고르는 기준이 생기니 결과를 기다리는 마음도 훨씬 차분해졌습니다.'],
  ['정우성', '1181회 · 2등', '적중한 부분과 아닌 부분을 함께 보여주는 점이 믿음이 갔어요.'],
  ['김하늘', '1178회 · 3등', '매주 리포트를 읽고 직접 기록하는 습관이 생겼습니다.'],
];
const methodItems = [
  { num: '01', title: '출현 빈도와 간격', desc: '최근 회차의 출현 횟수와 재등장 주기를 비교합니다.', Icon: BarChart3 },
  { num: '02', title: '조합 밸런스', desc: '홀짝·저고·끝수·연속수·총합을 점검합니다.', Icon: ShieldCheck },
  { num: '03', title: '결과 복기와 보정', desc: '실제 결과를 다음 주 필터에 반영합니다.', Icon: Check },
];

function Balls({ nums, tone = 'dark' }: { nums: string[]; tone?: 'dark' | 'light' }) {
  return <div className={`pb-balls ${tone}`}>{nums.map((num) => <span key={num}>{num}</span>)}</div>;
}

export function PortalAnalysis() {
  const [tab, setTab] = useState<'proof' | 'interview'>('proof');
  const [notice, setNotice] = useState('');
  const notify = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 2200); };

  return (
    <div className="portal-b">
      <div className="pb-topline"><div className="pb-shell"><span><i /> 매주 토요일 업데이트</span><span>마지막 기록 1184회</span><button onClick={() => notify('최신 기록을 확인했습니다.')}>업데이트 확인 <ArrowRight size={13} /></button></div></div>
      <header className="pb-nav"><div className="pb-shell pb-nav-inner"><button className="pb-brand" onClick={() => notify('골든픽 홈입니다.')}><span className="pb-mark">G</span><span><b>GOLDEN PICK</b><small>LOTTO RECORDS / SINCE 2018</small></span></button><nav><a href="#proof">당첨 증빙</a><a href="#stories">당첨자 인터뷰</a><a href="#method">분석 기준</a><a href="#community">커뮤니티</a><a href="#membership">멤버십 안내</a></nav><div className="pb-nav-actions"><button onClick={() => notify('로그인 화면을 준비 중입니다.')}>로그인</button><button className="pb-kakao" onClick={() => notify('카카오톡 상담을 준비 중입니다.')}><MessageCircle size={15} /> 카카오톡 상담</button></div></div></header>

      <main>
        <section className="pb-hero"><div className="pb-hero-glow" /><div className="pb-shell pb-hero-inner"><div><p className="pb-eyebrow gold">GOLDEN PICK / VERIFIED ANALYSIS</p><h1>당첨의 순간을<br /><em>기록으로 확인하세요.</em></h1><p className="pb-hero-copy">말보다 먼저 실제 당첨 영수증과 회원의 이야기를 보여드립니다.<br />확인된 회차, 등수, 금액만 차곡차곡 남깁니다.</p><div className="pb-hero-actions"><button className="pb-gold-btn" onClick={() => notify('최신 증빙 자료로 이동합니다.')}>최신 증빙 자료 보기 <ArrowRight size={17} /></button><button className="pb-ghost-btn" onClick={() => notify('분석 기준 안내를 준비 중입니다.')}>분석 기준 확인</button></div></div><div className="pb-hero-stat"><span>PUBLIC RECORD</span><strong>2,841</strong><small>누적 공개 당첨 기록</small><button onClick={() => notify('전체 기록을 불러옵니다.')}>공개 기준 보기 <ChevronRight size={14} /></button></div></div></section>

        <div className="pb-ticker"><div className="pb-shell"><span><FileCheck2 size={15} /> 누적 증빙 <b>2,841건</b></span><span><Trophy size={15} /> 1184회 확인 회원 <b>12명</b></span><span><Clock3 size={15} /> 마지막 업데이트 <b>2024.08.24 20:45</b></span></div></div>

        <section className="pb-shell pb-section" id="proof"><div className="pb-section-head"><div><p className="pb-eyebrow">01 / RECENT PROOF</p><h2>최신 당첨 증빙</h2><p>실제 회원이 보내주신 자료를 검토 후 공개합니다.</p></div><button className="pb-text-btn" onClick={() => notify('전체 당첨 기록을 준비 중입니다.')}>전체 보기 <ChevronRight size={15} /></button></div><div className="pb-receipts">{winning.map((item, index) => <article className="pb-receipt" key={item.draw}><div className="pb-paper-top"><span>LOTTO 6/45</span><span>{item.date}</span></div><div className="pb-receipt-main"><span className="pb-draw">{item.draw}</span><strong>{item.rank}</strong><b>{item.amount}</b></div><Balls nums={item.nums} tone="light" /><div className="pb-receipt-meta"><span>{item.area}</span><span>회원 증빙 <ShieldCheck size={12} /></span></div><i className={`pb-stamp stamp-${index}`}>VERIFIED<br />RECORD</i></article>)}</div><div className="pb-proof-table"><div className="pb-table-title"><div><p className="pb-eyebrow">ALL RECORDS</p><h3>전체 당첨 내역</h3></div><label><Search size={14} /><input placeholder="회차·지역 검색" onChange={() => undefined} /></label></div><div className="pb-table-head"><span>회차 / 일자</span><span>당첨 등수</span><span>당첨 금액</span><span>구매 지역</span><span /></div>{[...winning, { draw: '1180회', rank: '1등', amount: '2,140,500,000원', area: '서울 강남구', date: '2024.07.27' }].map((item) => <button className="pb-table-row" key={item.draw} onClick={() => notify(`${item.draw} 상세 증빙을 확인합니다.`)}><span><b>{item.draw}</b><small>{item.date}</small></span><strong className={item.rank === '1등' ? 'first' : ''}>{item.rank}</strong><b>{item.amount}</b><span>{item.area}</span><ChevronRight size={15} /></button>)}</div></section>

        <section className="pb-dark-section" id="stories"><div className="pb-shell"><div className="pb-section-head dark-head"><div><p className="pb-eyebrow gold">02 / MEMBER STORIES</p><h2>숫자 뒤에 있는<br /><em>사람의 이야기</em></h2><p>당첨 회원의 인터뷰와 후기를 함께 공개합니다.</p></div><button className="pb-text-btn light" onClick={() => notify('인터뷰 전체보기를 준비 중입니다.')}>인터뷰 전체보기 <ChevronRight size={15} /></button></div><div className="pb-story-grid"><button className="pb-feature-story" onClick={() => notify('인터뷰 영상을 준비 중입니다.')}><span className="pb-play"><Play size={18} fill="currentColor" /></span><div><small>1181회 2등 당첨자 인터뷰 · 03:42</small><h3>“적중한 부분과 아닌 부분을<br />함께 보여줘서 믿음이 갔어요.”</h3></div></button><div className="pb-mini-stories">{[['1184회', '처음으로 3등에 당첨됐습니다.', '박민서'], ['1178회', '매주 기록하는 습관이 생겼어요.', '김하늘']].map(([draw, title, name]) => <button key={draw} onClick={() => notify(`${draw} 인터뷰를 준비 중입니다.`)}><span className="pb-mini-play"><Play size={14} fill="currentColor" /></span><span><small>{draw} · MEMBER INTERVIEW</small><b>{title}</b><i>{name} 님</i></span><ChevronRight size={16} /></button>)}</div></div></div></section>

        <section className="pb-shell pb-section pb-lower-grid" id="method"><div className="pb-method"><p className="pb-eyebrow">03 / OUR METHOD</p><h2>분석 기준을<br /><em>숨기지 않습니다.</em></h2><p className="pb-copy">매주 같은 순서로 데이터를 읽고, 결과를 다시 기록합니다.</p>{methodItems.map(({ num, title, desc, Icon }) => <div className="pb-method-row" key={num}><b>{num}</b><Icon size={18} /><span><strong>{title}</strong><small>{desc}</small></span></div>)}</div><aside className="pb-community" id="community"><div className="pb-side-head"><span className="pb-eyebrow">COMMUNITY LOUNGE</span><button onClick={() => notify('커뮤니티 전체보기를 준비 중입니다.')}>전체보기 <ChevronRight size={13} /></button></div><h3>이번 주 회원 기록</h3>{posts.map(([name, draw, text]) => <button className="pb-post" key={name} onClick={() => notify(`${name}님의 후기를 확인합니다.`)}><span>{name.slice(0, 1)}</span><span><b>{name} · {draw}</b><small>“{text}”</small></span><ChevronRight size={14} /></button>)}<button className="pb-community-cta" onClick={() => notify('커뮤니티 입장을 준비 중입니다.')}><Users size={15} /> 커뮤니티 입장하기</button></aside></section>

        <section className="pb-shell pb-membership" id="membership"><div><p className="pb-eyebrow gold">GOLDEN PICK MEMBERSHIP</p><h2>이번 주 분석 기준을<br /><em>회원 전용으로 받아보세요.</em></h2><p>주간 분석 번호 · 리포트 · 결과 복기 · 회원 커뮤니티</p></div><div className="pb-price"><small>STANDARD / 1개월</small><strong>330,000<em>원</em></strong><button onClick={() => notify('멤버십 상담 신청을 준비 중입니다.')}>가입 상담 <ArrowRight size={15} /></button></div></section>

        <section className="pb-shell pb-support"><div><p className="pb-eyebrow">CUSTOMER CENTER</p><h2>궁금한 점은<br /><em>카카오톡으로 물어보세요.</em></h2><p>1·2등 분석 번호는 회원님의 목표에 맞춘 별도 상담으로 안내합니다.</p></div><button className="pb-support-btn" onClick={() => notify('카카오톡 상담을 준비 중입니다.')}><MessageCircle size={20} /><span><b>카카오톡 상담</b><small>평일 10:00 — 18:00</small></span><ArrowRight size={17} /></button><div className="pb-badge"><img src="/__mockup/images/customer-satisfaction-no-bg.png" alt="한국고객만족도 1위 배지" /><span>고객 만족도 관련 참고 배지</span></div></section>
      </main>
      <footer className="pb-footer"><div className="pb-shell"><div><b>GOLDEN PICK</b><span>기록으로 확인하는 로또 분석 서비스</span></div><div><a href="#proof">당첨 증빙</a><a href="#method">분석 기준</a><a href="#membership">멤버십</a><a href="#community">커뮤니티</a></div><small>© 2025 GOLDEN PICK · 본 페이지의 번호는 분석 예시이며 당첨을 보장하지 않습니다.</small></div></footer>
      {notice && <div className="pb-toast"><Check size={15} /> {notice}</div>}
    </div>
  );
}

export default PortalAnalysis;