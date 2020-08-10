/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapBox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');
const logoutBtn = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');

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
      const form = new FormData();
      form.append('name', document.getElementById('name').value);
      form.append('email', document.getElementById('email').value);
      form.append('photo', document.getElementById('photo').files[0]);

      updateSettings(form, 'data');
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

if (logoutBtn) {
   logoutBtn.addEventListener('click', logout);
   console.log('jsjsjsj')
}

if (bookBtn) {
   bookBtn.addEventListener('click', (e) => {
      e.target.textContent = 'Processing...';
      const { tourId } = e.target.dataset; // tour-id converts to tourId automatically in js
      bookTour(tourId);
   });
}
