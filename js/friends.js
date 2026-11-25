"use strict";

// 1. HTML 요소 가져오기
const friendsModal = document.getElementById("friends-modal");
const friendsOpen = document.getElementById("friends-open");
const friendsClose = document.getElementById("friends-close");
const friendsTabs = document.querySelectorAll(".friends-tabs button");
const friendsList = document.getElementById("friends-list");
const friendSearchForm = document.getElementById("friend-search-form");
const friendSearchInput = document.getElementById("friend-search-input");
const friendSearchResult = document.getElementById("friend-search-result");
const friendsMessage = document.getElementById("friends-message");

// 현재 선택된 탭
let currentTab = "friends";
// 2. 친구 관리 모달 열기
friendsOpen.addEventListener("click", function () {

    friendsModal.showModal();

    // 기본 탭을 친구 목록으로 설정
    currentTab = "friends";

    friendsTabs.forEach(function (tab) {
        tab.classList.toggle(
            "active",
            tab.dataset.tab === "friends"
        );
    });

    // 친구 목록 불러오기
    loadFriends();
});

// 3. 친구 관리 모달 닫기
friendsClose.addEventListener("click", function () {
    friendsModal.close();
});

// 4. 친구 관리 탭 전환
friendsTabs.forEach(function (tab) {

    tab.addEventListener("click", function () {

        // 모든 탭의 active 클래스 제거
        friendsTabs.forEach(function (button) {
            button.classList.remove("active");
        });

        // 클릭한 탭에 active 클래스 추가
        tab.classList.add("active");

        // 현재 선택된 탭 저장
        currentTab = tab.dataset.tab;

        // 기존 목록 초기화
        friendsList.replaceChildren();

        console.log("현재 선택된 탭:", currentTab);

        // 선택된 탭에 맞는 데이터 조회
        if (currentTab === "friends") {
            loadFriends();

        } else if (currentTab === "received") {
            loadFriendRequests("received");

        } else if (currentTab === "sent") {
            loadFriendRequests("sent");
        }
    });
});
// 5. 회원 검색 API 연동
friendSearchForm.addEventListener("submit", async function (event) {

    // 폼 제출 시 페이지 새로고침 방지
    event.preventDefault();

    // 검색할 아이디 가져오기
    const loginId = friendSearchInput.value.trim();

    // 기존 검색 결과 및 메시지 초기화
    friendSearchResult.replaceChildren();
    friendsMessage.textContent = "";
    friendsMessage.className = "";

    // 입력값 검증
    if (!loginId) {
        friendsMessage.textContent = "검색할 아이디를 입력하세요.";
        friendsMessage.className = "error";
        return;
    }

    const searchButton = friendSearchForm.querySelector(
        'button[type="submit"]'
    );

    searchButton.disabled = true;

    try {
        // 회원 검색 API 호출
        const response = await fetch(
            "/api/users/search?login_id=" + encodeURIComponent(loginId)
        );

        const result = await response.json();

        // API 응답 확인
        if (!response.ok || !result.success) {
            throw new Error(result.message || "회원 검색 실패");
        }

        // 검색 결과 화면에 출력
        renderSearchResults(result.users);

    } catch (error) {
        console.error("회원 검색 오류:", error);

        friendsMessage.textContent = error.message;
        friendsMessage.className = "error";

    } finally {
        searchButton.disabled = false;
    }
});

// 6. 회원 검색 결과 출력
function renderSearchResults(users) {

    friendSearchResult.replaceChildren();

    // 검색 결과가 없는 경우
    if (users.length === 0) {
        friendSearchResult.textContent =
            "검색 결과가 없습니다.";
        return;
    }

    // 검색된 회원 정보 출력
    users.forEach(function (user) {

        // 회원 정보 영역
        const info = document.createElement("div");
        info.className = "friend-info";

        // 닉네임
        const nickname = document.createElement("div");
        nickname.className = "friend-nickname";
        nickname.textContent = user.nickname;

        // 로그인 아이디
        const loginId = document.createElement("div");
        loginId.className = "friend-login-id";
        loginId.textContent = user.login_id;

        // 친구 요청 버튼
        const requestButton = document.createElement("button");
        requestButton.type = "button";
        requestButton.className = "friend-action primary";
        requestButton.textContent = "친구 요청";

        // 친구 요청 버튼 클릭 이벤트
        requestButton.addEventListener("click", function () {
        sendFriendRequest(user.user_id, requestButton);
        });

        // 회원 정보 조립
        info.appendChild(nickname);
        info.appendChild(loginId);

        // 검색 결과 행 생성
        const row = document.createElement("div");
        row.className = "friend-search-item";

        row.appendChild(info);
        row.appendChild(requestButton);

        // 화면에 추가
        friendSearchResult.appendChild(row);
    });
}

