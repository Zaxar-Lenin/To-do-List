import {
    addTodolistTC,
    fetchTodolistsTC,
    removeTodolistTC,
    setTodolistsAC,
    SetTodolistsActionType
} from './todolists-reducer'
import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {AppRootStateType} from '../../app/store'
import {SetAppErrorActionType, setAppStatusAC, SetAppStatusActionType} from '../../app/app-reducer'
import {handleServerAppError, handleServerNetworkError} from '../../utils/error-utils'
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState: TasksStateType = {}


export const fetchTasksTC = createAsyncThunk(
    "task/fetchTasksTC",
    async (todolistId: string, {dispatch}) => {
        const res = await todolistsAPI.getTasks(todolistId)
        return {items: res.data.items, todolistId}
    }
)

export const removeTaskTC = createAsyncThunk(
    "task/removeTaskTC",
    async (p: { taskId: string, todolistId: string }, {dispatch}) => {
        const res = await todolistsAPI.deleteTask(p.todolistId, p.taskId)
        return {taskId: p.taskId, todolistId: p.todolistId}
    })


export const addTaskTC = createAsyncThunk(
    "task/addTaskTC",
    async (param: { title: string, todolistId: string }, {dispatch, rejectWithValue}) => {
        dispatch(setAppStatusAC({status: 'loading'}))
        try {
            let res = await todolistsAPI.createTask(param.todolistId, param.title)
            if (res.data.resultCode === 0) {
                const task = res.data.data.item
                dispatch(setAppStatusAC({status: 'succeeded'}))
                return {task, todoListID: param.todolistId}
                // const action = addTaskAC({task})
                // dispatch(action)

            } else {
                handleServerAppError(res.data, dispatch);
                return rejectWithValue(null)
            }
        } catch (error) {
            // @ts-ignore
            handleServerNetworkError(error, dispatch)
            return rejectWithValue(null)
        }
        // .catch((error) => {
        //
        // })

    })


export const updateTaskTC = createAsyncThunk(
    "task/updateTaskTC",
    async (param: { taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string }, {
        dispatch,
        getState,
        rejectWithValue
    }) => {
        const state = getState() as AppRootStateType
        const task = state.tasks[param.todolistId].find(t => t.id === param.taskId)
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn('task not found in the state')
            return rejectWithValue(null)
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...param.domainModel
        }

        let res = await todolistsAPI.updateTask(param.todolistId, param.taskId, apiModel)
        try {
            if (res.data.resultCode === 0) {
                return {taskId: param.taskId, model: param.domainModel, todolistId: param.todolistId}
            } else {
                handleServerAppError(res.data, dispatch);
                return rejectWithValue(null)
            }
        } catch (error) {
            // @ts-ignore
            handleServerNetworkError(error, dispatch);
            return rejectWithValue(null)
        }
    }
)


const slice = createSlice({
    name: "task-reducer",
    initialState: initialState as TasksStateType,
    reducers: {
        setTasksAC(state: TasksStateType, action: PayloadAction<{ tasks: TaskType[], todolistId: string }>) {
            state[action.payload.todolistId] = action.payload.tasks
        },

    },
    extraReducers: (builder) => {
        builder.addCase(addTodolistTC.fulfilled, (state, action) => {
            state[action.payload.todolist.id] = []
        })
        builder.addCase(fetchTodolistsTC.fulfilled, (state, action) => {
            action.payload.todolists.forEach(m => {
                state[m.id] = []
            })
        })
        builder.addCase(fetchTasksTC.fulfilled, (state, action) => {
            state[action.payload.todolistId] = action.payload.items
        })
        builder.addCase(removeTaskTC.fulfilled, (state, action) => {
            state[action.payload.todolistId] = state[action.payload.todolistId].filter(f => f.id !== action.payload.taskId)
        })
        builder.addCase(addTaskTC.fulfilled, (state, action) => {
            state[action.payload.todoListID].unshift(action.payload.task)
        })
        builder.addCase(updateTaskTC.fulfilled, (state, action) => {
            let tasks = state[action.payload.todolistId]
            let taskIndex = tasks.findIndex(f => f.id === action.payload.taskId)
            if (taskIndex > -1) {
                tasks[taskIndex] = {...tasks[taskIndex], ...action.payload.model}
            }
        })
        builder.addCase(removeTodolistTC.fulfilled, (state, action) => {
            delete state[action.payload.id]
        })
    }
})


export const tasksReducer = slice.reducer

// actions

export const {setTasksAC} = slice.actions

// thunks


// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}
type ActionsType =
    | SetTodolistsActionType
    | ReturnType<typeof setTasksAC>
type ThunkDispatch = Dispatch<ActionsType | SetAppStatusActionType | SetAppErrorActionType>
