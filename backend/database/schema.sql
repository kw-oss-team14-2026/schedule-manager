CREATE DATABASE IF NOT EXISTS login_test_db;

USE login_test_db;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL
);

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

    FOREIGN KEY (user_id) REFERENCES users(user_id),

    INDEX idx_user_start (user_id, start_at),

    CHECK (end_at > start_at)
);

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