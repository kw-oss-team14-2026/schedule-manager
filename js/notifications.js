/* 일정 담당자는 getEvents()로 현재 일정 목록을 전달합니다. */
(function (root) {
  'use strict';
  function createReminder(options) {
    const { getEvents, onNotify, now = Date.now, storage = null,
      storageKey = 'campus-reminders-v1', intervalMs = 1000 } = options;
    let sent = {};
    let timer = null;
    try { sent = JSON.parse(storage?.getItem(storageKey) || '{}') || {}; } catch (_) {}
    if (typeof sent !== 'object' || Array.isArray(sent)) sent = {};
    function check() {
      const current = now();
      const events = getEvents();
      for (const event of events) {
        const extra = event.extendedProps || {};
        const minutes = event.reminderMinutes ?? extra.reminderMinutes ?? 10;
        if (!event.id || event.allDay || minutes === null || minutes === false) continue;
        // 날짜만 있는 종일 일정에는 알림을 예약하지 않습니다.
        if (typeof event.start === 'string' && !event.start.includes('T')) continue;
        const start = new Date(event.start).getTime();
        if (!Number.isFinite(start) || typeof minutes !== 'number' || minutes < 0) continue;
        const due = start - minutes * 60000;
        const key = JSON.stringify([String(event.id), start, minutes]);
        // 늦게 페이지를 열어도 시작 전이면 한 번 알립니다. 이미 시작한 일정은 제외합니다.
        // 시작 시각 알림은 타이머 오차를 고려해 시작 후 60초까지 허용합니다.
        const deadline = minutes === 0 ? start + 60000 : start;
        if (current < due || current > deadline || sent[key]) continue;
        onNotify({ id: String(event.id), title: String(event.title || '제목 없는 일정'), start, minutes });
        sent[key] = start;
      }
      // 지난 기록은 정리하여 저장 공간이 계속 커지는 것을 방지합니다.
      for (const key of Object.keys(sent)) if (sent[key] < current - 86400000) delete sent[key];
      try { storage?.setItem(storageKey, JSON.stringify(sent)); } catch (_) {}
    }
    return {
      check,
      start() { if (timer === null) { check(); timer = setInterval(check, intervalMs); } },
      stop() { if (timer !== null) clearInterval(timer); timer = null; }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createReminder };
  else root.CampusReminders = { createReminder };
})(typeof window === 'undefined' ? globalThis : window);
