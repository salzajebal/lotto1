import './_group.css';

export function Refined() {
  return (
    <div className="lotto-footer-preview">
      <footer className="footer-refined" aria-label="로또리코 사이트 정보">
        <div className="footer-refined-shell">
          <div className="footer-refined-top">
            <section className="footer-refined-brand" aria-labelledby="lotto-rico-name">
              <span className="footer-refined-mark" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <div>
                <strong id="lotto-rico-name">로또리코</strong>
                <small>
                  실제 당첨의 기쁨을
                  <br />
                  함께합니다
                </small>
              </div>
            </section>

            <section aria-labelledby="footer-note-title">
              <p className="footer-refined-kicker" id="footer-note-title">
                LOTTO RECORD / 2025
              </p>
              <p className="footer-refined-copy">
                번호를 고르는 순간부터
                <br />
                한 회 한 회의 기록까지 차분하게 살핍니다.
              </p>
            </section>

            <section className="footer-refined-contact" aria-label="연락처 및 대표자 정보">
              <div className="footer-refined-contact-card">
                <b>고객센터</b>
                <a href="tel:070-8058-9742" aria-label="고객센터 전화 070-8058-9742">
                  070-8058-9742
                </a>
              </div>
            <div className="footer-refined-contact-card footer-refined-contact-card--owner">
                <b>대표자</b>
                <span>이은수</span>
              <small>법인명 : 주식회사 로또리코</small>
              <small>경기도 파주시 광탄면 278</small>
              </div>
            </section>

            <nav className="footer-refined-nav" aria-label="로또리코 주요 메뉴">
              <a href="#reviews" aria-label="당첨 증빙으로 이동">
                당첨 증빙
              </a>
              <a href="#method" aria-label="분석 기준으로 이동">
                분석 기준
              </a>
              <a href="#membership" aria-label="멤버십으로 이동">
                멤버십
              </a>
              <a href="#community" aria-label="커뮤니티로 이동">
                커뮤니티
              </a>
            </nav>
          </div>

          <div className="footer-refined-bottom">
            <span>© 2025 로또리코</span>
            <span>본 페이지의 번호는 분석 예시이며 당첨을 보장하지 않습니다.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}