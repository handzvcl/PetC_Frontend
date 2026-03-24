import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
    const serviceCards = [
        {
            title: 'Health Checkups',
            desc: 'Theo dõi sức khoe tong quat va tu van dinh ky cho be cung.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s-6.5-3.2-6.5-9a4.5 4.5 0 0 1 9 0 4.5 4.5 0 0 1 9 0c0 5.8-6.5 9-6.5 9z" />
                    <path d="M12 8v8" />
                    <path d="M8 12h8" />
                </svg>
            ),
        },
        {
            title: 'Grooming Care',
            desc: 'Tam, say, cat tia va cham soc long theo tung giong thu cung.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 3h8" />
                    <path d="M9 3v4l-2 2v9a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V9l-2-2V3" />
                    <path d="M10 12h4" />
                </svg>
            ),
        },
        {
            title: 'Playful Activities',
            desc: 'Khong gian vui choi an toan giup be giai phong nang luong.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3a9 9 0 0 0 0 18" />
                    <path d="M12 3a9 9 0 0 1 0 18" />
                    <path d="M3 12h18" />
                </svg>
            ),
        },
        {
            title: 'Nutritional Guidance',
            desc: 'Goi y khau phan phu hop theo tuoi va tinh trang cua tung be.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 10h16" />
                    <path d="M6 10v7a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-7" />
                    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
                </svg>
            ),
        },
        {
            title: 'Training Programs',
            desc: 'Luyen tap hanh vi can ban de be ngoan va de hoa nhap hon.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l2.5 4.8 5.3.8-3.8 3.8.9 5.3L12 15.8l-4.9 2.9.9-5.3L4.2 8.6l5.3-.8z" />
                    <circle cx="12" cy="11" r="1.3" />
                </svg>
            ),
        },
        {
            title: 'Safe Boarding',
            desc: 'Dich vu luu tru sach se, theo doi lien tuc va bao cao hang ngay.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l8 4v5c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7z" />
                    <path d="M9.5 12.5l1.7 1.7 3.3-3.3" />
                </svg>
            ),
        },
    ];

    return (
        <div className="homepage-wrapper pet-homepage">
            <section className="pet-hero">
                <div className="container">
                    <div className="pet-hero-grid">
                        <div className="pet-hero-visual" data-animate="left">
                            <div className="hero-blob"></div>
                            <img
                                src="https://template.themewold.com/WordPress/CMS/Demo17/wp-content/uploads/2025/06/slider-02.png"
                                alt="Pet hero"
                                className="hero-dog-image"
                            />
                        </div>

                        <div className="pet-hero-content" data-animate="right">
                            <span className="hero-mini-title">PetC</span>
                            <h1>
                                Dịch vụ chăm sóc <span>thú cưng hiện đại</span>
                            </h1>
                            <p>
                                Trải nghiệm chăm sóc toàn diện, lịch hẹn linh hoạt, đội ngũ
                                chuyên nghiệp và không gian an toàn cho mọi bé cưng.
                            </p>
                            <div className="hero-actions">
                                <Link to="/booking" className="hero-btn hero-btn-primary">
                                    Đặt lịch ngay
                                </Link>
                                <a href="#pet-services" className="hero-btn hero-btn-outline">
                                    Xem dịch vụ
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="paw-pattern paw-pattern-a">🐾</div>
                <div className="paw-pattern paw-pattern-b">🐾</div>
                <div className="paw-pattern paw-pattern-c">🐾</div>
            </section>

            <section id="pet-services" className="pet-services-section">
                <div className="container">
                    <div className="pet-services-heading" data-animate="up">
                        <p className="services-top-title">Our Services</p>
                        <h2>Pet Pal Services</h2>
                        <span className="heading-divider"></span>
                    </div>

                    <div className="pet-service-grid">
                        {serviceCards.map((item) => (
                            <article className="pet-service-card" key={item.title}>
                                <div className="service-icon-wrap">{item.icon}</div>
                                <h3>{item.title}</h3>
                                <p>{item.desc}</p>
                            </article>
                        ))}
                    </div>

                    <div className="services-cta-wrap">
                        <Link to="/booking" className="hero-btn hero-btn-primary">
                            Tạo lịch hẹn cho bé cưng
                        </Link>
                    </div>
                </div>
            </section>

           
            <svg className="pet-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,85.3C672,75,768,53,864,53.3C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
            <svg className="pet-wave pet-wave-top" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,80L48,74.7C96,69,192,59,288,53.3C384,48,480,48,576,58.7C672,69,768,91,864,90.7C960,91,1056,69,1152,64C1248,59,1344,69,1392,74.7L1440,80L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
            </svg>
        </div>
    );
}

export default HomePage;