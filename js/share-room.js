"use strict";

// 1. HTML 요소 가져오기
const roomTitle = document.getElementById("room-title");
const roomMemberCount = document.getElementById("room-member-count");
const roomMemberButtons = document.getElementById("room-member-buttons");
const roomFreeTimeButton = document.getElementById("room-free-time-button");
const roomCalendarTitle = document.getElementById("room-calendar-title");
const roomFreeTimeLegend = document.getElementById("room-free-time-legend");
const roomCalendarElement = document.getElementById("room-calendar");
const roomMessage = document.getElementById("room-message");

// URL에서 공유방 번호 가져오기
const roomParams = new URLSearchParams(window.location.search);
const roomId = Number(roomParams.get("room_id"));
console.log("입장한 공유방 번호:", roomId);

// DB에서 조회한 공유방 및 참여자 데이터
let roomData = null;

// 일정 조회 상태 관리
let isRoomSchedulesLoaded = false;
let scheduleRequestId = 0;

// 현재 로그인한 회원 번호
let currentUserId = null;

// 현재 선택된 참여자 번호
let selectedMemberId = null;

// DB에서 조회할 참여자 일정 데이터
let roomSchedules = [];

// 2. FullCalendar 초기 설정
const roomCalendar = new FullCalendar.Calendar(roomCalendarElement, {
    initialView: "timeGridWeek",
    locale: "ko",
    firstDay: 0,
    headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: ""
    },
    slotMinTime: "00:00:00",
    slotMaxTime: "24:00:00",
    slotDuration: "00:30:00",
    scrollTime: "08:00:00",
    allDaySlot: false,
    nowIndicator: true,
    editable: false,
    selectable: false,
    height: 750,
    events: [],
    datesSet: function () {
    if (roomData !== null) {
        loadRoomSchedules();
    }
    }
});

// 3. 달력 화면 출력
roomCalendar.render();

// DB에서 공유방 상세 정보 및 참여자 조회
async function loadRoomInfo() {
    if (!Number.isSafeInteger(roomId) || roomId <= 0) {
        roomMessage.textContent = "올바르지 않은 공유방 번호입니다.";
        return;
    }

    try {
        const response = await fetch("/api/sharing/rooms/" + roomId);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "공유방 정보 조회에 실패했습니다.");
        }

        roomData = result.room;
        currentUserId = result.current_user_id;
        selectedMemberId = currentUserId;

        renderRoomInfo();
        selectRoomMember(selectedMemberId);
        await loadRoomSchedules();
    } catch (error) {
        console.error("공유방 정보 조회 오류:", error);
        roomMessage.textContent = error.message;
    }
}

// 4. 공유방 기본 정보 표시
function renderRoomInfo() {
    roomTitle.textContent = roomData.room_name;
    roomMemberCount.textContent = "참여 인원 " + roomData.members.length + "명";
}

// 5. 참여자 버튼 생성
function renderRoomMembers() {
    roomMemberButtons.replaceChildren();

    roomData.members.forEach(function (member) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "room-member-button";
        button.textContent = member.user_id === currentUserId
        ? "나"
        : member.nickname;
        button.classList.toggle("active", member.user_id === selectedMemberId);

        button.addEventListener("click", function () {
            selectRoomMember(member.user_id);
        });

        roomMemberButtons.appendChild(button);
    });
}

// 6. 참여자 선택
function selectRoomMember(userId) {
    const member = roomData.members.find(function (item) {
        return item.user_id === userId;
    });
    if (!member) return;

    selectedMemberId = userId;
    roomCalendarElement.classList.remove("common-free-mode");
    roomCalendarTitle.textContent = member.user_id === currentUserId
    ? "나의 일정"
    : member.nickname + "님의 일정";

    roomFreeTimeButton.classList.remove("active");
    roomFreeTimeLegend.hidden = true;

    renderRoomMembers();
    renderMemberSchedules();
}

