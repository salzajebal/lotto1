import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Check,
  ChevronRight,
  CircleHelp,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import './PortalAnalysis.css';

const winningNumbers = ['08', '14', '22', '28', '33', '41'];
const combos = [
  { label: 'A', numbers: ['07', '12', '19', '28', '34', '41'], note: '구간 균형형' },
  { label: 'B', numbers: ['03', '14', '21', '27', '36', '42'], note: '미출현 보완형' },
  { label: 'C', numbers: ['09', '16', '24', '31', '37', '44'], note: '고출현 집중형' },
];

export function PortalAnalysis() {
  const [activeTab, setActiveTab] = useState<'summary' | 'numbers'>('summary');
  const [survey, setSurvey] = useState<'yes' | 'no' | null>(null);
  const [notice, setNotice] = useState('');

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };

  return (
    <div className="portal-analysis">
      <div className="pa-statusbar">
        <div className="pa-shell pa-status-inner">
          <span className="pa-status-live"><i /> 1185회차 분석 현황</span>
          <span className="pa-status-copy">2026. 08. 29 기준 · 다음 추첨까지 4일</span>
          <button onClick={() => showNotice('최신 분석 상태를 확인했습니다.')}><Activity size={13} /> 업데이트 확인</button>
        </div>
      </div>

      <main>
        <section className="pa-shell pa-overview" id="analysis">
          <div className="pa-breadcrumb">GOLDEN PICK <ChevronRight size={13} /> 주간 분석 센터</div>
          <div className="pa-heading-row">
            <div>
              <p className="pa-kicker">WEEKLY ANALYSIS CENTER / 1185</p>
              <h1>이번 주 분석,<br /><em>숫자부터 확인하세요.</em></h1>
              <p className="pa-lead">감각적인 예측보다 확인 가능한 기준을 먼저 보여드립니다. 지난 회차 결과를 복기하고, 이번 주 조합의 근거를 한 화면에 정리했습니다.</p>
            </div>
            <div className="pa-draw-stamp">
              <span>LOTTO 6/45</span>
              <strong>1185</strong>
              <small>ANALYSIS READY</small>
            </div>
          </div>

          <div className="pa-tabbar">
            <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}><BarChart3 size={16} /> 분석 요약</button>
            <button className={activeTab === 'numbers' ? 'active' : ''} onClick={() => setActiveTab('numbers')}><SlidersHorizontal size={16} /> 번호 조합</button>
            <span className="pa-tab-note"><ShieldCheck size={14} /> 최근 12개월 데이터 반영</span>
          </div>

          {activeTab === 'summary' ? (
            <div className="pa-dashboard">
              <div className="pa-panel pa-main-panel">
                <div className="pa-panel-title"><div><span className="pa-label">WEEKLY BRIEFING</span><h2>주간 분석 현황</h2></div><span className="pa-confidence"><i /> 분석 진행률 94.2%</span></div>
                <div className="pa-metrics">
                  <div><span>고출현 구간</span><strong>11 — 20</strong><b>지난주 대비 +12%</b></div>
                  <div><span>홀짝 비율</span><strong>4 : 2</strong><small>균형 구간 유지</small></div>
                  <div><span>미출현 최장</span><strong>14주</strong><b className="warm">집중 관찰 필요</b></div>
                  <div><span>번호 총합</span><strong>135 — 145</strong><small>목표 범위</small></div>
                </div>
                <div className="pa-rule" />
                <div className="pa-fixed-grid">
                  <div><span className="pa-label">고정수 후보</span><div className="pa-ball-row blue">{['12', '28', '34'].map((n) => <b key={n}>{n}</b>)}</div><p>최근 출현 흐름과 간격을 함께 반영한 후보입니다.</p></div>
                  <div><span className="pa-label">제외수 후보</span><div className="pa-ball-row muted">{['03', '21', '42'].map((n) => <b key={n}>{n}</b>)}</div><p>조합에서 우선순위를 낮춘 번호입니다.</p></div>
                </div>
              </div>
              <aside className="pa-panel pa-review-panel">
                <div className="pa-panel-title"><div><span className="pa-label">LAST DRAW REVIEW</span><h2>1184회 복기</h2></div><TrendingUp size={18} /></div>
                <p className="pa-small-label">실제 당첨 번호</p>
                <div className="pa-ball-row winning">{winningNumbers.map((n) => <b key={n}>{n}</b>)}</div>
                <div className="pa-progress-copy"><span>분석 범위 내 적중</span><strong>4.5 / 6</strong></div>
                <div className="pa-progress"><i /></div>
                <p className="pa-review-text">1184회차에서 4개의 번호가 예측 범위에 포함되었습니다. 적중과 미적중을 모두 다음 기준에 반영합니다.</p>
                <button className="pa-outline-btn" onClick={() => showNotice('1184회차 복기 리포트를 준비 중입니다.')}>상세 복기 리포트 <ChevronRight size={15} /></button>
              </aside>
            </div>
          ) : (
            <div className="pa-combo-board">
              <div className="pa-combo-intro"><span className="pa-label">NUMBER COMBINATIONS</span><h2>1185회 추천 조합 미리보기</h2><p>공개되는 조합은 고정수·제외수·구간 밸런스를 조합한 예시입니다.</p></div>
              <div className="pa-combos">{combos.map((combo) => <button key={combo.label} onClick={() => showNotice(`${combo.label} 조합을 저장했습니다.`)}><span className="combo-label">{combo.label}</span><div className="pa-ball-row">{combo.numbers.map((n) => <b key={n}>{n}</b>)}</div><small>{combo.note} <ChevronRight size={13} /></small></button>)}</div>
            </div>
          )}
        </section>

        <section className="pa-section pa-method-section" id="method">
          <div className="pa-shell">
            <div className="pa-section-head"><div><p className="pa-kicker">HOW WE READ THE NUMBERS</p><h2>분석 기준을<br /><em>숨기지 않습니다.</em></h2></div><p>한 번의 결과를 과장하지 않고, 매주 같은 순서로 데이터를 읽습니다. 아래 세 단계가 이번 주 조합의 출발점입니다.</p></div>
            <div className="pa-method-list">
              <article><span>01</span><div><BarChart3 size={22} /><h3>출현 빈도와 간격</h3><p>최근 10년 회차의 출현 횟수, 미출현 주기, 재등장 간격을 구간별로 비교합니다.</p></div><strong>FREQUENCY</strong></article>
              <article><span>02</span><div><SlidersHorizontal size={22} /><h3>조합 밸런스</h3><p>홀짝·저고·끝수·연속수·총합을 점검해 한쪽으로 몰린 조합을 걸러냅니다.</p></div><strong>BALANCE</strong></article>
              <article><span>03</span><div><ShieldCheck size={22} /><h3>결과 복기와 보정</h3><p>실제 당첨 결과를 기록하고, 다음 주 필터에 반영해 기준의 변화를 추적합니다.</p></div><strong>REVIEW</strong></article>
            </div>
          </div>
        </section>

        <section className="pa-shell pa-ops-grid">
          <div className="pa-ops-card pa-survey"><div className="pa-card-top"><span className="pa-label">MEMBER SURVEY / 08.24—09.06</span><CircleHelp size={18} /></div><h3>꿈이 로또 구매에<br />영향을 주나요?</h3><p>간단한 설문에 참여하면 분석 운영에 도움이 됩니다.</p><div className="pa-survey-actions"><button className={survey === 'yes' ? 'chosen' : ''} onClick={() => setSurvey('yes')}>영향이 있다</button><button className={survey === 'no' ? 'chosen' : ''} onClick={() => setSurvey('no')}>꿈과 무관하게 구매</button></div><div className="pa-vote-result">{survey ? '응답이 저장되었습니다. 참여해주셔서 감사합니다.' : '현재 387명 참여 · 결과는 익명으로 집계됩니다.'}</div></div>
          <div className="pa-ops-card pa-account"><div className="pa-card-top"><span className="pa-label">MEMBER CONVENIENCE</span><CreditCard size={18} /></div><h3>무통장 입금 가상계좌</h3><p>멤버십 신청 후 발급된 가상계좌로 안전하게 입금할 수 있습니다.</p><button onClick={() => showNotice('로그인 후 가상계좌 발급을 이용할 수 있습니다.')}><CreditCard size={16} /> 가상계좌 발급하기</button><small>입금자명과 신청자명이 다를 경우<br />카카오톡 상담으로 알려주세요.</small></div>
        </section>

        <section className="pa-shell pa-membership" id="membership">
          <div className="pa-member-mark">GOLD</div><div><span className="pa-label">GOLDEN PICK MEMBERSHIP</span><h2>이번 주 분석 기준을<br /><strong>회원 전용으로 받아보세요.</strong></h2><p>주간 조합 · 분석 리포트 · 결과 복기 · 회원 커뮤니티</p></div><div className="pa-member-price"><span>STANDARD</span><strong>330,000<small>원</small></strong><button onClick={() => showNotice('멤버십 상담 신청 화면을 준비 중입니다.')}>가입 상담 <ChevronRight size={15} /></button></div>
        </section>

        <section className="pa-shell pa-reviews" id="reviews">
          <div className="pa-section-head"><div><p className="pa-kicker">MEMBER NOTES</p><h2>이번 주 회원 기록</h2></div><button onClick={() => showNotice('전체 후기 목록은 준비 중입니다.')}>후기 전체보기 <ChevronRight size={15} /></button></div>
          <div className="pa-review-strip">
            {[['박민서', '1184회 · 3등', '번호를 고르는 기준이 생기니, 결과를 기다리는 마음도 훨씬 차분해졌습니다.'], ['정우성', '1181회 · 2등', '적중한 부분과 아닌 부분을 함께 보여주는 점이 믿음이 갔어요.'], ['김하늘', '1178회 · 3등', '매주 리포트를 읽고 직접 기록하는 습관이 생겼습니다.']].map(([name, draw, text]) => <article key={name}><div><b>{name.slice(0, 1)}</b><span>{name}<small>{draw}</small></span></div><p>“{text}”</p></article>)}
          </div>
        </section>
      </main>

      <footer className="pa-footer"><div className="pa-shell pa-footer-inner"><div><strong>GOLDEN PICK</strong><span>기록으로 확인하는 로또 분석 서비스</span></div><div className="pa-footer-links"><button onClick={() => showNotice('이용약관을 준비 중입니다.')}>이용약관</button><button onClick={() => showNotice('개인정보처리방침을 준비 중입니다.')}>개인정보처리방침</button><button onClick={() => showNotice('카카오톡 상담을 준비 중입니다.')}><MessageCircle size={14} /> 카카오톡 상담</button></div></div><div className="pa-shell pa-footer-bottom">© 2025 GOLDEN PICK · 본 페이지의 번호는 분석 예시이며 당첨을 보장하지 않습니다.</div></footer>
      {notice && <div className="pa-toast"><Check size={15} /> {notice}</div>}
    </div>
  );
}

export default PortalAnalysis;