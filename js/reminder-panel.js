function initReminderPanel(calendar){
  const status=document.getElementById('reminder-status'),list=document.getElementById('reminder-list');
  let storage=null,currentUser=null,version=0;
  const displayed = new Map();
  try{storage=window.localStorage;}catch(_){}
  const reminders=CampusReminders.createReminder({getEvents:()=>calendar.getEvents(),storage,onNotify(event){
    const li=document.createElement('li'),text=document.createElement('p'),button=document.createElement('button');
    text.textContent=event.title+' · '+event.message+' 시작: '+new Date(event.start).toLocaleString('ko-KR');
    button.type='button';button.textContent='닫기';button.onclick=()=>li.remove();
    li.append(text,button);list.prepend(li);
    displayed.set(li, {id:event.id, start:event.start, stage:event.stage, userId:event.userId});
  }});
  function setUser(user){
    const id=user?.user_id==null?null:String(user.user_id);
    if(id!==currentUser){list.replaceChildren();displayed.clear();currentUser=id;reminders.setUser(id);}
    status.textContent=id===null?'로그인 후 일정 알림을 확인할 수 있습니다.':'로그인한 사용자의 일정을 확인하고 있습니다.';
    reminders.check();
  }
  async function refreshSession(){
    const request=++version;
    try{
      const response=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
      if(request!==version)return;
      if(response.status===401){setUser(null);return;}
      if(!response.ok)throw Error('session');
      const data=await response.json();if(request!==version)return;
      if(!data.success||data.user?.user_id==null)throw Error('session');
      setUser(data.user);
    }catch(_){if(request!==version)return;setUser(null);status.textContent='로그인 서버에 연결하지 못했습니다. 팀 서버를 실행해주세요.';}
  }
  function authChanged(){++version;setUser(null);refreshSession();}
  function visible(){if(!document.hidden)refreshSession();}
  function updated(){
    const events=calendar.getEvents();
    for(const [li,record] of displayed){
      const event=events.find(e=>String(e.id)===record.id);
      const owner=event?.user_id??event?.extendedProps?.user_id;
      const remaining=record.start-Date.now();
      if(!li.parentNode || !event || owner==null || String(owner)!==record.userId ||
         new Date(event.start).getTime()!==record.start || event.allDay ||
         event.reminderEnabled===false || event.extendedProps?.reminderEnabled===false ||
         remaining<=0 || (record.stage==='day' && remaining<=3600000)){
        li.remove();displayed.delete(li);
      }
    }
    reminders.check();
  }
  window.addEventListener('auth-changed',authChanged);
  document.addEventListener('visibilitychange',visible);
  calendar.on('eventsSet',updated);
  const cleanup=setInterval(updated,1000);
  const poll=setInterval(refreshSession,30000);refreshSession();
  return {refreshSession,destroy(){++version;clearInterval(poll);clearInterval(cleanup);reminders.setUser(null);list.replaceChildren();displayed.clear();window.removeEventListener('auth-changed',authChanged);document.removeEventListener('visibilitychange',visible);calendar.off('eventsSet',updated);}};
}
