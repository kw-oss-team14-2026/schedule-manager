const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { isValidDateTime } = require("../utils/validation");
const router = express.Router();

// 공유방 생성 및 친구 초대 API
router.post("/rooms", requireAuth, async (req, res) => {
    const userId = req.session.user.user_id;
    const { room_name, friend_ids } = req.body || {};

    // 1. 공유방 이름 검증
    if (
        typeof room_name !== "string" ||
        !room_name.trim() ||
        room_name.trim().length > 50
    ) {
        return res.status(400).json({
            success: false,
            message: "공유방 이름을 확인해 주세요."
        });
    }

    // 2. 초대할 친구 목록 검증
    if (
        !Array.isArray(friend_ids) ||
        friend_ids.length === 0 ||
        friend_ids.some(id =>
            !Number.isSafeInteger(id) ||
            id <= 0 ||
            id === userId
        ) ||
        new Set(friend_ids).size !== friend_ids.length
    ) {
        return res.status(400).json({
            success: false,
            message: "초대할 친구 목록을 확인해 주세요."
        });
    }

    let connection;

    try {
        // 3. 트랜잭션 시작
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 4. 실제 친구 관계 확인
        const [friends] = await connection.query(
            `SELECT
                CASE
                    WHEN requester_id = ? THEN receiver_id
                    ELSE requester_id
                END AS user_id
             FROM friendships
             WHERE (requester_id = ? OR receiver_id = ?)
                 AND status = 'accepted'
             FOR UPDATE`,
            [userId, userId, userId]
        );

        const validFriendIds = new Set(
            friends.map(friend => friend.user_id)
        );

        if (friend_ids.some(id => !validFriendIds.has(id))) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message: "친구 관계인 회원만 초대할 수 있습니다."
            });
        }

        // 5. 공유방 생성
        const [roomResult] = await connection.execute(
            `INSERT INTO sharing_rooms
             (room_name, creator_id)
             VALUES (?, ?)`,
            [room_name.trim(), userId]
        );

        const roomId = roomResult.insertId;

        // 6. 생성자를 참여자로 등록
        await connection.execute(
            `INSERT INTO sharing_room_members
             (room_id, user_id, status, joined_at)
             VALUES (?, ?, 'accepted', NOW())`,
            [roomId, userId]
        );

        // 7. 선택한 친구들에게 초대 전송
        const inviteValues = friend_ids.map(friendId => [
            roomId, friendId, userId, "pending"
        ]);

        await connection.query(
            `INSERT INTO sharing_room_members
             (room_id, user_id, invited_by, status)
             VALUES ?`,
            [inviteValues]
        );

        // 8. 트랜잭션 완료
        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "공유방을 생성하고 친구를 초대했습니다.",
            room_id: roomId,
            member_count: 1,
            pending_count: friend_ids.length
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("공유방 생성 오류:", error);

        return res.status(500).json({
            success: false,
            message: "공유방 생성 중 오류가 발생했습니다."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// 내 공유방 목록 조회 API
router.get("/rooms", requireAuth, async (req, res) => {
    const userId = req.session.user.user_id;

    try {
        // 참여 중인 공유방 및 인원 조회
        const [rows] = await pool.execute(
            `SELECT
                r.room_id,
                r.room_name,
                r.creator_id,
                r.created_at,
                (
                    SELECT COUNT(*)
                    FROM sharing_room_members AS m
                    WHERE m.room_id = r.room_id
                        AND m.status = 'accepted'
                ) AS member_count,
                (
                    SELECT COUNT(*)
                    FROM sharing_room_members AS m
                    WHERE m.room_id = r.room_id
                        AND m.status = 'pending'
                ) AS pending_count
             FROM sharing_rooms AS r
             INNER JOIN sharing_room_members AS me
                 ON r.room_id = me.room_id
             WHERE me.user_id = ?
                 AND me.status = 'accepted'
             ORDER BY r.created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            rooms: rows
        });
    } catch (error) {
        console.error("공유방 목록 조회 오류:", error);

        return res.status(500).json({
            success: false,
            message: "공유방 목록 조회 중 오류가 발생했습니다."
        });
    }
});

// 받은 공유방 초대 목록 조회 API
router.get("/invites", requireAuth, async (req, res) => {
    const userId = req.session.user.user_id;

    try {
        // 아직 응답하지 않은 공유방 초대 조회
        const [rows] = await pool.execute(
            `SELECT
                r.room_id,
                r.room_name,
                m.invited_by,
                COALESCE(u.nickname, '탈퇴한 회원') AS sender_nickname,
                m.created_at,
                (
                    SELECT COUNT(*)
                    FROM sharing_room_members AS member
                    WHERE member.room_id = r.room_id
                        AND member.status = 'accepted'
                ) AS member_count
             FROM sharing_room_members AS m
             INNER JOIN sharing_rooms AS r
                 ON m.room_id = r.room_id
             LEFT JOIN users AS u
                 ON m.invited_by = u.user_id
             WHERE m.user_id = ?
                 AND m.status = 'pending'
             ORDER BY m.created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            invites: rows
        });
    } catch (error) {
        console.error("공유방 초대 조회 오류:", error);

        return res.status(500).json({
            success: false,
            message: "공유방 초대 조회 중 오류가 발생했습니다."
        });
    }
});

// 공유방 초대 수락 및 거절 API
router.patch("/invites/:roomId", requireAuth, async (req, res) => {
    const userId = req.session.user.user_id;
    const roomId = Number(req.params.roomId);
    const { status } = req.body || {};

    if (!Number.isSafeInteger(roomId) || roomId <= 0) {
        return res.status(400).json({
            success: false,
            message: "올바른 공유방 번호를 입력하세요."
        });
    }

    if (status !== "accepted" && status !== "rejected") {
        return res.status(400).json({
            success: false,
            message: "올바른 초대 상태를 입력하세요."
        });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 공유방 잠금
        const [rooms] = await connection.execute(
            `SELECT room_id
             FROM sharing_rooms
             WHERE room_id = ?
             FOR UPDATE`,
            [roomId]
        );

        if (rooms.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 공유방입니다."
            });
        }

        // 초대 상태 및 참여 시간 변경
        const [result] = await connection.execute(
            `UPDATE sharing_room_members
             SET status = ?,
                 joined_at = CASE
                     WHEN ? = 'accepted' THEN NOW()
                     ELSE NULL
                 END
             WHERE room_id = ?
                 AND user_id = ?
                 AND status = 'pending'`,
            [status, status, roomId, userId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "처리할 수 있는 공유방 초대를 찾을 수 없습니다."
            });
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: status === "accepted"
                ? "공유방 초대를 수락했습니다."
                : "공유방 초대를 거절했습니다."
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("공유방 초대 처리 오류:", error);

        return res.status(500).json({
            success: false,
            message: "공유방 초대 처리 중 오류가 발생했습니다."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// 공유방 나가기 API
router.delete("/rooms/:roomId/members/me", requireAuth, async (req, res) => {
    const userId = req.session.user.user_id;
    const roomId = Number(req.params.roomId);

    // 1. 공유방 번호 검증
    if (!Number.isSafeInteger(roomId) || roomId <= 0) {
        return res.status(400).json({
            success: false,
            message: "올바른 공유방 번호를 입력하세요."
        });
    }

    let connection;

    try {
        // 2. 트랜잭션 시작
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 3. 공유방 잠금 및 존재 여부 확인
        const [rooms] = await connection.execute(
            `SELECT room_id
             FROM sharing_rooms
             WHERE room_id = ?
             FOR UPDATE`,
            [roomId]
        );

        if (rooms.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 공유방입니다."
            });
        }

        // 4. 본인의 참여 정보 삭제
        const [result] = await connection.execute(
            `DELETE FROM sharing_room_members
             WHERE room_id = ?
                 AND user_id = ?
                 AND status = 'accepted'`,
            [roomId, userId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "참여 중인 공유방을 찾을 수 없습니다."
            });
        }

        // 5. 남은 참여자 확인
        const [members] = await connection.execute(
            `SELECT user_id
             FROM sharing_room_members
             WHERE room_id = ?
                 AND status = 'accepted'
             FOR UPDATE`,
            [roomId]
        );

        const roomDeleted = members.length === 0;

        // 6. 마지막 참여자가 나간 경우 공유방 삭제
        if (roomDeleted) {
            await connection.execute(
                `DELETE FROM sharing_rooms
                 WHERE room_id = ?`,
                [roomId]
            );
        }

        // 7. 트랜잭션 완료
        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "공유방에서 나갔습니다.",
            room_deleted: roomDeleted
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("공유방 나가기 오류:", error);

        return res.status(500).json({
            success: false,
            message: "공유방 나가기 중 오류가 발생했습니다."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// 공유방 상세 정보 및 참여자 조회 API
router.get("/rooms/:roomId", requireAuth, async (req, res) => {
    const userId = req.session.user.user_id;
    const roomId = Number(req.params.roomId);

    // 1. 공유방 번호 검증
    if (!Number.isSafeInteger(roomId) || roomId <= 0) {
        return res.status(400).json({
            success: false,
            message: "올바른 공유방 번호를 입력하세요."
        });
    }

    try {
        // 2. 접근 권한 확인 및 공유방 정보 조회
        const [rows] = await pool.execute(
            `SELECT
                r.room_id,
                r.room_name,
                r.creator_id,
                r.created_at,
                u.user_id,
                u.nickname,
                m.joined_at
             FROM sharing_rooms AS r
             INNER JOIN sharing_room_members AS me
                 ON r.room_id = me.room_id
             INNER JOIN sharing_room_members AS m
                 ON r.room_id = m.room_id
             INNER JOIN users AS u
                 ON m.user_id = u.user_id
             WHERE r.room_id = ?
                 AND me.user_id = ?
                 AND me.status = 'accepted'
                 AND m.status = 'accepted'
             ORDER BY (u.user_id = ?) DESC,
                 m.joined_at ASC, u.user_id ASC`,
            [roomId, userId, userId]
        );

        // 3. 접근 권한 확인
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "접근할 수 있는 공유방을 찾을 수 없습니다."
            });
        }

        // 4. 참여자 목록 구성
        const members = rows.map(row => ({
            user_id: row.user_id,
            nickname: row.nickname,
            joined_at: row.joined_at
        }));

        // 5. 공유방 정보 반환
        return res.status(200).json({
            success: true,
            current_user_id: userId,
            room: {
                room_id: rows[0].room_id,
                room_name: rows[0].room_name,
                creator_id: rows[0].creator_id,
                created_at: rows[0].created_at,
                member_count: members.length,
                members: members
            }
        });
    } catch (error) {
        console.error("공유방 상세 조회 오류:", error);

        return res.status(500).json({
            success: false,
            message: "공유방 정보 조회 중 오류가 발생했습니다."
        });
    }
});

// 공유방 참여자 일정 조회 API
router.get("/rooms/:roomId/schedules", requireAuth, async (req, res) => {
    const userId = req.session.user.user_id;
    const roomId = Number(req.params.roomId);
    const { start, end } = req.query;

    // 1. 공유방 번호 검증
    if (!Number.isSafeInteger(roomId) || roomId <= 0) {
        return res.status(400).json({
            success: false,
            message: "올바른 공유방 번호를 입력하세요."
        });
    }

    // 2. 조회 기간 검증
    if (
        typeof start !== "string" ||
        typeof end !== "string" ||
        !isValidDateTime(start) ||
        !isValidDateTime(end) ||
        start >= end
    ) {
        return res.status(400).json({
            success: false,
            message: "일정 조회 기간을 확인해 주세요."
        });
    }

    try {
        // 3. 접근 권한 및 참여자 일정 조회
        const [rows] = await pool.execute(
            `SELECT
                s.schedule_id,
                s.user_id,
                s.title,
                DATE_FORMAT(s.start_at, '%Y-%m-%dT%H:%i:%s') AS start_at,
                DATE_FORMAT(s.end_at, '%Y-%m-%dT%H:%i:%s') AS end_at,
                s.color
             FROM sharing_room_members AS me
             INNER JOIN sharing_room_members AS m
                 ON me.room_id = m.room_id
                 AND m.status = 'accepted'
             LEFT JOIN schedules AS s
                 ON m.user_id = s.user_id
                 AND s.start_at < ?
                 AND s.end_at > ?
             WHERE me.room_id = ?
                 AND me.user_id = ?
                 AND me.status = 'accepted'
             ORDER BY s.start_at ASC`,
            [
                end.replace("T", " "),
                start.replace("T", " "),
                roomId,
                userId
            ]
        );

        // 4. 공유방 접근 권한 확인
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "접근할 수 있는 공유방을 찾을 수 없습니다."
            });
        }

        // 5. 일정이 없는 참여자의 NULL 데이터 제외
        const schedules = rows.filter(row => row.schedule_id !== null);

        // 6. 조회 결과 반환
        return res.status(200).json({
            success: true,
            schedules: schedules
        });
    } catch (error) {
        console.error("공유방 일정 조회 오류:", error);

        return res.status(500).json({
            success: false,
            message: "공유방 일정 조회 중 오류가 발생했습니다."
        });
    }
});
module.exports = router;