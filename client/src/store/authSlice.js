import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
    },
    clearCredentials: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
})

export const { setCredentials, clearCredentials, updateUser } = authSlice.actions

export const selectCurrentUser = (state) => state.auth.user
export const selectAccessToken = (state) => state.auth.accessToken
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated

export default authSlice.reducer
