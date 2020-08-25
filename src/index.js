const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage}= require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

/*
socket.emit : It emits to single client we are referring to.
io.emit : It sends to all the clients running the application.
socket.broadcast.emit : It will send to all the other clients except the one on which we are working.

Suppose a new user joins the chat so we want all other user to get the message that a new user has joined.
So we do not want that message for that current user so we use socket.broadcast.emit
 */
//io.on runs when client is connected.
io.on('connection',(socket)=>{

    // socket.emit('message','Welcome User')


    socket.on('join',({username, room}, callback)=>{

        const {error, user} = addUser({id:socket.id, username, room})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        //io.to.emit: emit to everyone in specific room.
        //socket.broadcast.to.emit: Everyone to except for current client but only in specific room.

        //Now we need to send TimeStamp. We have created a function in utils/message.js.
        //It takes one parameter i.e  message: welcome user.
        //It will now return that message and the timestamp back to us.
        socket.emit('message',generateMessage('Admin','Welcome User'))

        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has Joined`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage',(message,callback)=>{

        const user = getUser(socket.id)

        /*
        Bad words is the npm module which filter some bad words if entered. So client will fetch the word from form.
        Socket.emit done by client, then this socket.on called so here we are filtering the message.
         */
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Bad words not allowed')//Return to the callback message
        }

        io.to(user.room).emit('message',generateMessage(user.username, message)) //If no bad words then send that to everyone
        //socket.emit in chat.js has 3 param called callback. We are calling it .
        callback()
    })



    socket.on('sendLocation',({latitude, longitude},callback)=>{

        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${latitude},${longitude}`))

        callback()
    })

    //When client gets disconnected then this is called.
    socket.on('disconnect', ()=>{

        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message',generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})


server.listen(port, ()=>{
    console.log('Server is up on port '+ port)
})