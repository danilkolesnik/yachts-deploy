import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    role: '',
    email: '',
    id: ''
};

const usersDataSlice = createSlice({
    name: 'usersData',
    initialState,
    reducers: {
        setRole(state, action) {
            state.role = action.payload;
        },
        setEmail(state, action) {
            state.email = action.payload;
        },
        setId(state, action) {
            state.id = action.payload;
        }
    }
});

export const { setRole, setEmail, setId } = usersDataSlice.actions;

export default usersDataSlice.reducer;