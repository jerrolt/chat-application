const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom, getAllRooms } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicDir = path.join(__dirname, '../public')
app.use(express.static(publicDir))

app.get('', (req, res) => {
    res.render('index.html')
})


io.on('connection', (socket) => {


    // Listener - signup
    socket.on('signup', () => {
        const rooms = getAllRooms() //create method for this in src/utils/users.js
        //console.log(rooms)
        socket.emit('roomlist', rooms)
    })



    // Listener - User Joins/Creates a Room
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('msgToClient', generateMessage('Admin', 'Welcome'))           
        socket.broadcast.to(user.room).emit('msgToClient', generateMessage('Admin', `${user.username} has joined`))
        
        //send list of users to all users in the room
        // update the room
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()
    })


    // Listener - user sends message
    socket.on('msgFromClient', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()

        // if(filter.isProfane(message)) {
        //     return callback('Profanity is not allowed!')
        // }

        io.to(user.room).emit('msgToClient', generateMessage(user.username, filter.clean(message)))
        callback()
    })


    // Listener - User sends location
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${location.lat},${location.lon}`))
        callback()
    })

    // Listener - user disconnect
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('msgToClient', generateMessage('Admin', `${user.username} has left the room`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }              
    })  
})

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})