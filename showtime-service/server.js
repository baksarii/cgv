const express = require('express');
const mysql = require('mysql2/promise'); // 🚨 mysql2/promise 모듈 사용
const app = express();
const port = 3001;
app.use(express.json());

// --- RDS Configuration ---
// 🚨 Kubernetes Secret이나 환경 변수를 통해 안전하게 관리해야 하지만,
// 🚨 테스트를 위해 환경 변수에서 직접 로드한다고 가정합니다.
const dbConfig = {
    host: process.env.DB_HOST || 'cgv-db.cvsiy4oi6x0z.ap-northeast-2.rds.amazonaws.com', // ⚠️ 실제 RDS 엔드포인트로 변경하세요!
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || '12341234',
    database: process.env.DB_NAME || 'cgv_showtime_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

// 💡 데이터베이스 연결 풀 초기화 함수
async function initializeDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log("Database pool initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize database pool:", error);
        // 서비스 시작 시 DB 연결 실패는 치명적이므로, 프로세스를 종료할 수 있습니다.
        process.exit(1); 
    }
}
initializeDatabase();


// 0. 상영 시간표 전체 목록 조회 (GET /list)
app.get('/list', async (req, res) => {
    try {
        // 🚨 RDS에서 showtimes 테이블의 모든 데이터를 조회합니다.
        const [rows] = await pool.query('SELECT * FROM showtimes');
        console.log(`[Showtime Service] GET /list processed. Fetched ${rows.length} rows.`);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching showtimes from DB:", error);
        res.status(500).json({ error: '데이터베이스 조회 중 오류 발생' });
    }
});


// 1. 영화/상영시간 목록 보기 (기존 경로 유지 - /showtimes도 DB에서 조회)
app.get('/showtimes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM showtimes');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching showtimes from DB:", error);
        res.status(500).json({ error: '데이터베이스 조회 중 오류 발생' });
    }
});

// 2. 특정 상영관 좌석 상황 보기 (Mock 로직은 DB 로직으로 대체 필요)
app.get('/showtimes/:id/seats', (req, res) => {
    // 🚨 좌석 정보는 'showtimes' 및 'reservations' 테이블을 조인하여 가져오는 복잡한 DB 로직이 필요합니다.
    // 🚨 현재는 Mock 데이터를 그대로 사용합니다. 실제 운영 시 DB 로직으로 대체해야 합니다.
    const showtimeId = req.params.id;
    // ... (기존 Mock 로직 유지 또는 DB 연동 로직으로 대체) ...
    return res.status(501).json({ error: 'DB 연동 로직 구현 필요' });
});

// (Booking Service에서 예약된 좌석 정보를 요청할 때 사용되는 내부 API)
app.get('/seats/reserved/:id', (req, res) => {
    // 🚨 예약된 좌석 조회 역시 DB의 'reservations' 테이블에서 조회해야 합니다.
    res.json({ reserved: reservedSeats[req.params.id] || [] });
});

app.listen(port, () => {
  console.log(`Showtime Service listening on port ${port}`);
});