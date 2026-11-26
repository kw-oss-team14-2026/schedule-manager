// 날짜 및 시간 유효성 검증 함수
const isValidDateTime = (value) => {
    const date = new Date(value + "Z");

    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
        !isNaN(date.getTime()) &&
        date.toISOString().slice(0, 16) === value &&
        Number(value.slice(0, 4)) >= 1000;
};

module.exports = {
    isValidDateTime
};