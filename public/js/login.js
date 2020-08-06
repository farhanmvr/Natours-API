/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
   try {
      const res = await axios({
         method: 'post',
         url: 'http://localhost:5000/api/v1/users/login',
         data: {
            email,
            password,
         },
      });
      console.log(res);
      if (res.data.status === 'success') {
         showAlert('success', 'Logged in successfull');
         window.setTimeout(() => {
            location.assign('/');
         }, 2000);
      }
   } catch (err) {
      showAlert('error', err.response.data.message);
   }
};

export const logout = async () => {
   try {
      const res = await axios({
         method: 'get',
         url: 'http://localhost:5000/api/v1/users/logout',
      });
      if (res.data.status === 'success') location.reload(true);
   } catch (err) {
      showAlert('error', 'Error logging out, try again');
   }
};
