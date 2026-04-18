import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    role: '',
    email: '',
    id: '',
    permissions: [],
    responsibilityAreas: [],
    /** null = not checked yet, true = verified session, false = no valid session */
    session: null,
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
        },
        setUserFromVerify(state, action) {
            state.email = action.payload.email ?? '';
            state.role = action.payload.role ?? '';
            state.id = action.payload.id ?? '';
            state.permissions = Array.isArray(action.payload.permissions) ? action.payload.permissions : [];
            state.responsibilityAreas = Array.isArray(action.payload.responsibilityAreas)
                ? action.payload.responsibilityAreas
                : [];
            state.session = true;
        },
        clearUserSession(state) {
            state.role = '';
            state.email = '';
            state.id = '';
            state.permissions = [];
            state.responsibilityAreas = [];
            state.session = false;
        },
    }
});

export const { setRole, setEmail, setId, setUserFromVerify, clearUserSession } = usersDataSlice.actions;

export default usersDataSlice.reducer;