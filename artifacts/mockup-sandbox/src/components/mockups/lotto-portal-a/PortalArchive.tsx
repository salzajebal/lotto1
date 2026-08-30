import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Headphones,
  MapPin,
  Menu,
  MessageCircle,
  Play,
  Search,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";
import "./PortalArchive.css";

type Entry = {
  round: string;
  rank: string;
  amount: string;
  area: string;
  date: string;
  numbers: string[];
  note: string;
};

const entries: Entry[] = [
  { round: "1184", rank: "3등", amount: "1,584,725원", area: "서울 서초구", date: "2024.08.24", numbers: ["03", "08", "14", "23", "33", "45"], note: "분석 번호로 구매 후 3등에 당첨되었습니다." },
  { round: "1183", rank: "2등", amount: "54,201,110원", area: "인천 동구", date: "2024.08.17", numbers: ["07", "12", "18", "29", "34", "42"], note: "끝까지 확인하고 기록해두길 잘했어요." },
  { round: "1181", rank: "2등", amount: "61,439,872원", area: "경기 성남시", date: "2024.08.03", numbers: ["04", "11", "19", "27", "35", "41"], note: "매주 같은 기준으로 번호를 받아본 결과입니다." },
  { round: "1180", rank: "1등", amount: "2,140,500,000원", area: "서울 강남구", date: "2024.07.27", numbers: ["06", "17", "21", "28", "36", "44"], note: "처음에는 믿기지 않았습니다. 영수증을 다시 봤어요." },
];

const interviews = [
  { round: "1181회", title: "매주 기록하던 습관이 큰 힘이 됐어요", meta: "2등 당첨자 · 04:12", tone: "blue" },
  { round: "1178회", title: "번호보다 결과를 복기하는 게 중요했습니다", meta: "3등 당첨자 · 03:48", tone: "gold" },
  { round: "1169회", title: "평범한 직장인의 첫 당첨 이야기", meta: "2등 당첨자 · 05:21", tone: "ink" },
];

