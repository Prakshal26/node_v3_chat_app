const users = []

const addUser = ({id, username, room}) => {

    //Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //Validate the data
    if (!username || !room) {
        return {
            error: 'UserName and Room are required',
        }
    }
    //Check for Existing User. Will go to array of users and check for room and username. If that room is
    //already present then dont allow him to join. IF username already exist in that room then also dont alow to join.
    const existingUser = users.find((user)=>{
        return user.room === room && user.username ===username //User is trying to join the correct room
    })

    //Validate username
    if (existingUser) {
        return {
            error : 'Username is in use'
        }
    }

    //When User is ready to store
    const user = {id, username, room}
    users.push(user)
    return {user}
}

const removeUser = (id) => {
    const index = users.findIndex((user)=>{
        return user.id === id
    })
    if (index != -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user)=> user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user)=>{
        return user.room===room
    })
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}