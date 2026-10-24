'use strict';
const $ = s => document.querySelector(s);
let callback = null;
function message(text, error = false) { $('#message').textContent = text; $('#message').classList.toggle('error', error); }
async function request(data) {
 const res = await fetch('/api/auth', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data), cache:'no-store' });
 const result = await res.json();
 if (!res.ok) throw Error(result.error || 'Unable to complete this request.');
 return result;
}
async function busy(button, action) {
 button.disabled = true;
 try { await action(); } catch(e) { message(e.message, true); } finally { button.disabled = false; }
}
async function checkAccess() {
 const response = await fetch('/api/auth', {cache:'no-store'});
 if (!response.ok) throw Error('Sign-in is temporarily unavailable. Please try again.');
 const session = await response.json();
 if (session.admin) { location.replace('/admin/'); return; }
 if (session.loggedIn) {
  message('This account does not have permission to manage the collection. Contact the site owner.', true);
  $('#logout').hidden = false;
 }
}
$('#loginForm').onsubmit = e => {
 e.preventDefault(); const form = e.currentTarget;
 busy(form.querySelector('[type=submit]'), async () => {
  await request({action:'login', email:form.elements.email.value, password:form.elements.password.value});
  form.elements.password.value = '';
  await checkAccess();
 });
};
$('#forgot').onclick = () => busy($('#forgot'), async () => {
 const input = $('#loginForm').elements.email;
 if (!input.value || !input.reportValidity()) { message('Enter your email address to request a reset link.', true); return; }
 await request({action:'forgot', email:input.value}); message('Check your email for a password reset link.');
});
$('#passwordForm').onsubmit = e => {
 e.preventDefault(); busy(e.currentTarget.querySelector('button'), async () => {
  await request({action:callback.type, token:callback.token, password:$('#passwordForm').elements.password.value});
  $('#passwordForm').reset(); $('#passwordPanel').hidden = true; $('#loginPanel').hidden = false;
  message('Password saved.'); await checkAccess();
 });
};
$('#logout').onclick = () => busy($('#logout'), async () => { await request({action:'logout'}); location.replace('/owner-login/'); });
async function init() {
 const params = new URLSearchParams(location.hash.slice(1));
 const invite = params.get('invite_token'), recovery = params.get('recovery_token');
 if (invite || recovery) {
  callback = {type:invite?'invite':'recover', token:invite||recovery}; history.replaceState(null,'','/owner-login/');
  $('#heading').textContent = invite?'Accept invitation':'Reset password'; $('#loginPanel').hidden = true; $('#passwordPanel').hidden = false; return;
 }
 try { await checkAccess(); } catch(e) { message(e.message, true); }
}
init();
