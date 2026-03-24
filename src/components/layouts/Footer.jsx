import { Link } from "react-router-dom";
import "./Layout.css";

function Footer() {
    return (
        <footer className="pet-footer">
            <svg className="pet-footer-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,64L48,53.3C96,43,192,21,288,26.7C384,32,480,64,576,64C672,64,768,32,864,21.3C960,11,1056,21,1152,37.3C1248,53,1344,75,1392,85.3L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>

            <div className="container pet-footer-container">
                <div className="row g-4">
                    <div className="col-lg-4">
                        <Link to="/" className="footer-brand">
                            <i className="fas fa-paw"></i> Pawfect
                        </Link>
                        <p className="footer-desc">
                            It is a long established fact that reader will be distracted
                            by the readable content page looking a its layout The point of
                            using.
                        </p>
                        <a className="footer-hotline" href="tel:+18886662563">
                            <i className="fas fa-phone-alt"></i>
                            +1 8886662563
                        </a>
                        <div className="footer-hotline-sub">Got Questions? Call us 24/7</div>
                    </div>

                    <div className="col-lg-2 col-md-6">
                        <h4 className="footer-title">Useful Links</h4>
                        <ul className="footer-links">
                            <li><Link to="/articles">Blog</Link></li>
                            <li><Link to="/">Home</Link></li>
                            <li><a href="#">404</a></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/booking">Contact</Link></li>
                            <li><a href="#">FAQ</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <h4 className="footer-title">Get In Touch</h4>
                        <ul className="footer-contact">
                            <li>4041 Karren Dale, Freddy, DE 45493-6388</li>
                            <li><a href="mailto:pet@admin">pet@admin</a></li>
                            <li><a href="tel:+15555552563">+1 5555552563</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-3">
                        <h4 className="footer-title">Newsletter</h4>
                        <input
                            className="newsletter-input"
                            type="email"
                            placeholder="Email"
                            aria-label="Newsletter Email"
                        />
                        <button className="newsletter-btn" type="button">
                            Subscribe
                        </button>
                    </div>
                </div>

                <div className="footer-bottom">
                    © 2026 Phan Dinh Tuan. Phien ban thu nghiem phuc vu muc dich hoc tap.
                </div>
            </div>
        </footer>
    );
}

export default Footer;