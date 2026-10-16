const mysql = require("mysql2/promise");

async function main() {
    const db = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "kowon2008!",
        database: "schedule_manager"
    });

    // 프론트엔드에서 회원가입 정보를 받았다고 가정
    const loginId = "student01";
    const nickname = "홍길동";
    const passwordHash = "1234567";

    // MySQL에 회원 정보 저장
    await db.execute(
        "INSERT INTO users (login_id, password_hash, nickname) VALUES (?, ?, ?)",
        [loginId, passwordHash, nickname]
    );

    console.log("회원가입 정보 저장 성공!");

    // MySQL에서 회원 정보 조회
    const [rows] = await db.execute(
        "SELECT user_id, login_id, nickname FROM users WHERE login_id = ?",
        [loginId]
    );

    console.table(rows);

    await db.end();
}

main().catch(console.error);