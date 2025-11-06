document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'https://banhngot.fitlhu.com';
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const profileArea = document.getElementById('profile-area');
    const messageBox = document.getElementById('message');
    const logoutButton = document.getElementById('logout-button');

    // Chuyển đổi giữa Đăng nhập và Đăng ký
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.classList.remove('active');
        registerBox.classList.add('active');
        messageBox.classList.add('hidden');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerBox.classList.remove('active');
        loginBox.classList.add('active');
        messageBox.classList.add('hidden');
    });

    // Hàm hiển thị thông báo
    function showMessage(text, isSuccess) {
        messageBox.textContent = text;
        messageBox.classList.remove('hidden', 'success', 'error');
        if (isSuccess) {
            messageBox.classList.add('success');
        } else {
            messageBox.classList.add('error');
        }
    }

    // Hàm gọi API
    async function apiCall(endpoint, method = 'GET', data = null, useAuth = false) {
        const url = BASE_URL + endpoint;
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (useAuth) {
            const token = localStorage.getItem('authToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`; // Thêm token vào header
            } else {
                return { success: false, message: "Không tìm thấy token. Vui lòng đăng nhập lại." };
            }
        }

        const config = {
            method: method,
            headers: headers,
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const result = await response.json();

            if (!response.ok) {
                // Xử lý các lỗi HTTP 4xx, 5xx
                return { success: false, message: result.message || "Lỗi mạng hoặc lỗi server.", error: result.error || "Không rõ" };
            }

            return result;
        } catch (error) {
            console.error("Fetch Error:", error);
            return { success: false, message: "Không thể kết nối đến máy chủ API." };
        }
    }

    // --- Xử lý Đăng Ký ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            username: document.getElementById('register-username').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value,
            full_name: document.getElementById('register-fullname').value,
            avatar: document.getElementById('register-avatar').value || undefined,
        };

        showMessage("Đang xử lý đăng ký...", true);

        const result = await apiCall('/api/auth/register', 'POST', data);

        if (result.success) {
            showMessage("Đăng ký thành công! Vui lòng đăng nhập.", true);
            // Tự động chuyển sang form đăng nhập sau khi đăng ký
            registerBox.classList.remove('active');
            loginBox.classList.add('active');
            registerForm.reset();
        } else {
            // Lỗi 400, 500
            showMessage(`Đăng ký thất bại: ${result.message} - ${result.error}`, false);
        }
    });

    // --- Xử lý Đăng Nhập ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value,
        };

        showMessage("Đang xử lý đăng nhập...", true);

        const result = await apiCall('/api/auth/login', 'POST', data);

        if (result.success) {
            const token = result.data.token;
            // 1. Lưu token vào Local Storage
            localStorage.setItem('authToken', token);

            showMessage(result.message, true);
            loginForm.reset();
            
            // 2. Chuyển sang khu vực profile
            checkLoginStatus(); 

        } else {
            // Lỗi 401: Username hoặc password không đúng
            showMessage(`Đăng nhập thất bại: ${result.message}`, false);
        }
    });
    
    // --- Lấy và Hiển thị Profile ---
    async function fetchProfile() {
        const result = await apiCall('/api/auth/profile', 'GET', null, true); // true = sử dụng token

        if (result.success) {
            const user = result.data;
            document.getElementById('profile-name').textContent = user.full_name;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-username').textContent = user.username;
            document.getElementById('profile-avatar').src = user.avatar || 'placeholder.jpg'; // Ảnh mặc định nếu không có

            loginBox.classList.remove('active');
            registerBox.classList.remove('active');
            profileArea.classList.remove('hidden');
            messageBox.classList.add('hidden'); // Ẩn message box
        } else {
            // Token không hợp lệ (401) hoặc lỗi khác
            localStorage.removeItem('authToken'); // Xóa token cũ
            showMessage("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", false);
            loginBox.classList.add('active');
            profileArea.classList.add('hidden');
        }
    }

    // --- Kiểm tra trạng thái đăng nhập ---
    function checkLoginStatus() {
        if (localStorage.getItem('authToken')) {
            fetchProfile(); // Nếu có token, lấy profile
        } else {
            loginBox.classList.add('active'); // Nếu không, hiển thị form đăng nhập
            profileArea.classList.add('hidden');
        }
    }
    
    // --- Xử lý Đăng Xuất ---
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('authToken'); // Xóa token
        showMessage("Bạn đã đăng xuất.", true);
        checkLoginStatus(); // Quay lại màn hình đăng nhập
    });

    // Gọi hàm kiểm tra khi trang load
    checkLoginStatus();
});