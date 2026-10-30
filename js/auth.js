'use strict';
// 현재는 화면 입력값 검사만 수행합니다. 서버 API 연동 전까지 실제 계정은 생성되지 않습니다.
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const message = document.getElementById('form-message');

function showMessage(text) { if (message) message.textContent = text; }
function validateCommon(form) {
  const loginId = form.elements.namedItem('login_id');
  const password = form.elements.namedItem('password');
  const id = loginId.value.trim();
  if (!id || id.length > 50) {
    showMessage('로그인 아이디를 1~50자로 입력해주세요.');
    loginId.focus();
    return false;
  }
  if (password.value.length < 8) {
    showMessage('비밀번호를 8자 이상 입력해주세요.');
    password.focus();
    return false;
  }
  return true;
}
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    showMessage('');
    if (!validateCommon(loginForm)) return;
    showMessage('입력값 검사 완료. 실제 로그인은 백엔드 API 연결 후 사용할 수 있습니다.');
  });
}
if (signupForm) {
  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    showMessage('');
    const nickname = signupForm.elements.namedItem('nickname');
    if (!nickname.value.trim() || nickname.value.trim().length > 50) {
      showMessage('닉네임을 1~50자로 입력해주세요.');
      nickname.focus();
      return;
    }
    if (!validateCommon(signupForm)) return;
    const password = signupForm.elements.namedItem('password');
    const confirm = signupForm.elements.namedItem('confirm-password');
    if (password.value !== confirm.value) {
      showMessage('비밀번호 확인이 일치하지 않습니다.');
      confirm.focus();
      return;
    }
    showMessage('입력값 검사 완료. 실제 회원가입은 백엔드 API 연결 후 사용할 수 있습니다.');
  });
}
