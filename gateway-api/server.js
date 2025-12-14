const express = require('express');
const proxy = require('express-http-proxy');
const app = express();
const port = 3000; // Gateway API가 리스닝하는 포트

// --- Service Endpoints (Kubernetes Service Name) ---
const SHOWTIME_SERVICE_URL = 'http://showtime-service-svc:80'; 
const BOOKING_SERVICE_URL = 'http://booking-service-svc:80'; 


// --- 라우팅 설정 ---

// 1. Showtime Service로 라우팅
app.use('/api/v1/showtimes', proxy(SHOWTIME_SERVICE_URL, {
    proxyReqPathResolver: req => {
        // 🚨 수정: 제거된 '/api/v1/showtimes' 경로를 다시 붙여서 전달합니다.
        const path = `/api/v1/showtimes${req.url}`; 
        console.log(`[Showtime] Forwarding to: ${path}`);
        return path;
    }
}));

// 2. Booking Service로 라우팅
app.use('/api/v1/bookings', proxy(BOOKING_SERVICE_URL, {
    proxyReqPathResolver: req => {
        // 🚨 수정: 제거된 '/api/v1/bookings' 경로를 다시 붙여서 전달합니다.
        const path = `/api/v1/bookings${req.url}`;
        console.log(`[Booking] Forwarding to: ${path}`);
        return path;
    }
}));


// 기본 헬스 체크 (변경 없음)
app.get('/health', (req, res) => {
    res.status(200).send('Gateway is healthy.');
});

// 루트 경로 (변경 없음)
app.get('/', (req, res) => {
    res.status(200).send('Welcome to the CGV Microservice Gateway!');
});


app.listen(port, () => {
    console.log(`Gateway API listening on port ${port}`);
});