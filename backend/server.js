require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

const session = require("express-session");
const bcrypt = require("bcrypt");

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

// 현재 로그인 사용자 확인
app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "로그인이 필요합니다."
        });
    }

    return res.json({
        success: true,
        user: req.session.user
    });
});

// 로그아웃
app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "로그아웃에 실패했습니다."
            });
        }

        res.clearCookie("schedule.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            path: "/"
        });

        return res.json({
            success: true,
            message: "로그아웃되었습니다."
        });
    });
});

// 회원가입 API
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { login_id, password, nickname } = req.body;

        // 1. 입력값 확인
        if (
            typeof login_id !== "string" ||
            typeof password !== "string" ||
            typeof nickname !== "string" ||
            !login_id.trim() ||
            !password ||
            !nickname.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "모든 항목을 입력해 주세요."
            });
        }

        const id = login_id.trim();
        const name = nickname.trim();

        // 2. 길이 제한
        if (
            id.length > 50 ||
            name.length > 50 ||
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                success: false,
                message: "아이디와 닉네임은 50자 이하, 비밀번호는 8자 이상 72바이트 이하로 입력해 주세요."
            });
        }

        // 3. 아이디 중복 확인
        const [existingUsers] = await pool.execute(
            "SELECT user_id FROM users WHERE login_id = ?",
            [id]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "이미 사용 중인 아이디입니다."
            });
        }

        // 4. 비밀번호 해싱
        const passwordHash = await bcrypt.hash(password, 12);

        // 5. DB에 회원 정보 저장
        const [result] = await pool.execute(
            `INSERT INTO users (login_id, password_hash, nickname)
             VALUES (?, ?, ?)`,
            [id, passwordHash, name]
        );

        // 6. 성공 응답
        return res.status(201).json({
            success: true,
            message: "회원가입이 완료되었습니다.",
            user: {
                user_id: result.insertId,
                login_id: id,
                nickname: name
            }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "이미 사용 중인 아이디입니다."
            });
        }

        console.error("회원가입 오류:", error.message);

        return res.status(500).json({
            success: false,
            message: "회원가입 처리 중 오류가 발생했습니다."
        });
    }
});

// 로그인 API
app.post("/api/auth/login", async (req, res) => {
    try {
        const { login_id, password } = req.body;

        if (
            typeof login_id !== "string" ||
            typeof password !== "string" ||
            !login_id.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "아이디와 비밀번호를 입력해 주세요."
            });
        }

        const [users] = await pool.execute(
            `SELECT user_id, login_id, nickname, password_hash
             FROM users
             WHERE login_id = ?`,
            [login_id.trim()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "아이디 또는 비밀번호가 올바르지 않습니다."
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "아이디 또는 비밀번호가 올바르지 않습니다."
            });
        }

        // 로그인 성공 시 세션 ID 재발급
        req.session.regenerate((error) => {
            if (error) {
                console.error("세션 생성 오류:", error);
                return res.status(500).json({
                    success: false,
                    message: "로그인 처리 중 오류가 발생했습니다."
                });
            }

            req.session.user = {
                user_id: user.user_id,
                login_id: user.login_id,
                nickname: user.nickname
            };

            req.session.save((error) => {
                if (error) {
                    console.error("세션 저장 오류:", error);
                    return res.status(500).json({
                        success: false,
                        message: "로그인 처리 중 오류가 발생했습니다."
                    });
                }

                return res.json({
                    success: true,
                    message: "로그인 성공",
                    user: req.session.user
                });
            });
        });

    } catch (error) {
        console.error("로그인 오류:", error.message);

        return res.status(500).json({
            success: false,
            message: "로그인 처리 중 오류가 발생했습니다."
        });
    }
});

// 일정 추가 API
app.post("/api/schedules", async (req, res) => {
    try {
        // 1. 로그인 여부 확인
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "로그인이 필요합니다."
            });
        }

        // 2. 회원 번호 및 일정 데이터 가져오기
        const user_id = req.session.user.user_id;
        const { title, start_at, end_at, color } = req.body;

        // 3. 입력값 검증
        if (
            typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 100 ||
            typeof start_at !== "string" ||
            typeof end_at !== "string" ||
            typeof color !== "string" ||
            !/^#[0-9a-fA-F]{6}$/.test(color)
        ) {
            return res.status(400).json({
                success: false,
                message: "일정 입력값을 확인해 주세요."
            });
        }

        // 4. 날짜 및 시간 검증
        const isValidDateTime = (value) => {
            const date = new Date(value + "Z");

            return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
                !isNaN(date.getTime()) &&
                date.toISOString().slice(0, 16) === value &&
                Number(value.slice(0, 4)) >= 1000;
        };

        if (
            !isValidDateTime(start_at) ||
            !isValidDateTime(end_at) ||
            start_at >= end_at
        ) {
            return res.status(400).json({
                success: false,
                message: "시작 및 종료 시간을 확인해 주세요."
            });
        }

        // 5. DB에 일정 저장
        const [result] = await pool.execute(
            `INSERT INTO schedules
             (user_id, title, start_at, end_at, color)
             VALUES (?, ?, ?, ?, ?)`,
            [
                user_id,
                title.trim(),
                start_at.replace("T", " "),
                end_at.replace("T", " "),
                color
            ]
        );

        // 6. 성공 응답
        return res.status(201).json({
            success: true,
            message: "일정이 추가되었습니다.",
            schedule_id: result.insertId
        });

    } catch (error) {
        console.error("일정 추가 오류:", error.message);

        return res.status(500).json({
            success: false,
            message: "일정 추가 중 오류가 발생했습니다."
        });
    }
});

