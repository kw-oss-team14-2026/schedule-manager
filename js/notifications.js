(function(root){
  'use strict';
  function createReminder({getEvents,onNotify,storage=null,now=Date.now,intervalMs=1000}) {
    let user=null,timer=null,sent={},key='';
    function stop(){if(timer!==null)clearInterval(timer);timer=null;}
    function check(){
      if(user===null)return;
      const current=now();
      for(const event of getEvents()){
        const extra=event.extendedProps||{};
        const owner=event.user_id??extra.user_id;
        if(owner==null||String(owner)!==user||!event.id||event.allDay||event.start==null)continue;
        if(event.reminderEnabled===false||extra.reminderEnabled===false)continue;
        if(typeof event.start==='string'&&!event.start.includes('T'))continue;
        const start=new Date(event.start).getTime(),remaining=start-current;
        if(!Number.isFinite(start)||remaining<=0||remaining>86400000)continue;
        const stage=remaining<=3600000?'hour':'day';
        const eventKey=JSON.stringify([String(event.id),start]);
        const record=sent[eventKey]||{};
        if(record.hour||(stage==='day'&&record.day))continue;
        const message=stage==='hour'?'1시간 이내에 시작하는 일정입니다.':'24시간 이내에 시작하는 일정입니다.';
        onNotify({id:String(event.id),title:String(event.title||'제목 없는 일정'),start,stage,message,userId:user});
        sent[eventKey]={...record,[stage]:true,start};
      }
      for(const k of Object.keys(sent))if(!sent[k]||sent[k].start<=current)delete sent[k];
      try{storage?.setItem(key,JSON.stringify(sent));}catch(_){}
    }
    return {check,stop,setUser(id){
      stop();user=id==null?null:String(id);sent={};
      if(user===null)return;
      key='campus-reminders-v2:'+user;
      try{const value=JSON.parse(storage?.getItem(key)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))sent=value;}catch(_){}
      check();timer=setInterval(check,intervalMs);
    }};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createReminder};
  else root.CampusReminders={createReminder};
})(typeof window==='undefined'?globalThis:window);