// 7. 친구 요청 전송 API 연동
async function sendFriendRequest(receiverId, button) {

    // 기존 메시지 초기화
    friendsMessage.textContent = "";
    friendsMessage.className = "";

    // 중복 클릭 방지
    button.disabled = true;
    button.textContent = "요청 중...";

    try {
        // 친구 요청 API 호출
        const response = await fetch("/api/friends/request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                receiver_id: receiverId
            })
        });

        const result = await response.json();

        // API 응답 확인
        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "친구 요청에 실패했습니다."
            );
        }

        // 요청 성공
        friendsMessage.textContent = result.message;
        friendsMessage.className = "success";

        button.textContent = "요청 완료";

    } catch (error) {
        console.error("친구 요청 오류:", error);

        // 오류 메시지 출력
        friendsMessage.textContent = error.message;
        friendsMessage.className = "error";

        // 버튼 원래 상태로 복구
        button.disabled = false;
        button.textContent = "친구 요청";
    }
}

// 8. 받은 요청 및 보낸 요청 조회
async function loadFriendRequests(type) {

    friendsList.replaceChildren();

    try {
        const response = await fetch(
            "/api/friends/requests/" + type
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "친구 요청 조회에 실패했습니다."
            );
        }

        // 다른 탭으로 이동한 경우 출력하지 않음
        if (currentTab !== type) {
            return;
        }

        renderFriendRequests(result.requests, type);

    } catch (error) {
        console.error("친구 요청 조회 오류:", error);

        if (currentTab !== type) {
            return;
        }

        friendsMessage.textContent = error.message;
        friendsMessage.className = "error";
    }
}

// 9. 친구 요청 화면 출력
function renderFriendRequests(requests, type) {

    friendsList.replaceChildren();

    // 요청이 없는 경우
    if (requests.length === 0) {
        const empty = document.createElement("li");
        empty.className = "friends-empty";

        empty.textContent = type === "received"
            ? "받은 친구 요청이 없습니다."
            : "보낸 친구 요청이 없습니다.";

        friendsList.appendChild(empty);
        return;
    }

    requests.forEach(function (request) {

        // 목록 행 생성
        const row = document.createElement("li");

        // 회원 정보
        const info = document.createElement("div");
        info.className = "friend-info";

        const nickname = document.createElement("div");
        nickname.className = "friend-nickname";
        nickname.textContent = request.nickname;

        const loginId = document.createElement("div");
        loginId.className = "friend-login-id";
        loginId.textContent = request.login_id;

        info.appendChild(nickname);
        info.appendChild(loginId);

        row.appendChild(info);

        // 버튼 영역
        const actions = document.createElement("div");
        actions.className = "friend-actions";

        if (type === "received") {

            // 수락 버튼
            const acceptButton = document.createElement("button");
            acceptButton.type = "button";
            acceptButton.className = "friend-action primary";
            acceptButton.textContent = "수락";
            acceptButton.addEventListener("click", function () {
            updateFriendRequest(request.friendship_id, "accepted", actions);
            });

            // 거절 버튼
            const rejectButton = document.createElement("button");
            rejectButton.type = "button";
            rejectButton.className = "friend-action danger";
            rejectButton.textContent = "거절";
            rejectButton.addEventListener("click", function () {
            updateFriendRequest(request.friendship_id, "rejected", actions);
            });
            actions.appendChild(acceptButton);
            actions.appendChild(rejectButton);

        } else {

            // 보낸 요청 상태 표시
            const status = document.createElement("span");
            status.className = "friend-login-id";
            status.textContent = "수락 대기 중";

            actions.appendChild(status);
        }

        row.appendChild(actions);
        friendsList.appendChild(row);
    });
}

