import './_group.css';

export function Current() {
  return (
    <div className="lotto-footer-preview">
      <footer className="footer-current">
        <div className="footer-current-shell">
          <div className="footer-current-main">
            <div className="footer-current-brand">
              <span className="footer-current-mark" aria-hidden="true"><i /><i /><i /><i /></span>
              <div>
                <strong>로또리코</strong>
                <small>실제 당첨의 기쁨을 함께합니다</small>
              </div>
            </div>
            <div className="footer-current-nav">
              <a href="#reviews">당첨 증빙</a>
              <a href="#method">분석 기준</a>
              <a href="#membership">멤버십</a>
              <a href="#community">커뮤니티</a>
            </div>
          </div>
          <div className="footer-current-contact">
            <div><b>고객센터</b><a href="tel:070-8058-9742">070-8058-9742</a></div>
            <div><b>대표자</b><span>우주환</span></div>
          </div>
          <div className="footer-current-legal">© 2025 로또리코 · 본 페이지의 번호는 분석 예시이며 당첨을 보장하지 않습니다.</div>
        </div>
      </footer>
    </div>
  );
}