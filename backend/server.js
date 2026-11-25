require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

const session = require("express-session");
const authRoutes = require("./routes/auth");
const scheduleRoutes = require("./routes/schedules");
const userRoutes = require("./routes/users");
const friendRoutes = require("./routes/friends");
const sharingRoutes = require("./routes/sharing");

const path = require("path");

app.use(express.json());

const frontendPath = path.join(__dirname, "..");

// CSS, JavaScript, HTML 등 정적 파일 제공
app.use(express.static(frontendPath));
// 메인 페이지
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(session({
    name: "schedule.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60 * 2
    }
}));

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

// 인증 Router 연결
app.use("/api/auth", authRoutes);

// 일정 Router 연결
app.use("/api/schedules", scheduleRoutes);

// 회원 Router 연결
app.use("/api/users", userRoutes);

// 친구 Router 연결
app.use("/api/friends", friendRoutes);

// 공유방 Router 연결
app.use("/api/sharing", sharingRoutes);

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});