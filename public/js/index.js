const socket = io()
const $roomlist = document.querySelector('#rooms')
const roomListTemplate = document.querySelector('#datatlist-template').innerHTML


socket.on('roomlist', (rooms) => {
    console.log(rooms)
    const html = Mustache.render(roomListTemplate, {
        rooms
    })
    $roomlist.innerHTML = html
})

// Create/Join a chatroom
socket.emit('signup')

