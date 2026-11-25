"use strict";

// 1. HTML 요소 가져오기
const sharingModal = document.getElementById("sharing-modal");
const sharingOpen = document.getElementById("sharing-open");
const sharingClose = document.getElementById("sharing-close");

const sharingTabs = document.querySelectorAll(".sharing-tabs button");

const sharingRoomsPanel = document.getElementById("sharing-rooms-panel");
const sharingCreatePanel = document.getElementById("sharing-create-panel");
const sharingInvitesPanel = document.getElementById("sharing-invites-panel");

const sharingCreateOpen = document.getElementById("sharing-create-open");
const sharingMessage = document.getElementById("sharing-message");

// 공유방 생성 관련 HTML 요소
const sharingFriendList = document.getElementById("sharing-friend-list");
const sharingSelectedMembers = document.getElementById("sharing-selected-members");
const sharingMemberCount = document.getElementById("sharing-member-count");
const sharingRoomName = document.getElementById("sharing-room-name");
const sharingCreateForm = document.getElementById("sharing-create-form");
const sharingCreateSubmit = document.getElementById("sharing-create-submit");

// 조회한 친구 목록
let sharingFriends = [];

// 선택한 친구 목록
let selectedSharingFriends = [];
// 공유방 목록 HTML 요소
const sharingRoomList = document.getElementById("sharing-room-list");

// 임시 공유방 목록
let sharingRooms = [];

// 임시 공유방 고유 번호
let nextSharingRoomId = 1;
// 받은 초대 관련 HTML 요소
const sharingInviteList = document.getElementById("sharing-invite-list");
const sharingInviteCount = document.getElementById("sharing-invite-count");
const sharingNotificationCount = document.getElementById("sharing-notification-count");

// 임시로 받은 공유방 초대 목록
let sharingInvites = [
    {
        invite_id: 1,
        room_id: 101,
        room_name: "오픈소스 팀 프로젝트",
        sender_nickname: "test2",
        member_count: 3
    },
    {
        invite_id: 2,
        room_id: 102,
        room_name: "기말고사 스터디",
        sender_nickname: "test3",
        member_count: 2
    }
];
// 현재 선택된 탭
let currentSharingTab = "rooms";


// 2. 일정 공유 모달 열기
sharingOpen.addEventListener("click", function () {
    sharingModal.showModal();

    switchSharingTab("rooms");
});


// 3. 일정 공유 모달 닫기
sharingClose.addEventListener("click", function () {
    sharingModal.close();
});


// 4. 탭 버튼 클릭 이벤트
sharingTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        switchSharingTab(tab.dataset.tab);
    });
});


// 5. 새로운 공유방 만들기 버튼
sharingCreateOpen.addEventListener("click", function () {
    switchSharingTab("create");
});


// 6. 일정 공유 탭 전환 함수
function switchSharingTab(tabName) {

    // 현재 탭 저장
    currentSharingTab = tabName;

    // 선택된 탭 디자인 변경
    sharingTabs.forEach(function (tab) {
        tab.classList.toggle(
            "active",
            tab.dataset.tab === tabName
        );
    });

    // 선택된 탭의 영역만 표시
    sharingRoomsPanel.hidden = tabName !== "rooms";
    sharingCreatePanel.hidden = tabName !== "create";
    sharingInvitesPanel.hidden = tabName !== "invites";

    // 이전 메시지 초기화
    sharingMessage.textContent = "";
    sharingMessage.className = "";

    console.log("현재 일정 공유 탭:", currentSharingTab);
    // 공유방 만들기 탭에서 친구 목록 조회
    if (tabName === "rooms") {
    renderSharingRooms();
    } else if (tabName === "create") {
    loadSharingFriends();
    }else if (tabName === "invites") {
    renderSharingInvites();
    }
}
// 7. 일정 공유용 친구 목록 조회
async function loadSharingFriends() {

    sharingFriendList.replaceChildren();

    try {
        const response = await fetch("/api/friends");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "친구 목록 조회에 실패했습니다."
            );
        }

        if (currentSharingTab !== "create") {
            return;
        }

        sharingFriends = result.friends;

        // 삭제된 친구가 선택 목록에 남아 있지 않도록 처리
        selectedSharingFriends = selectedSharingFriends.filter(function (selected) {
            return sharingFriends.some(function (friend) {
                return friend.user_id === selected.user_id;
            });
        });

        renderSharingFriends();
        renderSelectedSharingFriends();

    } catch (error) {
        console.error("일정 공유 친구 조회 오류:", error);

        if (currentSharingTab !== "create") {
            return;
        }

        sharingFriends = [];
        selectedSharingFriends = [];

        renderSharingFriends();
        renderSelectedSharingFriends();

        sharingMessage.textContent = error.message;
        sharingMessage.className = "error";
    }
}