// 일정 조회 API
app.get("/api/schedules", async (req, res) => {
    try {
        // 1. 로그인 여부 확인
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "로그인이 필요합니다."
            });
        }

        // 2. 로그인한 회원 번호 가져오기
        const user_id = req.session.user.user_id;

        // 3. 해당 회원의 일정 조회
        const [rows] = await pool.execute(
            `SELECT
                schedule_id,
                title,
                DATE_FORMAT(start_at, '%Y-%m-%dT%H:%i:%s') AS start_at,
                DATE_FORMAT(end_at, '%Y-%m-%dT%H:%i:%s') AS end_at,
                color
             FROM schedules
             WHERE user_id = ?
             ORDER BY start_at ASC`,
            [user_id]
        );

        // 4. 조회 결과 반환
        return res.status(200).json({
            success: true,
            schedules: rows
        });

    } catch (error) {
        console.error("일정 조회 오류:", error.message);

        return res.status(500).json({
            success: false,
            message: "일정 조회 중 오류가 발생했습니다."
        });
    }
});

// 일정 수정 API
app.put("/api/schedules/:id", async (req, res) => {
    try {
        // 1. 로그인 여부 확인
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "로그인이 필요합니다."
            });
        }

        // 2. 회원 번호 및 일정 번호 가져오기
        const user_id = req.session.user.user_id;
        const schedule_id = Number(req.params.id);

        const { title, start_at, end_at, color } = req.body;

        // 3. 입력값 검증
        if (
            !Number.isSafeInteger(schedule_id) ||
            schedule_id <= 0 ||
            typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 100 ||
            typeof start_at !== "string" ||
            typeof end_at !== "string" ||
            typeof color !== "string" ||
            !/^#[0-9a-fA-F]{6}$/.test(color)
        ) {
            return res.status(400).json({
                success: false,
                message: "일정 입력값을 확인해 주세요."
            });
        }

        // 4. 날짜 및 시간 검증
        const isValidDateTime = (value) => {
            const date = new Date(value + "Z");

            return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
                !isNaN(date.getTime()) &&
                date.toISOString().slice(0, 16) === value &&
                Number(value.slice(0, 4)) >= 1000;
        };

        if (
            !isValidDateTime(start_at) ||
            !isValidDateTime(end_at) ||
            start_at >= end_at
        ) {
            return res.status(400).json({
                success: false,
                message: "시작 및 종료 시간을 확인해 주세요."
            });
        }

        // 5. DB의 기존 일정 수정
        const [result] = await pool.execute(
            `UPDATE schedules
             SET title = ?,
                 start_at = ?,
                 end_at = ?,
                 color = ?
             WHERE schedule_id = ?
               AND user_id = ?`,
            [
                title.trim(),
                start_at.replace("T", " "),
                end_at.replace("T", " "),
                color,
                schedule_id,
                user_id
            ]
        );

        // 6. 수정 대상 확인
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "수정할 일정을 찾을 수 없습니다."
            });
        }

        // 7. 성공 응답
        return res.status(200).json({
            success: true,
            message: "일정이 수정되었습니다."
        });

    } catch (error) {
        console.error("일정 수정 오류:", error.message);

        return res.status(500).json({
            success: false,
            message: "일정 수정 중 오류가 발생했습니다."
        });
    }
});

// 일정 삭제 API
app.delete("/api/schedules/:id", async (req, res) => {
    try {
        // 1. 로그인 여부 확인
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "로그인이 필요합니다."
            });
        }

        // 2. 회원 번호 및 일정 번호 가져오기
        const user_id = req.session.user.user_id;
        const schedule_id = Number(req.params.id);

        // 3. 일정 번호 검증
        if (
            !Number.isSafeInteger(schedule_id) ||
            schedule_id <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "잘못된 일정 번호입니다."
            });
        }

        // 4. DB에서 일정 삭제
        const [result] = await pool.execute(
            `DELETE FROM schedules
             WHERE schedule_id = ?
               AND user_id = ?`,
            [schedule_id, user_id]
        );

        // 5. 삭제 대상 확인
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "삭제할 일정을 찾을 수 없습니다."
            });
        }

        // 6. 성공 응답
        return res.status(200).json({
            success: true,
            message: "일정이 삭제되었습니다."
        });

    } catch (error) {
        console.error("일정 삭제 오류:", error.message);

        return res.status(500).json({
            success: false,
            message: "일정 삭제 중 오류가 발생했습니다."
        });
    }
});

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});