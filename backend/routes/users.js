const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

// 회원 검색 API
router.get("/search", requireAuth, async (req, res) => {
    
    const userId = req.session.user.user_id;
    const loginId = String(req.query.login_id || "").trim();

    // 검색어 확인
    if (!loginId) {
        return res.status(400).json({
            success: false,
            message: "검색할 아이디를 입력하세요."
        });
    }

    try {
        const [rows] = await pool.query(
            `SELECT user_id, login_id, nickname
             FROM users
             WHERE login_id = ?
             AND user_id <> ?`,
            [loginId, userId]
        );

        return res.json({
            success: true,
            users: rows
        });

    } catch (error) {
        console.error("회원 검색 오류:", error);

        return res.status(500).json({
            success: false,
            message: "회원 검색 중 오류가 발생했습니다."
        });
    }
});

module.exports = router;