// 8. 일정 공유용 친구 목록 출력
function renderSharingFriends() {

    sharingFriendList.replaceChildren();

    if (sharingFriends.length === 0) {
        const empty = document.createElement("li");

        empty.className = "sharing-empty";
        empty.textContent = "선택할 수 있는 친구가 없습니다.";

        sharingFriendList.appendChild(empty);
        return;
    }

    sharingFriends.forEach(function (friend) {

        // 친구 목록 행
        const row = document.createElement("li");
        row.className = "sharing-friend-item";

        // 프로필 아이콘
        const avatar = document.createElement("div");
        avatar.className = "sharing-friend-avatar";
        avatar.textContent = friend.nickname.charAt(0);

        // 친구 정보
        const info = document.createElement("div");
        info.className = "sharing-friend-info";

        const nickname = document.createElement("div");
        nickname.className = "sharing-friend-nickname";
        nickname.textContent = friend.nickname;

        const loginId = document.createElement("div");
        loginId.className = "sharing-friend-login-id";
        loginId.textContent = friend.login_id;

        info.appendChild(nickname);
        info.appendChild(loginId);

        // 이미 선택된 친구인지 확인
        const isSelected = selectedSharingFriends.some(function (selected) {
            return selected.user_id === friend.user_id;
        });

        // 친구 선택 버튼
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "sharing-add-button";
        addButton.textContent = isSelected ? "✓" : "+";

        addButton.classList.toggle("selected", isSelected);

        addButton.addEventListener("click", function () {
            toggleSharingFriend(friend);
        });

        row.appendChild(avatar);
        row.appendChild(info);
        row.appendChild(addButton);

        sharingFriendList.appendChild(row);
    });
}

// 9. 친구 선택 및 선택 취소
function toggleSharingFriend(friend) {

    const index = selectedSharingFriends.findIndex(function (selected) {
        return selected.user_id === friend.user_id;
    });

    if (index === -1) {

        // 선택되지 않은 친구 추가
        selectedSharingFriends.push(friend);

    } else {

        // 이미 선택된 친구 제거
        selectedSharingFriends.splice(index, 1);
    }

    renderSharingFriends();
    renderSelectedSharingFriends();
}

// 10. 선택된 참여자 출력
function renderSelectedSharingFriends() {

    sharingSelectedMembers.replaceChildren();

    // 본인은 항상 포함
    const me = document.createElement("span");
    me.className = "sharing-member";
    me.textContent = "나";

    sharingSelectedMembers.appendChild(me);

    // 선택된 친구 출력
    selectedSharingFriends.forEach(function (friend) {

        const member = document.createElement("span");
        member.className = "sharing-member";

        const name = document.createElement("span");
        name.textContent = friend.nickname;

        // 선택 취소 버튼
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "sharing-member-remove";
        removeButton.textContent = "×";

        removeButton.addEventListener("click", function () {
            toggleSharingFriend(friend);
        });

        member.appendChild(name);
        member.appendChild(removeButton);

        sharingSelectedMembers.appendChild(member);
    });

    // 본인을 포함한 인원수 표시
    sharingMemberCount.textContent =
        (selectedSharingFriends.length + 1) + "명";

    updateSharingCreateButton();
}
// 11. 공유방 생성 버튼 활성화 조건
function updateSharingCreateButton() {

    const roomName = sharingRoomName.value.trim();

    sharingCreateSubmit.disabled =
        roomName === "" ||
        selectedSharingFriends.length === 0;
}

