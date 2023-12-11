/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

// 196. Updating User Data with Our API
// 197. Updating User Password with Our API

// type is either password or data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'data'
        ? '/api/v1/users/updateMe'
        : '/api/v1/users/updateMyPassword';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully.`);
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', err.response.data.message);
  }
};
