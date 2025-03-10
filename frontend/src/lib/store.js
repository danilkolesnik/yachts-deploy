import { configureStore } from '@reduxjs/toolkit'
import userDataReducer from './features/todos/usersDataSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {
        userData:userDataReducer
    },
  })
}