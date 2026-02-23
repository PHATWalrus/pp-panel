import "./Footer.scss";
export default function Footer() {
    function refreshPage(e) {
        e.preventDefault();
        window.location.reload();
    }
    return (
        <div className="Footer">
            <div className="main">
                <div className="r1">
                    <a href="https://www.apple.com/support/systemstatus/">System Status</a>
                    <div className="sep" />
                    <a href="https://www.apple.com/legal/privacy/">Privacy Policy</a>
                    <div className="sep" />
                    <a href="https://www.apple.com/legal/internet-services/icloud/">Terms & Conditions</a>
                </div>
                <div className="r2">
                    Copyright &copy; 2025 Apple Inc. All rights reserved.
                </div>
            </div>
        </div >
    )
}