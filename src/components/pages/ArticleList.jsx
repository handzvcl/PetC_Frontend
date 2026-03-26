import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ArticleList = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const BACKEND_URL = 'http://localhost:8080';

    const resolveImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${BACKEND_URL}${url.startsWith('/') ? url : `/${url}`}`;
    };

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/articles');
                const result = await response.json();
                if (response.ok && result.success) {
                    setArticles(result.data || []);
                }
            } catch (error) {
                console.error('Lỗi khi tải bài viết:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    return (
        <div className="homepage-wrapper">
            {/* Phần Hero Section - Dùng class của Bootstrap thuần y hệt HomePage */}
            <div className="bg-light py-5 mb-4 border-bottom">
                <div className="container text-center">
                    <h1 className="display-4 fw-bold text-primary">Cẩm Nang Thú Cưng</h1>
                    <p className="lead text-muted">
                        Những kiến thức hữu ích giúp thú cưng của bạn luôn khỏe mạnh và hạnh phúc.
                    </p>
                </div>
            </div>

            {/* Phần Danh sách */}
            <div className="container mb-5">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center text-muted py-5 border rounded bg-white shadow-sm">
                        <i className="fas fa-box-open fs-1 mb-3"></i>
                        <h4>Chưa có bài viết nào được đăng.</h4>
                    </div>
                ) : (
                    <div className="row text-center g-4">
                        {articles.map(article => (
                            <div className="col-md-4" key={article.id}>
                                <div className="p-3 border rounded bg-white shadow-sm h-100 d-flex flex-column text-start">
                                    <div className="mb-3 rounded overflow-hidden" style={{ height: '180px', backgroundColor: '#f8f9fa' }}>
                                        {article.imageUrl ? (
                                            <img 
                                                src={resolveImageUrl(article.imageUrl)} 
                                                alt={article.title} 
                                                className="w-100 h-100" 
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                                <i className="fas fa-image fs-1"></i>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="small text-muted mb-2">
                                        <i className="fas fa-calendar-alt me-1"></i>
                                        {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                    <h5 className="fw-bold text-dark" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {article.title}
                                    </h5>
                                    <p className="text-muted flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {article.summary || "Đang cập nhật tóm tắt..."}
                                    </p>
                                    
                                    {/* Sử dụng nối chuỗi để tạo đường dẫn */}
                                    <Link to={"/articles/" + article.id} className="btn btn-outline-primary mt-2 align-self-start">
                                        Đọc tiếp <i className="fas fa-arrow-right ms-1"></i>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArticleList;