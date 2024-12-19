import axios from "axios"

export async function initialDataApi(serverUrl: string) {

    const response = await axios.get(serverUrl + '/api/getUsers', {
        headers: {
            accesstoken: localStorage.getItem('token'),
            page: 0
        }
    })
    return response.data
}

export async function getInitialUserData(serverUrl: string) {
    const response = await axios.get(serverUrl + '/api/getUserProfile', {
        headers: {
            accesstoken: localStorage.getItem('token'),
        }
    })
    return response
}