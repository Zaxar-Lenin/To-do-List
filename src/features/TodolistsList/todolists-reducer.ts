import {todolistsAPI, TodolistType} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {RequestStatusType, SetAppErrorActionType, setAppStatusAC, SetAppStatusActionType} from '../../app/app-reducer'
import {handleServerNetworkError} from '../../utils/error-utils'
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState: Array<TodolistDomainType> = []


export const fetchTodolistsTC = createAsyncThunk(
    "todoList/fetchTodolistsTC",
    async (_, {dispatch,rejectWithValue}) => {
        dispatch(setAppStatusAC({status: 'loading'}))
        try {
            let res = await todolistsAPI.getTodolists()
            dispatch(setAppStatusAC({status: 'succeeded'}))

            return {todolists: res.data}
        } catch (error) {
            // @ts-ignore
            handleServerNetworkError(error, dispatch);
            return rejectWithValue(null)
        }
    })


export const removeTodolistTC = createAsyncThunk(
    "todoList/removeTodolistTC",
    async (todolistId: string, {dispatch,rejectWithValue}) => {
        dispatch(setAppStatusAC({status: 'loading'}))
        //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
        dispatch(changeTodolistEntityStatusAC({id: todolistId, status: 'loading'}))
        try {
            let res = await  todolistsAPI.deleteTodolist(todolistId)
            dispatch(setAppStatusAC({status: 'succeeded'}))
            return {id: todolistId}
        } catch (error) {
            // @ts-ignore
            handleServerNetworkError(error, dispatch);
            return rejectWithValue(null)
        }
    })

export const addTodolistTC = createAsyncThunk(
    "todoList/addTodolistTC",
    async (title: string, {dispatch,rejectWithValue}) => {
        dispatch(setAppStatusAC({status: 'loading'}))
        try {
            let res = await todolistsAPI.createTodolist(title)
            dispatch(setAppStatusAC({status: 'succeeded'}))
            return {todolist: res.data.data.item}
        } catch (error) {
            // @ts-ignore
            handleServerNetworkError(error, dispatch);
            return rejectWithValue(null)
        }
    })



export const changeTodolistTitleTC = createAsyncThunk(
    "todoList/changeTodolistTitleTC",
    async (param: {id: string, title: string}, {dispatch,rejectWithValue}) => {
        dispatch(setAppStatusAC({status: 'loading'}))
        try {
            await todolistsAPI.updateTodolist(param.id, param.title)
            dispatch(setAppStatusAC({status: 'succeeded'}))
            return {id: param.id,title: param.title}
        } catch (error) {
            // @ts-ignore
            handleServerNetworkError(error, dispatch);
            return rejectWithValue(null)
        }
    })







const slice = createSlice({
    name: "todo-list-reducer",
    initialState: initialState as Array<TodolistDomainType>,
    reducers: {
        changeTodolistFilterAC(state: Array<TodolistDomainType>, action: PayloadAction<{
            id: string,
            filter: FilterValuesType
        }>) {
            let todoIndex = state.findIndex(f => f.id === action.payload.id)
            state[todoIndex].filter = action.payload.filter
        },
        changeTodolistEntityStatusAC(state: Array<TodolistDomainType>, action: PayloadAction<{
            id: string,
            status: RequestStatusType
        }>) {
            let todoIndex = state.findIndex(f => f.id === action.payload.id)
            state[todoIndex].entityStatus = action.payload.status
        },
        setTodolistsAC(state: Array<TodolistDomainType>, action: PayloadAction<{ todolists: Array<TodolistType> }>) {
            return action.payload.todolists.map(f => ({...f, filter: 'all', entityStatus: 'idle'}))
        }


    },
    extraReducers: builder => {
        builder.addCase(removeTodolistTC.fulfilled,(state,action)=>{
            let todoIndex = state.findIndex(f => f.id === action.payload.id)
            if (todoIndex > -1) {
                state.splice(todoIndex, 1)
            }
        })
        builder.addCase(fetchTodolistsTC.fulfilled,(state,action)=>{
            return action.payload.todolists.map(f => ({...f, filter: 'all', entityStatus: 'idle'}))
        })
        builder.addCase(changeTodolistTitleTC.fulfilled,(state,action)=>{
            let todoIndex = state.findIndex(f => f.id === action.payload.id)
            state[todoIndex].title = action.payload.title
        })
        builder.addCase(addTodolistTC.fulfilled,(state,action)=> {
            state.unshift({...action.payload.todolist, filter: 'all', entityStatus: 'idle'})
        })
    }
})


export const todolistsReducer = slice.reducer


// actions


export const {
    setTodolistsAC,
    changeTodolistEntityStatusAC,
    changeTodolistFilterAC,
} = slice.actions

// thunks



// types
export type SetTodolistsActionType = ReturnType<typeof setTodolistsAC>;
type ActionsType =
    | ReturnType<typeof changeTodolistFilterAC>
    | SetTodolistsActionType
    | ReturnType<typeof changeTodolistEntityStatusAC>
export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}
type ThunkDispatch = Dispatch<ActionsType | SetAppStatusActionType | SetAppErrorActionType>
