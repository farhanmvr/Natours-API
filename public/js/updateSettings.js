/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
   // type is 'password' or 'data'
   try {
      const url =
         type === 'password'
            ? 'http://localhost:5000/api/v1/users/updateMyPassword'
            : 'http://localhost:5000/api/v1/users/updateMe';
      const res = await axios({
         method: 'patch',
         url,
         data,
      });
      if (res.data.status === 'success') {
         showAlert('success', `${type.toUpperCase()} Updated successfully`);
         window.setTimeout(() => {
            location.assign('/me');
         }, 2000);
      }
   } catch (err) {
      showAlert('error', err.response.data.message);
   }
};
