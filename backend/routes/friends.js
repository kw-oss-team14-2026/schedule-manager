const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

// 친구 요청 API
router.post("/request", requireAuth, async (req, res) => {
    
    const requesterId = req.session.user.user_id;
    const receiverId = Number(req.body.receiver_id);

    // 상대방 ID 검증
    if (!Number.isInteger(receiverId) || receiverId <= 0) {
        return res.status(400).json({
            success: false,
            message: "올바른 회원 ID를 입력하세요."
        });
    }

    // 자기 자신에게 요청하는 경우
    if (requesterId === receiverId) {
        return res.status(400).json({
            success: false,
            message: "자기 자신에게 친구 요청을 보낼 수 없습니다."
        });
    }

    try {
        // 상대방이 존재하는지 확인
        const [users] = await pool.query(
            "SELECT user_id FROM users WHERE user_id = ?",
            [receiverId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 회원입니다."
            });
        }

        // 친구 요청 저장
        const [result] = await pool.query(
            `INSERT INTO friendships
             (requester_id, receiver_id)
             VALUES (?, ?)`,
            [requesterId, receiverId]
        );

        return res.status(201).json({
            success: true,
            message: "친구 요청을 보냈습니다.",
            friendship_id: result.insertId
        });

    } catch (error) {
        // 중복 친구 요청 처리
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "이미 친구 관계 또는 요청 기록이 존재합니다."
            });
        }

        console.error("친구 요청 오류:", error);

        return res.status(500).json({
            success: false,
            message: "친구 요청 중 오류가 발생했습니다."
        });
    }
});

module.exports = router;