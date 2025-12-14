const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise'); // 🚨 mysql2/promise 모듈 사용
const app = express();
const port = 3002;
app.use(express.json());

// --- RDS Configuration (환경 변수 사용) ---
const dbConfig = {
    // ⚠️ YAML 파일의 환경 변수 이름과 일치하도록 DB_HOST/DB_USERNAME 등을 사용합니다.
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME, // 👈 YAML의 DB_USERNAME 환경 변수 사용
    password: process.env.DB_PASSWORD,
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
        console.log("[Booking Service] Database pool initialized successfully.");
    } catch (error) {
        console.error("[Booking Service] Failed to initialize database pool:", error);
        process.exit(1); 
    }
}
initializeDatabase();


// 🚨 5. 예매 완료 내역 전체 조회 (DB에서 조회)
app.get('/list', async (req, res) => {
    try {
        // 🚨 booking 테이블의 모든 레코드를 조회합니다.
        const [rows] = await pool.query('SELECT * FROM booking');
        console.log(`[Booking Service] GET /list processed. Total: ${rows.length} rows.`);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching bookings from DB:", error);
        res.status(500).json({ error: '예매 목록 조회 중 오류 발생' });
    }
});


// 🚨 3. 좌석 선택 + 예매 요청 (DB에 저장 - 트랜잭션 사용)
app.post('/book', async (req, res) => {
    const { showtimeId, seats, userId } = req.body;
    if (!showtimeId || !seats || !userId || seats.length === 0) {
      return res.status(400).json({ error: '필수 정보 누락' });
    }

    let connection;
    try {
        // 1. 좌석 중복 검사 (Showtime Service API 호출 - 현재는 Mock 응답을 가정)
        // ⚠️ 주의: K8S 내부 서비스 이름 사용 (showtime-service-svc)
        const showtimeServiceUrl = `http://showtime-service-svc:80/showtimes/${showtimeId}/seats`; 
        
        // 🚨 현재 이 엔드포인트는 Mock이거나 미구현 상태이므로, 임시로 스킵하거나 응답을 Mocking합니다.
        // 실제로는 이 API를 통해 예약된 좌석 목록을 받아와 중복 검사를 해야 합니다.
        
        // 2. 예매 처리 (DB 트랜잭션 처리)
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const insertQuery = 'INSERT INTO booking (showtime_id, user_identifier, seat_number) VALUES ?';
        // 선택된 좌석 수만큼 INSERT 쿼리를 생성하기 위한 값 배열
        const values = seats.map(seat => [showtimeId, userId, seat]);

        const [result] = await connection.query(insertQuery, [values]);
        
        await connection.commit(); // 트랜잭션 커밋

        res.status(201).json({ 
            message: '예매 완료',
            bookingCount: result.affectedRows,
            firstReservationId: result.insertId // 첫 번째 예약 ID 반환 (DB에 의해 생성됨)
        });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // 오류 시 롤백
        }
        console.error("Error during booking process:", error.message || error);
        
        // 외래 키 또는 중복 예매 오류(UNIQUE KEY) 처리
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: '선택된 좌석 중 이미 예약된 좌석이 있습니다.' });
        }
        res.status(500).json({ error: '예매 처리 중 오류 발생 (DB 트랜잭션 롤백)' });
    } finally {
        if (connection) {
            connection.release(); // 연결 반환
        }
    }
});

// 🚨 4. 예매 완료 내역 조회 (DB에서 조회)
app.get('/bookings/:id', async (req, res) => {
    try {
        const reservationId = req.params.id; // bookingId는 이제 reservation_id (INT)
        const [rows] = await pool.query('SELECT * FROM booking WHERE reservation_id = ?', [reservationId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: '예매 내역 없음' });
        }
        // 예약 ID로 조회하면 여러 좌석이 나올 수 있으므로 배열을 반환하거나 그룹화해야 하지만,
        // 현재는 첫 번째 행을 기준으로 응답을 구성합니다.
        res.status(200).json(rows); 

    } catch (error) {
        console.error("Error fetching booking detail:", error);
        res.status(500).json({ error: '데이터베이스 조회 중 오류 발생' });
    }
});

app.listen(port, () => {
    console.log(`Booking Service listening on port ${port}`);
});