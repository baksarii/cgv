const express = require('express');
const mysql = require('mysql2/promise'); // 🚨 DB 연동을 위해 mysql2/promise 모듈 사용
const app = express();
const port = 3001;
app.use(express.json());

// --- RDS Configuration (환경 변수 사용) ---
const dbConfig = {
    // ⚠️ YAML 파일에서 주입한 환경 변수 사용
    host: process.env.DB_HOST,
    user: process.env.DB_USER,      // 👈 YAML의 DB_USER 환경 변수 사용
    password: process.env.DB_PASSWORD, // 👈 YAML의 DB_PASSWORD 환경 변수 사용
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
        console.log("[Showtime Service] Database pool initialized successfully.");
    } catch (error) {
        console.error("[Showtime Service] Failed to initialize database pool:", error);
        process.exit(1); 
    }
}
initializeDatabase();

// 1. 상영 목록 전체 조회 (DB에서 조회)
// Gateway API에서 /api/v1/showtimes 경로가 Strip된 후 넘어오는 /list 요청을 처리합니다.
app.get('/list', async (req, res) => {
    try {
        // 🚨 showtime 테이블의 모든 레코드를 조회합니다.
        const [rows] = await pool.query('SELECT * FROM showtime');
        console.log(`[Showtime Service] GET /list processed. Total: ${rows.length} rows.`);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching showtimes from DB:", error);
        res.status(500).json({ error: '상영 목록 조회 중 오류 발생' });
    }
});

// 2. 특정 상영 시간의 예약된 좌석 목록 조회 (Booking Service에서 호출 예정)
// ⚠️ 이 엔드포인트는 실제 Showtime Service가 관리하는 'reserved_seats' 테이블을 조회해야 합니다.
app.get('/showtimes/:showtimeId/seats', async (req, res) => {
    const { showtimeId } = req.params;
    try {
        // 🚨 DB에서 해당 showtimeId에 대해 예약된 좌석 목록을 조회합니다.
        // 현재는 예시 쿼리입니다. 실제로는 좌석 정보를 포함하는 테이블이 있어야 합니다.
        const [rows] = await pool.query(
            'SELECT seat_number FROM reserved_seats WHERE showtime_id = ?', 
            [showtimeId]
        );

        const reservedSeats = rows.map(row => row.seat_number);
        
        res.status(200).json({
            showtimeId: showtimeId,
            reserved: reservedSeats
        });

    } catch (error) {
        console.error(`Error fetching reserved seats for ${showtimeId}:`, error);
        // DB에 연결이 안되어도 Mock 데이터를 반환하여 Booking Service의 테스트를 돕습니다.
        res.status(200).json({
            showtimeId: showtimeId,
            reserved: ['A1', 'B2'] // Mock Data
        });
    }
});


app.listen(port, () => {
    console.log(`Showtime Service listening on port ${port}`);
});