const socket = io()

const $messageform = document.querySelector('form')
const $messageformInput = $messageform.querySelector('input')
const $messageformButton = $messageform.querySelector('button')

const $sendLocationButton = document.querySelector('#send-location')

const $messages = document.querySelector('#messages')

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})



const autoscroll = ()=>{
    // NEw message Element
    const $newMessage = $messages.lastElementChild

    // Get Height of Last/New Message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of message Container
    const containerHeight = $messages.scrollHeight

    //How Far i have scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

/*
In index.html we have created a script tag with id: message-template. It is not a normal HTML tag and will not be
displayed like that. Whenever user click submit button   then :
1. $messageform.addEventListener will be called. It will emit sendMessage
2. in index.js sendMessage will respond and then :
3. It will emit message which will come here below.
In this socket.on for message we are are rendering using  Mustache library. Now it will call that script that message-template in index.html
and will take message with it and print there.
 */
const messageTemplate = document.querySelector('#message-template').innerHTML

socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')//moment is library to format date.
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML

socket.on('locationMessage',(message)=>{
    console.log(message)
    const html = Mustache.render(locationMessageTemplate,{
        username: message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')//moment is library to format date.
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

socket.on('roomData',({room, users})=>{
    console.log(room)
    console.log(users)

    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageform.addEventListener('submit',(e)=>{

    e.preventDefault()

    //As soon submit is clicked disable that button so that user does not click on submit multiple times.
    $messageformButton.setAttribute('disabled','disabled')

    const message = e.target.elements.message.value

    // socket.emit('sendMessage', message)
    /*
    We can also have 3(apart from data as we can have n number of data param like message) parameters in emit function.
    Third parameter is a callback function which will only be executed/called from server. i.e in server where we will serve
    io.on for sendMessage there we will call the callback function and it will excute the 3 param here.
    It is used if we want to confirm that if message is successfully delivered.
     */
    socket.emit('sendMessage', message,(error)=>{

        //Re-enable the submit button
        $messageformButton.removeAttribute('disabled')
        $messageformInput.value=''
        $messageformInput.focus()

        if(error)
            return console.log(error)
        else console.log('Delivered')
    })
})

/*
In form we have created a button send location. As soon as that button will be clicked this event listener will be called.
Here it will use browser inbuild functionality which is called geolocation. It will give pop-up that this app want your location.
As soon as user give yes, it's location will come and stored in position.
 */
$sendLocationButton.addEventListener('click',()=>{

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported')
    }
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{

        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },()=>{//Event Acknowledment. Will be called from server if server says that yes everything is fine.
            console.log('Location Shared')

            $sendLocationButton.removeAttribute('disabled')

        })
    })

})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})