// 공유방 이름 입력 시 버튼 상태 갱신
sharingRoomName.addEventListener("input", function () {
    updateSharingCreateButton();
});

// 공유방 생성 이벤트
sharingCreateForm.addEventListener("submit", function (event) {
    event.preventDefault();

    createSharingRoom();
});

// 초기 버튼 상태 설정
updateSharingCreateButton();

// 12. 임시 공유방 생성
function createSharingRoom() {

    const roomName = sharingRoomName.value.trim();

    if (!roomName || selectedSharingFriends.length === 0) {
        return;
    }

    // 새로운 공유방 객체 생성
    const room = {
        room_id: nextSharingRoomId++,
        room_name: roomName,
        member_count: 1,
        invited_friends: [...selectedSharingFriends],
        created_at: new Date().toISOString()
    };

    // 공유방 목록에 추가
    sharingRooms.push(room);

    console.log("생성된 공유방:", room);

    // 입력값 및 선택 목록 초기화
    sharingCreateForm.reset();
    selectedSharingFriends = [];

    renderSharingFriends();
    renderSelectedSharingFriends();

    // 내 공유방 탭으로 이동
    switchSharingTab("rooms");

    sharingMessage.textContent = "임시 공유방을 생성했습니다.";
    sharingMessage.className = "success";
}

// 13. 공유방 목록 출력
function renderSharingRooms() {

    sharingRoomList.replaceChildren();

    if (sharingRooms.length === 0) {

        const empty = document.createElement("li");
        empty.className = "sharing-empty";
        empty.textContent = "참여 중인 공유방이 없습니다.";

        sharingRoomList.appendChild(empty);
        return;
    }

    sharingRooms.forEach(function (room) {

        // 공유방 카드
        const row = document.createElement("li");
        row.className = "sharing-room-item";

        // 공유방 헤더
        const header = document.createElement("div");
        header.className = "sharing-room-header";

        // 공유방 아이콘
        const icon = document.createElement("div");
        icon.className = "sharing-room-icon";
        icon.textContent = "👥";

        // 공유방 정보
        const info = document.createElement("div");
        info.className = "sharing-room-info";

        const title = document.createElement("div");
        title.className = "sharing-room-title";
        title.textContent = room.room_name;

        const meta = document.createElement("div");
        meta.className = "sharing-room-meta";

        meta.textContent =
            "참여 인원 " + room.member_count + "명" +
            " · 초대 대기 " + room.invited_friends.length + "명";

        info.appendChild(title);
        info.appendChild(meta);

        header.appendChild(icon);
        header.appendChild(info);

        // 버튼 영역
        const actions = document.createElement("div");
        actions.className = "sharing-room-actions";

        // 입장 버튼
        const enterButton = document.createElement("button");
        enterButton.type = "button";
        enterButton.className = "sharing-action primary";
        enterButton.textContent = "입장하기";

        enterButton.addEventListener("click", function () {
            enterSharingRoom(room.room_id);
        });

        // 나가기 버튼
        const leaveButton = document.createElement("button");
        leaveButton.type = "button";
        leaveButton.className = "sharing-action danger";
        leaveButton.textContent = "나가기";

        leaveButton.addEventListener("click", function () {
            leaveSharingRoom(room.room_id);
        });

        actions.appendChild(enterButton);
        actions.appendChild(leaveButton);

        row.appendChild(header);
        row.appendChild(actions);

        sharingRoomList.appendChild(row);
    });
}

// 14. 임시 공유방 나가기
function leaveSharingRoom(roomId) {

    if (!confirm("이 공유방에서 나가시겠습니까?")) {
        return;
    }

    sharingRooms = sharingRooms.filter(function (room) {
        return room.room_id !== roomId;
    });

    renderSharingRooms();

    sharingMessage.textContent = "공유방에서 나갔습니다.";
    sharingMessage.className = "success";
}

