'use strict';

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const message = document.getElementById('form-message');

function showMessage(text) {
  if (message) message.textContent = text;
}

function validateCommon(form) {
  const loginId = form.elements.namedItem('login_id');
  const password = form.elements.namedItem('password');
  const id = loginId.value.trim();

  if (!id || id.length > 50) {
    showMessage('로그인 아이디를 1~50자로 입력해주세요.');
    loginId.focus();
    return false;
  }

  if (password.value.length < 8 || new TextEncoder().encode(password.value).length > 72) {
    showMessage('비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력해주세요.');
    password.focus();
    return false;
  }

  return true;
}

async function postAuth(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);
  if (!data || typeof data.success !== 'boolean') {
    throw new Error('서버 응답을 확인할 수 없습니다.');
  }

  return { response, data };
}

function setSubmitting(form, submitting) {
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = submitting;
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');
    if (!validateCommon(loginForm)) return;

    const loginId = loginForm.elements.namedItem('login_id').value.trim();
    const password = loginForm.elements.namedItem('password').value;
    setSubmitting(loginForm, true);

    try {
      const { response, data } = await postAuth('/api/auth/login', {
        login_id: loginId,
        password
      });

      if (!response.ok || !data.success) {
        showMessage(data.message || '로그인에 실패했습니다.');
        return;
      }

      showMessage('로그인 성공! 메인 페이지로 이동합니다.');
      window.location.assign('index.html');
    } catch (error) {
      console.error('로그인 요청 오류:', error);
      showMessage('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(loginForm, false);
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');

    const nicknameInput = signupForm.elements.namedItem('nickname');
    const nickname = nicknameInput.value.trim();
    if (!nickname || nickname.length > 50) {
      showMessage('닉네임을 1~50자로 입력해주세요.');
      nicknameInput.focus();
      return;
    }

    if (!validateCommon(signupForm)) return;

    const password = signupForm.elements.namedItem('password').value;
    const confirmInput = signupForm.elements.namedItem('confirm-password');
    if (password !== confirmInput.value) {
      showMessage('비밀번호 확인이 일치하지 않습니다.');
      confirmInput.focus();
      return;
    }

    const loginId = signupForm.elements.namedItem('login_id').value.trim();
    setSubmitting(signupForm, true);

    try {
      const { response, data } = await postAuth('/api/auth/signup', {
        login_id: loginId,
        password,
        nickname
      });

      if (!response.ok || !data.success) {
        showMessage(data.message || '회원가입에 실패했습니다.');
        return;
      }

      alert('회원가입이 완료되었습니다. 로그인해 주세요.');
      window.location.assign('login.html');
    } catch (error) {
      console.error('회원가입 요청 오류:', error);
      showMessage('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(signupForm, false);
    }
  });
}
