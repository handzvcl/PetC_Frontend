import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const ArticleManagement = () => {
    // --- STATE CƠ BẢN ---
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false); 
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // --- STATE FORM BÀI VIẾT ---
    const [currentId, setCurrentId] = useState(null);
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState(''); 
    const [imageUrl, setImageUrl] = useState('');
    const [isPublished, setIsPublished] = useState(true);

    const BACKEND_URL = 'http://localhost:8080'; 

    const resolveImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${BACKEND_URL}${url.startsWith('/') ? url : `/${url}`}`;
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/articles/admin/all`, { credentials: 'include' });
            const result = await response.json();
            if (response.ok && result.success) {
                setArticles(result.data || []);
            }
        } catch (error) {
            showToast('Lỗi khi tải danh sách bài viết!', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- HÀM UPLOAD ẢNH BÌA ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploadingImage(true);
            const response = await fetch(`${BACKEND_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            
            if (response.ok && result.success) {
                setImageUrl(resolveImageUrl(result.data));
                showToast('Tải ảnh bìa thành công!', 'success');
            } else {
                throw new Error(result.message || 'Lỗi tải ảnh');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setUploadingImage(false);
            e.target.value = null; 
        }
    };

    // --- CÁC HÀM XỬ LÝ FORM ---
    const handleOpenCreate = () => {
        setIsEditMode(false);
        setCurrentId(null);
        setTitle('');
        setSummary('');
        setContent('');
        setImageUrl('');
        setIsPublished(true);
        setShowModal(true);
    };

    const handleOpenEdit = (article) => {
        setIsEditMode(true);
        setCurrentId(article.id);
        setTitle(article.title || '');
        setSummary(article.summary || '');
        setContent(article.content || '');
        setImageUrl(resolveImageUrl(article.imageUrl || ''));
        setIsPublished(article.published !== undefined ? article.published : article.isPublished); 
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn không?')) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/articles/admin/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok && result.success) {
                showToast('Đã xóa bài viết thành công!', 'success');
                fetchArticles();
            } else {
                throw new Error(result.message || 'Lỗi khi xóa bài viết');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) {
            alert("Tiêu đề và nội dung bài viết không được để trống!");
            return;
        }

        try {
            setSubmitting(true);
            const url = isEditMode 
                ? `${BACKEND_URL}/api/articles/admin/${currentId}` 
                : `${BACKEND_URL}/api/articles/admin`;
            const method = isEditMode ? 'PUT' : 'POST';

            const payload = {
                title, summary, content, imageUrl,
                published: isPublished, isPublished: isPublished
            };

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showToast(isEditMode ? 'Cập nhật thành công!' : 'Thêm bài mới thành công!', 'success');
                setShowModal(false);
                fetchArticles();
            } else {
                throw new Error(result.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container-fluid px-4">
            {toast.show && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
                    <div className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                        <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
                        {toast.message}
                        <button type="button" className="btn-close" onClick={() => setToast({ show: false, message: '', type: '' })}></button>
                    </div>
                </div>
            )}

            <h1 className="mt-4">Quản lý Cẩm nang</h1>
            <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
                <li className="breadcrumb-item active">Bài viết</li>
            </ol>

            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                    <div><i className="fas fa-newspaper me-2 text-primary"></i>Danh sách Bài viết</div>
                    <button className="btn btn-primary btn-sm fw-bold" onClick={handleOpenCreate}>
                        <i className="fas fa-plus me-1"></i> Thêm bài viết mới
                    </button>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered align-middle">
                                <thead className="table-light text-center">
                                    <tr>
                                        <th width="5%">ID</th>
                                        <th width="15%">Ảnh bìa</th>
                                        <th width="30%">Tiêu đề</th>
                                        <th width="15%">Ngày tạo</th>
                                        <th width="15%">Trạng thái</th>
                                        <th width="20%">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {articles.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center text-muted py-4">Chưa có bài viết nào</td></tr>
                                    ) : (
                                        articles.map(article => {
                                            const isPub = article.published !== undefined ? article.published : article.isPublished;
                                            return (
                                                <tr key={article.id}>
                                                    <td className="text-center fw-bold">{article.id}</td>
                                                    <td className="text-center">
                                                        {article.imageUrl ? (
                                                            <img src={resolveImageUrl(article.imageUrl)} alt="cover" className="img-thumbnail shadow-sm" style={{ height: '70px', width: '100px', objectFit: 'cover' }} />
                                                        ) : (
                                                            <span className="text-muted small">Không có ảnh</span>
                                                        )}
                                                    </td>
                                                    <td className="fw-bold">{article.title}</td>
                                                    <td className="text-center">{new Date(article.createdAt).toLocaleDateString('vi-VN')}</td>
                                                    <td className="text-center">
                                                        {isPub ? (
                                                            <span className="badge bg-success">Đang hiển thị</span>
                                                        ) : (
                                                            <span className="badge bg-secondary">Đang ẩn</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(article)}>
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(article.id)}>
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL THÊM / SỬA BÀI VIẾT */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-xl modal-dialog-scrollable">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">
                                    <i className={`fas fa-${isEditMode ? 'edit' : 'plus-circle'} me-2`}></i>
                                    {isEditMode ? 'Cập nhật Bài viết' : 'Thêm Bài viết mới'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-light">
                                <form id="articleForm" onSubmit={handleSubmit}>
                                    <div className="row">
                                        {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
                                        <div className="col-md-3">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Ảnh bìa</label>
                                                <div className="card border-1 text-center p-3 mb-2" style={{ borderStyle: 'dashed' }}>
                                                    {imageUrl ? (
                                                        <div className="position-relative">
                                                            <img src={imageUrl} alt="preview" className="img-fluid rounded" style={{ maxHeight: '180px', objectFit: 'cover' }} />
                                                            <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onClick={() => setImageUrl('')}>
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-muted py-4">
                                                            <i className="fas fa-image fs-1 mb-2"></i>
                                                            <p className="mb-0 small">Chưa có ảnh bìa</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <input 
                                                    type="file" 
                                                    className="form-control form-control-sm" 
                                                    accept="image/png, image/jpeg, image/jpg, image/webp" 
                                                    onChange={handleImageUpload} 
                                                    disabled={uploadingImage}
                                                />
                                                {uploadingImage && <small className="text-primary mt-1 d-block"><i className="fas fa-spinner fa-spin me-1"></i>Đang tải ảnh lên...</small>}
                                            </div>
                                            
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Trạng thái hiển thị</label>
                                                <div className="form-check form-switch fs-5">
                                                    <input className="form-check-input" type="checkbox" id="publishSwitch" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} style={{ cursor: 'pointer' }} />
                                                    <label className="form-check-label ms-2 fs-6" htmlFor="publishSwitch" style={{ cursor: 'pointer' }}>
                                                        {isPublished ? <span className="text-success fw-bold">Bật (Public)</span> : <span className="text-secondary">Tắt (Nháp)</span>}
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="mb-3 mt-4">
                                                <label className="form-label fw-bold">Tóm tắt (Summary)</label>
                                                <textarea className="form-control" rows="4" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Đoạn mô tả ngắn hiển thị ở trang chủ..."></textarea>
                                            </div>
                                        </div>

                                        {/* CỘT PHẢI: NỘI DUNG TINYMCE */}
                                        <div className="col-md-9">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Tiêu đề bài viết <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control fw-bold fs-5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề..." required />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Nội dung chi tiết <span className="text-danger">*</span></label>
                                                
                                                {/* TRÌNH SOẠN THẢO TINYMCE */}
                                                <Editor
                                                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY} 
                                                    value={content}
                                                    onEditorChange={(newContent) => setContent(newContent)}
                                                    init={{
                                                        height: 500,
                                                        menubar: true,
                                                        plugins: [
                                                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                                        ],
                                                        toolbar: 'undo redo | blocks | ' +
                                                            'bold italic forecolor | alignleft aligncenter ' +
                                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                                            'removeformat | image | help',
                                                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
                                                        
                                                        // LOGIC TỰ ĐỘNG GỌI API UPLOAD CỦA BẠN KHI CHÈN ẢNH VÀO NỘI DUNG
                                                        images_upload_handler: (blobInfo, progress) => new Promise(async (resolve, reject) => {
                                                            const formData = new FormData();
                                                            formData.append('file', blobInfo.blob(), blobInfo.filename());

                                                            try {
                                                                const response = await fetch(`${BACKEND_URL}/api/upload`, {
                                                                    method: 'POST',
                                                                    body: formData
                                                                });
                                                                const result = await response.json();
                                                                if (response.ok && result.success) {
                                                                    // Trả về full link để ảnh hiện ngay trong Editor
                                                                    resolve(`${BACKEND_URL}${result.data}`);
                                                                } else {
                                                                    reject(result.message || 'Lỗi tải ảnh');
                                                                }
                                                            } catch (err) {
                                                                reject('Lỗi kết nối tới server');
                                                            }
                                                        })
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" form="articleForm" className="btn btn-primary px-4 fw-bold" disabled={submitting || uploadingImage}>
                                    {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-save me-2"></i>}
                                    {isEditMode ? 'Lưu thay đổi' : 'Đăng bài viết'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticleManagement;