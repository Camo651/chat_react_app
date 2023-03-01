import React from 'react'
import MessageBar from './MessageBar.js'
import Message from './Message.js'
import POST from '../ApiHandler.js';

export default function ChatPanel({currentChat, myUUID}) { // currentChat is the uuid of the current friends dms
  const [messages, stateSetMessages] = React.useState([]);
  const [lastMessage, stateSetLastMessage] = React.useState("");
  const [chatMemebers, stateSetChatMembers] = React.useState(["Loading...", "Loading..."]);

  React.useEffect(() => {
    getMessages();
  },[]);

  async function getChatMemebers(){
    let name1 = await POST('u', 'r', undefined, myUUID);
    let name2 = await POST('u', 'r', undefined, currentChat);

    if(name1.status !== "")
      name1 = "Loading...";
    else
      name1 = name1.payload.name;
    if(name2.status !== "")
      name2 = "Loading...";
    else
      name2 = name2.payload.name;

    stateSetChatMembers([name1, name2]);
    return [name1, name2];
  }

  async function getMessages(){

    let [name1, name2] = await getChatMemebers();

    let chatId1 = myUUID + '_' + currentChat;
    let chatId2 = currentChat + '_' + myUUID;

    let myData = await POST('f', 'r', undefined, chatId1);
    let otherData = await POST('f', 'r', undefined, chatId2);

    if(myData.status !== "" || otherData.status !== ""){
      alert('Error in getting messages: ' + myData.status + ' ' + otherData.status);
      return;
    }

    let m1 = myData.payload;
    let m2 = otherData.payload;

    let merged = [];

    for(let key in m1){
      let time = m1[key][0];
      let message = m1[key][1];
      merged.push(<Message key={key} time={time} message={message} name={name1} isMe={true}/>);
    }
    if(chatId1 !== chatId2)
      for(let key in m2){
        let time = m2[key][0];
        let message = m2[key][1];
        merged.push(<Message key={key} time={time} message={message} name={name2} isMe={false}/>);
      }

    console.log(myData);
    console.log(otherData);

    merged.sort((a, b) => {
      let aTime = a.props.time;
      let bTime = b.props.time;
      if(aTime < bTime)
        return -1;
      else if(aTime > bTime)
        return 1;
      else
        return 0;
    });

    //convert each time to a nice looking string
    for(let i = 0; i < merged.length; i++){
      let unixTime = merged[i].props.time * 1000;
      let date = new Date(unixTime);
      let dateString = date.toLocaleString();
      merged[i] = React.cloneElement(merged[i], {time: dateString});
    }

    merged.reverse();

    stateSetMessages(merged);
  }

  async function sendMessage(message){
    
  }

  async function addMessage(message){
    let sendReq = await POST('f', 'w', message, myUUID + '_' + currentChat)
    let newMsgData = await POST('f', 'r', 1, myUUID + '_' + currentChat);

    console.log(sendReq);
    console.log(newMsgData);

    if(sendReq.status !== "" || newMsgData.status !== ""){
      alert('Error in sending message: ' + sendReq.status + ' ' + newMsgData.status);
      return;
    }
    
    let newMessage = newMsgData.payload;
    let newMessageKey = Object.keys(newMessage)[0];
    let newMessageTime = new Date(newMessage[newMessageKey][0] *1000).toLocaleDateString();
    let newMessageText = newMessage[newMessageKey][1];

    let name1 = chatMemebers[0];

    let newMessageElement = <Message key={newMessageKey} time={newMessageTime} message={newMessageText} name={name1} isMe={true}/>;

    stateSetMessages([newMessageElement, ...messages]);
    stateSetLastMessage(Date.now());
  }

  return (
    <>
      <div className="chat-panel">
        <div className="messages-pane">
          {messages}
        </div>
        <MessageBar key={lastMessage} addMessage={sendMessage}/>
      </div>
    </>
  )
}
