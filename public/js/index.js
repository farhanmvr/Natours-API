/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapBox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';

// DOM elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');
const logoutBtn = document.querySelector('.nav__el--logout');

// Delegation
if (mapBox) {
   const locations = JSON.parse(mapBox.dataset.locations);
   displayMap(locations);
}
if (loginForm) {
   document.querySelector('.form--login').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      login(email, password);
   });
}

if (userDataForm) {
   userDataForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      updateSettings({ name, email }, 'data');
   });
}

if (userPasswordForm) {
   userPasswordForm.addEventListener('submit', async (e) => {
      document.querySelector('.btn--save-password').textContent = 'Updating....';
      e.preventDefault();
      const passwordCurrent = document.getElementById('password-current').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;
      await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
      document.querySelector('.btn--save-password').textContent = 'Save password';
   });
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);
