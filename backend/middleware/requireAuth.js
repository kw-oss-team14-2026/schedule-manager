function requireAuth(req, res, next) {
    // 로그인 여부 확인
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "로그인이 필요합니다."
        });
    }

    next();
}

module.exports = requireAuth;