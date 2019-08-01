const socket = io()

const $messageForm = document.querySelector('#msg-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormBtn = $messageForm.querySelector('button')
const $shareLocationBtn = document.querySelector('#share-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Parse options from signin page
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    //New Message Height
    const newMessageStyles = getComputedStyle($newMessage) //provided by browser
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height of messages container
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far has user scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('msgToClient', ({ username, text, createdAt }) => {
    const html = Mustache.render(messageTemplate, {
        username,
        text,
        createdAt: moment(createdAt).format('h:mm a') 
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


socket.on('locationMessage', ({ username, url, createdAt }) => {
    const html = Mustache.render(locationTemplate, {
        username,
        url,
        createdAt: moment(createdAt).format('h:mm a') 
    })
    $messages.insertAdjacentHTML('beforeend', html)
})


socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormBtn.setAttribute('disabled', 'disabled')

    let message = e.target.elements.message.value 
    socket.emit('msgFromClient', message, (error) => {
        $messageFormBtn.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) {
            console.log(error)
        }
        console.log('Delivered')   
    })
})


$shareLocationBtn.addEventListener('click', (e) => {
    if(!navigator.geolocation) {
        return alert('Geo Location not supported by your browser')
    }

    $shareLocationBtn.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            lat: position.coords.latitude, 
            lon: position.coords.longitude
        }, () => {
            $shareLocationBtn.removeAttribute('disabled')       
            console.log('Location shared')
        })
    })
})

// Create/Join a chatroom
socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    } 
})