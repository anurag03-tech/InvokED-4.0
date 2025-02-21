// import axios from "axios";

// const instance = axios.create({
//   baseURL: process.env.EXPO_PUBLIC_MY_API_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Add response interceptor for error handling
// instance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Handle network errors
//     if (!error.response) {
//       return Promise.reject(
//         new Error("Network error. Please check your connection.")
//       );
//     }

//     // Handle other errors
//     return Promise.reject(error);
//   }
// );

// export default instance;