export function PortalArchive() {
  const [tab, setTab] = useState<"receipt" | "interview">("receipt");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const filtered = useMemo(() => entries.filter((entry) => `${entry.round} ${entry.area} ${entry.rank}`.includes(query.trim())), [query]);
  const act = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2300);
  };

  return (
    <div className="portal-a">
      <div className="portal-a-state"><span className="state-dot" /> 매주 토요일 업데이트 · 마지막 기록 1184회</div>
      <header className="portal-a-header">
        <div className="portal-a-shell header-inner">
          <button className="portal-a-brand" onClick={() => act("골든픽 기록 홈입니다.")} aria-label="골든픽 홈">
            <span className="brand-seal">G</span><span><b>GOLDEN PICK</b><small>LOTTO RECORDS / SINCE 2018</small></span>
          </button>
          <nav className={menu ? "portal-a-nav open" : "portal-a-nav"}>
            <button className="selected" onClick={() => act("당첨 증빙 메뉴")}>당첨 증빙</button>
            <button onClick={() => { setTab("interview"); act("당첨자 인터뷰로 이동했습니다."); }}>당첨자 인터뷰</button>
            <button onClick={() => act("분석 기준 메뉴")}>분석 기준</button>
            <button onClick={() => act("커뮤니티 메뉴")}>커뮤니티</button>
            <button onClick={() => act("멤버십 메뉴")}>멤버십 안내</button>
          </nav>
          <div className="header-actions">
            <button className="login-link" onClick={() => act("로그인 화면을 준비 중입니다.")}>로그인</button>
            <button className="kakao-button" onClick={() => act("카카오톡 상담 신청을 준비 중입니다.")}><MessageCircle size={15} /> 카카오톡 상담</button>
            <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="메뉴"><Menu size={19} /></button>
          </div>
        </div>
      </header>

      <main>
        <div className="portal-a-shell">
          <div className="breadcrumb"><span>홈</span><ChevronRight size={12} /><strong>골든픽 당첨 기록</strong></div>
          <section className="archive-intro">
            <div>
              <p className="section-kicker"><ShieldCheck size={15} /> GOLDEN PICK / VERIFIED ARCHIVE</p>
              <h1>당첨의 순간을<br /><em>기록으로 확인하세요.</em></h1>
              <p className="intro-copy">골든픽 회원이 직접 공유한 당첨 영수증과 인터뷰입니다.<br />확인된 회차, 등수, 금액만 차곡차곡 남깁니다.</p>
            </div>
            <div className="archive-count"><span>PUBLIC RECORD</span><strong>2,841</strong><small>누적 공개 당첨 기록</small><button onClick={() => act("기록 공개 기준을 확인했습니다.")}>공개 기준 보기 <ChevronRight size={14} /></button></div>
          </section>

          <section className="proof-panel">
            <div className="panel-heading">
              <div><span className="tiny-label">01 / RECENT PROOF</span><h2>최신 당첨 증빙</h2><p>실제 당첨 회원이 보내주신 자료를 검토 후 공개합니다.</p></div>
              <button className="text-button" onClick={() => act("전체 증빙 목록을 불러옵니다.")}>전체 보기 <ChevronRight size={15} /></button>
            </div>
            <div className="receipt-grid">
              {entries.slice(0, 3).map((entry, index) => (
                <button className={`receipt-card ${index === 0 ? "featured" : ""}`} key={entry.round} onClick={() => act(`${entry.round}회 상세 증빙을 확인합니다.`)}>
                  <div className="receipt-top"><span>LOTTO 6/45</span><span>{entry.date}</span></div>
                  <div className="receipt-stamp">VERIFIED<br /><small>GOLDEN PICK</small></div>
                  <p className="receipt-round">{entry.round}<small>회</small></p>
                  <strong className="receipt-rank">{entry.rank}</strong>
                  <b className="receipt-money">{entry.amount}</b>
                  <div className="receipt-line" />
                  <div className="receipt-numbers">{entry.numbers.map((number) => <i key={number}>{number}</i>)}</div>
                  <div className="receipt-bottom"><span><MapPin size={12} /> {entry.area}</span><span>회원 증빙 <BadgeCheck size={13} /></span></div>
                </button>
              ))}
            </div>
          </section>

          <section className="switch-panel">
            <div className="switch-tabs">
              <button className={tab === "receipt" ? "active" : ""} onClick={() => setTab("receipt")}><FileText size={16} /> 생생한 당첨 증빙</button>
              <button className={tab === "interview" ? "active" : ""} onClick={() => setTab("interview")}><Play size={16} /> 당첨자 인터뷰</button>
            </div>
            {tab === "receipt" ? (
              <div className="record-list">
                {filtered.map((entry) => <article className="record-row" key={entry.round}>
                  <div className="record-round"><strong>{entry.round}</strong><span>회차</span></div><div className={`rank-tag ${entry.rank === "1등" ? "first" : ""}`}>{entry.rank}</div>
                  <div className="record-description"><b>{entry.note}</b><small><CalendarDays size={12} /> {entry.date} · <MapPin size={12} /> {entry.area}</small></div>
                  <strong className="record-amount">{entry.amount}</strong><button className="row-arrow" onClick={() => act(`${entry.round}회 증빙 상세`)} aria-label="상세 보기"><ChevronRight size={17} /></button>
                </article>)}
              </div>
            ) : (
              <div className="interview-grid">{interviews.map((item) => <button className={`interview-card ${item.tone}`} key={item.round} onClick={() => act(`${item.round} 인터뷰를 재생합니다.`)}><span className="play-circle"><Play size={16} fill="currentColor" /></span><small>{item.round} · {item.meta}</small><strong>{item.title}</strong><span className="watch">인터뷰 보기 <ChevronRight size={14} /></span></button>)}</div>
            )}
          </section>

          <section className="search-section">
            <div className="search-heading"><span className="tiny-label">02 / ALL RECORDS</span><h2>전체 당첨 내역</h2><p>회차와 구매 지역으로 공개 기록을 찾아보세요.</p></div>
            <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="회차 또는 지역 검색" /><span>{filtered.length}건</span></label>
            <div className="archive-table"><div className="table-head"><span>회차 / 일자</span><span>당첨 등수</span><span>당첨 금액</span><span>구매 지역</span><span>상태</span></div>{filtered.map((entry) => <button className="table-row" key={`${entry.round}-${entry.area}`} onClick={() => act(`${entry.round}회 기록을 선택했습니다.`)}><span><b>{entry.round}회</b><small>{entry.date}</small></span><strong className={entry.rank === "1등" ? "gold-rank" : ""}>{entry.rank}</strong><b>{entry.amount}</b><span><MapPin size={13} /> {entry.area}</span><span className="verified"><BadgeCheck size={14} /> 확인됨</span></button>)}</div>
          </section>

          <section className="service-banner">
            <div className="banner-copy"><span className="tiny-label">03 / ANALYSIS SERVICE</span><h2>당첨 기록을 읽는<br /><em>기준까지 함께 공개합니다.</em></h2><p>최근 10년 회차 데이터, 번호 간격, 구간 밸런스를 매주 업데이트합니다.</p><button onClick={() => act("분석 기준 안내를 확인합니다.")}>분석 기준 살펴보기 <ChevronRight size={15} /></button></div>
            <div className="number-board"><small>NEXT DRAW / 1185</small><div>{["04", "11", "19", "27", "35", "41"].map((n) => <i key={n}>{n}</i>)}</div><span>지난 회차를 바탕으로 만든 예시 조합입니다.</span></div>
          </section>

          <section className="membership-strip"><div><span className="tiny-label">GOLD MEMBERSHIP</span><h2>매주 같은 기준으로,<br /><strong>이번 주 분석 번호</strong>를 받아보세요.</h2><p>3등 분석 번호 멤버십 · 월 330,000원</p></div><button onClick={() => act("멤버십 상담을 준비 중입니다.")}>멤버십 상담하기 <ChevronRight size={16} /></button><div className="membership-note"><Headphones size={17} /><span>1·2등 분석은 별도 상담<br /><b>카카오톡으로 문의하세요</b></span></div></section>
        </div>
      </main>

      <footer className="portal-a-footer"><div className="portal-a-shell footer-inner"><div><b>GOLDEN PICK</b><span>실제 기록과 읽기 쉬운 정보로 만드는 로또 아카이브</span></div><div className="footer-badge"><img src="/__mockup/images/customer-satisfaction-no-bg.png" alt="한국고객만족도 1위 표식" /><span>고객 만족 관련 표식<br /><small>서비스 참고용 배지</small></span></div><div className="footer-links"><button onClick={() => act("이용약관")}>이용약관</button><button onClick={() => act("개인정보처리방침")}>개인정보처리방침</button><button onClick={() => act("고객센터")}>고객센터</button></div></div></footer>
      {notice && <div className="portal-toast"><Trophy size={16} /> {notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
    </div>
  );
}

export default PortalArchive;