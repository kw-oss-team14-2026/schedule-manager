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

// 임시 공유방 및 참여자 데이터
const roomData = {
    room_id: roomId,
    room_name: "오픈소스 팀 프로젝트",
    members: [
        { user_id: 1, nickname: "나" },
        { user_id: 2, nickname: "test2" },
        { user_id: 3, nickname: "test3" },
        { user_id: 4, nickname: "고도연" }
    ]
};

let selectedMemberId = 1;

// 테스트용 일정 날짜 생성
function getTestDate(day, time) {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayOfMonth = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${dayOfMonth}T${time}:00`;
}

// 임시 참여자별 일정 데이터
const roomSchedules = [
    { user_id: 1, title: "전공 수업", start: getTestDate(1, "09:00"), end: getTestDate(1, "12:00"), color: "#6b4ee6" },
    { user_id: 1, title: "팀 프로젝트", start: getTestDate(3, "14:00"), end: getTestDate(3, "16:00"), color: "#dc2626" },
    { user_id: 2, title: "교양 수업", start: getTestDate(1, "10:00"), end: getTestDate(1, "13:00"), color: "#2563eb" },
    { user_id: 2, title: "아르바이트", start: getTestDate(4, "17:00"), end: getTestDate(4, "21:00"), color: "#2563eb" },
    { user_id: 3, title: "스터디", start: getTestDate(2, "13:00"), end: getTestDate(2, "15:00"), color: "#ea580c" },
    { user_id: 4, title: "동아리 활동", start: getTestDate(3, "15:00"), end: getTestDate(3, "18:00"), color: "#db2777" }
];
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
    if (selectedMemberId === null) {
        renderCommonFreeTime();
    }
    }
});

// 3. 달력 화면 출력
roomCalendar.render();

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
        button.textContent = member.nickname;
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
    roomCalendarTitle.textContent = member.nickname === "나"
        ? "나의 일정"
        : member.nickname + "님의 일정";

    roomFreeTimeButton.classList.remove("active");
    roomFreeTimeLegend.hidden = true;

    renderRoomMembers();
    renderMemberSchedules();
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
    selectedMemberId = null;
    roomCalendarElement.classList.add("common-free-mode");

    roomCalendarTitle.textContent = "공통 빈 시간";
    roomFreeTimeButton.classList.add("active");
    roomFreeTimeLegend.hidden = false;

    renderRoomMembers();
    renderCommonFreeTime();
});
// 8. 공유방 초기 화면 출력
renderRoomInfo();
selectRoomMember(selectedMemberId);