// 15. 공유방 입장
function enterSharingRoom(roomId) {

    console.log("입장할 공유방 번호:", roomId);

    alert("공유방 번호: " + roomId + "\n공유방 페이지는 구현 예정입니다.");
}

// 16. 받은 공유방 초대 목록 출력
function renderSharingInvites() {

    sharingInviteList.replaceChildren();

    if (sharingInvites.length === 0) {

        const empty = document.createElement("li");
        empty.className = "sharing-empty";
        empty.textContent = "받은 공유방 초대가 없습니다.";

        sharingInviteList.appendChild(empty);
        return;
    }

    sharingInvites.forEach(function (invite) {

        // 초대 카드
        const row = document.createElement("li");
        row.className = "sharing-invite-item";

        // 공유방 이름
        const title = document.createElement("div");
        title.className = "sharing-invite-title";
        title.textContent = invite.room_name;

        // 초대한 회원
        const sender = document.createElement("div");
        sender.className = "sharing-invite-sender";
        sender.textContent =
            invite.sender_nickname + "님이 초대했습니다.";

        // 현재 참여 인원
        const meta = document.createElement("div");
        meta.className = "sharing-invite-meta";
        meta.textContent =
            "현재 참여 인원 " + invite.member_count + "명";

        // 버튼 영역
        const actions = document.createElement("div");
        actions.className = "sharing-invite-actions";

        // 수락 버튼
        const acceptButton = document.createElement("button");
        acceptButton.type = "button";
        acceptButton.className = "sharing-action primary";
        acceptButton.textContent = "수락";

        acceptButton.addEventListener("click", function () {
            acceptSharingInvite(invite.invite_id);
        });

        // 거절 버튼
        const rejectButton = document.createElement("button");
        rejectButton.type = "button";
        rejectButton.className = "sharing-action danger";
        rejectButton.textContent = "거절";

        rejectButton.addEventListener("click", function () {
            rejectSharingInvite(invite.invite_id);
        });

        actions.appendChild(acceptButton);
        actions.appendChild(rejectButton);

        row.appendChild(title);
        row.appendChild(sender);
        row.appendChild(meta);
        row.appendChild(actions);

        sharingInviteList.appendChild(row);
    });
}

// 17. 공유방 초대 수락
function acceptSharingInvite(inviteId) {

    // 수락할 초대 찾기
    const invite = sharingInvites.find(function (item) {
        return item.invite_id === inviteId;
    });

    if (!invite) {
        return;
    }

    // 내 공유방에 추가
    sharingRooms.push({
        room_id: invite.room_id,
        room_name: invite.room_name,
        member_count: invite.member_count + 1,
        invited_friends: [],
        created_at: new Date().toISOString()
    });

    // 받은 초대 목록에서 제거
    sharingInvites = sharingInvites.filter(function (item) {
        return item.invite_id !== inviteId;
    });

    // 알림 숫자 갱신
    updateSharingInviteCount();

    // 내 공유방으로 이동
    switchSharingTab("rooms");

    sharingMessage.textContent = "공유방 초대를 수락했습니다.";
    sharingMessage.className = "success";
}

// 18. 공유방 초대 거절
function rejectSharingInvite(inviteId) {

    if (!confirm("공유방 초대를 거절하시겠습니까?")) {
        return;
    }

    // 받은 초대 목록에서 제거
    sharingInvites = sharingInvites.filter(function (item) {
        return item.invite_id !== inviteId;
    });

    // 목록 및 알림 숫자 갱신
    renderSharingInvites();
    updateSharingInviteCount();

    sharingMessage.textContent = "공유방 초대를 거절했습니다.";
    sharingMessage.className = "success";
}

// 19. 받은 초대 알림 숫자 갱신
function updateSharingInviteCount() {

    const count = sharingInvites.length;

    // 일정 공유 버튼의 알림 숫자
    sharingNotificationCount.textContent = count;
    sharingNotificationCount.hidden = count === 0;

    // 받은 초대 탭의 알림 숫자
    sharingInviteCount.textContent = count;
    sharingInviteCount.hidden = count === 0;
}

// 페이지 최초 실행 시 알림 숫자 표시
updateSharingInviteCount();