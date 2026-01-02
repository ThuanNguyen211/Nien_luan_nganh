# Nien_luan_nganh

## Hướng dẫn Clone và Chạy Dự Án

### 1. Clone Repository

Sao chép dự án từ GitHub bằng lệnh:

git clone https://github.com/ThuanNguyen211/Nien_luan_nganh.git

### 2. Cài đặt Dependencies

Cài đặt các gói phụ thuộc bằng npm:

npm install

### 3. Chạy Dự Án

Khởi động máy chủ phát triển:

npm run dev

Dự án sẽ chạy trên \http://localhost:5173\ (hoặc cổng khác nếu 5173 đã được sử dụng).

### 4. Cấu trúc Dự Án

\\\
pod/
 src/
    components/       # Các component React
    config/          # Cấu hình ứng dụng
    App.jsx          # Component chính
    main.jsx         # Entry point
    App.css          # Stylesheet chính
 public/              # Tài nguyên tĩnh
 package.json         # Dependencies và scripts
 vite.config.js       # Cấu hình Vite
 eslint.config.js     # Cấu hình ESLint
\\\
