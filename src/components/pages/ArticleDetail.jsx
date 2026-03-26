import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// =================================================================
// COMPONENT ĐỆ QUY: DÙNG ĐỂ HIỂN THỊ BÌNH LUẬN ĐA CẤP (VÔ HẠN)
// =================================================================
const CommentNode = ({ 
    comment, 
    allComments, 
    isAuth, 
    replyingTo, 
    setReplyingTo, 
    replyContent, 
    setReplyContent, 
    onSubmit, 
    submitting 
}) => {
    // Tìm tất cả các bình luận có parentId là ID của bình luận hiện tại
    const replies = allComments
        .filter(c => c.parentId === comment.id)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <div className="mb-3 mt-2">
            <div className="d-flex gap-3">
                <img 
                    src={`https://ui-avatars.com/api/?name=${comment.username}&background=random`} 
                    alt="Avatar" 
                    className="rounded-circle shadow-sm" 
                    width="40" height="40" 
                />
                <div className="flex-grow-1">
                    {/* Bong bóng bình luận */}
                    <div className="bg-light p-2 px-3 rounded border border-light d-inline-block w-100">
                        <div className="fw-bold text-dark fs-6">
                            {comment.username} 
                            <span className="text-muted small fw-normal ms-2">
                                {new Date(comment.createdAt).toLocaleString('vi-VN')}
                            </span>
                        </div>
                        <div className="mt-1 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
                            {comment.content}
                        </div>
                    </div>
                    
                    {/* Nút Trả lời */}
                    <div className="mt-1 ms-2">
                        <button 
                            className="btn btn-sm btn-link text-decoration-none p-0 fw-bold text-primary" 
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        >
                            <i className="fas fa-reply me-1"></i> Trả lời
                        </button>
                    </div>

                    {/* Ô nhập Reply (Chỉ hiện khi bấm vào nút Trả lời) */}
                    {replyingTo === comment.id && isAuth && (
                        <form onSubmit={(e) => onSubmit(e, comment.id)} className="mt-2 mb-3 d-flex gap-2">
                            <textarea 
                                className="form-control form-control-sm shadow-sm" 
                                rows="2" 
                                placeholder={`Đang trả lời ${comment.username}...`} 
                                value={replyContent} 
                                onChange={e => setReplyContent(e.target.value)} 
                                required 
                                autoFocus
                            ></textarea>
                            <button type="submit" className="btn btn-sm btn-primary align-self-end fw-bold px-3" disabled={submitting}>
                                Gửi
                            </button>
                        </form>
                    )}
                    {!isAuth && replyingTo === comment.id && (
                        <div className="alert alert-secondary small py-2 mt-2 mb-3">
                            Vui lòng đăng nhập để trả lời.
                        </div>
                    )}

                    {/* ĐỆ QUY: NẾU CÓ CÂU TRẢ LỜI, TỰ GỌI LẠI COMPONENT NÀY BÊN TRONG NÓ */}
                    {replies.length > 0 && (
                        <div className="mt-2 ps-3 border-start border-2 border-primary border-opacity-25">
                            {replies.map(reply => (
                                <CommentNode
                                    key={reply.id}
                                    comment={reply}
                                    allComments={allComments}
                                    isAuth={isAuth}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyContent={replyContent}
                                    setReplyContent={setReplyContent}
                                    onSubmit={onSubmit}
                                    submitting={submitting}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// =================================================================
// COMPONENT CHÍNH: TRANG CHI TIẾT BÀI VIẾT
// =================================================================
const ArticleDetail = () => {
    const { id } = useParams();
    const { isAuth } = useAuth(); 
    const [article, setArticle] = useState(null);
    const [comments, setComments] = useState([]); 
    
    // --- STATE CHO BÌNH LUẬN ---
    const [newComment, setNewComment] = useState(""); 
    const [replyingTo, setReplyingTo] = useState(null); 
    const [replyContent, setReplyContent] = useState(""); 

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const BACKEND_URL = 'http://localhost:8080';

    const resolveImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${BACKEND_URL}${url.startsWith('/') ? url : `/${url}`}`;
    };

    useEffect(() => {
        const fetchArticleDetail = async () => {
            try {
                setLoading(true);
                const response = await fetch("http://localhost:8080/api/articles/" + id);
                const result = await response.json();
                if (response.ok && result.success) setArticle(result.data);
                else throw new Error(result.message || "Không tìm thấy bài viết");
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchComments = async () => {
            try {
                const res = await fetch("http://localhost:8080/api/articles/" + id + "/comments");
                const resData = await res.json();
                if (res.ok && resData.success) setComments(resData.data || []);
            } catch (err) {
                console.error("Lỗi tải bình luận", err);
            }
        };

        fetchArticleDetail();
        fetchComments();
    }, [id]);

    const handleCommentSubmit = async (e, parentId = null) => {
        e.preventDefault();
        const content = parentId ? replyContent : newComment;
        if (!content.trim()) return;

        // 🔥 XỬ LÝ LẤY TOKEN TỪ OBJECT 'user' TRONG LOCALSTORAGE
        const userStorage = localStorage.getItem("user");
        let token = "";
        if (userStorage) {
            token = JSON.parse(userStorage).token;
        }

        try {
            setSubmitting(true);
            const response = await fetch("http://localhost:8080/api/articles/" + id + "/comments", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ content, parentId }) 
            });
            const result = await response.json();

            if (response.ok && result.success) {
                if (parentId) {
                    setReplyContent("");
                    setReplyingTo(null); 
                } else {
                    setNewComment("");
                }
                setComments([result.data, ...comments]); 
            } else {
                alert(result.message || "Không thể gửi bình luận");
            }
        } catch (err) {
            alert("Lỗi kết nối");
        } finally {
            setSubmitting(false);
        }
    };

    // Lọc các bình luận gốc (Level 1) để rải ra màn hình
    const rootComments = comments.filter(c => !c.parentId);

    if (loading) {
        return (
            <div className="homepage-wrapper">
                <div className="bg-light py-5 mb-4 border-bottom text-center">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="homepage-wrapper">
                <div className="bg-light py-5 mb-4 border-bottom text-center">
                    <i className="fas fa-exclamation-triangle text-danger fs-1 mb-3"></i>
                    <h2>Rất tiếc! Bài viết không tồn tại.</h2>
                    <Link to="/articles" className="btn btn-primary mt-3">Quay lại danh sách</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="homepage-wrapper">
            <div className="bg-light py-5 mb-4 border-bottom">
                <div className="container text-center">
                    <h1 className="display-4 fw-bold text-primary" style={{ fontSize: '2.5rem' }}>{article.title}</h1>
                    <p className="lead text-muted">
                        <i className="fas fa-calendar-alt me-2"></i>
                        Đăng ngày: {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                </div>
            </div>

            <div className="container mb-5">
                <div className="row justify-content-center">
                    <div className="col-lg-9">
                        <nav aria-label="breadcrumb" className="mb-4">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Trang chủ</Link></li>
                                <li className="breadcrumb-item"><Link to="/articles" className="text-decoration-none">Cẩm nang</Link></li>
                                <li className="breadcrumb-item active" aria-current="page">Chi tiết</li>
                            </ol>
                        </nav>

                        <div className="p-4 border rounded bg-white shadow-sm mb-4">
                            {article.imageUrl && (
                                <div className="mb-4 text-center">
                                    <img 
                                        src={resolveImageUrl(article.imageUrl)} 
                                        alt={article.title} 
                                        className="img-fluid rounded" 
                                        style={{ maxHeight: '450px', width: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                            <div 
                                className="article-content fs-5" 
                                style={{ lineHeight: '1.8', color: '#333' }} 
                                dangerouslySetInnerHTML={{ __html: article.content }} 
                            />
                        </div>

                        {/* --- KHU VỰC BÌNH LUẬN --- */}
                        <div className="p-4 border rounded bg-white shadow-sm mt-4">
                            <h4 className="fw-bold mb-4 border-bottom pb-3">Bình luận ({comments.length})</h4>

                            {/* Ô nhập bình luận Gốc */}
                            {isAuth ? (
                                <form onSubmit={(e) => handleCommentSubmit(e, null)} className="mb-5 pb-3 border-bottom">
                                    <div className="d-flex align-items-start gap-3">
                                        <img src={"https://ui-avatars.com/api/?name=User&background=random"} alt="Avatar" className="rounded-circle shadow-sm" width="50" height="50" />
                                        <div className="flex-grow-1">
                                            <textarea 
                                                className="form-control mb-2 shadow-sm" 
                                                rows="3" 
                                                placeholder="Để lại suy nghĩ của bạn về bài viết này..." 
                                                value={newComment} 
                                                onChange={(e) => setNewComment(e.target.value)} 
                                                required
                                            ></textarea>
                                            <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={submitting}>
                                                {submitting ? "Đang gửi..." : "Gửi bình luận"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="alert alert-secondary text-center mb-4">
                                    Vui lòng <Link to="/login" className="fw-bold text-primary text-decoration-none">đăng nhập</Link> để tham gia bình luận.
                                </div>
                            )}

                            {/* Danh sách bình luận */}
                            <div className="comment-list">
                                {rootComments.length === 0 ? (
                                    <div className="text-center text-muted py-3">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
                                ) : (
                                    rootComments.map(comment => (
                                        <CommentNode
                                            key={comment.id}
                                            comment={comment}
                                            allComments={comments}
                                            isAuth={isAuth}
                                            replyingTo={replyingTo}
                                            setReplyingTo={setReplyingTo}
                                            replyContent={replyContent}
                                            setReplyContent={setReplyContent}
                                            onSubmit={handleCommentSubmit}
                                            submitting={submitting}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticleDetail;