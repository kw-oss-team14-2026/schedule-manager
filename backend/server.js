require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Express 서버 상태 확인
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "서버가 정상적으로 실행 중입니다."
    });
});

// MySQL 연결 상태 확인
app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT COUNT(*) AS userCount FROM users"
        );

        res.json({
            success: true,
            message: "MySQL 연결 성공!",
            userCount: rows[0].userCount
        });
    } catch (error) {
        console.error("DB 연결 오류:", error.message);

        res.status(500).json({
            success: false,
            message: "MySQL 연결 실패"
        });
    }
});

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});