// 10. 친구 목록 조회 API 연동
async function loadFriends() {

    friendsList.replaceChildren();

    try {
        const response = await fetch("/api/friends");

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "친구 목록 조회에 실패했습니다."
            );
        }

        // 다른 탭으로 이동한 경우 출력하지 않음
        if (currentTab !== "friends") {
            return;
        }

        renderFriends(result.friends);

    } catch (error) {
        console.error("친구 목록 조회 오류:", error);

        if (currentTab !== "friends") {
            return;
        }

        friendsMessage.textContent = error.message;
        friendsMessage.className = "error";
    }
}

// 11. 친구 목록 화면 출력
function renderFriends(friends) {

    friendsList.replaceChildren();

    // 등록된 친구가 없는 경우
    if (friends.length === 0) {

        const empty = document.createElement("li");
        empty.className = "friends-empty";
        empty.textContent = "등록된 친구가 없습니다.";

        friendsList.appendChild(empty);
        return;
    }

    // 친구 목록 출력
    friends.forEach(function (friend) {

        // 목록 행 생성
        const row = document.createElement("li");

        // 친구 정보 영역
        const info = document.createElement("div");
        info.className = "friend-info";

        // 닉네임
        const nickname = document.createElement("div");
        nickname.className = "friend-nickname";
        nickname.textContent = friend.nickname;

        // 로그인 아이디
        const loginId = document.createElement("div");
        loginId.className = "friend-login-id";
        loginId.textContent = friend.login_id;

        // 삭제 버튼
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "friend-action danger";
        deleteButton.textContent = "삭제";

        // 친구 삭제 버튼 클릭 이벤트
        deleteButton.addEventListener("click", function () {
        deleteFriend(friend.friendship_id, deleteButton);
        });

        // HTML 요소 조립
        info.appendChild(nickname);
        info.appendChild(loginId);

        row.appendChild(info);
        row.appendChild(deleteButton);

        friendsList.appendChild(row);
    });
}

// 12. 친구 요청 수락 및 거절 API 연동
async function updateFriendRequest(friendshipId, status, actions) {

    // 기존 메시지 초기화
    friendsMessage.textContent = "";
    friendsMessage.className = "";

    // 수락 및 거절 버튼 가져오기
    const buttons = actions.querySelectorAll("button");

    // 중복 요청 방지
    buttons.forEach(function (button) {
        button.disabled = true;
    });

    try {
        // 친구 요청 상태 변경 API 호출
        const response = await fetch(
            "/api/friends/requests/" + friendshipId,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: status
                })
            }
        );

        const result = await response.json();

        // API 응답 확인
        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "친구 요청 처리에 실패했습니다."
            );
        }

        // 성공 메시지 출력
        friendsMessage.textContent = result.message;
        friendsMessage.className = "success";

        // 받은 요청 목록 다시 조회
        if (currentTab === "received") {
            await loadFriendRequests("received");
        } else if (currentTab === "friends") {
            await loadFriends();
        }

    } catch (error) {
        console.error("친구 요청 처리 오류:", error);

        friendsMessage.textContent = error.message;
        friendsMessage.className = "error";

        // 버튼 활성화
        buttons.forEach(function (button) {
            button.disabled = false;
        });
    }
}

// 13. 친구 삭제 API 연동
async function deleteFriend(friendshipId, button) {

    // 삭제 여부 확인
    if (!confirm("정말 친구를 삭제하시겠습니까?")) {
        return;
    }

    // 기존 메시지 초기화
    friendsMessage.textContent = "";
    friendsMessage.className = "";

    // 중복 클릭 방지
    button.disabled = true;

    try {
        // 친구 삭제 API 호출
        const response = await fetch(
            "/api/friends/" + friendshipId,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        // API 응답 확인
        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "친구 삭제에 실패했습니다."
            );
        }

        // 성공 메시지 출력
        friendsMessage.textContent = result.message;
        friendsMessage.className = "success";

        // 친구 목록 다시 조회
        if (currentTab === "friends") {
            await loadFriends();
        }

    } catch (error) {
        console.error("친구 삭제 오류:", error);

        friendsMessage.textContent = error.message;
        friendsMessage.className = "error";

        button.disabled = false;
    }
}