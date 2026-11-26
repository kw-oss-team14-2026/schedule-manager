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

// 받은 친구 요청 조회 API
router.get("/requests/received", requireAuth, async (req, res) => {

    // 1. 로그인한 회원 번호 가져오기
    const userId = req.session.user.user_id;

    try {
        // 2. 받은 친구 요청 조회
        const [rows] = await pool.query(
            `SELECT
                f.friendship_id,
                f.requester_id,
                u.login_id,
                u.nickname,
                f.status,
                f.created_at
             FROM friendships AS f
             INNER JOIN users AS u
                 ON f.requester_id = u.user_id
             WHERE f.receiver_id = ?
                 AND f.status = 'pending'
             ORDER BY f.created_at DESC`,
            [userId]
        );

        // 3. 조회 결과 반환
        return res.status(200).json({
            success: true,
            requests: rows
        });

    } catch (error) {
        // 4. 오류 처리
        console.error("받은 친구 요청 조회 오류:", error);

        return res.status(500).json({
            success: false,
            message: "받은 친구 요청 조회 중 오류가 발생했습니다."
        });
    }
});

// 보낸 친구 요청 조회 API
router.get("/requests/sent", requireAuth, async (req, res) => {

    // 1. 로그인한 회원 번호 가져오기
    const userId = req.session.user.user_id;

    try {
        // 2. 보낸 친구 요청 조회
        const [rows] = await pool.query(
            `SELECT
                f.friendship_id,
                f.receiver_id,
                u.login_id,
                u.nickname,
                f.status,
                f.created_at
             FROM friendships AS f
             INNER JOIN users AS u
                 ON f.receiver_id = u.user_id
             WHERE f.requester_id = ?
                 AND f.status = 'pending'
             ORDER BY f.created_at DESC`,
            [userId]
        );

        // 3. 조회 결과 반환
        return res.status(200).json({
            success: true,
            requests: rows
        });

    } catch (error) {
        // 4. 오류 처리
        console.error("보낸 친구 요청 조회 오류:", error);

        return res.status(500).json({
            success: false,
            message: "보낸 친구 요청 조회 중 오류가 발생했습니다."
        });
    }
});

// 친구 요청 수락 및 거절 API
router.patch("/requests/:id", requireAuth, async (req, res) => {

    // 1. 로그인한 회원 번호 가져오기
    const userId = req.session.user.user_id;

    // 2. 친구 요청 번호 및 변경할 상태 가져오기
    const friendshipId = Number(req.params.id);
    const { status } = req.body;

    // 3. 친구 요청 번호 검증
    if (
        !Number.isSafeInteger(friendshipId) ||
        friendshipId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "올바른 친구 요청 번호를 입력하세요."
        });
    }

    // 4. 변경할 상태 검증
    if (status !== "accepted" && status !== "rejected") {
        return res.status(400).json({
            success: false,
            message: "올바른 친구 요청 상태를 입력하세요."
        });
    }

    try {
        // 5. 친구 요청 상태 변경
        const [result] = await pool.query(
            `UPDATE friendships
             SET status = ?
             WHERE friendship_id = ?
                 AND receiver_id = ?
                 AND status = 'pending'`,
            [status, friendshipId, userId]
        );

        // 6. 변경된 데이터 확인
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "처리할 수 있는 친구 요청을 찾을 수 없습니다."
            });
        }

        // 7. 성공 응답
        return res.status(200).json({
            success: true,
            message: status === "accepted"
                ? "친구 요청을 수락했습니다."
                : "친구 요청을 거절했습니다."
        });

    } catch (error) {
        // 8. 오류 처리
        console.error("친구 요청 처리 오류:", error);

        return res.status(500).json({
            success: false,
            message: "친구 요청 처리 중 오류가 발생했습니다."
        });
    }
});

// 친구 목록 조회 API
router.get("/", requireAuth, async (req, res) => {

    // 1. 로그인한 회원 번호 가져오기
    const userId = req.session.user.user_id;

    try {
        // 2. 수락된 친구 관계 조회
        const [rows] = await pool.query(
            `SELECT
                f.friendship_id,
                u.user_id,
                u.login_id,
                u.nickname,
                f.updated_at
             FROM friendships AS f
             INNER JOIN users AS u
                 ON u.user_id = CASE
                     WHEN f.requester_id = ? THEN f.receiver_id
                     ELSE f.requester_id
                 END
             WHERE (f.requester_id = ? OR f.receiver_id = ?)
                 AND f.status = 'accepted'
             ORDER BY u.nickname ASC`,
            [userId, userId, userId]
        );

        // 3. 조회 결과 반환
        return res.status(200).json({
            success: true,
            friends: rows
        });

    } catch (error) {
        // 4. 오류 처리
        console.error("친구 목록 조회 오류:", error);

        return res.status(500).json({
            success: false,
            message: "친구 목록 조회 중 오류가 발생했습니다."
        });
    }
});

// 친구 삭제 API
router.delete("/:id", requireAuth, async (req, res) => {

    // 1. 로그인한 회원 번호 가져오기
    const userId = req.session.user.user_id;

    // 2. 삭제할 친구 관계 번호 가져오기
    const friendshipId = Number(req.params.id);

    // 3. 친구 관계 번호 검증
    if (
        !Number.isSafeInteger(friendshipId) ||
        friendshipId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "올바른 친구 관계 번호를 입력하세요."
        });
    }

    try {
        // 4. 친구 관계 삭제
        const [result] = await pool.query(
            `DELETE FROM friendships
             WHERE friendship_id = ?
                 AND (requester_id = ? OR receiver_id = ?)
                 AND status = 'accepted'`,
            [friendshipId, userId, userId]
        );

        // 5. 삭제 결과 확인
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "삭제할 수 있는 친구 관계를 찾을 수 없습니다."
            });
        }

        // 6. 성공 응답
        return res.status(200).json({
            success: true,
            message: "친구를 삭제했습니다."
        });

    } catch (error) {
        // 7. 오류 처리
        console.error("친구 삭제 오류:", error);

        return res.status(500).json({
            success: false,
            message: "친구 삭제 중 오류가 발생했습니다."
        });
    }
});
module.exports = router;