// API 요청용 날짜 형식 변환
function formatRoomDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// DB에서 공유방 참여자 일정 조회
async function loadRoomSchedules() {
    const requestId = ++scheduleRequestId;
    const rangeStart = roomCalendar.view.activeStart;
    const rangeEnd = roomCalendar.view.activeEnd;

    const params = new URLSearchParams({
        start: formatRoomDateTime(rangeStart),
        end: formatRoomDateTime(rangeEnd)
    });

    isRoomSchedulesLoaded = false;
    roomSchedules = [];
    roomFreeTimeButton.disabled = true;
    roomCalendar.removeAllEvents();
    roomMessage.textContent = "일정을 불러오는 중입니다.";

    try {
        const response = await fetch(
            "/api/sharing/rooms/" + roomId + "/schedules?" + params.toString()
        );
        const result = await response.json();

        if (requestId !== scheduleRequestId) {
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || "일정 조회에 실패했습니다.");
        }

        // API 응답을 FullCalendar용 데이터로 변환
        roomSchedules = result.schedules.map(function (schedule) {
            return {
                user_id: schedule.user_id,
                title: schedule.title,
                start: schedule.start_at,
                end: schedule.end_at,
                color: schedule.color
            };
        });

        isRoomSchedulesLoaded = true;
        roomFreeTimeButton.disabled = false;
        roomMessage.textContent = "";

        // 현재 선택된 화면에 일정 표시
        if (selectedMemberId === null) {
            renderCommonFreeTime();
        } else {
            renderMemberSchedules();
        }
    } catch (error) {
        if (requestId !== scheduleRequestId) {
            return;
        }

        console.error("공유방 일정 조회 오류:", error);
        roomMessage.textContent = error.message;
        roomFreeTimeLegend.hidden = true;
    }
}

// 7. 선택한 참여자의 일정 표시
function renderMemberSchedules() {
    roomCalendar.removeAllEvents();

    const schedules = roomSchedules.filter(function (schedule) {
        return schedule.user_id === selectedMemberId;
    });

    schedules.forEach(function (schedule) {
        roomCalendar.addEvent({
            title: schedule.title,
            start: schedule.start,
            end: schedule.end,
            color: schedule.color,
            allDay: false
        });
    });
}

roomFreeTimeButton.disabled = true;
// 공통 빈 시간 계산
function calculateCommonFreeTime(rangeStart, rangeEnd) {
    const freeTimes = [];
    const day = new Date(rangeStart);

    while (day < rangeEnd) {
        const dayStart = new Date(day);
        const dayEnd = new Date(day);
        dayEnd.setDate(dayEnd.getDate() + 1);

        // 해당 날짜의 전체 참여자 일정 추출
        const busyTimes = roomSchedules.map(function (schedule) {
            return {
                start: new Date(schedule.start),
                end: new Date(schedule.end)
            };
        }).filter(function (schedule) {
            return schedule.start < dayEnd && schedule.end > dayStart;
        }).map(function (schedule) {
            return {
                start: Math.max(schedule.start.getTime(), dayStart.getTime()),
                end: Math.min(schedule.end.getTime(), dayEnd.getTime())
            };
        });

        // 일정 시작 시간 기준 정렬
        busyTimes.sort(function (a, b) {
            return a.start - b.start;
        });

        // 일정 사이의 빈 시간 계산
        let cursor = dayStart.getTime();

        busyTimes.forEach(function (busy) {
            if (busy.start > cursor) {
                freeTimes.push({
                    start: new Date(cursor),
                    end: new Date(busy.start)
                });
            }
            cursor = Math.max(cursor, busy.end);
        });

        // 마지막 일정 이후의 빈 시간
        if (cursor < dayEnd.getTime()) {
            freeTimes.push({
                start: new Date(cursor),
                end: dayEnd
            });
        }

        day.setDate(day.getDate() + 1);
    }

    return freeTimes;
}
// 공통 빈 시간 달력 표시
function renderCommonFreeTime() {
    roomCalendar.removeAllEvents();

    if (!isRoomSchedulesLoaded) {
        roomFreeTimeLegend.hidden = true;
        return;
    }

    roomFreeTimeLegend.hidden = false;

    const rangeStart = roomCalendar.view.activeStart;
    const rangeEnd = roomCalendar.view.activeEnd;
    const freeTimes = calculateCommonFreeTime(rangeStart, rangeEnd);

    freeTimes.forEach(function (freeTime) {
        roomCalendar.addEvent({
            start: freeTime.start,
            end: freeTime.end,
            display: "background",
            backgroundColor: "#86efac",
            allDay: false
        });
    });
}
// 공통 빈 시간 버튼 클릭
roomFreeTimeButton.addEventListener("click", function () {
    if (!isRoomSchedulesLoaded) {
        return;
    }

    selectedMemberId = null;
    roomCalendarElement.classList.add("common-free-mode");
    roomCalendarTitle.textContent = "공통 빈 시간";
    roomFreeTimeButton.classList.add("active");
    roomFreeTimeLegend.hidden = false;

    renderRoomMembers();
    renderCommonFreeTime();
});
// 8. 공유방 초기 데이터 조회
loadRoomInfo();