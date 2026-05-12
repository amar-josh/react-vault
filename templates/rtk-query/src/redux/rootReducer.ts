/**
 * Root reducer. Compose every slice + every RTK Query API's reducer here.
 *
 * As you add features, import the slice/api and add to the object below.
 */
import { combineReducers } from '@reduxjs/toolkit';

const rootReducer = combineReducers({
  // Slices:
  // login: loginReducer,
  // notification: notificationReducer,
  //
  // RTK Query API reducers (by their reducerPath):
  // [loginApi.reducerPath]: loginApi.reducer,
  // [kycApi.reducerPath]: kycApi.reducer,
});

export default rootReducer;
