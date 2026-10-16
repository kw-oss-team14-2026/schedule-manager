// HTML에서 달력을 만든 뒤 initSearch(calendar, onSelect)를 호출합니다.
function initSearch(calendar, onSelect) {
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  const summary = document.getElementById("search-summary");

  function renderResults() {
    const keyword = input.value.trim().toLowerCase();
    results.replaceChildren();

    if (keyword === "") {
      summary.textContent = "등록된 전체 일정에서 제목을 검색합니다.";
      return;
    }

    const matches = calendar.getEvents().filter(function (event) {
      return event.title.toLowerCase().includes(keyword);
    });
    matches.sort(function (a, b) {
      return (a.start ? a.start.getTime() : Infinity) -
        (b.start ? b.start.getTime() : Infinity);
    });

    summary.textContent = matches.length === 0
      ? "검색 결과가 없습니다."
      : "검색 결과 " + matches.length + "개";

    matches.forEach(function (event) {
      const item = document.createElement("li");
      const date = event.startStr.slice(0, 10);
      const button = document.createElement("button");
      button.type = "button";
      // 제목을 HTML로 해석하지 않고 그대로 표시합니다.
      button.textContent = (date || "날짜 없음") + " · " + event.title;
      button.disabled = !date;
      button.addEventListener("click", function () {
        onSelect(date);
      });
      item.appendChild(button);
      results.appendChild(item);
    });
  }

  input.disabled = false;
  input.addEventListener("input", renderResults);
  // 다른 담당자가 일정을 추가·수정·삭제하면 검색 결과도 갱신합니다.
  calendar.on("eventsSet", renderResults);
  renderResults();
}
