CREATE DATABASE IF NOT EXISTS login_test_db;
USE login_test_db;

-- 1. 회원 테이블
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL
);

-- 2. 일정 테이블
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    color CHAR(7) NOT NULL DEFAULT '#6b4ee6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(user_id),
    INDEX idx_user_start (user_id, start_at),
    CHECK (end_at > start_at)
);

-- 3. 친구 관계 테이블
CREATE TABLE IF NOT EXISTS friendships (
    friendship_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected')
        NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (receiver_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    CHECK (requester_id <> receiver_id),
    UNIQUE KEY uq_friend_pair (
        (LEAST(requester_id, receiver_id)),
        (GREATEST(requester_id, receiver_id))
    ),
    INDEX idx_requester_status (requester_id, status),
    INDEX idx_receiver_status (receiver_id, status)
);

-- 4. 공유방 테이블
CREATE TABLE IF NOT EXISTS sharing_rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(50) NOT NULL,
    creator_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- 5. 공유방 참여자 테이블
CREATE TABLE IF NOT EXISTS sharing_room_members (
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    invited_by INT NULL,
    status ENUM('pending', 'accepted', 'rejected')
        NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    joined_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id)
        REFERENCES sharing_rooms(room_id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (invited_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,
    INDEX idx_member_user_status (user_id, status),
    INDEX idx_member_room_status (room_id, status)
);