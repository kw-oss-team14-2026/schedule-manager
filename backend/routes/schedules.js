const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { isValidDateTime } = require("../utils/validation");

const router = express.Router();

// 일정 추가 API
router.post("/",requireAuth, async (req, res) => {
    try {
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
router.get("/",requireAuth, async (req, res) => {
    try {
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
router.put("/:id",requireAuth, async (req, res) => {
    try {
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
router.delete("/:id", requireAuth,async (req, res) => {
    try {
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

module.exports = router;